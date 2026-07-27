/** @module data-storage-panel tests */
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
  },
}));

// Inline mock factories — vi.mock is hoisted, so mock callbacks cannot
// reference module-scope variables. We retrieve the spy back via vi.mocked()
// after the imports complete.
vi.mock('@/lib/offline/indexeddb-cache', () => ({
  clearOfflineData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/settings/store', () => {
  const updateMediaSettings = vi.fn().mockResolvedValue(undefined);
  const fetchSettings = vi.fn().mockResolvedValue(undefined);
  const useSettingsStore = vi.fn(() => ({
    settings: {
      media: {
        autoDownloadPhotos: 'always',
        autoDownloadVideos: 'wifi',
        autoDownloadFiles: 'never',
        dataSaverMode: false,
      },
    },
    updateMediaSettings,
    fetchSettings,
    isSaving: false,
  }));
  return {
    useSettingsStore,
    DEFAULT_MEDIA_SETTINGS: {
      autoDownloadPhotos: 'always',
      autoDownloadVideos: 'wifi',
      autoDownloadFiles: 'never',
      dataSaverMode: false,
    },
    // Re-export the inner spies so tests can assert on them.
    __mockUpdateMediaSettings: updateMediaSettings,
    __mockFetchSettings: fetchSettings,
  };
});

vi.mock('@/shared/components/ui', () => ({
  Button: ({
    animated: _animated,
    children,
    isLoading: _isLoading,
    size: _size,
    variant: _variant,
    ...props
  }: React.PropsWithChildren<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      animated?: boolean;
      isLoading?: boolean;
      size?: string;
      variant?: string;
    }
  >) => <button {...props}>{children}</button>,
  Dialog: ({ open, children }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div role="dialog">{children}</div>
  ),
  DialogDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <footer>{children}</footer>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <header>{children}</header>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { DataStoragePanel } from '../data-storage-panel';
import * as indexedDbCache from '@/lib/offline/indexeddb-cache';
import * as settingsStoreModule from '@/modules/settings/store';

const mockedClearOfflineData = vi.mocked(indexedDbCache.clearOfflineData);
// The mock factory above adds these symbols; they are not part of the real
// module's public surface, but vi.mock has replaced the module entirely.
interface MockedSettingsModule {
  readonly __mockUpdateMediaSettings: MockInstance;
  readonly __mockFetchSettings: MockInstance;
}
function getMockedStore(): MockedSettingsModule {
  const mod: unknown = settingsStoreModule;
  if (
    typeof mod === 'object' &&
    mod !== null &&
    '__mockUpdateMediaSettings' in mod &&
    '__mockFetchSettings' in mod
  ) {
    const record: Record<string, unknown> = mod;
    const u = record['__mockUpdateMediaSettings'];
    const f = record['__mockFetchSettings'];
    if (vi.isMockFunction(u) && vi.isMockFunction(f)) {
      return { __mockUpdateMediaSettings: u, __mockFetchSettings: f };
    }
  }
  throw new Error('settings store mock missing test handles');
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <DataStoragePanel />
    </MemoryRouter>
  );
}

const ESTIMATE_USED = 12 * 1024 * 1024; // 12 MB
const ESTIMATE_QUOTA = 200 * 1024 * 1024; // 200 MB

beforeEach(() => {
  vi.clearAllMocks();
  // Mock navigator.storage.estimate
  Object.defineProperty(globalThis.navigator, 'storage', {
    configurable: true,
    value: {
      estimate: vi.fn().mockResolvedValue({ usage: ESTIMATE_USED, quota: ESTIMATE_QUOTA }),
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DataStoragePanel', () => {
  it('renders cache size from navigator.storage.estimate', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText(/Caches use ~/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/12\.0 MB/)).toBeInTheDocument();
    expect(screen.getByText(/200\.0 MB/)).toBeInTheDocument();
  });

  it('renders only the backed photo and video auto-download groups', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Photos')).toBeInTheDocument();
    });
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.queryByText('Files')).not.toBeInTheDocument();

    const groups = screen.getAllByRole('radiogroup');
    expect(groups).toHaveLength(2);
  });

  it('confirmation dialog blocks immediate clear', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getAllByText(/Clear cache/i).length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByRole('button', { name: /Clear cache/i });
    fireEvent.click(buttons[0]!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockedClearOfflineData).not.toHaveBeenCalled();
  });

  it('calls clearOfflineData after confirming', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getAllByText(/Clear cache/i).length).toBeGreaterThan(0);
    });

    const triggerButtons = screen.getAllByRole('button', { name: /Clear cache/i });
    fireEvent.click(triggerButtons[0]!);

    const dialog = screen.getByRole('dialog');
    const dialogButtons = dialog.querySelectorAll('button');
    const confirmBtn = dialogButtons[dialogButtons.length - 1];
    if (confirmBtn === undefined) throw new Error('confirm button missing');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockedClearOfflineData).toHaveBeenCalledTimes(1);
    });
  });

  it('debounces auto-download radio change and calls updateMediaSettings', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPanel();

    await vi.waitFor(() => {
      expect(screen.getByText('Photos')).toBeInTheDocument();
    });

    const photoRadios = screen.getAllByRole('radio');
    const photosNever = photoRadios.find(
      (r) =>
        r.getAttribute('name') === 'auto-download-autoDownloadPhotos' &&
        r.getAttribute('value') === 'never'
    );
    if (photosNever === undefined) throw new Error('photos never radio missing');
    await act(async () => {
      fireEvent.click(photosNever);
      await vi.advanceTimersByTimeAsync(600);
    });

    const handles = getMockedStore();
    await waitFor(() => {
      expect(handles.__mockUpdateMediaSettings).toHaveBeenCalledWith({
        autoDownloadPhotos: 'never',
      });
    });
  });

  it('resets only the visible media policies', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset to defaults/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Reset to defaults/i }));
    const dialog = screen.getByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    const resetButton = buttons[buttons.length - 1];
    if (resetButton === undefined) throw new Error('reset button missing');
    fireEvent.click(resetButton);

    const handles = getMockedStore();
    await waitFor(() => {
      expect(handles.__mockUpdateMediaSettings).toHaveBeenCalledWith({
        autoDownloadPhotos: 'always',
        autoDownloadVideos: 'wifi',
      });
    });
  });
});
