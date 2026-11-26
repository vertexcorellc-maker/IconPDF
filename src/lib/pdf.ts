// Shared PDF helpers: pdf.js for rendering page thumbnails, pdf-lib for editing.
// Everything runs in the browser; nothing is uploaded.
import * as pdfjs from 'pdfjs-dist';
// Vite's ?worker import gives a real module Worker, which avoids the worker
// handshake hanging that happens when pdf.js is handed a worker URL string.
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import { trackLocalInput } from './local-stats';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

export interface LoadedPdf {
  doc: pdfjs.PDFDocumentProxy;
  numPages: number;
}

/** Open a PDF for rendering. Clones the bytes so the caller's copy stays usable. */
export async function openForRender(bytes: Uint8Array): Promise<LoadedPdf> {
  const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
  return { doc, numPages: doc.numPages };
}

/** Render one page to a PNG data URL at roughly the given width. */
export async function renderThumb(
  doc: pdfjs.PDFDocumentProxy,
  pageNumber: number,
  targetWidth = 200
): Promise<{ url: string; width: number; height: number; rotation: number }> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = targetWidth / base.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return {
    url: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    rotation: (page as any).rotate ?? 0,
  };
}

export async function readFileBytes(file: File): Promise<Uint8Array> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  trackLocalInput(file.name, file.size, file);
  return bytes;
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  // Lets the shared result card (lib/result.ts) show metrics + chain actions.
  window.dispatchEvent(new CustomEvent('iconpdf:result', { detail: { blob, filename } }));
}

/** Render a full page to an image Blob (for PDF → JPG/PNG). */
export async function renderPageToBlob(
  doc: pdfjs.PDFDocumentProxy,
  pageNumber: number,
  scale = 2,
  type: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d')!;
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), type, quality));
}

/** Zip a set of files in the browser and download them. */
export async function zipAndDownload(
  files: { name: string; data: Uint8Array }[],
  zipName: string
) {
  const { zipSync } = await import('fflate');
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[f.name] = f.data;
  const zipped = zipSync(entries, { level: 6 });
  downloadBlob(new Blob([zipped], { type: 'application/zip' }), zipName);
}

/** Minimal HTML5 drag-to-reorder for a container of [data-id] children.
 *  Calls onReorder(newOrderOfIds) after each drop. */
export function makeSortable(container: HTMLElement, onReorder: (ids: string[]) => void) {
  let dragId: string | null = null;

  container.addEventListener('dragstart', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
    if (!card) return;
    dragId = card.dataset.id!;
    card.classList.add('dragging');
    e.dataTransfer!.effectAllowed = 'move';
  });

  container.addEventListener('dragend', () => {
    container.querySelector('.dragging')?.classList.remove('dragging');
    dragId = null;
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const after = getAfterElement(container, e.clientX, e.clientY);
    const dragging = container.querySelector<HTMLElement>('.dragging');
    if (!dragging) return;
    if (after == null) container.appendChild(dragging);
    else container.insertBefore(dragging, after);
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    const ids = Array.from(container.querySelectorAll<HTMLElement>('[data-id]')).map(
      (el) => el.dataset.id!
    );
    onReorder(ids);
  });
}

function getAfterElement(container: HTMLElement, x: number, y: number): HTMLElement | null {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>('[data-id]:not(.dragging)')
  );
  let closest: { offset: number; el: HTMLElement } | null = null;
  for (const el of items) {
    const box = el.getBoundingClientRect();
    // Reorder on a wrapping grid: use the row (y) first, then x within the row.
    const offset = y - box.top - box.height / 2 || x - box.left - box.width / 2;
    if (offset < 0 && (closest === null || offset > closest.offset)) {
      closest = { offset, el };
    }
  }
  return closest?.el ?? null;
}
