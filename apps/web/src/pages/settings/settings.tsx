/**
 * Main settings page layout.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ComputerDesktopIcon,
  LanguageIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  FaceSmileIcon,
  PhoneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { GlassSearchInput } from '@/components/ui/glass-search-input';

// These components are available for extended settings functionality
import { AccountSettings } from '@/modules/settings/components/account-settings';
import { default as DeleteAccount } from '@/pages/settings/delete-account';
import { default as DataExport } from '@/pages/settings/data-export';
import {
  SecuritySettingsPanel,
  NotificationSettingsPanel,
  LanguageSettingsPanel,
  SessionsSettingsPanel,
  PrivacySettingsPanel,
  DndSchedulePanel,
  DataStoragePanel,
} from '@/modules/settings/components/panels';
import { AdvancedSettingsPanel } from '@/modules/settings/components/panels/advanced-settings-panel';
import { StickersEmojiSettingsPanel } from '@/modules/settings/components/panels/stickers-emoji-settings-panel';
import { CallsSettingsPanel } from '@/modules/settings/components/panels/calls-settings-panel';
import { NotificationProfilesPanel } from '@/modules/settings/components/panels/notification-profiles-panel';
import { NotificationProfileEditor } from '@/modules/settings/components/panels/notification-profile-editor';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { useAuthStore } from '@/modules/auth/store';
import {
  isPreferenceBootstrapReady,
  usePreferenceOrchestrator,
} from '@/modules/settings/store/preferenceOrchestrator';

// Operational preferences only.
// Moved to /me/appearance: appearance/theme
// Moved to /me/subscription: billing/subscription
// Moved to /me/invites: invites/referrals
const settingsSections = [
  { id: 'account', label: 'Account', icon: UserIcon, description: 'Email, username, password' },
  {
    id: 'security',
    label: 'Security',
    icon: ShieldCheckIcon,
    description: '2FA and password',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: ComputerDesktopIcon,
    description: 'Active logins and devices',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    description: 'Push, email, preferences',
  },
  { id: 'privacy', label: 'Privacy', icon: KeyIcon, description: 'Visibility, blocked users' },
  {
    id: 'data-storage',
    label: 'Data & Storage',
    icon: CircleStackIcon,
    description: 'Cache, auto-download, bandwidth',
  },
  {
    id: 'stickers-emoji',
    label: 'Stickers & Emoji',
    icon: FaceSmileIcon,
    description: 'Suggestions, animation, skin tone',
  },
  {
    id: 'calls',
    label: 'Calls',
    icon: PhoneIcon,
    description: 'Mic processing, video resolution',
  },
  {
    id: 'language',
    label: 'Language',
    icon: LanguageIcon,
    description: 'Language, timezone, date format',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Cog6ToothIcon,
    description: 'Diagnostics, reset preferences',
  },
  {
    id: 'data-export',
    label: 'Data Export',
    icon: ArrowDownTrayIcon,
    description: 'Download your data (GDPR)',
  },
  {
    id: 'delete-account',
    label: 'Delete Account',
    icon: TrashIcon,
    description: 'Permanently delete account',
  },
];

function SettingsBootstrapGate({
  hasError,
  isLoading,
  onRetry,
}: {
  readonly hasError: boolean;
  readonly isLoading: boolean;
  readonly onRetry: () => void;
}) {
  return (
    <motion.div
      key="settings-bootstrap"
      className="flex min-h-[360px] items-center justify-center"
      {...FADE_UP}
      aria-busy={isLoading}
      aria-live="polite"
    >
      <div className="bg-[var(--token-card-bg)]/50 w-full max-w-md space-y-5 rounded-2xl border border-[var(--token-card-border)] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)]">
            <ArrowPathIcon
              className={`h-5 w-5 text-[var(--color-brand-purple)] ${isLoading ? 'animate-spin' : ''}`}
            />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--token-text-primary)]">
              {hasError ? 'Settings unavailable' : 'Loading settings'}
            </h3>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              {hasError ? 'Try again when the connection is ready.' : 'Just a moment.'}
            </p>
          </div>
        </div>

        {hasError && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--token-text-primary)] transition hover:bg-[var(--token-bg-primary)]"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Settings component.
 */
