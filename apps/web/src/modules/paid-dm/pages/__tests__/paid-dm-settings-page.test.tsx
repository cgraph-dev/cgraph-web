/** @module PaidDmSettingsPage tests */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockGet = vi.fn();
const mockPut = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

import PaidDmSettingsPage from '../paid-dm-settings-page';
function makeSettings(overrides: Record<string, unknown> = {}) {
  return {
    enabled: false,
    priceNodes: 10,
    acceptedFileTypes: [],
    autoAcceptFriends: false,
    autoRefundAfterHours: 72,
    ...overrides,
  };
}
describe('PaidDmSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { data: makeSettings() } });
    mockPut.mockResolvedValue({ data: { data: makeSettings() } });
  });
  it('renders a spinner while loading', () => {
    // Never-resolving promise keeps loading state
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<PaidDmSettingsPage />);

    // Loading state should be visible
    expect(document.body).toBeTruthy();
    // Spinner is the only element — page heading should NOT appear
    expect(screen.queryByText('Paid DM Settings')).toBeNull();
  });
  it('renders the settings form after loading', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    expect(screen.getByText('Enable Paid DMs')).toBeInTheDocument();
    expect(screen.getByText('Price per DM (Nodes)')).toBeInTheDocument();
    expect(screen.getByText('Accepted File Types')).toBeInTheDocument();
    expect(screen.getByText('Auto-accept Friends')).toBeInTheDocument();
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
  });

  it('fetches settings on mount', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/v1/paid-dm/settings');
    });
  });

  it('uses defaults when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    // Default: enabled = false → checkbox unchecked
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked(); // enabled
  });
  it('toggles the enable checkbox', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    const enableCheckbox = screen.getAllByRole('checkbox')[0]!;
    expect(enableCheckbox).not.toBeChecked();

    fireEvent.click(enableCheckbox);
    expect(enableCheckbox).toBeChecked();
  });
  it('renders price input with default value', async () => {
    mockGet.mockResolvedValue({
      data: { data: makeSettings({ priceNodes: 25 }) },
    });

    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Price per DM (Nodes)')).toHaveValue(25);
    });
  });

  it('enforces minimum price of 1 Node', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    const priceInput = screen.getByLabelText('Price per DM (Nodes)');
    fireEvent.change(priceInput, { target: { value: '0' } });

    // Math.max(1, 0) => 1
    expect(priceInput).toHaveValue(1);
  });

  it('enforces maximum price of 10000 Nodes', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    const priceInput = screen.getByLabelText('Price per DM (Nodes)');
    fireEvent.change(priceInput, { target: { value: '99999' } });

    expect(priceInput).toHaveValue(10000);
  });

  it('renders the auto-refund window input with default 72', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Auto-refund window (hours)')).toHaveValue(72);
    });
  });

  it('clamps auto-refund window to allowed range', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    const refundInput = screen.getByLabelText('Auto-refund window (hours)');
    fireEvent.change(refundInput, { target: { value: '0' } });
    expect(refundInput).toHaveValue(1);

    fireEvent.change(refundInput, { target: { value: '999' } });
    expect(refundInput).toHaveValue(168);
  });

  it('accepts prices above minimum', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    const priceInput = screen.getByLabelText('Price per DM (Nodes)');
    fireEvent.change(priceInput, { target: { value: '50' } });

    expect(priceInput).toHaveValue(50);
  });
  it('renders all four file type checkboxes', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    expect(screen.getByText('image')).toBeInTheDocument();
    expect(screen.getByText('video')).toBeInTheDocument();
    expect(screen.getByText('audio')).toBeInTheDocument();
    expect(screen.getByText('document')).toBeInTheDocument();
  });

  it('toggles file type checkboxes', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    const imageLabel = screen.getByText('image');
    const imageCheckbox = imageLabel.closest('label')!.querySelector('input')!;

    expect(imageCheckbox).not.toBeChecked();
    fireEvent.click(imageCheckbox);
    expect(imageCheckbox).toBeChecked();

    // Toggle off
    fireEvent.click(imageCheckbox);
    expect(imageCheckbox).not.toBeChecked();
  });

  it('pre-selects file types from loaded settings', async () => {
    mockGet.mockResolvedValue({
      data: { data: makeSettings({ acceptedFileTypes: ['image', 'audio'] }) },
    });

    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    const imageCheckbox = screen.getByText('image').closest('label')!.querySelector('input')!;
    const audioCheckbox = screen.getByText('audio').closest('label')!.querySelector('input')!;
    const videoCheckbox = screen.getByText('video').closest('label')!.querySelector('input')!;

    expect(imageCheckbox).toBeChecked();
    expect(audioCheckbox).toBeChecked();
    expect(videoCheckbox).not.toBeChecked();
  });
  it('toggles auto-accept friends', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    // auto-accept is the last checkbox (index depends on file types + enable)
    const checkboxes = screen.getAllByRole('checkbox');
    const autoAcceptCheckbox = checkboxes[checkboxes.length - 1]!;

    expect(autoAcceptCheckbox).not.toBeChecked();
    fireEvent.click(autoAcceptCheckbox);
    expect(autoAcceptCheckbox).toBeChecked();
  });
  it('saves settings successfully and shows success message', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/v1/paid-dm/settings', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Settings saved!')).toBeInTheDocument();
    });
  });

  it('shows error message when save fails', async () => {
    mockPut.mockRejectedValue(new Error('Server error'));

    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(screen.getByText('Failed to save settings.')).toBeInTheDocument();
    });
  });

  it('disables the save button while saving', async () => {
    // Slow promise to keep saving state
    let resolvePromise: (v: unknown) => void;
    mockPut.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(screen.getByText('Saving…')).toBeInTheDocument();
    });

    const savingButton = screen.getByText('Saving…').closest('button')!;
    expect(savingButton).toBeDisabled();

    // Resolve to clean up
    resolvePromise!({ data: { data: makeSettings() } });

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });
  });

  it('sends current settings state when saving', async () => {
    render(<PaidDmSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid DM Settings')).toBeInTheDocument();
    });

    // Toggle enable on
    fireEvent.click(screen.getAllByRole('checkbox')[0]!);

    // Change price
    const priceInput = screen.getByLabelText('Price per DM (Nodes)');
    fireEvent.change(priceInput, { target: { value: '100' } });

    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/v1/paid-dm/settings', {
        enabled: true,
        priceNodes: 100,
        acceptedFileTypes: [],
        autoAcceptFriends: false,
        autoRefundAfterHours: 72,
      });
    });
  });
});
