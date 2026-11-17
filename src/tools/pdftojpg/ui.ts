import type * as pdfjs from 'pdfjs-dist';
import {
  openForRender,
  renderThumb,
  renderPageToBlob,
  readFileBytes,
  downloadBlob,
  zipAndDownload,
} from '../../lib/pdf';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('p2j-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const busy = el<HTMLDivElement>('busy');
const statusText = el<HTMLParagraphElement>('status');
const grid = el<HTMLDivElement>('grid');
const note = el<HTMLParagraphElement>('note');
const fmtSel = el<HTMLSelectElement>('fmt');
const scaleSel = el<HTMLSelectElement>('scale');
const downloadBtn = el<HTMLButtonElement>('download');
const resetBtn = el<HTMLButtonElement>('reset');

let doc: pdfjs.PDFDocumentProxy | null = null;
let numPages = 0;
let baseName = 'document';

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

async function load(file: File) {
  setState('ready');
  busy.hidden = false;
  grid.innerHTML = '';
  note.textContent = '';
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  try {
    const bytes = await readFileBytes(file);
    const loaded = await openForRender(bytes);
    doc = loaded.doc;
    numPages = loaded.numPages;
    for (let i = 1; i <= numPages; i++) {
      statusText.textContent = `Loading pages… ${i} of ${numPages}`;
      const t = await renderThumb(doc, i, 170);
      const card = document.createElement('div');
      card.className = 'pg-card';
      card.innerHTML = `
        <div class="pg-thumb-wrap"><img class="pg-thumb" src="${t.url}" alt="" /></div>
        <div class="pg-bar"><span class="pg-num">${i}</span></div>`;
      grid.appendChild(card);
    }
    downloadBtn.disabled = false;
    note.textContent = `${numPages} page${numPages === 1 ? '' : 's'} ready.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  } finally {
    busy.hidden = true;
  }
}

async function run() {
  if (!doc) return;
  downloadBtn.disabled = true;
  note.classList.remove('is-error');
  const type = fmtSel.value as 'image/jpeg' | 'image/png';
  const scale = Number(scaleSel.value);
  const ext = type === 'image/png' ? 'png' : 'jpg';
  try {
    if (numPages === 1) {
      note.textContent = 'Rendering…';
      const blob = await renderPageToBlob(doc, 1, scale, type);
      downloadBlob(blob, `${baseName}.${ext}`);
    } else {
      const files: { name: string; data: Uint8Array }[] = [];
      for (let i = 1; i <= numPages; i++) {
        note.textContent = `Rendering page ${i} of ${numPages}…`;
        const blob = await renderPageToBlob(doc, i, scale, type);
        files.push({
          name: `${baseName}-${String(i).padStart(2, '0')}.${ext}`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
      }
      note.textContent = 'Zipping…';
      await zipAndDownload(files, `${baseName}-images.zip`);
    }
    note.textContent = `Done. Saved ${numPages} image${numPages === 1 ? '' : 's'}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not export: ${err?.message ?? err}`;
  } finally {
    downloadBtn.disabled = false;
  }
}

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) load(f);
  fileInput.value = '';
});
resetBtn.addEventListener('click', () => {
  doc = null;
  numPages = 0;
  setState('idle');
});
downloadBtn.addEventListener('click', run);

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
