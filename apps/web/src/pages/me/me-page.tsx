/**
 * Me Hub Page
 *
 * Unified hub for identity, economy, social, and preference settings.
 * Secondary left nav rail (240px) with an Outlet for nested route content.
 */

import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  UserCircleIcon,
  PaintBrushIcon,
  CircleStackIcon,
  SparklesIcon,
  UserPlusIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { tweens } from '@/lib/animation-presets';
import { HapticFeedback } from '@/lib/animations/animation-engine';

interface MeNavSection {
  readonly title: string;
  readonly items: readonly MeNavItem[];
}

interface MeNavItem {
  readonly path: string;
  readonly label: string;
  readonly description: string;
  readonly icon: typeof UserCircleIcon;
}

const ME_NAV_SECTIONS: readonly MeNavSection[] = [
  {
    title: 'Identity',
    items: [
      {
        path: '/me/profile',
        label: 'Profile',
        description: 'Your public profile',
        icon: UserCircleIcon,
      },
      {
        path: '/me/appearance',
        label: 'Appearance',
        description: 'Themes, cosmetics & style',
        icon: PaintBrushIcon,
      },
    ],
  },
  {
    title: 'Economy',
    items: [
      {
        path: '/me/wallet',
        label: 'Nodes Wallet',
        description: 'Balance & transactions',
        icon: CircleStackIcon,
      },
      {
        path: '/me/subscription',
        label: 'Subscription',
        description: 'Manage your plan',
        icon: SparklesIcon,
      },
    ],
  },
  {
    title: 'Social',
    items: [
      {
        path: '/me/invites',
        label: 'Invites',
        description: 'Invite friends to CGraph',
        icon: UserPlusIcon,
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        path: '/me/settings',
        label: 'Settings',
        description: 'Account & app config',
        icon: Cog6ToothIcon,
      },
    ],
  },
] as const;

/**
 * Me hub layout with secondary navigation rail and content outlet.
 */
export default function MePage(): React.ReactNode {
  const location = useLocation();

  // Keep the bare legacy entry aligned with the primary Settings navigation target.
  if (location.pathname === '/me') {
    return <Navigate to="/me/settings" replace />;
  }

  return (
    <div className="relative flex flex-1 overflow-hidden bg-transparent">
      {/* Secondary Nav Rail */}
      <nav className="bg-[var(--token-card-bg)]/40 relative z-10 flex h-full w-60 shrink-0 flex-col border-r border-[var(--token-card-border)] py-4 backdrop-blur-3xl transition-all duration-300">
        <div className="flex-1 overflow-y-auto p-5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={tweens.moderate}
          >
            <div className="mb-8 pl-1">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--token-text-primary)]">
                Me
              </h2>
              <p className="mt-1 text-xs font-medium text-[var(--token-text-muted)]">
                Your identity, wallet &amp; preferences
              </p>
            </div>

            {/* Section Navigation */}
            <div className="space-y-6">
              {ME_NAV_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-[var(--token-text-muted)]">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <MeNavLink key={item.path} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Content Outlet */}
      <div className="relative z-10 flex-1 overflow-y-auto bg-transparent">
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Single nav link inside the Me hub rail.
 */
function MeNavLink({ item }: { readonly item: MeNavItem }): React.ReactNode {
  const Icon = item.icon;

  return (
    <NavLink to={item.path} onClick={() => HapticFeedback.light()} className="group relative block">
      {({ isActive }) => (
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={`relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition-all duration-200 ${
            isActive
              ? 'shadow-primary-500/5 text-[var(--token-text-primary)] shadow-lg'
              : 'text-[var(--token-text-muted)] hover:bg-[var(--token-bg-primary)] hover:text-[var(--token-text-primary)]'
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="meActiveTab"
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
            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-500 ${
              isActive
                ? 'border-primary-500/30 bg-primary-500/10 text-primary-400'
                : 'border-transparent bg-[var(--token-bg-primary)] text-[var(--token-text-muted)] group-hover:bg-[var(--token-bg-secondary)] group-hover:text-[var(--token-text-primary)]'
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>

          <div className="relative z-10 min-w-0 flex-1">
            <div className="text-sm tracking-wide">{item.label}</div>
            <div className="truncate text-[11px] font-medium text-[var(--token-text-muted)] transition-colors group-hover:text-[var(--token-text-secondary)]">
              {item.description}
            </div>
          </div>
        </motion.div>
      )}
    </NavLink>
  );
}