export default function Settings() {
  const navigate = useNavigate();
  const { section = 'account' } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const bootstrapPreferences = usePreferenceOrchestrator((state) => state.bootstrapPreferences);
  const isBootstrappingPreferences = usePreferenceOrchestrator((state) => state.isBootstrapping);
  const preferenceResult = usePreferenceOrchestrator((state) => state.result);
  const preferenceError = usePreferenceOrchestrator((state) => state.error);
  const lastBootstrappedUserId = usePreferenceOrchestrator((state) => state.lastBootstrappedUserId);

  useEffect(() => {
    if (isAuthenticated) {
      void bootstrapPreferences({ userId, includeTheme: Boolean(userId) });
    }
  }, [bootstrapPreferences, isAuthenticated, userId]);

  const preferencesReady = isPreferenceBootstrapReady({
    isAuthenticated,
    userId,
    includeTheme: Boolean(userId),
    lastBootstrappedUserId,
    result: preferenceResult,
  });

  const retryPreferenceBootstrap = () => {
    void bootstrapPreferences({ userId, includeTheme: Boolean(userId), force: true });
  };

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return settingsSections;
    return settingsSections.filter(
      (item) =>
        item.label.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="relative flex flex-1 overflow-hidden bg-transparent">
      {/* Sidebar */}
      <nav className="bg-[var(--token-card-bg)]/40 relative z-10 flex h-full w-72 shrink-0 flex-col border-r border-[var(--token-card-border)] py-4 backdrop-blur-3xl transition-all duration-300">
        <div className="flex-1 overflow-y-auto p-5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={tweens.moderate}
          >
            <div className="mb-8 pl-1">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--token-text-primary)]">
                Settings
              </h2>
              <p className="mt-1 text-xs font-medium text-[var(--token-text-muted)]">
                Manage your account &amp; preferences
              </p>
            </div>

            {/* Live filter over settingsSections by label + description. */}
            <div className="mb-8 px-1">
              <GlassSearchInput
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search settings"
              />
            </div>

            {/* Category Navigation */}
            <nav className="space-y-2" aria-label="Settings sections">
              {filteredSections.length === 0 && (
                <p className="px-4 py-2 text-xs text-[var(--token-text-muted)]">
                  No sections match "{searchQuery}".
                </p>
              )}
              {filteredSections.map((item) => {
                const active = section === item.id;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      HapticFeedback.light();
                      navigate(`../${item.id}`, { relative: 'path' });
                    }}
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-bold transition-all duration-200 ${
                      active
                        ? 'shadow-primary-500/5 text-[var(--token-text-primary)] shadow-lg'
                        : 'text-[var(--token-text-muted)] hover:bg-[var(--token-bg-primary)] hover:text-[var(--token-text-primary)]'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="settingsActiveTab"
                        initial={false}
                        className="absolute inset-0 rounded-2xl border border-[var(--token-card-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        style={{
                          background:
                            'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 10%, transparent) 0%, rgba(59,130,246,0.08) 100%)',
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                      />
                    )}

                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-500 ${
                        active
                          ? 'border-primary-500/30 bg-primary-500/10 text-primary-400'
                          : 'border-transparent bg-[var(--token-bg-primary)] text-[var(--token-text-muted)] group-hover:bg-[var(--token-bg-secondary)] group-hover:text-[var(--token-text-primary)]'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>

                    <div className="relative z-10 min-w-0 flex-1">
                      <div className="text-sm tracking-wide">{item.label}</div>
                      <div className="truncate text-[11px] font-medium text-[var(--token-text-muted)] transition-colors group-hover:text-[var(--token-text-secondary)]">
                        {item.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </motion.div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto bg-transparent p-8">
        <motion.div
          className="mx-auto max-w-2xl"
          {...FADE_UP}
          transition={{ ...tweens.moderate, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {!preferencesReady ? (
              <SettingsBootstrapGate
                hasError={Boolean(preferenceError)}
                isLoading={isBootstrappingPreferences}
                onRetry={retryPreferenceBootstrap}
              />
            ) : (
              <>
                {section === 'account' && <AccountSettings key="account" />}
                {section === 'security' && <SecuritySettingsPanel key="security" />}
                {section === 'notifications' && <NotificationSettingsPanel key="notifications" />}
                {section === 'dnd-schedule' && <DndSchedulePanel key="dnd-schedule" />}
                {section === 'notification-profiles' && (
                  <NotificationProfilesPanel key="notification-profiles" />
                )}
                {section?.startsWith('notification-profiles/') && (
                  <NotificationProfileEditor key="notification-profile-editor" />
                )}
                {section === 'privacy' && <PrivacySettingsPanel key="privacy" />}
                {section === 'data-storage' && <DataStoragePanel key="data-storage" />}
                {section === 'stickers-emoji' && (
                  <StickersEmojiSettingsPanel key="stickers-emoji" />
                )}
                {section === 'calls' && <CallsSettingsPanel key="calls" />}
                {section === 'advanced' && <AdvancedSettingsPanel key="advanced" />}
                {section === 'language' && <LanguageSettingsPanel key="language" />}
                {section === 'sessions' && <SessionsSettingsPanel key="sessions" />}
                {section === 'data-export' && <DataExport key="data-export" />}
                {section === 'delete-account' && <DeleteAccount key="delete-account" />}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
