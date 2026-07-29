// Fail-Safe Dual Persistence Storage Engine (IndexedDB + LocalStorage Backup)
const DB_NAME = 'AetherDriveDB';
const DB_VERSION = 4;

let dbInstance = null;

// ── IndexedDB Initialization ──────────────────────────────────────────────────
export function initDB() {
  return new Promise((resolve) => {
    if (dbInstance) return resolve(dbInstance);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onblocked = () => {
        if (dbInstance) {
          try { dbInstance.close(); } catch {}
          dbInstance = null;
        }
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('files')) {
          const s = db.createObjectStore('files', { keyPath: 'id' });
          s.createIndex('userId',   'userId',   { unique: false });
          s.createIndex('folderId', 'folderId', { unique: false });
        }

        if (!db.objectStoreNames.contains('folders')) {
          const s = db.createObjectStore('folders', { keyPath: 'id' });
          s.createIndex('userId',   'userId',   { unique: false });
          s.createIndex('parentId', 'parentId', { unique: false });
        }

        if (!db.objectStoreNames.contains('activity_logs')) {
          const s = db.createObjectStore('activity_logs', { keyPath: 'id' });
          s.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains('vault_settings')) {
          db.createObjectStore('vault_settings', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('converted_blobs')) {
          db.createObjectStore('converted_blobs', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        dbInstance = e.target.result;
        dbInstance.onclose = () => { dbInstance = null; };
        dbInstance.onversionchange = () => {
          try { dbInstance.close(); } catch {}
          dbInstance = null;
        };
        resolve(dbInstance);
      };

      request.onerror = (e) => {
        console.warn('[IDB] Open fallback to localStorage:', e.target?.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('[IDB] Exception fallback to localStorage:', err);
      resolve(null);
    }
  });
}

// ── LocalStorage Backup Helpers ───────────────────────────────────────────────
const LS_FILES_KEY = 'aether_ls_vault_files';
const LS_FOLDERS_KEY = 'aether_ls_vault_folders';
const LS_LOGS_KEY = 'aether_ls_activity_logs';

function getLS(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLS(key, items) {
  try {
    // Strip heavy binary blob references before saving to localStorage
    const cleanItems = items.map(item => {
      const { blob, ...rest } = item;
      return rest;
    });
    localStorage.setItem(key, JSON.stringify(cleanItems));
  } catch { /* localStorage quota limit — ignore */ }
}

function putLS(key, record) {
  try {
    const items = getLS(key);
    const idx = items.findIndex(i => i.id === record.id);
    const { blob, ...cleanRecord } = record;
    if (idx >= 0) {
      items[idx] = cleanRecord;
    } else {
      items.unshift(cleanRecord);
    }
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

function deleteLS(key, id) {
  try {
    const items = getLS(key).filter(i => i.id !== id);
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

// ── Files Operations ──────────────────────────────────────────────────────────
export async function getAllFiles() {
  const lsFiles = getLS(LS_FILES_KEY);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('files')) return lsFiles;

    return new Promise((resolve) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.getAll();
      req.onsuccess = () => {
        const idbFiles = req.result || [];
        // Merge IDB files with LS backup files
        const map = new Map();
        lsFiles.forEach(f => map.set(f.id, f));
        idbFiles.forEach(f => map.set(f.id, { ...map.get(f.id), ...f }));
        resolve(Array.from(map.values()));
      };
      req.onerror = () => resolve(lsFiles);
    });
  } catch {
    return lsFiles;
  }
}

export async function saveFile(record) {
  putLS(LS_FILES_KEY, record);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('files')) return null;

    return new Promise((resolve) => {
      let isResolved = false;
      const done = (val) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);
          resolve(val);
        }
      };

      const timer = setTimeout(() => done(null), 15000);

      const tx = db.transaction('files', 'readwrite');
      tx.onabort = () => done(null);
      tx.onerror = () => done(null);

      const store = tx.objectStore('files');
      const getReq = store.get(record.id);

      getReq.onsuccess = () => {
        const existing = getReq.result;
        const recordToSave = {
          ...record,
          blob: record.blob || existing?.blob || null
        };
        const putReq = store.put(recordToSave);
        putReq.onsuccess = () => done(putReq.result);
        putReq.onerror = () => done(null);
      };

      getReq.onerror = () => {
        const putReq = store.put(record);
        putReq.onsuccess = () => done(putReq.result);
        putReq.onerror = () => done(null);
      };
    });
  } catch {
    return null;
  }
}

export async function deleteFile(id) {
  deleteLS(LS_FILES_KEY, id);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('files')) return;
    return new Promise((resolve) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

// ── Folders Operations ────────────────────────────────────────────────────────
export async function getAllFolders() {
  const lsFolders = getLS(LS_FOLDERS_KEY);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('folders')) return lsFolders;

    return new Promise((resolve) => {
      const tx = db.transaction('folders', 'readonly');
      const store = tx.objectStore('folders');
      const req = store.getAll();
      req.onsuccess = () => {
        const idbFolders = req.result || [];
        const map = new Map();
        lsFolders.forEach(f => map.set(f.id, f));
        idbFolders.forEach(f => map.set(f.id, { ...map.get(f.id), ...f }));
        resolve(Array.from(map.values()));
      };
      req.onerror = () => resolve(lsFolders);
    });
  } catch {
    return lsFolders;
  }
}

export async function saveFolder(record) {
  putLS(LS_FOLDERS_KEY, record);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('folders')) return;
    return new Promise((resolve) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteFolder(id) {
  deleteLS(LS_FOLDERS_KEY, id);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('folders')) return;
    return new Promise((resolve) => {
      const tx = db.transaction('folders', 'readwrite');
      tx.objectStore('folders').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

// ── Activity Logs ─────────────────────────────────────────────────────────────
export async function getActivityLogsDB() {
  const lsLogs = getLS(LS_LOGS_KEY);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('activity_logs')) return lsLogs;

    return new Promise((resolve) => {
      const tx = db.transaction('activity_logs', 'readonly');
      const store = tx.objectStore('activity_logs');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || lsLogs);
      req.onerror = () => resolve(lsLogs);
    });
  } catch {
    return lsLogs;
  }
}

export async function logActivityDB(entry) {
  putLS(LS_LOGS_KEY, entry);
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('activity_logs')) return;
    return new Promise((resolve) => {
      const tx = db.transaction('activity_logs', 'readwrite');
      const store = tx.objectStore('activity_logs');
      const req = store.put(entry);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ── Converted Blobs Store ────────────────────────────────────────────────────
export async function saveConvertedBlob(id, file) {
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('converted_blobs')) return;
    return new Promise((resolve) => {
      const tx = db.transaction('converted_blobs', 'readwrite');
      const store = tx.objectStore('converted_blobs');
      const req = store.put({ id, file, savedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch { return null; }
}

export async function getConvertedBlob(id) {
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('converted_blobs')) return null;
    return new Promise((resolve) => {
      const tx = db.transaction('converted_blobs', 'readonly');
      const store = tx.objectStore('converted_blobs');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.file || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function getAllConvertedBlobs() {
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('converted_blobs')) return [];
    return new Promise((resolve) => {
      const tx = db.transaction('converted_blobs', 'readonly');
      const store = tx.objectStore('converted_blobs');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}

export async function deleteConvertedBlob(id) {
  try {
    const db = await initDB();
    if (!db || !db.objectStoreNames.contains('converted_blobs')) return;
    return new Promise((resolve) => {
      const tx = db.transaction('converted_blobs', 'readwrite');
      tx.objectStore('converted_blobs').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { return null; }
}
