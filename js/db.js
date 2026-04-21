const DB_NAME = 'appLocalDB';
const DB_VERSION = 1;
const STORE_NAMES = ['settings', 'entities', 'records'];

let dbPromise = null;

function getDB() {
  if (!dbPromise) dbPromise = initDB();
  return dbPromise;
}

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('entities')) {
        db.createObjectStore('entities', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('records')) {
        db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(storeName, mode = 'readonly') {
  return getDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

export async function getAll(storeName) {
  const store = await tx(storeName);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getById(storeName, id) {
  const store = await tx(storeName);
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function add(storeName, data) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.add(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function update(storeName, data) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function remove(storeName, id) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function clearStore(storeName) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function exportAllData() {
  const payload = {};
  for (const storeName of STORE_NAMES) {
    payload[storeName] = await getAll(storeName);
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: payload,
  };
}

export async function importAllData(input) {
  if (!input || !input.data) {
    throw new Error('Invalid import file');
  }

  for (const storeName of STORE_NAMES) {
    await clearStore(storeName);
    const list = input.data[storeName] || [];
    for (const item of list) {
      await add(storeName, item);
    }
  }

  return true;
}
