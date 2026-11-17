import { PDFDocument, degrees } from 'pdf-lib';
import { openForRender, renderThumb, readFileBytes, downloadBytes } from '../../lib/pdf';

interface Pg {
  id: string;
  index: number;
  rotation: number;
  origRotation: number;
  thumb: string;
  img?: HTMLImageElement;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('rot-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const busy = el<HTMLDivElement>('busy');
const statusText = el<HTMLParagraphElement>('status');
const grid = el<HTMLDivElement>('grid');
const note = el<HTMLParagraphElement>('note');
const applyBtn = el<HTMLButtonElement>('apply');
const resetBtn = el<HTMLButtonElement>('reset');

let srcBytes: Uint8Array | null = null;
let pages: Pg[] = [];
let baseName = 'document';

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function apply(page: Pg) {
  if (page.img) page.img.style.transform = `rotate(${page.rotation}deg)`;
}

function render() {
  grid.innerHTML = '';
  for (const page of pages) {
    const card = document.createElement('div');
    card.className = 'pg-card';
    card.dataset.id = page.id;
    card.innerHTML = `
      <div class="pg-thumb-wrap"><img class="pg-thumb" src="${page.thumb}" alt="" /></div>
      <div class="pg-bar">
        <span class="pg-num">${page.index + 1}</span>
        <button class="pg-btn" type="button" title="Rotate right">⟳</button>
      </div>`;
    page.img = card.querySelector<HTMLImageElement>('.pg-thumb')!;
    apply(page);
    card.querySelector('.pg-btn')!.addEventListener('click', () => {
      page.rotation = (page.rotation + 90) % 360;
      apply(page);
    });
    grid.appendChild(card);
  }
}

function rotateAll(delta: number) {
  for (const page of pages) {
    page.rotation = (page.rotation + delta + 360) % 360;
    apply(page);
  }
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
      pages.push({ id: crypto.randomUUID(), index: i - 1, rotation: 0, origRotation: t.rotation, thumb: t.url });
    }
    render();
    note.textContent = `${numPages} page${numPages === 1 ? '' : 's'}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  } finally {
    busy.hidden = true;
  }
}

async function save() {
  if (!srcBytes) return;
  applyBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Saving…';
  try {
    const doc = await PDFDocument.load(srcBytes);
    const docPages = doc.getPages();
    pages.forEach((p) => docPages[p.index].setRotation(degrees((p.origRotation + p.rotation) % 360)));
    downloadBytes(await doc.save(), `${baseName}-rotated.pdf`);
    note.textContent = 'Done. Saved the rotated PDF.';
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not save: ${err?.message ?? err}`;
  } finally {
    applyBtn.disabled = false;
  }
}

el<HTMLButtonElement>('allLeft').addEventListener('click', () => rotateAll(-90));
el<HTMLButtonElement>('allRight').addEventListener('click', () => rotateAll(90));
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
applyBtn.addEventListener('click', save);

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
