import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { openForRender, renderThumb, readFileBytes, downloadBytes } from '../../lib/pdf';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('wm-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const prev = el<HTMLImageElement>('prev');
const wm = el<HTMLDivElement>('wm');
const note = el<HTMLParagraphElement>('note');
const applyBtn = el<HTMLButtonElement>('apply');
const resetBtn = el<HTMLButtonElement>('reset');
const textI = el<HTMLInputElement>('text');
const sizeS = el<HTMLSelectElement>('size');
const angleS = el<HTMLSelectElement>('angle');
const layoutS = el<HTMLSelectElement>('layout');
const colorI = el<HTMLInputElement>('color');
const opacityI = el<HTMLInputElement>('opacity');

let srcBytes: Uint8Array | null = null;
let pageCount = 0;
let previewHeightPts = 842;
let baseName = 'document';

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function updatePreview() {
  // Scale the PDF point size to the rendered preview height.
  const scale = prev.clientHeight / previewHeightPts || 0.24;
  wm.textContent = textI.value;
  wm.style.fontSize = `${Number(sizeS.value) * scale}px`;
  wm.style.color = colorI.value;
  wm.style.opacity = opacityI.value;
  wm.style.transform = `translate(-50%, -50%) rotate(${-Number(angleS.value)}deg)`;
  wm.style.display = textI.value ? 'block' : 'none';
}

async function load(file: File) {
  setState('ready');
  note.textContent = '';
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  try {
    srcBytes = await readFileBytes(file);
    const { doc, numPages } = await openForRender(srcBytes);
    pageCount = numPages;
    const page = await doc.getPage(1);
    previewHeightPts = page.getViewport({ scale: 1 }).height;
    prev.onload = updatePreview;
    prev.src = (await renderThumb(doc, 1, 320)).url;
    note.textContent = `${numPages} page${numPages === 1 ? '' : 's'}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  }
}

async function apply() {
  if (!srcBytes || !textI.value) return;
  applyBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Applying…';
  try {
    const text = textI.value;
    const size = Number(sizeS.value);
    const angle = Number(angleS.value);
    const opacity = Number(opacityI.value);
    const { r, g, b } = hexToRgb(colorI.value);
    const color = rgb(r, g, b);
    const rad = (angle * Math.PI) / 180;

    const doc = await PDFDocument.load(srcBytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const tw = font.widthOfTextAtSize(text, size);

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      if (layoutS.value === 'tile') {
        const gapX = Math.max(tw + 80, 240);
        const gapY = 150;
        for (let y = 0; y < height + gapY; y += gapY) {
          for (let x = -tw; x < width + gapX; x += gapX) {
            page.drawText(text, { x, y, size, font, color, opacity, rotate: degrees(angle) });
          }
        }
      } else {
        const x = width / 2 - (tw / 2) * Math.cos(rad);
        const y = height / 2 - (tw / 2) * Math.sin(rad);
        page.drawText(text, { x, y, size, font, color, opacity, rotate: degrees(angle) });
      }
    }
    downloadBytes(await doc.save(), `${baseName}-watermarked.pdf`);
    note.textContent = `Done. Watermarked ${pageCount} page${pageCount === 1 ? '' : 's'}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not apply the watermark: ${err?.message ?? err}`;
  } finally {
    applyBtn.disabled = false;
  }
}

[textI, sizeS, angleS, colorI, opacityI].forEach((c) =>
  c.addEventListener('input', updatePreview)
);
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
