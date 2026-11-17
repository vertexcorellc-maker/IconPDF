import { PDFDocument } from 'pdf-lib';
import { readFileBytes, downloadBytes } from '../../lib/pdf';

const LAYOUTS: Record<string, { cols: number; rows: number }> = {
  '2': { cols: 1, rows: 2 },
  '4': { cols: 2, rows: 2 },
  '6': { cols: 2, rows: 3 },
  '9': { cols: 3, rows: 3 },
};
const A4: [number, number] = [595.28, 841.89];
const MARGIN = 18;
const GAP = 10;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('nup-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const note = el<HTMLParagraphElement>('note');
const info = el<HTMLParagraphElement>('info');
const layoutS = el<HTMLSelectElement>('layout');
const applyBtn = el<HTMLButtonElement>('apply');
const resetBtn = el<HTMLButtonElement>('reset');

let srcBytes: Uint8Array | null = null;
let pageCount = 0;
let baseName = 'document';

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function updateInfo() {
  if (!pageCount) return;
  const per = Number(layoutS.value);
  info.textContent = `${pageCount} pages → ${Math.ceil(pageCount / per)} sheet${
    Math.ceil(pageCount / per) === 1 ? '' : 's'
  }`;
}

async function load(file: File) {
  setState('ready');
  note.textContent = '';
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  srcBytes = await readFileBytes(file);
  const doc = await PDFDocument.load(srcBytes);
  pageCount = doc.getPageCount();
  updateInfo();
}

async function apply() {
  if (!srcBytes) return;
  applyBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Arranging…';
  try {
    const src = await PDFDocument.load(srcBytes);
    const out = await PDFDocument.create();
    const eps = await out.embedPdf(srcBytes, src.getPageIndices());
    const { cols, rows } = LAYOUTS[layoutS.value];
    const per = cols * rows;
    const [PW, PH] = A4;
    const cellW = (PW - 2 * MARGIN - (cols - 1) * GAP) / cols;
    const cellH = (PH - 2 * MARGIN - (rows - 1) * GAP) / rows;

    for (let i = 0; i < eps.length; i += per) {
      const sheet = out.addPage([PW, PH]);
      for (let k = 0; k < per && i + k < eps.length; k++) {
        const ep = eps[i + k];
        const col = k % cols;
        const row = Math.floor(k / cols);
        const scale = Math.min(cellW / ep.width, cellH / ep.height);
        const w = ep.width * scale;
        const h = ep.height * scale;
        const cellX = MARGIN + col * (cellW + GAP);
        const cellTop = PH - MARGIN - row * (cellH + GAP);
        const x = cellX + (cellW - w) / 2;
        const y = cellTop - cellH + (cellH - h) / 2;
        sheet.drawPage(ep, { x, y, width: w, height: h });
      }
    }
    downloadBytes(await out.save(), `${baseName}-${layoutS.value}up.pdf`);
    note.textContent = `Done. ${pageCount} pages on ${out.getPageCount()} sheet${
      out.getPageCount() === 1 ? '' : 's'
    }.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not arrange the pages: ${err?.message ?? err}`;
  } finally {
    applyBtn.disabled = false;
  }
}

layoutS.addEventListener('change', updateInfo);
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
