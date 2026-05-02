import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from '../resilience';

// Circuit Breaker

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({ failureThreshold: 3, successThreshold: 2, resetTimeout: 1000 });
  });

  it('starts in closed state', () => {
    expect(cb.getStats().state).toBe('closed');
    expect(cb.isAllowed()).toBe(true);
  });

  it('opens after reaching failure threshold', () => {
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getStats().state).toBe('closed');
    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');
    expect(cb.isAllowed()).toBe(false);
  });

  it('transitions to half-open after reset timeout', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');

    // Advance time past reset timeout
    vi.useFakeTimers();
    vi.advanceTimersByTime(1100);
    expect(cb.isAllowed()).toBe(true);
    expect(cb.getStats().state).toBe('half-open');
    vi.useRealTimers();
  });

  it('closes again after enough successes in half-open', () => {
    vi.useFakeTimers();
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    vi.advanceTimersByTime(1100);
    cb.isAllowed(); // trigger half-open

    cb.recordSuccess();
    expect(cb.getStats().state).toBe('half-open');
    cb.recordSuccess();
    expect(cb.getStats().state).toBe('closed');
    vi.useRealTimers();
  });

  it('re-opens on failure in half-open', () => {
    vi.useFakeTimers();
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    vi.advanceTimersByTime(1100);
    cb.isAllowed(); // trigger half-open

    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');
    vi.useRealTimers();
  });

  it('resets failure counter on success in closed state', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    expect(cb.getStats().failures).toBe(0);
    // Should not open — counter was reset
    cb.recordFailure();
    expect(cb.getStats().state).toBe('closed');
  });

  it('tracks cumulative stats', () => {
    cb.recordSuccess();
    cb.recordSuccess();
    cb.recordFailure();
    const stats = cb.getStats();
    expect(stats.totalRequests).toBe(3);
    expect(stats.totalSuccesses).toBe(2);
    expect(stats.totalFailures).toBe(1);
  });

  it('reset() forces closed state', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');
    cb.reset();
    expect(cb.getStats().state).toBe('closed');
    expect(cb.isAllowed()).toBe(true);
  });
});

// Error classes

describe('Error classes', () => {
  it('CircuitOpenError has correct name and stats', () => {
    const stats: import('../resilience').CircuitBreakerStats = {
      state: 'open',
      failures: 5,
      successes: 0,
      lastFailureTime: Date.now(),
      totalRequests: 10,
      totalFailures: 5,
      totalSuccesses: 5,
    };
    const error = new CircuitOpenError(undefined, stats);
    expect(error.name).toBe('CircuitOpenError');
    expect(error.stats).toBe(stats);
    expect(error.message).toContain('Circuit breaker is open');
  });
});
