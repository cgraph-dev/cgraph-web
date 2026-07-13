/** @module privacy-settings-panel tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
    button: ({ children, onClick }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button onClick={onClick as React.MouseEventHandler}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockUpdatePrivacySettings = vi.fn().mockResolvedValue(undefined);

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      privacy: {
        allowMessageRequests: true,
        showOnlineStatus: true,
        allowGroupInvites: 'anyone',
        profileVisibility: 'public',
        allowFriendRequests: true,
        showInSearch: true,
        showReadReceipts: true,
        showTypingIndicators: true,
        showPhone: false,
        showForwardedFrom: true,
        allowCalls: true,
        autoDeleteDefault: null,
        selectivePrivacy: {
          messageRequests: {
            mode: 'everyone',
            alwaysAllowUserIds: [],
            neverAllowUserIds: [],
          },
          phoneNumber: {
            mode: 'nobody',
            alwaysAllowUserIds: [],
            neverAllowUserIds: [],
          },
          calls: {
            mode: 'everyone',
            alwaysAllowUserIds: [],
            neverAllowUserIds: [],
          },
        },
      },
    },
    updatePrivacySettings: mockUpdatePrivacySettings,
    isSaving: false,
  })),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../blocked-users-settings', () => ({
  BlockedUsersSettings: () => <div data-testid="blocked-users-settings">Blocked users</div>,
}));

import { PrivacySettingsPanel } from '../privacy-settings-panel';

describe('PrivacySettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only backed privacy controls', () => {
    render(<PrivacySettingsPanel />);
    expect(screen.getByTestId('blocked-users-settings')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Read Receipts' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Typing Indicators' })).toBeInTheDocument();
    expect(screen.queryByText(/Who can send you direct messages/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vanish Messages Default/i)).not.toBeInTheDocument();
  });

  it('uses the settings owner for read receipt changes', async () => {
    render(<PrivacySettingsPanel />);

    fireEvent.click(screen.getByRole('switch', { name: 'Read Receipts' }));

    await waitFor(() => {
      expect(mockUpdatePrivacySettings).toHaveBeenCalledWith({ showReadReceipts: false });
    });
  });

  it('uses the settings owner for typing indicator changes', async () => {
    render(<PrivacySettingsPanel />);

    fireEvent.click(screen.getByRole('switch', { name: 'Typing Indicators' }));

    await waitFor(() => {
      expect(mockUpdatePrivacySettings).toHaveBeenCalledWith({ showTypingIndicators: false });
    });
  });
});
