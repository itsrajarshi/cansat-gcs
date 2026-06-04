import { TelemetryPacket } from '@/types/telemetry';
import { CHART_SAMPLE_LIMIT, STORAGE_KEYS } from '@/utils/constants';

const DB_NAME = 'cansat-gcs-db';
const DB_VERSION = 1;
const STORE_NAME = 'packets';
const MAX_STORED_PACKETS = 10000;

type StorageMode = 'indexeddb' | 'localstorage';

let cachedMode: StorageMode | null = null;

function getStorageMode(): StorageMode {
  if (cachedMode) return cachedMode;
  const hasIDB = typeof indexedDB !== 'undefined' && typeof (window as any).indexedDB !== 'undefined';
  cachedMode = hasIDB ? 'indexeddb' : 'localstorage';
  return cachedMode;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'packetId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

async function pruneIndexedDb(db: IDBDatabase) {
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const keysReq = store.getAllKeys();
  const keys = (await new Promise<IDBValidKey[]>((resolve, reject) => {
    keysReq.onsuccess = () => resolve(keysReq.result);
    keysReq.onerror = () => reject(new Error('Failed to read IndexedDB keys'));
  })) as number[];

  if (keys.length <= MAX_STORED_PACKETS) return;

  keys.sort((a, b) => Number(a) - Number(b));
  const toDelete = keys.slice(0, keys.length - MAX_STORED_PACKETS);

  const delTx = db.transaction(STORE_NAME, 'readwrite');
  const delStore = delTx.objectStore(STORE_NAME);
  toDelete.forEach((k) => delStore.delete(k));

  await new Promise<void>((resolve, reject) => {
    delTx.oncomplete = () => resolve();
    delTx.onerror = () => reject(new Error('Failed to prune IndexedDB'));
  });
}

function loadFromLocalStorage(): TelemetryPacket[] {
  const raw = localStorage.getItem(STORAGE_KEYS.TELEMETRY_HISTORY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as TelemetryPacket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(packets: TelemetryPacket[]) {
  localStorage.setItem(STORAGE_KEYS.TELEMETRY_HISTORY, JSON.stringify(packets));
}

export const telemetryStorage = {
  async savePacket(packet: TelemetryPacket): Promise<void> {
    const mode = getStorageMode();
    if (mode === 'localstorage') {
      const existing = loadFromLocalStorage();
      const withoutDup = existing.filter((p) => p.packetId !== packet.packetId);
      const next = [...withoutDup, packet].sort((a, b) => a.packetId - b.packetId);
      const pruned = next.slice(-MAX_STORED_PACKETS);
      saveToLocalStorage(pruned);
      return;
    }

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(packet);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Failed to save packet'));
    });

    await pruneIndexedDb(db);
    db.close();
  },

  async savePackets(packets: TelemetryPacket[]): Promise<void> {
    if (packets.length === 0) return;
    const mode = getStorageMode();
    if (mode === 'localstorage') {
      const existing = loadFromLocalStorage();
      const existingById = new Map<number, TelemetryPacket>(existing.map((p) => [p.packetId, p]));
      for (const p of packets) existingById.set(p.packetId, p);
      const next = Array.from(existingById.values()).sort((a, b) => a.packetId - b.packetId);
      saveToLocalStorage(next.slice(-MAX_STORED_PACKETS));
      return;
    }

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const p of packets) store.put(p);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Failed to save packets'));
    });

    await pruneIndexedDb(db);
    db.close();
  },

  async loadLatestPackets(limit: number = CHART_SAMPLE_LIMIT): Promise<TelemetryPacket[]> {
    const mode = getStorageMode();
    if (mode === 'localstorage') {
      const existing = loadFromLocalStorage();
      existing.sort((a, b) => a.packetId - b.packetId);
      return existing.slice(-limit);
    }

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const allReq = store.getAll();
    const all = (await new Promise<TelemetryPacket[]>((resolve, reject) => {
      allReq.onsuccess = () => resolve(allReq.result as TelemetryPacket[]);
      allReq.onerror = () => reject(new Error('Failed to load packets'));
    })) ?? [];

    db.close();
    all.sort((a, b) => a.packetId - b.packetId);
    return all.slice(-limit);
  },

  async clear(): Promise<void> {
    const mode = getStorageMode();
    if (mode === 'localstorage') {
      localStorage.removeItem(STORAGE_KEYS.TELEMETRY_HISTORY);
      return;
    }

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Failed to clear packets'));
    });
    db.close();
  },
};

