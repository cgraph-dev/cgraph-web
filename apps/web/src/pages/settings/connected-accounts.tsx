/**
 * ConnectedAccounts - View/manage OAuth connected accounts
 * Show linked providers, link new, unlink existing
 */

import { useCallback, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { entranceVariants, springs, staggerConfigs } from '@/lib/animation-presets';
import { LinkIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
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
    <div className="mx-auto max-w-2xl">
      <motion.div
        variants={entranceVariants.fadeUp}
        initial="initial"
        animate="animate"
        transition={springs.gentle}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-3">
          <LinkIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
        </div>
        <p className="text-sm text-white/40">
          Manage external accounts linked to your CGraph profile
        </p>
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: staggerConfigs.fast.staggerChildren } },
        }}
        className="space-y-3"
      >
        {providerRows.map((provider) => {
          const linked = isLinked(provider);
          const providerId = toOAuthProvider(provider);
          const providerIsAvailable = Boolean(
            providerId && availableProviders.some((availableProvider) => availableProvider === providerId)
          );
          const label = getProviderLabel(provider, linked);
          return (
            <motion.div
              key={provider}
              variants={entranceVariants.fadeUp}
              className="aurora-social-panel flex items-center justify-between rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <span className="border-primary-500/20 bg-primary-500/10 flex h-11 w-11 items-center justify-center rounded-xl border text-xl text-primary-300">
                  {getProviderInitial(provider, linked)}
                </span>
                <div>
                  <span className="font-medium text-white">{label}</span>
                  {linked && (
                    <div className="flex items-center gap-1 text-xs text-primary-300">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Connected{linked.email ? ` · ${linked.email}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {linked ? (
                <button
                  onClick={() => handleUnlink(linked.provider)}
                  className="aurora-social-button-danger flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => providerId && handleLink(providerId)}
                  disabled={!providerIsAvailable}
                  className="aurora-social-button flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
                >
                  <LinkIcon className="h-4 w-4" />
                  Connect
                </button>
              )}
            </motion.div>
          );
        })}
        {!loading && providerRows.length === 0 && (
          <motion.div
            variants={entranceVariants.fadeUp}
            className="aurora-social-panel rounded-2xl p-4 text-sm text-white/50"
          >
            No external account providers are available right now.
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
