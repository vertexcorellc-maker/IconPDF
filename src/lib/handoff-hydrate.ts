// Runs on every page (imported from the layout). On a tool page it injects any
// handed-off file into that tool's hidden file input and fires `change`, so the
// tool loads it exactly as if the user had dropped it there. No-op on the home
// page and on tool pages with no pending handoff.
import { consumeHandoff } from './handoff';

const slug = location.pathname.replace(/^\/+|\/+$/g, '');
const input = document.getElementById('file') as HTMLInputElement | null;

if (slug && input) {
  consumeHandoff(slug).then((files) => {
    if (!files || !files.length) return;
    // Defer a frame so the tool's own module has attached its change listener.
    requestAnimationFrame(() => {
      try {
        const dt = new DataTransfer();
        for (const f of files) dt.items.add(f);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch {
        /* browser blocked the injection — the user can still drop manually */
      }
    });
  });
}
