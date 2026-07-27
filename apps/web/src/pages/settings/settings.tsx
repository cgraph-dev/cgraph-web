/**
 * Main settings page layout.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  TrashIcon,
  ComputerDesktopIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  PhoneIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { GlassSearchInput } from '@/components/ui/glass-search-input';
import { Button, IconButton } from '@/components/ui/button';

// These components are available for extended settings functionality
import { AccountSettings } from '@/modules/settings/components/account-settings';
import AppThemeSettings from '@/pages/settings/app-theme-settings';
import { ConnectedAccounts } from '@/pages/settings/connected-accounts';
import { default as DeleteAccount } from '@/pages/settings/delete-account';
import {
  SecuritySettingsPanel,
  NotificationSettingsPanel,
  SessionsSettingsPanel,
  PrivacySettingsPanel,
  DndSchedulePanel,
  DataStoragePanel,
  ChatSettingsPanel,
} from '@/modules/settings/components/panels';
import { AdvancedSettingsPanel } from '@/modules/settings/components/panels/advanced-settings-panel';
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

// Operational preferences. Profile cosmetics remain in /me/appearance.
// Moved to /me/subscription: billing/subscription
// Moved to /me/invites: invites/referrals
const settingsSections = [
  { id: 'account', label: 'Account', icon: UserIcon, description: 'Email, username, password' },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: PaintBrushIcon,
    description: 'App theme and interface style',
  },
  {
    id: 'chats',
    label: 'Chats',
    icon: ChatBubbleLeftRightIcon,
    description: 'Themes, wallpaper, Spaces',
  },
  {
    id: 'connected-accounts',
    label: 'Connected Accounts',
    icon: LinkIcon,
    description: 'External sign-in providers',
  },
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
    id: 'calls',
    label: 'Calls',
    icon: PhoneIcon,
    description: 'Mic processing, video resolution',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Cog6ToothIcon,
    description: 'Diagnostics, reset preferences',
  },
  {
    id: 'delete-account',
    label: 'Delete Account',
    icon: TrashIcon,
    description: 'Request permanent anonymization',
  },
];

const settingsSectionIds = new Set(settingsSections.map(({ id }) => id));

function getSettingsSection(routeSection: string | undefined, detail: string | undefined): string {
  if (!routeSection) return 'account';

  const section = detail ? `${routeSection}/${detail}` : routeSection;

  if (settingsSectionIds.has(section)) return section;
  if (section === 'dnd-schedule' || section === 'notification-profiles') return section;
  if (section.startsWith('notification-profiles/')) return section;

  return 'account';
}

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
      <div className="cgraph-card w-full max-w-md space-y-5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--product-line)] bg-[var(--product-surface-recessed)]">
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
          <Button
            onClick={onRetry}
            leftIcon={<ArrowPathIcon />}
            variant="secondary"
            animated={false}
          >
            Retry
          </Button>
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
  const { section: routeSection, detail } = useParams();
  const section = getSettingsSection(routeSection, detail);
  const hasSectionRoute = Boolean(routeSection);
  const requestedSection = detail ? `${routeSection}/${detail}` : routeSection;
  const shouldRecoverRoute = Boolean(requestedSection && requestedSection !== section);
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
      void bootstrapPreferences({ userId });
    }
  }, [bootstrapPreferences, isAuthenticated, userId]);

  useEffect(() => {
    if (shouldRecoverRoute) {
      navigate('/me/settings/account', { replace: true });
    }
  }, [navigate, shouldRecoverRoute]);

  const preferencesReady = isPreferenceBootstrapReady({
    isAuthenticated,
    userId,
    lastBootstrappedUserId,
    result: preferenceResult,
  });

  const retryPreferenceBootstrap = () => {
    void bootstrapPreferences({ userId, force: true });
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
    <div className="cgraph-workspace relative flex flex-1 overflow-hidden">
      <nav
        aria-label="Settings navigation"
        className={`cgraph-pane relative z-10 h-full w-full shrink-0 flex-col lg:w-72 ${hasSectionRoute ? 'hidden lg:flex' : 'flex'}`}
      >
        <div className="cgraph-pane-header flex flex-col justify-center px-4">
          <h2 className="text-xl font-semibold text-[var(--token-text-primary)]">Settings</h2>
          <p className="mt-0.5 text-xs text-[var(--token-text-muted)]">
            Account and app preferences
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={tweens.moderate}
          >
            <div className="mb-3">
              <GlassSearchInput
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search settings"
              />
            </div>

            <nav className="space-y-1" aria-label="Settings sections">
              {filteredSections.length === 0 && (
                <p className="px-4 py-2 text-xs text-[var(--token-text-muted)]">
                  No sections match "{searchQuery}".
                </p>
              )}
              {filteredSections.map((item) => {
                const active = section === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      HapticFeedback.light();
                      navigate(`/me/settings/${item.id}`);
                    }}
                    data-active={active || undefined}
                    className="cgraph-list-row group flex w-full items-center gap-3 px-3 py-2 text-left"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        active
                          ? 'border-[var(--product-line-strong)] bg-[var(--product-surface-selected)] text-[var(--token-interactive-primary)]'
                          : 'border-transparent bg-[var(--product-surface-recessed)] text-[var(--token-text-muted)]'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--token-text-primary)]">
                        {item.label}
                      </div>
                      <div className="truncate text-xs text-[var(--token-text-muted)]">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        </div>
      </nav>

      <div
        className={`cgraph-workspace relative z-10 flex-1 flex-col overflow-y-auto ${hasSectionRoute ? 'flex' : 'hidden lg:flex'}`}
        tabIndex={0}
        aria-label="Settings content"
      >
        {hasSectionRoute && (
          <div className="cgraph-content flex pb-0 lg:hidden">
            <IconButton
              icon={<ChevronLeft />}
              label="Back to settings"
              onClick={() => navigate('/me/settings')}
            />
          </div>
        )}

        <motion.div
          className="cgraph-content w-full max-w-3xl"
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
                {section === 'appearance' && <AppThemeSettings key="appearance" />}
                {section === 'chats' && <ChatSettingsPanel key="chats" />}
                {section === 'connected-accounts' && (
                  <ConnectedAccounts key="connected-accounts" />
                )}
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
                {section === 'calls' && <CallsSettingsPanel key="calls" />}
                {section === 'advanced' && <AdvancedSettingsPanel key="advanced" />}
                {section === 'sessions' && <SessionsSettingsPanel key="sessions" />}
                {section === 'delete-account' && <DeleteAccount key="delete-account" />}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
