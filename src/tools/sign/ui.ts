import { PDFDocument } from 'pdf-lib';
import SignaturePad from 'signature_pad';
import type * as pdfjs from 'pdfjs-dist';
import { openForRender, renderThumb, readFileBytes, downloadBytes } from '../../lib/pdf';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tool = el('sign-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const pageWrap = el<HTMLDivElement>('pageWrap');
const pageImg = el<HTMLImageElement>('pageImg');
const sigEl = el<HTMLDivElement>('sig');
const sigImg = el<HTMLImageElement>('sigImg');
const pageLabel = el<HTMLSpanElement>('pageLabel');
const note = el<HTMLParagraphElement>('note');
const applyBtn = el<HTMLButtonElement>('apply');
const resetBtn = el<HTMLButtonElement>('reset');
const pad = el<HTMLCanvasElement>('pad');
const typed = el<HTMLInputElement>('typed');
const sigSize = el<HTMLInputElement>('sigSize');

let doc: pdfjs.PDFDocumentProxy | null = null;
let srcBytes: Uint8Array | null = null;
let numPages = 0;
let current = 0;
let baseName = 'document';
let tab: 'draw' | 'type' = 'draw';
let signaturePad: SignaturePad | null = null;

let sigUrl: string | null = null;
let sigAspect = 0.4; // height / width
let place: { page: number; cx: number; cy: number; w: number } | null = null;

function setState(state: 'idle' | 'ready') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
}

function positionOverlay() {
  if (!place || place.page !== current) {
    sigEl.hidden = true;
    return;
  }
  const W = pageWrap.clientWidth;
  const H = pageWrap.clientHeight;
  const w = place.w * W;
  const h = w * sigAspect;
  sigEl.style.width = `${w}px`;
  sigEl.style.height = `${h}px`;
  sigEl.style.left = `${place.cx * W - w / 2}px`;
  sigEl.style.top = `${place.cy * H - h / 2}px`;
  sigEl.hidden = false;
}

async function showPage(i: number) {
  if (!doc) return;
  current = Math.max(0, Math.min(numPages - 1, i));
  pageLabel.textContent = `Page ${current + 1} of ${numPages}`;
  const t = await renderThumb(doc, current + 1, 520);
  await new Promise<void>((res) => {
    pageImg.onload = () => res();
    pageImg.src = t.url;
  });
  positionOverlay();
}

async function load(file: File) {
  setState('ready');
  note.textContent = '';
  baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  try {
    srcBytes = await readFileBytes(file);
    const loaded = await openForRender(srcBytes);
    doc = loaded.doc;
    numPages = loaded.numPages;
    place = null;
    sigUrl = null;
    applyBtn.disabled = true;
    await showPage(0);
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not open this PDF: ${err?.message ?? err}`;
  }
}

function typedToImage(text: string) {
  const font = '64px "Segoe Script", "Brush Script MT", cursive';
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  const w = Math.ceil(measure.measureText(text).width) + 24;
  const h = 96;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.font = font;
  ctx.fillStyle = '#0b1f4d';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 12, h / 2);
  return { url: c.toDataURL('image/png'), w, h };
}

function currentSignature(): { url: string; w: number; h: number } | null {
  if (tab === 'draw') {
    if (!signaturePad || signaturePad.isEmpty()) return null;
    return { url: signaturePad.toDataURL('image/png'), w: pad.width, h: pad.height };
  }
  const text = typed.value.trim();
  if (!text) return null;
  return typedToImage(text);
}

function placeSignature() {
  const s = currentSignature();
  if (!s) {
    note.classList.add('is-error');
    note.textContent = 'Draw or type your signature first.';
    return;
  }
  note.classList.remove('is-error');
  note.textContent = '';
  sigUrl = s.url;
  sigAspect = s.h / s.w;
  sigImg.src = s.url;
  place = { page: current, cx: 0.5, cy: 0.5, w: Number(sigSize.value) };
  applyBtn.disabled = false;
  positionOverlay();
}

async function apply() {
  if (!srcBytes || !sigUrl || !place) return;
  applyBtn.disabled = true;
  note.classList.remove('is-error');
  note.textContent = 'Signing…';
  try {
    const sigBytes = new Uint8Array(await (await fetch(sigUrl)).arrayBuffer());
    const out = await PDFDocument.load(srcBytes);
    const png = await out.embedPng(sigBytes);
    const page = out.getPages()[place.page];
    const { width, height } = page.getSize();
    const w = place.w * width;
    const h = w * sigAspect;
    const x = place.cx * width - w / 2;
    const y = height - place.cy * height - h / 2;
    page.drawImage(png, { x, y, width: w, height: h });
    downloadBytes(await out.save(), `${baseName}-signed.pdf`);
    note.textContent = `Done. Signature added to page ${place.page + 1}.`;
  } catch (err: any) {
    note.classList.add('is-error');
    note.textContent = `Could not sign: ${err?.message ?? err}`;
  } finally {
    applyBtn.disabled = false;
  }
}

// Dragging the signature overlay
let dragging = false;
sigEl.addEventListener('pointerdown', (e) => {
  if (!place) return;
  dragging = true;
  sigEl.setPointerCapture(e.pointerId);
});
sigEl.addEventListener('pointermove', (e) => {
  if (!dragging || !place) return;
  const box = pageWrap.getBoundingClientRect();
  place.cx = Math.min(0.97, Math.max(0.03, (e.clientX - box.left) / box.width));
  place.cy = Math.min(0.97, Math.max(0.03, (e.clientY - box.top) / box.height));
  positionOverlay();
});
sigEl.addEventListener('pointerup', () => (dragging = false));

// Tabs
function setTab(t: 'draw' | 'type') {
  tab = t;
  el('tabDraw').classList.toggle('is-active', t === 'draw');
  el('tabType').classList.toggle('is-active', t === 'type');
  el('panelDraw').hidden = t !== 'draw';
  el('panelType').hidden = t !== 'type';
  if (t === 'draw' && !signaturePad) signaturePad = new SignaturePad(pad, { penColor: '#0b1f4d' });
}
el('tabDraw').addEventListener('click', () => setTab('draw'));
el('tabType').addEventListener('click', () => setTab('type'));
el('clearPad').addEventListener('click', () => signaturePad?.clear());

sigSize.addEventListener('input', () => {
  if (place) {
    place.w = Number(sigSize.value);
    positionOverlay();
  }
});
el<HTMLButtonElement>('addSig').addEventListener('click', placeSignature);
el<HTMLButtonElement>('prev').addEventListener('click', () => showPage(current - 1));
el<HTMLButtonElement>('next').addEventListener('click', () => showPage(current + 1));

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) load(f);
  fileInput.value = '';
});
resetBtn.addEventListener('click', () => {
  doc = null;
  srcBytes = null;
  place = null;
  sigUrl = null;
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

setTab('draw');
setState('idle');
