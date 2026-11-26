// Shared tool-page chrome, applied to every `section.tool`:
//  1. Empty state: upload icon, format chips from the input's `accept`, "try a sample".
//  2. Active state: splits `.stage` into a canvas (previews) and a sticky inspector
//     (settings + actions). Elements are *moved*, never recreated, so every id and
//     listener the tool scripts hold stays valid — no tool logic changes.
const UPLOAD_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';

// Direct children of .stage that belong in the inspector, in document order.
const INSPECTOR_CHILDREN = ['.select-bar', '.opt-row', '.info', '.controls', '.note'];
// Nested panels that are really settings (lifted out of their two-column layouts).
const INSPECTOR_NESTED = ['.wm-controls'];

const tool = document.querySelector<HTMLElement>('section.tool');
const drop = tool?.querySelector<HTMLLabelElement>('.drop');
const stage = tool?.querySelector<HTMLElement>('.stage');
const input = document.getElementById('file') as HTMLInputElement | null;

function enhanceDrop() {
  if (!drop || !input) return;
  const icon = drop.querySelector('.drop-icon');
  if (icon) icon.innerHTML = UPLOAD_ICON;

  const accept = input.accept.split(',').map((s) => s.trim());
  const chips: string[] = [];
  if (accept.includes('application/pdf')) chips.push('PDF');
  if (accept.includes('image/jpeg')) chips.push('JPG');
  if (accept.includes('image/png')) chips.push('PNG');
  if (accept.includes('image/webp')) chips.push('WEBP');
  if (input.multiple) chips.push('MULTI-FILE');
  chips.push('NO SIZE LIMIT');
  const hint = drop.querySelector('.drop-hint');
  if (hint) {
    hint.setAttribute('aria-label', hint.textContent?.trim() ?? '');
    hint.innerHTML = chips.map((c) => `<span class="chip">${c}</span>`).join('');
  }

  const wantsPdf = accept.includes('application/pdf');
  const wantsImage = !wantsPdf && accept.includes('image/jpeg');
  // Background removal needs a real photo to be meaningful, so no synthetic sample there.
  if (!wantsPdf && !(wantsImage && location.pathname.includes('jpg-to-pdf'))) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'drop-sample';
  btn.innerHTML = `No file handy? <u>Try a sample ${wantsPdf ? 'PDF' : 'image'}</u>`;
  btn.addEventListener('click', async (e) => {
    e.preventDefault(); // keep the <label> from opening the file dialog
    e.stopPropagation();
    btn.disabled = true;
    try {
      const { samplePdf, sampleImage } = await import('./sample');
      const files = wantsPdf
        ? await Promise.all(Array.from({ length: input.multiple ? 2 : 1 }, (_, i) => samplePdf(i)))
        : await Promise.all([sampleImage(0), sampleImage(1)]);
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      btn.disabled = false;
    }
  });
  drop.appendChild(btn);
}

function buildWorkspace() {
  if (!stage || stage.querySelector('.workspace')) return;
  const ws = document.createElement('div');
  ws.className = 'workspace';
  const canvas = document.createElement('div');
  canvas.className = 'canvas';
  const insp = document.createElement('aside');
  insp.className = 'inspector';
  insp.setAttribute('aria-label', 'Tool settings');

  const settings = document.createElement('div');
  settings.className = 'insp-section';

  for (const sel of INSPECTOR_NESTED) {
    stage.querySelectorAll<HTMLElement>(sel).forEach((n) => settings.appendChild(n));
  }

  let controls: HTMLElement | null = null;
  for (const child of Array.from(stage.children) as HTMLElement[]) {
    if (child.classList.contains('busy')) continue; // overlay stays over the whole stage
    const goesRight = INSPECTOR_CHILDREN.some((s) => child.matches(s));
    if (!goesRight) {
      canvas.appendChild(child);
    } else if (child.matches('.controls')) {
      controls = child;
    } else if (child.matches('.info')) {
      // Long explanations become a collapsed accordion so settings stay scannable.
      const d = document.createElement('details');
      d.className = 'accordion';
      d.innerHTML = '<summary>How this works</summary>';
      d.appendChild(child);
      settings.appendChild(d);
    } else if (child.matches('.note') && controls) {
      controls.prepend(child);
    } else {
      settings.appendChild(child);
    }
  }

  const title = document.createElement('p');
  title.className = 'insp-title';
  title.textContent = settings.childElementCount ? 'Settings' : 'Export';
  insp.appendChild(title);

  // Slot for the stage-3 result card (filled by lib/result.ts).
  const result = document.createElement('div');
  result.id = 'result-slot';
  insp.appendChild(result);

  if (settings.childElementCount) insp.appendChild(settings);
  if (controls) insp.appendChild(controls);

  ws.append(canvas, insp);
  stage.appendChild(ws);

  // Tools with nothing to preview (Compress, Page numbers…) get a document preview
  // so the canvas never sits empty.
  if (!canvas.childElementCount) mountPreview(canvas);
}

function mountPreview(canvas: HTMLElement) {
  canvas.classList.add('canvas-preview');
  const box = document.createElement('div');
  box.className = 'doc-preview';
  canvas.appendChild(box);
  let token = 0;
  window.addEventListener('iconpdf:input', async (e) => {
    const { file, name, size } = (e as CustomEvent).detail as { file?: File; name: string; size: number };
    const my = ++token;
    const { fmtBytes } = await import('./local-stats');
    box.innerHTML = `<div class="doc-thumb"><span class="doc-spin"></span></div>
      <div class="doc-card"><span class="chip">PDF</span><span class="doc-name"></span><span class="doc-meta mono">${fmtBytes(size)}</span></div>`;
    box.querySelector('.doc-name')!.textContent = name;
    if (!file || file.type !== 'application/pdf') return;
    try {
      const { openForRender, renderThumb } = await import('./pdf');
      const { doc, numPages } = await openForRender(new Uint8Array(await file.arrayBuffer()));
      const t = await renderThumb(doc, 1, 360);
      if (my !== token) return;
      box.querySelector('.doc-thumb')!.innerHTML = `<img src="${t.url}" alt="First page preview" />`;
      box.querySelector('.doc-meta')!.textContent = `${fmtBytes(size)} · ${numPages} page${numPages > 1 ? 's' : ''}`;
    } catch {
      box.querySelector('.doc-thumb')?.remove();
    }
  });
}

enhanceDrop();
buildWorkspace();
