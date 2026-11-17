import { PDFDocument, PDFName } from 'pdf-lib';
import { readFileBytes, downloadBytes } from '../../lib/pdf';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('meta-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const metaList = el<HTMLDListElement>('meta');
const note = el<HTMLParagraphElement>('note');
const cleanBtn = el<HTMLButtonElement>('clean');
const resetBtn = el<HTMLButtonElement>('reset');

let srcBytes: Uint8Array | null = null;
let baseName = 'document';

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function fmtDate(d: Date | undefined) {
  // Treat the epoch sentinel we write when scrubbing as "no date".
  return d && d.getTime() > 0 ? d.toLocaleString() : undefined;
}

function readMeta(doc: PDFDocument) {
  const hasXmp = !!doc.catalog.get(PDFName.of('Metadata'));
  const rows: [string, string | undefined][] = [
    ['Title', doc.getTitle()],
    ['Author', doc.getAuthor()],
    ['Subject', doc.getSubject()],
    ['Keywords', (doc.getKeywords() as string | undefined) || undefined],
    ['Creator (software)', doc.getCreator()],
    ['Producer (software)', doc.getProducer()],
    ['Created', fmtDate(doc.getCreationDate())],
    ['Modified', fmtDate(doc.getModificationDate())],
    ['Embedded XMP data', hasXmp ? 'Present' : undefined],
  ];
  return rows.filter(([, v]) => v);
}

function renderMeta(rows: [string, string | undefined][], cleaned = false) {
  metaList.innerHTML = '';
  if (!rows.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = cleaned ? 'All metadata removed.' : 'No metadata found in this file.';
    metaList.appendChild(p);
    cleanBtn.disabled = true;
    return;
  }
  for (const [k, v] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v!;
    metaList.appendChild(dt);
    metaList.appendChild(dd);
  }
  cleanBtn.disabled = cleaned;
}

async function load(file: File) {
  setState('ready');
  note.textContent = '';
  note.classList.remove('is-error');
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  try {
    srcBytes = await readFileBytes(file);
    // updateMetadata:false stops pdf-lib stamping its own Producer/ModDate on load,
    // so we read (and later keep) the file's true metadata.
    const doc = await PDFDocument.load(srcBytes, { updateMetadata: false });
    renderMeta(readMeta(doc));
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  }
}

async function clean() {
  if (!srcBytes) return;
  cleanBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Removing metadata…';
  try {
    const doc = await PDFDocument.load(srcBytes, { updateMetadata: false });
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');
    const epoch = new Date(0);
    doc.setCreationDate(epoch);
    doc.setModificationDate(epoch);
    // Drop the XMP metadata stream, which often carries the richest hidden data.
    doc.catalog.delete(PDFName.of('Metadata'));

    const out = await doc.save();
    downloadBytes(out, `${baseName}-clean.pdf`);

    // Re-read the cleaned file to prove what's left.
    const check = await PDFDocument.load(out, { updateMetadata: false });
    renderMeta(readMeta(check), true);
    note.textContent = 'Done. Metadata stripped and the clean PDF downloaded.';
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not clean the PDF: ${err?.message ?? err}`;
    cleanBtn.disabled = false;
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
cleanBtn.addEventListener('click', clean);

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
