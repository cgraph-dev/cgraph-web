/**
 * BillingSettingsPanel - Ultra-Elite subscription and perks dashboard
 * Featuring immersive mesh gradients, holographic tiering, and complex glass aesthetics
 */
import { useState, useEffect, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  SparklesIcon,
  ReceiptPercentIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  TrophyIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { usePremiumStore } from '@/modules/premium/store';
import { DunningModal } from '@/modules/premium/components/dunning-modal';
import { apiClient } from '@/lib/api-client';
import { safeRedirect } from '@/lib/security';
import { toast, GlassCard } from '@/shared/components/ui';
import { tweens, springs, entranceVariants } from '@/lib/animation-presets';
import type { InvoiceRecord } from '@cgraph/api-client';
import { FADE_UP } from '@/lib/animations/transitions';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BillingSettingsPanel');

/**
 * FeatureCard - Stunning grid item for premium benefits
 */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      variants={entranceVariants.fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ ...springs.smooth, delay }}
      whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.04)' }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] p-5 transition-all duration-300"
    >
      <div className="bg-primary-500/10 absolute -right-4 -top-4 h-24 w-24 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />

      <div className="relative z-10 space-y-3">
        <div className="bg-primary-500/10 ring-primary-500/20 flex h-10 w-10 items-center justify-center rounded-xl text-primary-400 ring-1 transition-transform duration-500 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-black tracking-tight text-white/90 transition-colors group-hover:text-primary-300">
            {title}
          </h4>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-white/30">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * MeshHero - Immersive header for the billing page
 */
