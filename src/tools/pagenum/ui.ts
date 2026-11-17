import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFileBytes, downloadBytes } from '../../lib/pdf';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('pn-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const note = el<HTMLParagraphElement>('note');
const applyBtn = el<HTMLButtonElement>('apply');
const resetBtn = el<HTMLButtonElement>('reset');
const posS = el<HTMLSelectElement>('pos');
const fmtS = el<HTMLSelectElement>('fmt');
const startI = el<HTMLInputElement>('start');
const sizeS = el<HTMLSelectElement>('size');

let srcBytes: Uint8Array | null = null;
let baseName = 'document';
const MARGIN = 28;

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

async function load(file: File) {
  srcBytes = await readFileBytes(file);
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  setState('ready');
  note.textContent = '';
}

async function apply() {
  if (!srcBytes) return;
  applyBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Numbering…';
  try {
    const size = Number(sizeS.value);
    const start = parseInt(startI.value, 10) || 0;
    const doc = await PDFDocument.load(srcBytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const lastNum = start + pages.length - 1;
    const pos = posS.value;

    pages.forEach((page, i) => {
      const n = start + i;
      let label = String(n);
      if (fmtS.value === 'of') label = `${n} of ${lastNum}`;
      else if (fmtS.value === 'word') label = `Page ${n}`;

      const { width, height } = page.getSize();
      const tw = font.widthOfTextAtSize(label, size);
      const x = pos.endsWith('l') ? MARGIN : pos.endsWith('r') ? width - MARGIN - tw : (width - tw) / 2;
      const y = pos.startsWith('b') ? MARGIN : height - MARGIN - size;
      page.drawText(label, { x, y, size, font, color: rgb(0.25, 0.25, 0.25) });
    });

    downloadBytes(await doc.save(), `${baseName}-numbered.pdf`);
    note.textContent = `Done. Numbered ${pages.length} page${pages.length === 1 ? '' : 's'}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not add page numbers: ${err?.message ?? err}`;
  } finally {
    applyBtn.disabled = false;
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
applyBtn.addEventListener('click', apply);

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
