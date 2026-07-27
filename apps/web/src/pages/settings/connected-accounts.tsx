/**
 * ConnectedAccounts - View/manage OAuth connected accounts
 * Show linked providers, link new, unlink existing
 */

import { useCallback, useState, useEffect } from 'react';
import { LinkIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import {
  OAuthProvider,
  providerNames,
  readDiscoveredOAuthProviders,
  toOAuthProvider,
} from '@/lib/oauth';

const logger = createLogger('ConnectedAccounts');

interface ConnectedAccount {
  id: string;
  provider: string;
  provider_name: string;
  email?: string;
  linked_at: string;
}

const providerInitials: Record<OAuthProvider, string> = {
  google: 'G',
  apple: 'A',
  facebook: 'F',
  tiktok: 'T',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isConnectedAccount(value: unknown): value is ConnectedAccount {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.provider === 'string' &&
    typeof value.provider_name === 'string' &&
    typeof value.linked_at === 'string' &&
    (value.email === undefined || typeof value.email === 'string')
  );
}

function readUserFromMeResponse(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) {
    return {};
  }

  return isRecord(payload.data) ? payload.data : payload;
}

function readConnectedAccounts(payload: unknown): ConnectedAccount[] {
  const user = readUserFromMeResponse(payload);
  return Array.isArray(user.connected_accounts)
    ? user.connected_accounts.filter(isConnectedAccount)
    : [];
}

function getProviderLabel(provider: string, account?: ConnectedAccount): string {
  const knownProvider = toOAuthProvider(provider);
  if (knownProvider) {
    return providerNames[knownProvider];
  }

  return account?.provider_name || provider;
}

function getProviderInitial(provider: string, account?: ConnectedAccount): string {
  const knownProvider = toOAuthProvider(provider);
  const label = getProviderLabel(provider, account);
  return knownProvider ? providerInitials[knownProvider] : label.charAt(0).toUpperCase();
}

/**
 * Connected Accounts component.
 */
export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [availableProviders, setAvailableProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnectedAccountState = useCallback(async () => {
    setLoading(true);
    try {
      const [meResponse, providerResponse] = await Promise.all([
        http.get('/api/v1/me'),
        http.get('/api/v1/auth/oauth/providers'),
      ]);
      setAccounts(readConnectedAccounts(meResponse.data));
      setAvailableProviders(readDiscoveredOAuthProviders(providerResponse.data));
    } catch (error) {
      logger.warn('Failed to fetch connected accounts', error);
      setAvailableProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectedAccountState();
  }, [fetchConnectedAccountState]);

  const handleLink = async (provider: string) => {
    try {
      const { data } = await http.get(`/api/v1/auth/oauth/${provider}`);
      const authorizationUrl = data.authorization_url;
      if (typeof authorizationUrl === 'string') {
        window.location.href = authorizationUrl;
      }
    } catch (error) {
      logger.warn('Failed to start OAuth flow', error);
    }
  };

  const handleUnlink = async (provider: string) => {
    if (accounts.length <= 1) {
      alert('You must keep at least one authentication method.');
      return;
    }
    try {
      await http.delete(`/api/v1/auth/oauth/${provider}/link`);
      setAccounts((prev) => prev.filter((a) => a.provider !== provider));
    } catch (error) {
      logger.warn('Failed to unlink connected account', error);
    }
  };

  const isLinked = (provider: string) => accounts.find((a) => a.provider === provider);
  const linkedProviderIds = accounts.map((account) => account.provider);
  const providerRows = [...new Set([...linkedProviderIds, ...availableProviders])];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="cgraph-page-header">
        <div className="flex items-start gap-3">
          <div className="cgraph-empty-icon mb-0 h-10 w-10 shrink-0">
            <LinkIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="cgraph-eyebrow">Sign-in methods</p>
            <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">
              Connected Accounts
            </h1>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              Manage external accounts linked to your CGraph profile.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-3" aria-busy={loading}>
        {loading &&
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="cgraph-card flex items-center gap-3 p-4">
              <Skeleton className="h-11 w-11 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          ))}
        {providerRows.map((provider) => {
          const linked = isLinked(provider);
          const providerId = toOAuthProvider(provider);
          const providerIsAvailable = Boolean(
            providerId && availableProviders.some((availableProvider) => availableProvider === providerId)
          );
          const label = getProviderLabel(provider, linked);
          return (
            <div
              key={provider}
              className="cgraph-card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--product-line)] bg-[var(--product-surface-recessed)] text-lg font-semibold text-[var(--token-interactive-primary)]">
                  {getProviderInitial(provider, linked)}
                </span>
                <div>
                  <span className="font-medium text-[var(--token-text-primary)]">{label}</span>
                  {linked && (
                    <div className="flex items-center gap-1 text-xs text-[var(--token-text-muted)]">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Connected{linked.email ? ` · ${linked.email}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {linked ? (
                <Button
                  variant="danger"
                  size="sm"
                  animated={false}
                  leftIcon={<XMarkIcon />}
                  onClick={() => handleUnlink(linked.provider)}
                >
                  Unlink
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  animated={false}
                  leftIcon={<LinkIcon />}
                  onClick={() => providerId && handleLink(providerId)}
                  disabled={!providerIsAvailable}
                >
                  Connect
                </Button>
              )}
            </div>
          );
        })}
        {!loading && providerRows.length === 0 && (
          <div className="cgraph-empty-state cgraph-card">
            <div className="cgraph-empty-icon">
              <LinkIcon className="h-6 w-6" />
            </div>
            <h2>No providers available</h2>
            <p>External sign-in providers are unavailable right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
