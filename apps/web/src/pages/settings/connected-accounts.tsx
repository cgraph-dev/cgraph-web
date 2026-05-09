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
import { listConfiguredOAuthProviders, type OAuthProvider } from '@/lib/oauth';

const logger = createLogger('ConnectedAccounts');

interface ConnectedAccount {
  id: string;
  provider: string;
  provider_name: string;
  email?: string;
  linked_at: string;
}

const PROVIDERS: Record<OAuthProvider, { id: OAuthProvider; name: string; icon: string }> = {
  google: { id: 'google', name: 'Google', icon: '🔵' },
  apple: { id: 'apple', name: 'Apple', icon: '🍎' },
  facebook: { id: 'facebook', name: 'Facebook', icon: '🔷' },
  tiktok: { id: 'tiktok', name: 'TikTok', icon: '🎵' },
};

function isOAuthProvider(value: string): value is OAuthProvider {
  return value in PROVIDERS;
}

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [configuredProviders, setConfiguredProviders] = useState<OAuthProvider[]>([]);
  const [_loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get('/api/v1/me');
      const user = data.data || data;
      setAccounts(user.connected_accounts || []);
      setConfiguredProviders(await listConfiguredOAuthProviders());
    } catch (error) {
      logger.warn('Failed to fetch connected accounts', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
  const visibleProviders = [
    ...new Set([
      ...accounts.map((account) => account.provider).filter(isOAuthProvider),
      ...configuredProviders,
    ]),
  ].map((provider) => PROVIDERS[provider]);

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
        {visibleProviders.length === 0 && (
          <motion.div
            variants={entranceVariants.fadeUp}
            className="aurora-social-panel rounded-2xl p-4 text-sm text-white/50"
          >
            External account linking is unavailable until an OAuth provider is configured.
          </motion.div>
        )}

        {visibleProviders.map((provider) => {
          const linked = isLinked(provider.id);
          const canLink = configuredProviders.includes(provider.id);
          return (
            <motion.div
              key={provider.id}
              variants={entranceVariants.fadeUp}
              className="aurora-social-panel flex items-center justify-between rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <span className="border-primary-500/20 bg-primary-500/10 flex h-11 w-11 items-center justify-center rounded-xl border text-xl text-primary-300">
                  {provider.icon}
                </span>
                <div>
                  <span className="font-medium text-white">{provider.name}</span>
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
              ) : canLink ? (
                <button
                  onClick={() => handleLink(provider.id)}
                  className="aurora-social-button flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
                >
                  <LinkIcon className="h-4 w-4" />
                  Connect
                </button>
              ) : (
                <span className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/35">
                  Unavailable
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
