/**
 * JobStore — IndexedDB persistence for the frontend job queue.
 *
 * Jobs survive page reload and are replayed on the next session.
 * Uses a simple cursor-based approach (no external lib dependency).
 */

export type JobStatus = 'pending' | 'running' | 'failed' | 'done';

export interface Job {
  readonly id: string;
  readonly type: string;
  readonly data: unknown;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly createdAt: number;
  readonly status: JobStatus;
}

const DB_NAME = 'cgraph_jobs';
const DB_VERSION = 1;
const STORE_NAME = 'jobs';

function isJob(value: unknown): value is Job {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'type' in value &&
    typeof value.type === 'string' &&
    'status' in value &&
    typeof value.status === 'string'
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 *
 */
export class JobStore {
  private db: IDBDatabase | null = null;

  /**
   *
   */
  async open(): Promise<void> {
    this.db = await openDb();
  }

  private getDb(): IDBDatabase {
    if (!this.db) throw new Error('JobStore not opened — call open() first');
    return this.db;
  }

  /**
   *
   */
  async save(job: Job): Promise<void> {
    await runTransaction(this.getDb(), 'readwrite', (store) => store.put(job));
  }

  /**
   *
   */
  async getNext(): Promise<Job | null> {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const req = index.openCursor(IDBKeyRange.only('pending'));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve(null);
          return;
        }
        const value = cursor.value;
        resolve(isJob(value) ? value : null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   *
   */
  async markDone(id: string): Promise<void> {
    await this.updateStatus(id, 'done');
  }

  /**
   *
   */
  async markFailed(id: string): Promise<void> {
    await this.updateStatus(id, 'failed');
  }

  /**
   *
   */
  async getPending(): Promise<Job[]> {
    return this.getByStatus('pending');
  }

  /**
   *
   */
  async getFailed(): Promise<Job[]> {
    return this.getByStatus('failed');
  }

  private async updateStatus(id: string, status: JobStatus): Promise<void> {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const value = getReq.result;
        if (!isJob(value)) {
          resolve();
          return;
        }
        const putReq = store.put({ ...value, status });
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  private getByStatus(status: JobStatus): Promise<Job[]> {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const req = index.getAll(IDBKeyRange.only(status));
      req.onsuccess = () => {
        const results: Job[] = [];
        if (Array.isArray(req.result)) {
          for (const item of req.result) {
            if (isJob(item)) results.push(item);
          }
        }
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   *
   */
  close(): void {
    this.db?.close();
    this.db = null;
  }
}
