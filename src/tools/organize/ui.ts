import { PDFDocument, degrees } from 'pdf-lib';
import { openForRender, renderThumb, readFileBytes, downloadBytes, makeSortable } from '../../lib/pdf';

interface Page {
  id: string;
  index: number; // original 0-based page index
  rotation: number; // extra rotation to apply, multiple of 90
  origRotation: number;
  deleted: boolean;
  thumb: string;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('org-tool');
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
let pages: Page[] = [];

makeSortable(grid, (ids) => {
  pages = ids.map((id) => pages.find((p) => p.id === id)!).filter(Boolean);
  renumber();
});

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function updateNote() {
  const kept = pages.filter((p) => !p.deleted).length;
  applyBtn.disabled = kept < 1;
  note.classList.remove('is-error');
  note.textContent = `${kept} page${kept === 1 ? '' : 's'} in output${
    kept !== pages.length ? ` (${pages.length - kept} deleted)` : ''
  }.`;
}

function renumber() {
  let n = 0;
  grid.querySelectorAll<HTMLElement>('[data-id]').forEach((card) => {
    const page = pages.find((p) => p.id === card.dataset.id)!;
    const badge = card.querySelector('.pg-num')!;
    if (page.deleted) {
      badge.textContent = '–';
      card.classList.add('is-deleted');
    } else {
      badge.textContent = String(++n);
      card.classList.remove('is-deleted');
    }
  });
  updateNote();
}

function render() {
  grid.innerHTML = '';
  for (const page of pages) {
    const card = document.createElement('div');
    card.className = 'pg-card';
    card.draggable = true;
    card.dataset.id = page.id;
    card.innerHTML = `
      <div class="pg-thumb-wrap">
        <img class="pg-thumb" src="${page.thumb}" alt="" />
      </div>
      <div class="pg-bar">
        <span class="pg-num"></span>
        <button class="pg-btn pg-rotate" type="button" title="Rotate right" aria-label="Rotate right">⟳</button>
        <button class="pg-btn pg-del" type="button" title="Delete / restore" aria-label="Delete page">✕</button>
      </div>`;
    const img = card.querySelector<HTMLImageElement>('.pg-thumb')!;
    img.style.transform = `rotate(${page.rotation}deg)`;

    card.querySelector('.pg-rotate')!.addEventListener('click', (e) => {
      e.stopPropagation();
      page.rotation = (page.rotation + 90) % 360;
      img.style.transform = `rotate(${page.rotation}deg)`;
    });
    card.querySelector('.pg-del')!.addEventListener('click', (e) => {
      e.stopPropagation();
      page.deleted = !page.deleted;
      renumber();
    });
    grid.appendChild(card);
  }
  renumber();
}

async function load(file: File) {
  setState('ready');
  busy.hidden = false;
  grid.innerHTML = '';
  note.textContent = '';
  try {
    srcBytes = await readFileBytes(file);
    const { doc, numPages } = await openForRender(srcBytes);
    pages = [];
    for (let i = 1; i <= numPages; i++) {
      statusText.textContent = `Loading pages… ${i} of ${numPages}`;
      const t = await renderThumb(doc, i, 170);
      pages.push({
        id: crypto.randomUUID(),
        index: i - 1,
        rotation: 0,
        origRotation: t.rotation,
        deleted: false,
        thumb: t.url,
      });
    }
    render();
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  } finally {
    busy.hidden = true;
  }
}

async function apply() {
  if (!srcBytes) return;
  const kept = pages.filter((p) => !p.deleted);
  if (!kept.length) return;
  applyBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Building PDF…';
  try {
    const src = await PDFDocument.load(srcBytes);
    const out = await PDFDocument.create();
    for (const page of kept) {
      const [copied] = await out.copyPages(src, [page.index]);
      copied.setRotation(degrees((page.origRotation + page.rotation) % 360));
      out.addPage(copied);
    }
    const bytes = await out.save();
    downloadBytes(bytes, 'organized.pdf');
    note.textContent = `Done. Saved ${kept.length} page${kept.length === 1 ? '' : 's'}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not build the PDF: ${err?.message ?? err}`;
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
  pages = [];
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
