import { PDFDocument } from 'pdf-lib';
import { openForRender, renderThumb, readFileBytes, downloadBytes, zipAndDownload } from '../../lib/pdf';

interface Pg {
  id: string;
  index: number;
  selected: boolean;
  thumb: string;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('split-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const busy = el<HTMLDivElement>('busy');
const statusText = el<HTMLParagraphElement>('status');
const grid = el<HTMLDivElement>('grid');
const note = el<HTMLParagraphElement>('note');
const count = el<HTMLSpanElement>('count');
const extractBtn = el<HTMLButtonElement>('extract');
const splitBtn = el<HTMLButtonElement>('splitzip');
const resetBtn = el<HTMLButtonElement>('reset');

let srcBytes: Uint8Array | null = null;
let pages: Pg[] = [];
let baseName = 'document';

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function refresh() {
  const n = pages.filter((p) => p.selected).length;
  count.textContent = `${n} of ${pages.length} selected`;
  extractBtn.disabled = n < 1;
  splitBtn.disabled = n < 1;
}

function render() {
  grid.innerHTML = '';
  pages.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'pg-card is-selectable' + (p.selected ? ' is-selected' : '');
    card.dataset.id = p.id;
    card.innerHTML = `
      <span class="pg-check" aria-hidden="true">✓</span>
      <div class="pg-thumb-wrap"><img class="pg-thumb" src="${p.thumb}" alt="" /></div>
      <div class="pg-bar"><span class="pg-num">${i + 1}</span></div>`;
    card.addEventListener('click', () => {
      p.selected = !p.selected;
      card.classList.toggle('is-selected', p.selected);
      refresh();
    });
    grid.appendChild(card);
  });
  refresh();
}

async function load(file: File) {
  setState('ready');
  busy.hidden = false;
  grid.innerHTML = '';
  note.textContent = '';
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  try {
    srcBytes = await readFileBytes(file);
    const { doc, numPages } = await openForRender(srcBytes);
    pages = [];
    for (let i = 1; i <= numPages; i++) {
      statusText.textContent = `Loading pages… ${i} of ${numPages}`;
      const t = await renderThumb(doc, i, 170);
      pages.push({ id: crypto.randomUUID(), index: i - 1, selected: true, thumb: t.url });
    }
    render();
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  } finally {
    busy.hidden = true;
  }
}

async function extract() {
  const picked = pages.filter((p) => p.selected);
  if (!srcBytes || !picked.length) return;
  extractBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Extracting…';
  try {
    const src = await PDFDocument.load(srcBytes);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, picked.map((p) => p.index));
    copied.forEach((pg) => out.addPage(pg));
    downloadBytes(await out.save(), `${baseName}-extract.pdf`);
    note.textContent = `Done. Extracted ${picked.length} page${picked.length === 1 ? '' : 's'}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not extract: ${err?.message ?? err}`;
  } finally {
    extractBtn.disabled = false;
  }
}

async function splitToZip() {
  const picked = pages.filter((p) => p.selected);
  if (!srcBytes || !picked.length) return;
  splitBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Building files…';
  try {
    const src = await PDFDocument.load(srcBytes);
    const files: { name: string; data: Uint8Array }[] = [];
    for (const p of picked) {
      const out = await PDFDocument.create();
      const [pg] = await out.copyPages(src, [p.index]);
      out.addPage(pg);
      files.push({ name: `${baseName}-page-${p.index + 1}.pdf`, data: await out.save() });
    }
    await zipAndDownload(files, `${baseName}-pages.zip`);
    note.textContent = `Done. Saved ${files.length} files to a ZIP.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not split: ${err?.message ?? err}`;
  } finally {
    splitBtn.disabled = false;
  }
}

el<HTMLButtonElement>('all').addEventListener('click', () => {
  pages.forEach((p) => (p.selected = true));
  render();
});
el<HTMLButtonElement>('none').addEventListener('click', () => {
  pages.forEach((p) => (p.selected = false));
  render();
});
fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) load(f);
  fileInput.value = '';
});
resetBtn.addEventListener('click', () => {
  pages = [];
  srcBytes = null;
  setState('idle');
});
extractBtn.addEventListener('click', extract);
splitBtn.addEventListener('click', splitToZip);

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
