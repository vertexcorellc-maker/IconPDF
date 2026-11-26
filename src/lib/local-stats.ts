// Live "processed locally" counter behind the header status pill.
// Counts bytes read from the user's own files this session — nothing is sent anywhere.
const KEY = 'iconpdf-local-bytes';

export const fmtBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`
      : `${(n / 1048576).toFixed(n < 10485760 ? 2 : 1)} MB`;

export function getLocalBytes(): number {
  try {
    return Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Record that a file of `size` bytes was read on-device, and notify listeners. */
export function trackLocalInput(name: string, size: number, file?: File) {
  const total = getLocalBytes() + size;
  try {
    sessionStorage.setItem(KEY, String(total));
  } catch {
    /* storage blocked — the pill just won't count */
  }
  window.dispatchEvent(new CustomEvent('iconpdf:input', { detail: { name, size, total, file } }));
}
