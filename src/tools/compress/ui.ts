import type * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { openForRender, renderPageToBlob, readFileBytes, downloadBytes } from '../../lib/pdf';

const LEVELS = {
  strong: { scale: 1.0, quality: 0.5 },
  balanced: { scale: 1.4, quality: 0.6 },
  light: { scale: 2.0, quality: 0.75 },
} as const;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('cmp-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const busy = el<HTMLDivElement>('busy');
const statusText = el<HTMLParagraphElement>('status');
const note = el<HTMLParagraphElement>('note');
const sizeRead = el<HTMLParagraphElement>('size');
const levelS = el<HTMLSelectElement>('level');
const compressBtn = el<HTMLButtonElement>('compress');
const resetBtn = el<HTMLButtonElement>('reset');

let doc: pdfjs.PDFDocumentProxy | null = null;
let numPages = 0;
let origSize = 0;
let baseName = 'document';

const fmt = (n: number) => (n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(2)} MB`);

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

async function load(file: File) {
  setState('ready');
  note.textContent = '';
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  origSize = file.size;
  sizeRead.textContent = `Original: ${fmt(origSize)}`;
  const bytes = await readFileBytes(file);
  const loaded = await openForRender(bytes);
  doc = loaded.doc;
  numPages = loaded.numPages;
}

async function compress() {
  if (!doc) return;
  compressBtn.disabled = true;
  busy.hidden = false;
  note.classList.remove('is-error');
  const { scale, quality } = LEVELS[levelS.value as keyof typeof LEVELS];
  try {
    const out = await PDFDocument.create();
    for (let i = 1; i <= numPages; i++) {
      statusText.textContent = `Compressing page ${i} of ${numPages}…`;
      const page = await doc.getPage(i);
      const sizePts = page.getViewport({ scale: 1 });
      const blob = await renderPageToBlob(doc, i, scale, 'image/jpeg', quality);
      const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const p = out.addPage([sizePts.width, sizePts.height]);
      p.drawImage(img, { x: 0, y: 0, width: sizePts.width, height: sizePts.height });
    }
    const bytes = await out.save();
    const delta = Math.round((1 - bytes.length / origSize) * 100);
    downloadBytes(bytes, `${baseName}-compressed.pdf`);
    sizeRead.textContent = `Original: ${fmt(origSize)}  →  New: ${fmt(bytes.length)}`;
    note.textContent =
      delta > 0
        ? `Done. ${delta}% smaller.`
        : `Done, but this PDF was already well compressed (mostly text), so it didn't get smaller. The original is the better choice here.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not compress: ${err?.message ?? err}`;
  } finally {
    busy.hidden = true;
    compressBtn.disabled = false;
  }
}

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) load(f);
  fileInput.value = '';
});
resetBtn.addEventListener('click', () => {
  doc = null;
  setState('idle');
});
compressBtn.addEventListener('click', compress);

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
