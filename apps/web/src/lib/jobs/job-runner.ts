/**
 * JobRunner — drives the job queue processing loop with exponential backoff.
 *
 * Call start() once at app startup (after initJobQueue).
 * The runner polls for pending jobs and backs off when the queue is empty
 * or when a job fails transiently, avoiding thundering-herd on errors.
 */
import { processNext, getPending } from './job-queue';
import { logger } from '@/lib/logger';

const MIN_INTERVAL_MS = 500;
const MAX_INTERVAL_MS = 30_000;
const BACKOFF_FACTOR = 2;

/**
 *
 */
export class JobRunner {
  private running = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private currentInterval = MIN_INTERVAL_MS;
  private consecutiveEmpty = 0;

  /**
   *
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.currentInterval = MIN_INTERVAL_MS;
    this.consecutiveEmpty = 0;
    logger.info('JobRunner started');
    this.scheduleNext(0);
  }

  /**
   *
   */
  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    logger.info('JobRunner stopped');
  }

  private scheduleNext(delayMs: number): void {
    this.timerId = setTimeout(() => this.tick(), delayMs);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;

    try {
      const pending = await getPending();

      if (pending.length === 0) {
        this.consecutiveEmpty++;
        // Back off when queue is idle to avoid busy-polling
        this.currentInterval = Math.min(
          MIN_INTERVAL_MS * Math.pow(BACKOFF_FACTOR, this.consecutiveEmpty),
          MAX_INTERVAL_MS
        );
      } else {
        // Reset backoff when there's work to do
        this.consecutiveEmpty = 0;
        this.currentInterval = MIN_INTERVAL_MS;
        await processNext();
      }
    } catch (err) {
      logger.error('JobRunner tick error', { err });
      // Back off on unexpected errors
      this.currentInterval = Math.min(this.currentInterval * BACKOFF_FACTOR, MAX_INTERVAL_MS);
    }

    if (this.running) {
      this.scheduleNext(this.currentInterval);
    }
  }
}

/** Singleton runner — import and call start() at app startup. */
export const jobRunner = new JobRunner();
