// IndexedDB helper for offline data storage

const DB_NAME = 'anti-rigging-offline';
const DB_VERSION = 1;

interface OfflineSubmission {
  id: string;
  stationId: number;
  totalVoters: number;
  validVotes: number;
  invalidVotes: number;
  candidateAVotes: number;
  candidateBVotes: number;
  photoBlob?: Blob;
  latitude?: number;
  longitude?: number;
  notes?: string;
  timestamp: number;
  synced: boolean;
}

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create submissions store
      if (!database.objectStoreNames.contains('submissions')) {
        const submissionsStore = database.createObjectStore('submissions', { keyPath: 'id' });
        submissionsStore.createIndex('synced', 'synced', { unique: false });
        submissionsStore.createIndex('stationId', 'stationId', { unique: false });
        submissionsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create stations cache store
      if (!database.objectStoreNames.contains('stations')) {
        database.createObjectStore('stations', { keyPath: 'id' });
      }

      // Create settings store
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

export async function saveOfflineSubmission(submission: Omit<OfflineSubmission, 'id' | 'timestamp' | 'synced'>): Promise<string> {
  const database = await initDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const fullSubmission: OfflineSubmission = {
    ...submission,
    id,
    timestamp: Date.now(),
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['submissions'], 'readwrite');
    const store = transaction.objectStore('submissions');
    const request = store.add(fullSubmission);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(new Error('Failed to save offline submission'));
  });
}

export async function getUnsyncedSubmissions(): Promise<OfflineSubmission[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['submissions'], 'readonly');
    const store = transaction.objectStore('submissions');
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get unsynced submissions'));
  });
}

export async function markSubmissionSynced(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['submissions'], 'readwrite');
    const store = transaction.objectStore('submissions');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const submission = getRequest.result;
      if (submission) {
        submission.synced = true;
        const putRequest = store.put(submission);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('Failed to mark submission as synced'));
      } else {
        reject(new Error('Submission not found'));
      }
    };

    getRequest.onerror = () => reject(new Error('Failed to get submission'));
  });
}

export async function deleteSubmission(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['submissions'], 'readwrite');
    const store = transaction.objectStore('submissions');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete submission'));
  });
}

export async function getAllSubmissions(): Promise<OfflineSubmission[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['submissions'], 'readonly');
    const store = transaction.objectStore('submissions');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get all submissions'));
  });
}

export async function cacheStations(stations: any[]): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['stations'], 'readwrite');
    const store = transaction.objectStore('stations');

    // Clear existing stations
    store.clear();

    // Add new stations
    stations.forEach((station) => {
      store.add(station);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to cache stations'));
  });
}

export async function getCachedStations(): Promise<any[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['stations'], 'readonly');
    const store = transaction.objectStore('stations');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get cached stations'));
  });
}

export async function saveSetting(key: string, value: any): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save setting'));
  });
}

export async function getSetting(key: string): Promise<any> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(new Error('Failed to get setting'));
  });
}

// Sync helper
export async function syncOfflineData(syncFunction: (submission: OfflineSubmission) => Promise<boolean>): Promise<{ synced: number; failed: number }> {
  const unsynced = await getUnsyncedSubmissions();
  let synced = 0;
  let failed = 0;

  for (const submission of unsynced) {
    try {
      const success = await syncFunction(submission);
      if (success) {
        await markSubmissionSynced(submission.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Failed to sync submission:', submission.id, error);
      failed++;
    }
  }

  return { synced, failed };
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
