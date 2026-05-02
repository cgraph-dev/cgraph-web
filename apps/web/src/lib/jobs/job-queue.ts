/**
 * JobQueue — enqueue, process, and retry frontend jobs.
 *
 * Jobs are persisted in IndexedDB via JobStore so they survive
 * page reloads. Handlers are registered per job type and invoked
 * by JobRunner. Retries use exponential backoff (see job-runner.ts).
 */
import { JobStore, type Job, type JobStatus } from './job-store';
import { logger } from '@/lib/logger';

export type { Job, JobStatus };

export type JobHandler = (data: unknown) => Promise<void>;

const DEFAULT_MAX_ATTEMPTS = 3;

let _store: JobStore | null = null;
const _handlers = new Map<string, JobHandler>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStore(): JobStore {
  if (!_store) throw new Error('JobQueue not initialised — call initJobQueue() first');
  return _store;
}

/**
 * Initialise the queue. Must be called once at app startup.
 */
export async function initJobQueue(): Promise<void> {
  _store = new JobStore();
  await _store.open();
  logger.info('JobQueue initialised');
}

/**
 * Register a handler for a given job type.
 * Handlers must be idempotent (they may be called more than once on retry).
 */
export function registerJobHandler(type: string, handler: JobHandler): void {
  _handlers.set(type, handler);
}

/**
 * Add a job to the queue. Returns the generated job id.
 */
export async function enqueue(
  type: string,
  data: unknown,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS
): Promise<string> {
  const job: Job = {
    id: generateId(),
    type,
    data,
    attempts: 0,
    maxAttempts,
    createdAt: Date.now(),
    status: 'pending',
  };
  await getStore().save(job);
  logger.info('Job enqueued', { id: job.id, type: job.type });
  return job.id;
}

/**
 * Process the next pending job. Noop if nothing is pending.
 */
export async function processNext(): Promise<void> {
  const store = getStore();
  const job = await store.getNext();
  if (!job) return;

  const updated: Job = { ...job, status: 'running', attempts: job.attempts + 1 };
  await store.save(updated);

  const handler = _handlers.get(job.type);
  if (!handler) {
    logger.warn('No handler for job type', { type: job.type });
    await store.markFailed(job.id);
    return;
  }

  try {
    await handler(job.data);
    await store.markDone(job.id);
    logger.info('Job completed', { id: job.id, type: job.type });
  } catch (_err) {
    const attempts = updated.attempts;
    if (attempts >= job.maxAttempts) {
      await store.markFailed(job.id);
      logger.error('Job permanently failed', { id: job.id, type: job.type, attempts });
    } else {
      // Return to pending for the runner to retry with backoff
      await store.save({ ...updated, status: 'pending' });
      logger.warn('Job failed, will retry', { id: job.id, type: job.type, attempts });
    }
  }
}

/**
 * Move all permanently-failed jobs back to pending so they can be retried.
 */
export async function retryFailed(): Promise<void> {
  const store = getStore();
  const failed = await store.getFailed();
  for (const job of failed) {
    await store.save({ ...job, status: 'pending', attempts: 0 });
  }
  if (failed.length > 0) {
    logger.info('Retrying failed jobs', { count: failed.length });
  }
}

/**
 * Return all currently pending jobs (read-only snapshot).
 */
export async function getPending(): Promise<readonly Job[]> {
  return getStore().getPending();
}
