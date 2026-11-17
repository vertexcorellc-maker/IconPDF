import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { readFileBytes, downloadBytes } from '../../lib/pdf';

interface Threat {
  label: string;
  remove: () => void;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('san-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const scanList = el<HTMLUListElement>('scan');
const note = el<HTMLParagraphElement>('note');
const sanitizeBtn = el<HTMLButtonElement>('sanitize');
const resetBtn = el<HTMLButtonElement>('reset');

let srcBytes: Uint8Array | null = null;
let baseName = 'document';

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

/** Inspect a document and return the active-content items it contains. */
function findThreats(doc: PDFDocument): Threat[] {
  const threats: Threat[] = [];
  const cat = doc.catalog;

  if (cat.get(PDFName.of('OpenAction'))) {
    threats.push({ label: 'Auto-run action when opened', remove: () => cat.delete(PDFName.of('OpenAction')) });
  }
  if (cat.get(PDFName.of('AA'))) {
    threats.push({ label: 'Document-level trigger actions', remove: () => cat.delete(PDFName.of('AA')) });
  }

  const names = cat.lookup(PDFName.of('Names'));
  if (names instanceof PDFDict) {
    if (names.get(PDFName.of('JavaScript'))) {
      threats.push({ label: 'Embedded JavaScript', remove: () => names.delete(PDFName.of('JavaScript')) });
    }
    if (names.get(PDFName.of('EmbeddedFiles'))) {
      threats.push({ label: 'Embedded files', remove: () => names.delete(PDFName.of('EmbeddedFiles')) });
    }
  }

  let pageActions = 0;
  const pageNodes = doc.getPages().map((p) => p.node);
  for (const node of pageNodes) {
    if (node.get(PDFName.of('AA'))) pageActions++;
  }
  if (pageActions) {
    threats.push({
      label: `Page trigger actions (${pageActions})`,
      remove: () => pageNodes.forEach((n) => n.delete(PDFName.of('AA'))),
    });
  }

  return threats;
}

function renderScan(threats: Threat[], cleaned = false) {
  scanList.innerHTML = '';
  if (!threats.length) {
    const li = document.createElement('li');
    li.className = 'scan-clean';
    li.textContent = cleaned
      ? '✓ All active content removed.'
      : '✓ No JavaScript, embedded files or auto-run actions found. This PDF is already clean.';
    scanList.appendChild(li);
    sanitizeBtn.disabled = true;
    return;
  }
  for (const t of threats) {
    const li = document.createElement('li');
    li.className = 'scan-threat';
    li.textContent = t.label;
    scanList.appendChild(li);
  }
  sanitizeBtn.disabled = false;
}

async function load(file: File) {
  setState('ready');
  note.textContent = '';
  note.classList.remove('is-error');
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  try {
    srcBytes = await readFileBytes(file);
    const doc = await PDFDocument.load(srcBytes, { updateMetadata: false });
    renderScan(findThreats(doc));
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  }
}

async function sanitize() {
  if (!srcBytes) return;
  sanitizeBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Removing…';
  try {
    const doc = await PDFDocument.load(srcBytes, { updateMetadata: false });
    const threats = findThreats(doc);
    threats.forEach((t) => t.remove());
    const out = await doc.save();
    downloadBytes(out, `${baseName}-safe.pdf`);

    const check = await PDFDocument.load(out, { updateMetadata: false });
    renderScan(findThreats(check), true);
    note.textContent = `Done. Removed ${threats.length} item${threats.length === 1 ? '' : 's'} and downloaded the safe copy.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not sanitize: ${err?.message ?? err}`;
    sanitizeBtn.disabled = false;
  }
}

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) load(f);
  fileInput.value = '';
});
resetBtn.addEventListener('click', () => {
  srcBytes = null;
  setState('idle');
});
sanitizeBtn.addEventListener('click', sanitize);

['dragenter', 'dragover'].forEach((t) =>
  drop.addEventListener(t, (e) => {
    e.preventDefault();
    drop.classList.add('is-over');
  })
);
['dragleave', 'drop'].forEach((t) =>
  drop.addEventListener(t, (e) => {
    e.preventDefault();
    drop.classList.remove('is-over');
  })
);
drop.addEventListener('drop', (e) => {
  const f = (e as DragEvent).dataTransfer?.files?.[0];
  if (f && f.type === 'application/pdf') load(f);
});

setState('idle');
