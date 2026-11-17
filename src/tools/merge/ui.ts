import { PDFDocument } from 'pdf-lib';
import { openForRender, renderThumb, readFileBytes, downloadBytes, makeSortable } from '../../lib/pdf';

interface Item {
  id: string;
  name: string;
  kind: 'pdf' | 'image';
  bytes: Uint8Array;
  pages: number;
  thumb: string;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('merge-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const fileMore = el<HTMLInputElement>('fileMore');
const stage = el<HTMLDivElement>('stage');
const list = el<HTMLDivElement>('list');
const note = el<HTMLParagraphElement>('note');
const mergeBtn = el<HTMLButtonElement>('merge');
const clearBtn = el<HTMLButtonElement>('clear');

let items: Item[] = [];

makeSortable(list, (ids) => {
  items = ids.map((id) => items.find((it) => it.id === id)!).filter(Boolean);
  updateNote();
});

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function updateNote() {
  const totalPages = items.reduce((n, it) => n + it.pages, 0);
  mergeBtn.disabled = items.length < 1;
  note.classList.remove('is-error');
  note.textContent = items.length
    ? `${items.length} file${items.length > 1 ? 's' : ''}, ${totalPages} page${totalPages > 1 ? 's' : ''} total.`
    : 'Add at least one file.';
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
      <span class="file-meta">${it.pages} pg${it.pages > 1 ? 's' : ''}</span>
      <button class="file-remove" type="button" title="Remove" aria-label="Remove ${it.name}">×</button>`;
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
  const incoming = Array.from(files);
  if (!incoming.length) return;
  setState('ready');
  note.textContent = 'Reading files…';
  for (const file of incoming) {
    try {
      const bytes = await readFileBytes(file);
      const id = crypto.randomUUID();
      if (file.type === 'application/pdf') {
        const { doc, numPages } = await openForRender(bytes);
        const thumb = (await renderThumb(doc, 1, 200)).url;
        items.push({ id, name: file.name, kind: 'pdf', bytes, pages: numPages, thumb });
      } else if (file.type.startsWith('image/')) {
        items.push({
          id,
          name: file.name,
          kind: 'image',
          bytes,
          pages: 1,
          thumb: URL.createObjectURL(new Blob([bytes], { type: file.type })),
        });
      }
    } catch (err) {
      console.error('Could not read', file.name, err);
    }
  }
  render();
  updateNote();
}

async function merge() {
  if (items.length < 1) return;
  mergeBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Merging…';
  try {
    const outDoc = await PDFDocument.create();
    for (const it of items) {
      if (it.kind === 'pdf') {
        const src = await PDFDocument.load(it.bytes);
        const copied = await outDoc.copyPages(src, src.getPageIndices());
        copied.forEach((p) => outDoc.addPage(p));
      } else {
        const img =
          it.name.toLowerCase().endsWith('.png') || it.thumb.includes('image/png')
            ? await outDoc.embedPng(it.bytes)
            : await outDoc.embedJpg(it.bytes);
        const page = outDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
    }
    const bytes = await outDoc.save();
    downloadBytes(bytes, 'merged.pdf');
    note.textContent = `Done. Merged ${items.length} files into one PDF.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not merge: ${err?.message ?? err}`;
  } finally {
    mergeBtn.disabled = false;
  }
}

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
mergeBtn.addEventListener('click', merge);

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
