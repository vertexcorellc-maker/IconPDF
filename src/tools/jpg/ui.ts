import { PDFDocument } from 'pdf-lib';
import { readFileBytes, downloadBytes, makeSortable } from '../../lib/pdf';

interface Item {
  id: string;
  name: string;
  type: string;
  bytes: Uint8Array;
  thumb: string;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('jpg-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const fileMore = el<HTMLInputElement>('fileMore');
const stage = el<HTMLDivElement>('stage');
const list = el<HTMLDivElement>('list');
const note = el<HTMLParagraphElement>('note');
const createBtn = el<HTMLButtonElement>('create');
const clearBtn = el<HTMLButtonElement>('clear');
const sizeSel = el<HTMLSelectElement>('size');
const marginWrap = el<HTMLDivElement>('marginWrap');
const marginSel = el<HTMLSelectElement>('margin');

const PAGE = { a4: [595.28, 841.89], letter: [612, 792] } as const;
let items: Item[] = [];

makeSortable(list, (ids) => {
  items = ids.map((id) => items.find((it) => it.id === id)!).filter(Boolean);
});

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function updateNote() {
  createBtn.disabled = items.length < 1;
  note.classList.remove('is-error');
  note.textContent = items.length
    ? `${items.length} image${items.length > 1 ? 's' : ''}.`
    : 'Add at least one image.';
}

function render() {
  list.innerHTML = '';
  items.forEach((it, i) => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.draggable = true;
    card.dataset.id = it.id;
    card.innerHTML = `
      <span class="file-index">${i + 1}</span>
      <img class="file-thumb" src="${it.thumb}" alt="" />
      <span class="file-name" title="${it.name}">${it.name}</span>
      <button class="file-remove" type="button" title="Remove">×</button>`;
    card.querySelector('.file-remove')!.addEventListener('click', (e) => {
      e.stopPropagation();
      items = items.filter((x) => x.id !== it.id);
      render();
      updateNote();
      if (!items.length) setState('idle');
    });
    list.appendChild(card);
  });
}

async function addFiles(files: FileList | File[]) {
  const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (!incoming.length) return;
  setState('ready');
  for (const file of incoming) {
    const bytes = await readFileBytes(file);
    items.push({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      bytes,
      thumb: URL.createObjectURL(new Blob([bytes], { type: file.type })),
    });
  }
  render();
  updateNote();
}

async function create() {
  if (!items.length) return;
  createBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Creating PDF…';
  try {
    const mode = sizeSel.value as 'fit' | 'a4' | 'letter';
    const margin = Number(marginSel.value);
    const doc = await PDFDocument.create();
    for (const it of items) {
      const img =
        it.type === 'image/png' ? await doc.embedPng(it.bytes) : await doc.embedJpg(it.bytes);
      if (mode === 'fit') {
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      } else {
        const [pw, ph] = PAGE[mode];
        const page = doc.addPage([pw, ph]);
        const availW = pw - margin * 2;
        const availH = ph - margin * 2;
        const scale = Math.min(availW / img.width, availH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
    }
    downloadBytes(await doc.save(), 'images.pdf');
    note.textContent = `Done. Created a PDF from ${items.length} image${items.length > 1 ? 's' : ''}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not create the PDF: ${err?.message ?? err}`;
  } finally {
    createBtn.disabled = false;
  }
}

sizeSel.addEventListener('change', () => {
  marginWrap.hidden = sizeSel.value === 'fit';
});
fileInput.addEventListener('change', () => {
  if (fileInput.files) addFiles(fileInput.files);
  fileInput.value = '';
});
fileMore.addEventListener('change', () => {
  if (fileMore.files) addFiles(fileMore.files);
  fileMore.value = '';
});
clearBtn.addEventListener('click', () => {
  items = [];
  render();
  setState('idle');
});
createBtn.addEventListener('click', create);

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
  const files = (e as DragEvent).dataTransfer?.files;
  if (files?.length) addFiles(files);
});

setState('idle');
