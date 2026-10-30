const DB_NAME = "garagem-offline";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface PendingRecord {
  id: string;
  type: string;
  data: any;
  token: string;
  createdAt: string;
}

export async function savePending(record: PendingRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", "readwrite");
    tx.objectStore("pending").put(record);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getPending(): Promise<PendingRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", "readonly");
    const request = tx.objectStore("pending").getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function removePending(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", "readwrite");
    tx.objectStore("pending").delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function saveCache(key: string, data: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readwrite");
    tx.objectStore("cache").put({ key, data, savedAt: Date.now() });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getCache(key: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readonly");
    const request = tx.objectStore("cache").get(key);
    request.onsuccess = () => { db.close(); resolve(request.result?.data ?? null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

// Comparacao e escrita na mesma transacao: duas abas nao apagam a fila uma da outra.
export async function compareAndSaveCache(key: string, data: unknown, expected: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite'), store = tx.objectStore('cache');
    const request = store.get(key);
    let conflict = false;
    request.onsuccess = () => {
      const stored = request.result?.data;
      if ((stored === undefined ? null : JSON.stringify(stored)) !== expected) { conflict = true; tx.abort(); return; }
      store.put({ key, data, savedAt: Date.now() });
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(conflict
      ? Object.assign(new Error('Controle local mudou em outra aba. Recarregue para preservar as pendencias.'), { status: 409 }) : tx.error); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getCacheEntries(prefix: string): Promise<{ key: string; data: any }[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readonly');
    const request = tx.objectStore('cache').getAll(IDBKeyRange.bound(prefix, prefix + '\uffff'));
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function syncPending(
  sendFn: (record: PendingRecord) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const pending = await getPending();
  let synced = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      await sendFn(record);
      await removePending(record.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
