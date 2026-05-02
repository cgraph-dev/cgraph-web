/**
 * Resilience primitives for network requests.
 *
 * Core primitive:
 * - **Circuit Breaker** — fail-fast when a downstream is unhealthy
 */

// Types

/** Circuit breaker states following the standard 3-state model. */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit. Default: 5. */
  failureThreshold: number;
  /** Number of successes in half-open before closing. Default: 2. */
  successThreshold: number;
  /** How long to wait (ms) before trying half-open. Default: 30_000. */
  resetTimeout: number;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

// Errors

/** Thrown when the circuit breaker is open and rejecting requests. */
export class CircuitOpenError extends Error {
  override readonly name = 'CircuitOpenError';

  constructor(
    message = 'Circuit breaker is open — request rejected',
    public readonly stats: CircuitBreakerStats
  ) {
    super(message);
  }
}

// Default configs

const DEFAULT_CB: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30_000,
};

// Circuit Breaker

/**
 * A 3-state circuit breaker (closed → open → half-open → closed).
 *
 * - **Closed**: requests flow normally. Failures increment a counter.
 * - **Open**: requests are rejected immediately with `CircuitOpenError`.
 * - **Half-open**: a limited number of requests are allowed through to probe
 *   recovery. On success, the circuit closes; on failure, it re-opens.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CB, ...config };
  }

  /** Current snapshot of the breaker's state and counters. */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /** Whether the circuit is currently allowing requests. */
  isAllowed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      // Check if enough time has elapsed to move to half-open
      if (
        this.lastFailureTime !== null &&
        Date.now() - this.lastFailureTime >= this.config.resetTimeout
      ) {
        this.state = 'half-open';
        this.successes = 0;
        return true;
      }
      return false;
    }
    // half-open: allow through
    return true;
  }

  /** Record a successful request. */
  recordSuccess(): void {
    this.totalRequests++;
    this.totalSuccesses++;

    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
      }
    } else if (this.state === 'closed') {
      // Reset failure counter on success in closed state
      this.failures = 0;
    }
  }

  /** Record a failed request. */
  recordFailure(): void {
    this.totalRequests++;
    this.totalFailures++;
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Any failure in half-open immediately re-opens
      this.state = 'open';
      this.successes = 0;
    } else if (this.state === 'closed' && this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  /** Force the breaker into the closed state (e.g. for manual recovery). */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
  }
}
