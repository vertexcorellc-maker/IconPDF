const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const tool = el<HTMLElement>('bg-tool');
const drop = el<HTMLLabelElement>('drop');
const fileInput = el<HTMLInputElement>('file');
const stage = el<HTMLDivElement>('stage');
const compare = el<HTMLDivElement>('compare');
const orig = el<HTMLImageElement>('orig');
const cut = el<HTMLDivElement>('cut');
const out = el<HTMLCanvasElement>('out');
const busy = el<HTMLDivElement>('busy');
const statusText = el<HTMLParagraphElement>('status');
const bar = el<HTMLDivElement>('bar');
const slider = el<HTMLInputElement>('slider');
const divider = el<HTMLDivElement>('divider');
const downloadBtn = el<HTMLButtonElement>('download');
const resetBtn = el<HTMLButtonElement>('reset');
const pick = el<HTMLInputElement>('pick');
const note = el<HTMLParagraphElement>('note');
const swatches = Array.from(document.querySelectorAll<HTMLElement>('.swatch'));

let worker: Worker | null = null;
let fileName = 'image';
let background = 'transparent';
let origUrl: string | null = null;
let hasResult = false;
let currentFile: File | null = null;
let forceCpu = false;
try {
  forceCpu = sessionStorage.getItem('bg-force-cpu') === '1';
} catch {}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = onWorkerMessage;
    worker.onerror = (e) => fail(e.message || 'The AI worker stopped unexpectedly.');
  }
  return worker;
}

function setState(state: 'idle' | 'busy' | 'done' | 'error') {
  tool.dataset.state = state;
  drop.hidden = state !== 'idle';
  stage.hidden = state === 'idle';
  busy.hidden = state !== 'busy';
  downloadBtn.disabled = state !== 'done';
  slider.disabled = state !== 'done';
}

function setSplit(pct: number) {
  compare.style.setProperty('--split', `${pct}%`);
  divider.style.left = `${pct}%`;
}

function fail(message: string) {
  setState('error');
  note.textContent = `Something went wrong: ${message}`;
  note.classList.add('is-error');
}

function onWorkerMessage(e: MessageEvent) {
  const msg = e.data;
  if (msg.type === 'status') {
    if (msg.stage === 'model') {
      statusText.textContent = 'Loading the AI model (first time only)…';
      bar.style.width = '0%';
    } else {
      statusText.textContent = 'Removing background…';
      bar.style.width = '100%';
      bar.classList.add('is-pulse');
    }
  } else if (msg.type === 'progress') {
    const pct = msg.total ? Math.round((msg.loaded / msg.total) * 100) : 0;
    const mb = (n: number) => (n / 1048576).toFixed(0);
    statusText.textContent = `Loading the AI model: ${mb(msg.loaded)} of ${mb(msg.total)} MB`;
    bar.style.width = `${pct}%`;
  } else if (msg.type === 'done') {
    out.width = msg.width;
    out.height = msg.height;
    const ctx = out.getContext('2d')!;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(msg.data), msg.width, msg.height), 0, 0);
    hasResult = true;
    bar.classList.remove('is-pulse');
    setState('done');
    slider.value = '50';
    setSplit(50);
    note.textContent =
      msg.tier === 'gpu'
        ? 'Processed on your graphics card.'
        : 'Processed on your processor. A browser with WebGPU gives sharper edges and more speed.';
  } else if (msg.type === 'retry-cpu') {
    forceCpu = true;
    try {
      sessionStorage.setItem('bg-force-cpu', '1');
    } catch {}
    worker?.terminate();
    worker = null;
    if (currentFile) getWorker().postMessage({ blob: currentFile, forceCpu });
  } else if (msg.type === 'error') {
    fail(msg.message);
  }
}

function start(file: File) {
  if (!file.type.startsWith('image/')) return;
  fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
  if (origUrl) URL.revokeObjectURL(origUrl);
  origUrl = URL.createObjectURL(file);
  hasResult = false;
  note.textContent = '';
  note.classList.remove('is-error');
  out.width = out.height = 0;
  statusText.textContent = 'Preparing…';
  bar.style.width = '0%';
  setSplit(100);
  orig.onload = () => {
    compare.style.aspectRatio = `${orig.naturalWidth} / ${orig.naturalHeight}`;
  };
  orig.src = origUrl;
  setState('busy');
  currentFile = file;
  getWorker().postMessage({ blob: file, forceCpu });
}

function setBackground(value: string, source?: HTMLElement) {
  background = value;
  cut.style.setProperty('--bg', value === 'transparent' ? '' : value);
  cut.classList.toggle('has-colour', value !== 'transparent');
  swatches.forEach((s) => s.classList.toggle('is-active', s === source));
}

function download() {
  if (!hasResult) return;
  const canvas = document.createElement('canvas');
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext('2d')!;
  if (background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(out, 0, 0);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}-no-background.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) start(file);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((type) =>
  document.addEventListener(type, (e) => {
    e.preventDefault();
    drop.classList.add('is-over');
  })
);
['dragleave', 'drop'].forEach((type) =>
  document.addEventListener(type, (e) => {
    e.preventDefault();
    drop.classList.remove('is-over');
  })
);
document.addEventListener('drop', (e) => {
  const file = (e as DragEvent).dataTransfer?.files?.[0];
  if (file) start(file);
});
document.addEventListener('paste', (e) => {
  const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
  if (file) start(file);
});

slider.addEventListener('input', () => setSplit(Number(slider.value)));
downloadBtn.addEventListener('click', download);
resetBtn.addEventListener('click', () => setState('idle'));
swatches.forEach((s) => {
  if (s.dataset.bg) s.addEventListener('click', () => setBackground(s.dataset.bg!, s));
});
pick.addEventListener('input', () => setBackground(pick.value, pick.parentElement!));

setState('idle');
