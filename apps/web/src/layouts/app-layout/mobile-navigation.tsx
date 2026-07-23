import { useState, type ReactNode } from 'react';
import { NavLink, type Location, useNavigate } from 'react-router-dom';
import {
  ArrowRightStartOnRectangleIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import { publicProfilePath } from '@/lib/profile-route';
import type { User } from '@/modules/auth/store';
import type { NavItem } from './constants';

type IconComponent = (props: { className?: string }) => ReactNode;

const PRIMARY_PATHS = new Set(['/messages', '/groups', '/explore', '/forums']);

interface MobileNavigationProps {
  user: User | null;
  location: Location;
  handleLogout: () => void | Promise<void>;
  totalUnread: number;
  unreadCount: number;
  navItems: NavItem[];
}

function badgeForItem(item: NavItem, totalUnread: number, unreadCount: number): number {
  if (item.path === '/messages') return totalUnread;
  if (item.path === '/social/notifications') return unreadCount;
  return 0;
}

function MobileNavItem({
  item,
  location,
  totalUnread,
  unreadCount,
  onNavigate,
  inMenu = false,
}: {
  item: NavItem;
  location: Location;
  totalUnread: number;
  unreadCount: number;
  onNavigate?: () => void;
  inMenu?: boolean;
}) {
  const isActive = location.pathname.startsWith(item.path);
  const iconRaw = isActive ? item.activeIcon : item.icon;
  const Icon: IconComponent = iconRaw satisfies IconComponent;
  const badge = badgeForItem(item, totalUnread, unreadCount);

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
        inMenu ? 'rounded-md border border-[var(--token-border-muted)]' : ''
      } ${
        isActive
          ? 'bg-primary-500/10 text-primary-300'
          : inMenu
            ? 'text-[var(--token-text-primary)]'
            : 'text-[var(--token-text-muted)] active:text-[var(--token-text-primary)]'
      }`}
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {badge > 0 ? (
          <span className="absolute -right-2.5 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export function MobileNavigation({
  user,
  location,
  handleLogout,
  totalUnread,
  unreadCount,
  navItems,
}: MobileNavigationProps) {
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const primaryItems = navItems.filter((item) => PRIMARY_PATHS.has(item.path));
  const moreItems = navItems.filter((item) => !PRIMARY_PATHS.has(item.path));
  const moreIsActive = moreItems.some((item) => location.pathname.startsWith(item.path));
  const moreUnread = moreItems.reduce(
    (sum, item) => sum + badgeForItem(item, totalUnread, unreadCount),
    0,
  );
  const profileRoute = user ? publicProfilePath(user) : '/me/profile';

  const confirmLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await handleLogout();
      setLogoutOpen(false);
      setMoreOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <nav
        data-testid="mobile-navigation"
        className="relative z-40 flex min-h-16 shrink-0 items-stretch border-t border-[var(--token-border-muted)] bg-[var(--token-sidebar-bg)] pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Mobile navigation"
      >
        {primaryItems.map((item) => (
          <MobileNavItem
            key={item.path}
            item={item}
            location={location}
            totalUnread={totalUnread}
            unreadCount={unreadCount}
          />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More navigation options"
          aria-haspopup="dialog"
          className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
            moreIsActive
              ? 'text-primary-300'
              : 'text-[var(--token-text-muted)] active:text-[var(--token-text-primary)]'
          }`}
        >
          <span className="relative">
            <EllipsisHorizontalIcon className="h-5 w-5" />
            {moreUnread > 0 ? (
              <span className="absolute -right-2.5 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                {moreUnread > 99 ? '99+' : moreUnread}
              </span>
            ) : null}
          </span>
          <span>More</span>
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent ariaLabel="More navigation" className="w-[calc(100vw-2rem)] p-4">
          <DialogHeader>
            <DialogTitle className="text-[var(--token-text-primary)]">More</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {moreItems.map((item) => (
              <MobileNavItem
                key={item.path}
                item={item}
                location={location}
                totalUnread={totalUnread}
                unreadCount={unreadCount}
                onNavigate={() => setMoreOpen(false)}
                inMenu
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                navigate(profileRoute);
              }}
              className="flex min-h-14 items-center gap-3 rounded-md border border-[var(--token-border-muted)] px-3 text-left text-sm text-[var(--token-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <UserCircleIcon className="h-5 w-5" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setLogoutOpen(true);
              }}
              className="flex min-h-14 items-center gap-3 rounded-md border border-[var(--token-border-muted)] px-3 text-left text-sm text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
              Log out
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={logoutOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) setLogoutOpen(open);
        }}
      >
        <DialogContent ariaLabel="Confirm logout" className="w-[calc(100vw-2rem)]">
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

export default MobileNavigation;
