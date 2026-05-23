/**
 * ManageSubscriptionPanel - Ultra-Elite administrative view
 * Featuring immersive mesh gradients, holographic metrics, and refractive glass aesthetics
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  CheckBadgeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { usePremiumStore } from '@/modules/premium/store';
import { toast, GlassCard } from '@/shared/components/ui';
import { apiClient } from '@/lib/api-client';
import { safeRedirect } from '@/lib/security';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { springs } from '@/lib/animation-presets';

/** Manage subscription panel for premium tier upgrades and billing. */
export function ManageSubscriptionPanel() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTier, expiresAt } = usePremiumStore();

  const tierLabel = currentTier || (user?.isPremium ? 'premium' : 'free');
  const isPremium = tierLabel === 'premium' || tierLabel === 'enterprise';

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getTimeRemaining();
  const progress = daysRemaining !== null ? Math.min(100, (daysRemaining / 30) * 100) : 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: springs.smooth },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="relative space-y-8">
      {/* Back Header */}
      <motion.div variants={item} className="relative z-10 flex items-center gap-4">
        <button
          onClick={() => {
            HapticFeedback.light();
            navigate('/me/subscription');
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] text-[var(--token-text-secondary)] transition-all hover:bg-[var(--token-bg-tertiary)] hover:text-[var(--token-text-primary)]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--token-text-primary)]">
            Manage Details
          </h1>
          <p className="text-xs font-medium text-[var(--token-text-secondary)]">
            Administrative controls for your membership
          </p>
        </div>
      </motion.div>

      {/* Time Remaining Metric - Holographic Upgrade */}
      {isPremium && daysRemaining !== null && (
        <motion.div variants={item}>
          <GlassCard variant="holographic" className="p-10">
            {/* Grain/Noise */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03] grayscale"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
              }}
            />

            <div className="bg-primary-500/10 absolute -right-20 -top-20 h-80 w-80 animate-pulse rounded-full blur-[120px]" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-10 md:flex-row">
              <div className="space-y-4 text-center md:text-left">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-primary-500/30 bg-primary-500/10 inline-flex rounded-full border px-3 py-1"
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-400">
                    Keys Active
                  </span>
                </motion.div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--token-text-muted)]">
                    Time Remaining
                  </p>
                  <h2 className="text-6xl font-black tracking-tighter text-[var(--token-text-primary)]">
                    {daysRemaining}{' '}
                    <span className="text-xl font-bold italic tracking-normal text-[var(--token-text-muted)]">
                      Days
                    </span>
                  </h2>
                </div>
                <p className="max-w-xs text-xs font-medium leading-relaxed text-[var(--token-text-secondary)]">
                  Your membership guarantees priority routing through hyper-fast node clusters.
                </p>
              </div>

              <div className="relative h-32 w-32">
                <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                  <path
                    className="stroke-[var(--token-border-muted)]"
                    strokeWidth="2.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress / 100 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className="stroke-primary-500"
                    strokeWidth="2.5"
                    strokeDasharray="100, 100"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      filter:
                        'drop-shadow(0 0 8px color-mix(in srgb, var(--color-brand-purple) 50%, transparent))',
                    }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <CheckBadgeIcon className="h-10 w-10 animate-pulse text-primary-400" />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Administrative Grid - Refractive Upgrades */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <motion.div variants={item}>
          <GlassCard className="aurora-social-panel hover:border-primary-500/30 group space-y-5 p-7 transition-all duration-500">
            <div className="bg-primary-500/5 absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />

            <div className="flex items-center gap-4">
              <div className="bg-primary-500/10 ring-primary-500/20 flex h-12 w-12 items-center justify-center rounded-2xl text-primary-400 ring-1 transition-transform duration-500 group-hover:scale-110">
                <CreditCardIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--token-text-primary)]">
                  Billing Method
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--token-text-muted)]">
                  Default Layer
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-[var(--token-text-secondary)]">
                Ending in •••• 4242
              </p>
              <p className="text-[10px] text-[var(--token-text-muted)]">Visa Membership Protocol</p>
            </div>
            <button
              onClick={() => {
                HapticFeedback.light();
                (async () => {
                  const res = await apiClient.billing.createPortal();
                  if ('ok' in res && res.ok && res.data.url) safeRedirect(res.data.url);
                })();
              }}
              className="aurora-social-button-muted flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--token-text-secondary)] transition-all hover:tracking-[0.3em]"
            >
              Update Method
            </button>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="hover:border-purple-500/30 group space-y-5 p-7 transition-all duration-500">
            <div className="bg-purple-500/5 absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />

            <div className="flex items-center gap-4">
              <div className="bg-purple-500/10 ring-purple-500/20 flex h-12 w-12 items-center justify-center rounded-2xl text-purple-400 ring-1 transition-transform duration-500 group-hover:scale-110">
                <CalendarDaysIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--token-text-primary)]">
                  Next Renewal
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--token-text-muted)]">
                  Subscription Log
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-[var(--token-text-secondary)]">
                {expiresAt
                  ? new Date(expiresAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </p>
              <p className="text-[10px] text-[var(--token-text-muted)]">
                Automated cycle authorized
              </p>
            </div>
            <button
              onClick={() => HapticFeedback.light()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--token-text-secondary)] transition-all hover:bg-[var(--token-bg-tertiary)] hover:tracking-[0.3em] hover:text-[var(--token-text-primary)]"
            >
              Plan Options
            </button>
          </GlassCard>
        </motion.div>
      </div>

      {/* Primary Actions - Interactive Stagger */}
      <motion.div variants={item} className="space-y-4">
        <h3 className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--token-text-muted)]">
          Administrative Actions
        </h3>
        <GlassCard className="divide-y divide-[var(--token-border-muted)] p-0 shadow-xl">
          {[
            {
              icon: ArrowPathIcon,
              color: 'emerald',
              label: 'Renew Key',
              desc: 'Instant validation of current access level',
            },
            {
              icon: DocumentDuplicateIcon,
              color: 'blue',
              label: 'Download Invoice',
              desc: 'Get PDF copy of your last transaction',
            },
            {
              icon: NoSymbolIcon,
              color: 'red',
              label: 'Cancel Access',
              desc: 'Revoke premium protocols at end of period',
              danger: true,
            },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                HapticFeedback.medium();
                if (action.danger) toast.info('Please contact support to cancel.');
              }}
              className="group flex w-full items-center justify-between p-6 text-left transition-all hover:bg-[var(--token-bg-primary)]"
            >
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${action.color}-500/10 text-${action.color}-400 ring-1 ring-${action.color}-500/20 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-110`}
                >
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-[var(--token-text-primary)] transition-colors group-hover:text-primary-500">
                    {action.label}
                  </p>
                  <p className="text-[10px] font-medium text-[var(--token-text-muted)]">
                    {action.desc}
                  </p>
                </div>
              </div>
              <div className="-translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <div className="h-2 w-2 rounded-full bg-[var(--token-border-default)]" />
              </div>
            </button>
          ))}
        </GlassCard>
      </motion.div>

      {/* Membership Key Footer */}
      <motion.div variants={item} className="flex flex-col items-center justify-center gap-2 pt-8">
        <div className="h-px w-20 bg-gradient-to-r from-transparent via-[var(--token-border-muted)] to-transparent" />
        <p className="text-[9px] font-black uppercase italic tracking-[0.4em] text-[var(--token-text-muted)]">
          Membership Active Shard: 48F2-A9Q1-0X99
        </p>
      </motion.div>
    </motion.div>
  );
}
