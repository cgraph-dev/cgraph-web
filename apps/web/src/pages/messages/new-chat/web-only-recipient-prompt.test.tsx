/** @module web-only-recipient-prompt tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

vi.mock('@/lib/api/conversations/device-capability', () => ({
  fetchDeviceCapability: vi.fn(),
}));

import { fetchDeviceCapability } from '@/lib/api/conversations/device-capability';
import { WebOnlyRecipientPrompt } from './web-only-recipient-prompt';

function renderWithClient(ui: ReactElement): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

type FetchDeviceCapabilityMock = ReturnType<typeof vi.fn>;

describe('WebOnlyRecipientPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when recipient has a signal device', async () => {
    (fetchDeviceCapability as unknown as FetchDeviceCapabilityMock).mockResolvedValue({
      canReceiveSecret: true,
    });
    const { queryByText } = renderWithClient(
      <WebOnlyRecipientPrompt recipientId="bob" chosenType="secret" onChange={vi.fn()} />
    );
    await waitFor(() =>
      expect(fetchDeviceCapability as unknown as FetchDeviceCapabilityMock).toHaveBeenCalled()
    );
    expect(queryByText(/web only/i)).toBeNull();
  });

  it('prompts when recipient is web-only and user chose secret', async () => {
    (fetchDeviceCapability as unknown as FetchDeviceCapabilityMock).mockResolvedValue({
      canReceiveSecret: false,
    });
    const onChange = vi.fn();
    const { findByRole } = renderWithClient(
      <WebOnlyRecipientPrompt recipientId="bob" chosenType="secret" onChange={onChange} />
    );
    const button = await findByRole('button', { name: /send as cloud/i });
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('cloud');
  });

  it('does not render and does not query capability when user already chose cloud', async () => {
    (fetchDeviceCapability as unknown as FetchDeviceCapabilityMock).mockResolvedValue({
      canReceiveSecret: false,
    });
    const { queryByRole } = renderWithClient(
      <WebOnlyRecipientPrompt recipientId="bob" chosenType="cloud" onChange={vi.fn()} />
    );
    // Prompt renders nothing and must not fire the capability request —
    // Cloud was already chosen, so there is no downgrade to surface.
    expect(queryByRole('button', { name: /send as cloud/i })).toBeNull();
    expect(fetchDeviceCapability as unknown as FetchDeviceCapabilityMock).not.toHaveBeenCalled();
  });
});
