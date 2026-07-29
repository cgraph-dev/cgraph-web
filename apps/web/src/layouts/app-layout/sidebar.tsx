/**
 * Sidebar Component - Responsive navigation sidebar with badges
 */
import { type ReactNode, useMemo, useState } from 'react';
import { NavLink, type Location, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogoIcon } from '@/components/logo/logo-icon';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import Tooltip from '@/components/ui/tooltip';
import { getAvatarBorderId } from '@/lib/utils';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { LogOut } from 'lucide-react';
import { PresenceStatusSelector } from '@/shared/components/presence-status-selector';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import type { User } from '@/modules/auth/store';
import {
  normalizeAccentThemeId,
  UserProfileCard,
  type ProfileCardUserV2,
} from '@/modules/social/components/user-profile-card';
import type { NavItem } from './constants';
import { publicProfilePath } from '@/lib/profile-route';
type FeatureGateKey = string;
type IconComponent = (props: { className?: string }) => ReactNode;

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

function sidebarProfileCardUser(user: User): ProfileCardUserV2 {
  const profileTheme = normalizeAccentThemeId(user.profileTheme);

  return {
    id: user.id,
    username: user.username ?? '',
    displayName: user.displayName || user.username || 'User',
    avatarUrl: user.avatarUrl ?? '',
    avatarBorderId: getAvatarBorderId(user) ?? undefined,
    bio: user.bio,
    level: user.level ?? 1,
    xp: user.xp ?? 0,
    xpToNextLevel: 100,
    pulse: user.pulse ?? 0,
    streak: user.streak ?? 0,
    equippedBadges: [],
    isOnline: user.status === 'online',
    profileColor: user.profileColor ?? undefined,
    accentTheme: profileTheme,
    nameplateId: user.equippedNameplateId ?? undefined,
    displayNameFont: user.displayNameFont ?? undefined,
    displayNameEffect: user.displayNameEffect ?? undefined,
    displayNameColor: user.displayNameColor ?? undefined,
    displayNameSecondaryColor: user.displayNameSecondaryColor ?? undefined,
    profile_color: user.profileColor ?? undefined,
    profile_theme: user.profileTheme ?? undefined,
    equipped_nameplate: user.equippedNameplateId ?? undefined,
    display_name_font: user.displayNameFont ?? undefined,
    display_name_effect: user.displayNameEffect ?? undefined,
    display_name_color: user.displayNameColor ?? undefined,
    display_name_secondary_color: user.displayNameSecondaryColor ?? undefined,
  };
}

function SidebarProfileAvatar({ user }: { user: User | null }) {
  const displayName = user?.displayName || user?.username || 'User';
  const avatarBorderId = user ? getAvatarBorderId(user) : undefined;

  return (
    <div
      className="h-14 w-14 cursor-pointer overflow-visible rounded-full"
      role="img"
      aria-label={`Your profile picture: ${displayName}`}
    >
      <ThemedAvatar
        src={user?.avatarUrl}
        alt={`${displayName} avatar`}
        size="sidebar"
        className="h-14 w-14 rounded-full"
        avatarBorderId={avatarBorderId}
        fallbackText={displayName}
      />
    </div>
  );
}

/**
 * Lock badge overlay for level-gated nav items.
 * Shows a small lock icon with tooltip when the feature is locked.
 */
function NavItemGateBadge({ feature: _feature }: { feature: FeatureGateKey }) {
  const { unlocked, requiredLevel } = { unlocked: true, requiredLevel: 0 };

  if (unlocked) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -right-1 -top-1 z-30 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--token-interactive-primary)]"
      title={`Unlock at Level ${requiredLevel}`}
    >
      <LockClosedIcon className="h-2.5 w-2.5 text-white" />
    </motion.div>
  );
}

/**
 * Single nav item — tap-to-squish on press, color change on hover.
 * No scale on hover (only colors change).
 */
function SidebarNavItem({
  item,
  isActive,
  totalUnread,
  unreadCount,
}: {
  item: NavItem;
  isActive: boolean;
  totalUnread: number;
  unreadCount: number;
}) {
  const iconRaw = isActive ? item.activeIcon : item.icon;
  const Icon: IconComponent = iconRaw satisfies IconComponent;

  return (
    <Tooltip content={item.label} side="right" delay={150}>
      <NavLink
        to={item.path}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => HapticFeedback.light()}
        className="relative block"
      >
        <motion.div
          className={`cgraph-control cgraph-control-icon relative flex h-11 w-11 items-center justify-center ${
            isActive ? 'cgraph-control-primary' : 'cgraph-control-ghost'
          }`}
          whileTap={{ scale: 0.94 }}
          transition={tapSpring}
          data-cgraph-surface="control"
          data-cgraph-state={isActive ? 'selected' : 'idle'}
        >
          <div className="relative z-10">
            <Icon
              className={`h-[22px] w-[22px] transition-colors duration-150 ${
                isActive ? 'text-current' : 'text-[var(--token-text-secondary)]'
              }`}
            />
          </div>

          {/* Message badge */}
          <AnimatePresence>
            {item.path === '/messages' && totalUnread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Notification badge */}
          <AnimatePresence>
            {item.path === '/social/notifications' && unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Level gate lock */}
          {'featureGate' in item && typeof item.featureGate === 'string' && (
            <NavItemGateBadge feature={item.featureGate} />
          )}
        </motion.div>
      </NavLink>
    </Tooltip>
  );
}

