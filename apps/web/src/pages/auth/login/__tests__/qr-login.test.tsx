import type { HTMLAttributes, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { QrLogin } from '../qr-login';

const qrSocketMock = vi.hoisted(() => {
  const instances: Array<{
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    channel: ReturnType<typeof vi.fn>;
  }> = [];

  class MockChannel {
    readonly join = vi.fn(() => ({
      receive: vi.fn().mockReturnThis(),
    }));

    readonly on = vi.fn();
    readonly leave = vi.fn();
  }

  class MockSocket {
    readonly connect = vi.fn();
    readonly disconnect = vi.fn();
    readonly channel = vi.fn(() => new MockChannel());

    constructor(readonly url: string, readonly options: unknown) {
      instances.push(this);
    }
  }

  return { instances, MockSocket };
});

vi.mock('phoenix', () => ({
  Socket: qrSocketMock.MockSocket,
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

describe('QrLogin', () => {
  beforeEach(() => {
    qrSocketMock.instances.length = 0;
    vi.spyOn(apiClient.auth, 'createQrSession').mockResolvedValue({
      ok: true,
      data: {
        session_id: 'qr-session-test',
        qr_payload: 'cgraph://qr-login/qr-session-test',
        expires_in: 300,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('joins one QR auth channel for one generated session', async () => {
    render(
      <MemoryRouter>
        <QrLogin />
      </MemoryRouter>
    );

    await screen.findByText(/waiting for scan/i);

    await waitFor(() => {
      expect(qrSocketMock.instances).toHaveLength(1);
      expect(qrSocketMock.instances[0]?.connect).toHaveBeenCalledTimes(1);
      expect(qrSocketMock.instances[0]?.channel).toHaveBeenCalledTimes(1);
      expect(qrSocketMock.instances[0]?.channel).toHaveBeenCalledWith('qr_auth:qr-session-test', {});
    });
  });
});
