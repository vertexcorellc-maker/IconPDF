// Carries files dropped on the home screen into whichever tool the user picks.
// Files live in IndexedDB (File objects are structured-cloneable); the chosen
// tool's slug lives in sessionStorage so it only hydrates the matching page.

const DB_NAME = 'iconpdf-handoff';
const STORE = 'files';
const KEY = 'pending';
const TARGET_KEY = 'iconpdf-handoff-target';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Stash the dropped files and remember which tool page should receive them. */
export async function putHandoff(files: File[], targetSlug: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(files, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    sessionStorage.setItem(TARGET_KEY, targetSlug);
  } catch {
    // If storage is unavailable, the tool page just opens empty — no crash.
  }
}

/** On a tool page: return and clear the pending files if they were meant for this slug. */
export async function consumeHandoff(slug: string): Promise<File[] | null> {
  let target: string | null = null;
  try {
    target = sessionStorage.getItem(TARGET_KEY);
  } catch {
    return null;
  }
  if (!target || target !== slug) return null;
  try {
    sessionStorage.removeItem(TARGET_KEY);
  } catch {
    /* ignore */
  }
  try {
    const db = await openDb();
    const files = await new Promise<File[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const getReq = store.get(KEY);
      getReq.onsuccess = () => {
        store.delete(KEY);
        resolve((getReq.result as File[]) ?? null);
      };
      getReq.onerror = () => reject(getReq.error);
    });
    db.close();
    return files && files.length ? files : null;
  } catch {
    return null;
  }
}