function MeshHero({ tier, isPremium }: { tier: string; isPremium: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] p-1 shadow-2xl">
      {/* Animated Mesh Layer */}
      <div className="absolute inset-0 z-0 opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -left-[20%] -top-[20%] h-[140%] w-[140%] opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${isPremium ? '#f59e0b' : '#3b82f6'} 0%, transparent 50%),
                         radial-gradient(circle at 0% 100%, var(--color-brand-purple) 0%, transparent 50%),
                         radial-gradient(circle at 100% 0%, #10b981 0%, transparent 50%)`,
          }}
        />
        <div className="absolute inset-0 backdrop-blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[1.8rem] bg-[var(--token-bg-primary)] p-8 md:flex-row md:p-12">
        {/* Grain/Noise Texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] grayscale"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="space-y-6 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--token-border-muted)] bg-white/5 px-3 py-1 backdrop-blur-md"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
              Membership Status
            </span>
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl">
              {isPremium ? (
                <span className="bg-gradient-to-r from-amber-200 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Elite Premium
                </span>
              ) : (
                <span className="italic text-white/40">Free Account</span>
              )}
            </h1>
            <p className="max-w-md text-base font-medium leading-relaxed text-white/50 md:text-lg">
              {isPremium
                ? "You have full access to CGraph's most advanced communication protocols."
                : 'Basic tier enabled. Unlock the full potential of your communication network.'}
            </p>
          </div>
        </div>

        <div className="relative shrink-0">
          <AnimatePresence>
            {isPremium && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -inset-12 bg-amber-500/10 blur-[60px]"
              />
            )}
          </AnimatePresence>

          <GlassCard className="relative z-10 flex min-w-[280px] flex-col items-center justify-center border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] p-8 text-center backdrop-blur-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] border-2 border-[var(--token-border-muted)] bg-white/5 text-amber-500 shadow-inner">
              <SparklesIcon className={`h-10 w-10 ${isPremium ? 'animate-pulse' : 'opacity-20'}`} />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">
                Current Tier
              </p>
              <p className="mt-1 text-2xl font-black text-white">{tier.toUpperCase()}</p>
            </div>

            <div className="mt-8 flex w-full flex-col items-center border-t border-[var(--token-card-border)] pt-6">
              <p className="text-[10px] font-black uppercase tracking-tight text-white/30">
                Member Since
              </p>
              <p className="text-sm font-bold text-white/60">March 2024</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export function BillingSettingsPanel() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTier, expiresAt, cancelAtPeriodEnd } = usePremiumStore();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    apiClient.billing
      .getInvoices()
      .then((result) => {
        if ('ok' in result && result.ok) setInvoices(result.data);
      })
      .catch((error: unknown) => {
        logger.warn('Failed to load invoices', error);
      });
  }, []);

  const handleUpgrade = async () => {
    HapticFeedback.heavy();
    setIsLoading(true);
    try {
      const result = await apiClient.billing.createCheckout('premium');
      if ('ok' in result && result.ok && result.data.url) {
        safeRedirect(result.data.url);
      } else {
        toast.error('Premium checkout is currently unavailable. Please try again later.');
      }
    } catch (error) {
      logger.error('Failed to start premium checkout', error);
      toast.error('Premium checkout is currently unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const tierLabel = currentTier || (user?.isPremium ? 'premium' : 'free');
  const isPremium = tierLabel === 'premium' || tierLabel === 'enterprise';

  const powerUps = [
    {
      icon: GlobeAltIcon,
      title: 'Global Themes',
      desc: 'Unlock immersive profile skins and motion backgrounds.',
    },
    {
      icon: CloudArrowUpIcon,
      title: 'Hyper Storage',
      desc: 'Secure cloud uploads up to 500MB per file.',
    },
    {
      icon: TrophyIcon,
      title: 'Prestige Badges',
      desc: 'Unique animated emblems of status and achievement.',
    },
    {
      icon: UserGroupIcon,
      title: 'Guild Priority',
      desc: 'First-in-line access to high-capacity group networks.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Iron Guard',
      desc: 'Advanced encryption layers for all metadata transfers.',
    },
    {
      icon: BoltIcon,
      title: 'Zero Lag',
      desc: 'Dedicated relay shards for near-instant message routing.',
    },
  ];

  // Surface a single most-recent invoice's amount/currency to the dunning modal.
  // The modal itself only renders when premiumStore.status === 'past_due'.
  const latestInvoice = invoices[0];
  const dunningAmount = latestInvoice?.amount ?? 0;
  const dunningCurrency = latestInvoice?.currency ?? 'usd';

  return (
    <motion.div
      {...FADE_UP}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={tweens.standard}
      className="space-y-10"
    >
      <DunningModal amountDueCents={dunningAmount} currency={dunningCurrency} />

      {/* Header */}
      <motion.div variants={entranceVariants.fadeUp}>
        <h1 className="mb-1 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-black text-transparent">
          Subscription
        </h1>
        <p className="text-sm font-medium text-white/40">
          Oversee your membership protocols and access keys
        </p>
      </motion.div>

      {/* Mesh Hero Section */}
      <MeshHero tier={tierLabel} isPremium={isPremium} />

      {/* Subscription Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30">
              Premium Power-Ups
            </h3>
            <div className="mx-4 h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {powerUps.map((up, i) => (
              <FeatureCard key={i} {...up} delay={0.1 + i * 0.05} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--token-text-muted)]">
            Manage Account
          </h3>

          <div className="space-y-6 rounded-3xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] p-6 backdrop-blur-3xl">
            {!isPremium ? (
              <div className="space-y-4">
                <div className="bg-primary-500/10 ring-primary-500/20 rounded-xl p-4 ring-1">
                  <p className="text-sm font-bold text-primary-400">Unlock Pro Protocols</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--token-text-secondary)]">
                    Gain access to advanced encryption and ultra-fast node clusters.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-xl bg-primary-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl transition-all"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {isLoading ? 'Encrypting...' : 'Upgrade Now'}
                </motion.button>
              </div>
            ) : (
              <div className="via-purple-500/10 relative overflow-hidden rounded-2xl border border-[var(--token-border-muted)] bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 p-8 text-center ring-1 ring-white/5">
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl"
                />

                <div className="relative z-10 flex flex-col items-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/30">
                    <ShieldCheckIcon className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-black tracking-tight text-[var(--token-text-primary)]">
                      Subscription Active
                    </h4>
                  </div>

                  {expiresAt && (
                    <div className="mx-auto inline-block rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--token-text-muted)]">
                      Renews: {new Date(expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mx-2 h-px bg-[var(--token-border-muted)]" />

            <div className="space-y-1">
              <button
                onClick={() => {
                  HapticFeedback.light();
                  navigate('/settings/subscription-manage');
                }}
                className="aurora-social-button-muted flex w-full items-center justify-between rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--token-text-secondary)] transition-all"
              >
                Modify Subscription
                <ArrowRightIcon className="h-4 w-4 text-[var(--token-text-muted)]" />
              </button>
              <button
                onClick={() => {
                  HapticFeedback.light();
                  navigate('/settings/account');
                }}
                className="aurora-social-button-muted flex w-full items-center justify-between rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--token-text-secondary)] transition-all"
              >
                Account Info
                <ArrowRightIcon className="h-4 w-4 text-[var(--token-text-muted)]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Section */}
      <AnimatePresence>
        {invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--token-text-muted)]">
                Invoice History
              </h3>
              <div className="mx-4 h-px flex-1 bg-[var(--token-border-muted)]" />
            </div>

            <GlassCard className="overflow-hidden border-[var(--token-card-border)] bg-[var(--token-bg-primary)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--token-card-border)] text-[10px] font-black uppercase tracking-widest text-[var(--token-text-muted)]">
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="transition-colors hover:bg-[var(--token-bg-primary)]"
                      >
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                              invoice.status === 'paid'
                                ? 'border-primary-500/20 bg-primary-500/10 text-primary-300'
                                : 'border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] text-[var(--token-text-muted)]'
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-mono font-black text-[var(--token-text-primary)]">
                          ${(invoice.amount / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-5 font-medium text-[var(--token-text-secondary)]">
                          {new Date(
                            invoice.createdAt ?? invoice.created_at ?? ''
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5 text-right">
                          {(invoice.pdfUrl ?? invoice.pdf_url) && (
                            <motion.a
                              whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                              whileTap={{ scale: 0.88 }}
                              href={invoice.pdfUrl ?? invoice.pdf_url ?? ''}
                              target="_blank"
                              className="aurora-social-button-muted inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--token-text-secondary)] transition-all"
                            >
                              <ReceiptPercentIcon className="h-5 w-5" />
                            </motion.a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Subtle Cancel Button */}
            {isPremium && !cancelAtPeriodEnd && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => {
                    HapticFeedback.heavy();
                    toast.info('Please contact support to cancel your subscription.');
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-[var(--token-text-muted)] transition-colors hover:text-red-500"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
