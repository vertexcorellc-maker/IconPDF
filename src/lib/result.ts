// Stage 3 — the shared result card. Every tool already downloads through
// lib/pdf.ts#downloadBlob, which emits `iconpdf:result`; this renders the
// before/after metrics, a re-download button and one-click "chain" actions that
// hand the output straight to another tool via the existing handoff store.
import { TOOLS, CHAIN_ORDER } from '../site';
import { putHandoff } from './handoff';
import { fmtBytes } from './local-stats';

const slug = location.pathname.replace(/^\/+|\/+$/g, '');
const tool = document.querySelector<HTMLElement>('section.tool');
const input = document.getElementById('file') as HTMLInputElement | null;
const CHECK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>';

const CHAIN_LABEL: Record<string, string> = {
  'compress-pdf': 'Compress this result',
  'sanitize-pdf': 'Sanitize it',
  'clean-metadata': 'Strip metadata',
  'sign-pdf': 'Sign it',
  'page-numbers': 'Add page numbers',
  'watermark-pdf': 'Watermark it',
  'organize-pdf': 'Reorder pages',
  'split-pdf': 'Split it',
};

// Inputs read since the tool was last reset — gives us an honest "before" size.
let inputs: { name: string; size: number }[] = [];
window.addEventListener('iconpdf:input', (e) => {
  const d = (e as CustomEvent).detail;
  inputs.push({ name: d.name, size: d.size });
});

const slot = () => document.getElementById('result-slot');

function clear() {
  const s = slot();
  if (s) s.innerHTML = '';
}

if (tool) {
  // Back to the empty state → forget inputs and hide the result card.
  new MutationObserver(() => {
    if (tool.dataset.state === 'idle') {
      inputs = [];
      clear();
    }
  }).observe(tool, { attributes: true, attributeFilter: ['data-state'] });
}

window.addEventListener('iconpdf:result', (e) => {
  const s = slot();
  if (!s) return;
  const { blob, filename } = (e as CustomEvent).detail as { blob: Blob; filename: string };
  const isPdf = blob.type === 'application/pdf';
  const kind = isPdf ? 'PDF' : blob.type === 'application/zip' ? 'ZIP' : blob.type.startsWith('image/') ? 'image' : 'file';

  // Before → after only when a single source file makes the comparison meaningful.
  let metric = `<span>${fmtBytes(blob.size)}</span>`;
  const single = isPdf && !input?.multiple && inputs.length > 0;
  if (single) {
    const before = inputs[inputs.length - 1].size;
    const pct = Math.round((1 - blob.size / before) * 100);
    const cls = pct > 0 ? 'delta' : 'delta is-up';
    const sign = pct > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`;
    metric = `${fmtBytes(before)} → ${fmtBytes(blob.size)} <span class="${cls}">(${sign})</span>`;
  } else if (isPdf && inputs.length > 1) {
    metric = `${inputs.length} files → ${fmtBytes(blob.size)}`;
  }

  const chains = isPdf
    ? CHAIN_ORDER.filter((c) => c !== slug && TOOLS.some((t) => t.slug === c && t.ready)).slice(0, 4)
    : [];

  s.innerHTML = `
    <div class="result" role="status">
      <div class="result-head"><span class="result-check">${CHECK}</span>Done — saved to your downloads</div>
      <div class="result-file" title="${filename}">${filename}</div>
      <div class="result-metric">${metric}</div>
      <button type="button" class="btn btn-primary" data-act="dl">Download ${kind} again</button>
      ${
        chains.length
          ? `<p class="chain-label">Chain to another tool</p>
             <div class="chain">${chains
               .map((c) => `<button type="button" data-chain="${c}">${CHAIN_LABEL[c] ?? c}</button>`)
               .join('')}</div>`
          : ''
      }
    </div>`;

  s.querySelector('[data-act="dl"]')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  s.querySelectorAll<HTMLButtonElement>('[data-chain]').forEach((b) =>
    b.addEventListener('click', async () => {
      b.disabled = true;
      const file = new File([blob], filename, { type: 'application/pdf' });
      await putHandoff([file], b.dataset.chain!);
      location.href = '/' + b.dataset.chain;
    })
  );
  s.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
