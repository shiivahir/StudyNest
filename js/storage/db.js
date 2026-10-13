/*
  Local storage layer (IndexedDB).

  DBMS view of the design:
    files  = table of small metadata rows   (primary key: id)
    blobs  = table of heavy PDF bytes       (key: the same id)
  Splitting light data from heavy data keeps the library list fast: listing files
  never has to touch the PDF bytes. Writes to both tables happen in ONE transaction,
  so a file is either fully saved or not saved at all (atomicity, the A in ACID).
*/
const DB_NAME = 'studynest';
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('files', { keyPath: 'id' });
        db.createObjectStore('blobs');            // out-of-line key = file id
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { dbPromise = null; reject(request.error); };
    });
  }
  return dbPromise;
}

/* Run `work` inside one transaction; resolve when the transaction COMMITS. */
async function run(storeNames, mode, work) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, mode);
    const request = work(...storeNames.map(name => transaction.objectStore(name)));
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
  });
}

export async function addFile(file, pageCount) {
  const record = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    pages: pageCount,
    addedAt: Date.now(),
  };
  const blob = new Blob([file], { type: 'application/pdf' });
  await run(['files', 'blobs'], 'readwrite', (files, blobs) => {
    files.put(record);
    blobs.put(blob, record.id);
  });
  return record;
}

export async function listFiles() {
  const all = await run(['files'], 'readonly', files => files.getAll());
  return all.sort((a, b) => b.addedAt - a.addedAt);     // newest first
}

export const getFileMeta = id => run(['files'], 'readonly', files => files.get(id));
export const getFileBlob = id => run(['blobs'], 'readonly', blobs => blobs.get(id));
export const countFiles  = () => run(['files'], 'readonly', files => files.count());

export async function deleteFile(id) {
  await run(['files', 'blobs'], 'readwrite', (files, blobs) => {
    files.delete(id);
    blobs.delete(id);
  });
}

/* Ask the browser not to evict our data when disk space is low. May be declined. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch { /* ignore: persistence is a bonus, not a requirement */ }
  return false;
}