interface SidebarProps {
  user: User | null;
  location: Location;
  handleLogout: () => void | Promise<void>;
  totalUnread: number;
  unreadCount: number;
  navItems: NavItem[];
}

/**
 * Sidebar component.
 */
export default function Sidebar({
  user,
  location,
  handleLogout,
  totalUnread,
  unreadCount,
  navItems,
}: SidebarProps) {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRoute = user ? publicProfilePath(user) : '/me/profile';
  const profileCardUser = useMemo(() => (user ? sidebarProfileCardUser(user) : null), [user]);

  const confirmLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await handleLogout();
      setLogoutOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <aside
        className="cgraph-navigation-rail relative z-10 hidden w-[72px] flex-col items-center overflow-visible overscroll-contain py-4 lg:flex"
        role="navigation"
        aria-label="Main navigation"
      >
      {/* ── User Avatar (top) ── */}
      <div className="relative z-10 mb-2" role="group" aria-label="User profile">
        {user?.id && profileCardUser ? (
          <UserProfileCard
            userId={user.id}
            user={profileCardUser}
            trigger="hover"
            variant="mini"
            className="relative block"
          >
            <button
              type="button"
              onClick={() => navigate(profileRoute)}
              className="focus-visible:ring-primary-400/70 relative block focus:outline-none focus-visible:ring-2"
              aria-label="Open your public profile"
            >
              <motion.div whileTap={{ scale: 0.94 }} transition={tapSpring} className="relative">
                <SidebarProfileAvatar user={user} />
              </motion.div>
            </button>
          </UserProfileCard>
        ) : (
          <NavLink to={profileRoute} className="relative block">
            <motion.div whileTap={{ scale: 0.94 }} transition={tapSpring} className="relative">
              <SidebarProfileAvatar user={user} />
            </motion.div>
          </NavLink>
        )}

        {/* Presence Status Selector */}
        <div className="mt-1.5">
          <PresenceStatusSelector compact />
        </div>
      </div>

      {/* Divider */}
      <div className="mb-2 h-px w-8 bg-[var(--product-line)]" />

      {/* ── Navigation ── */}
      <nav className="relative z-10 flex flex-1 flex-col items-center gap-1" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <SidebarNavItem
              key={item.path}
              item={item}
              isActive={isActive}
              totalUnread={totalUnread}
              unreadCount={unreadCount}
            />
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mb-2 mt-auto h-px w-8 bg-[var(--product-line)]" />

      {/* ── Bottom: Logout + Logo ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-2"
        role="group"
        aria-label="Bottom actions"
      >
        {/* Logout */}
        <Tooltip content="Log out" side="right" delay={150}>
          <button
            type="button"
            onClick={() => {
              HapticFeedback.medium();
              setLogoutOpen(true);
            }}
            className="cgraph-control cgraph-control-icon cgraph-control-ghost relative flex h-10 w-10 items-center justify-center text-[var(--token-text-muted)] hover:text-[var(--token-feedback-error)]"
            aria-label="Logout from your account"
          >
            <LogOut className="relative z-10 h-5 w-5" aria-hidden="true" />
          </button>
        </Tooltip>

        {/* Logo */}
        <a
          href="https://www.cgraph.org"
          title="CGraph"
          className="block opacity-50 transition-opacity duration-150 hover:opacity-80"
        >
          <div role="img" aria-label="CGraph logo">
            <LogoIcon size={44} />
          </div>
        </a>
      </div>
      </aside>

      <Dialog
        open={logoutOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) setLogoutOpen(open);
        }}
      >
        <DialogContent ariaLabel="Confirm logout">
          <DialogHeader>
            <DialogTitle>Log out of CGraph?</DialogTitle>
            <DialogDescription>
              This browser session will end and its local account data will be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              animated={false}
              disabled={isLoggingOut}
              onClick={() => setLogoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              animated={false}
              isLoading={isLoggingOut}
              onClick={confirmLogout}
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
