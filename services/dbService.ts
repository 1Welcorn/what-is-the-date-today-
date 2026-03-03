
export interface CachedWeather {
  id: string; // e.g., "current" or "manual-cityname"
  data: any;
  timestamp: number;
}

export interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

const DB_NAME = 'AtmosphereDB';
const DB_VERSION = 1;
const WEATHER_STORE = 'weather';
const IMAGE_STORE = 'images';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(WEATHER_STORE)) {
        db.createObjectStore(WEATHER_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveWeather = async (id: string, data: any) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(WEATHER_STORE, 'readwrite');
    const store = transaction.objectStore(WEATHER_STORE);
    const request = store.put({ id, data, timestamp: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getWeather = async (id: string): Promise<CachedWeather | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(WEATHER_STORE, 'readonly');
    const store = transaction.objectStore(WEATHER_STORE);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const saveImage = async (url: string, blob: Blob) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.put({ url, blob, timestamp: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getImage = async (url: string): Promise<CachedImage | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, 'readonly');
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.get(url);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};
