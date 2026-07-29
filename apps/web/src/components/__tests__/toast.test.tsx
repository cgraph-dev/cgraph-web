import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from '../../hooks/useToast';
import ToastContainer, { toast, useToastStore } from '../ui/toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('announces success and info messages politely', () => {
    render(<ToastContainer />);

    act(() => {
      toast.success('Saved', 'Your settings are current.');
      toast.info('Connected');
    });

    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toHaveTextContent('SavedYour settings are current.');
    expect(statuses[1]).toHaveTextContent('Connected');
  });

  it('announces error and warning messages assertively', () => {
    render(<ToastContainer />);

    act(() => {
      toast.error('Message not sent');
      toast.warning('Connection is unstable');
    });

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveAttribute('aria-live', 'assertive');
    expect(alerts[1]).toHaveAttribute('aria-live', 'assertive');
  });

  it('exposes semantic variants without hardcoded color classes', () => {
    render(<ToastContainer />);

    act(() => {
      toast.success('Success');
      toast.error('Error');
      toast.warning('Warning');
      toast.info('Info');
    });

    expect(document.querySelector('[data-cgraph-variant="success"]')).not.toBeNull();
    expect(document.querySelector('[data-cgraph-variant="error"]')).not.toBeNull();
    expect(document.querySelector('[data-cgraph-variant="warning"]')).not.toBeNull();
    expect(document.querySelector('[data-cgraph-variant="info"]')).not.toBeNull();
  });

  it('creates distinct IDs for rapid notifications', () => {
    act(() => {
      toast.success('First');
      toast.success('Second');
    });

    const ids = useToastStore.getState().toasts.map((item) => item.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('dismisses one notification without removing its neighbors', () => {
    render(<ToastContainer />);

    act(() => {
      toast.success('First');
      toast.error('Second');
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0]!);

    expect(useToastStore.getState().toasts.map((item) => item.title)).toEqual(['Second']);
  });

  it('auto-dismisses after the default five-second duration', () => {
    render(<ToastContainer />);

    act(() => toast.success('Saved'));
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('keeps a notification when duration is zero', () => {
    render(<ToastContainer />);

    act(() => {
      useToastStore
        .getState()
        .addToast({ type: 'info', title: 'Persistent', duration: 0 });
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText('Persistent')).toBeInTheDocument();
  });

  it('accepts a duration option without treating it as message content', () => {
    render(<ToastContainer />);

    act(() => {
      toast.error('Premium access required', { duration: 4000 });
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText('Premium access required')).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('honors the duration supplied through the shared hook', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ type: 'success', message: 'Brief update', duration: 1200 });
      vi.advanceTimersByTime(1199);
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);

    act(() => vi.advanceTimersByTime(1));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
