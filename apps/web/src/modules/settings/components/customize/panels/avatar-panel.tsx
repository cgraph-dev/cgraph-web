/**
 * Avatar Panel
 *
 * Customization panel for avatar size and Lottie border preview.
 * CSS border types have been removed — all borders use the Lottie system
 * selected from the Identity tab's Borders section.
 *
 */

import { memo, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { SizeSelector, SectionHeader } from '../customization-ui';
import { FADE_UP } from '@/lib/animations/transitions';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { getBorderById } from '@/data/avatar-borders';
import { useAuthStore } from '@/modules/auth/store';

const LottieBorderRenderer = lazy(() =>
  import('@/lib/lottie/lottie-border-renderer').then((m) => ({ default: m.LottieBorderRenderer }))
);

// AVATAR PANEL COMPONENT

export const AvatarPanel = memo(function AvatarPanel() {
  const { avatarSize, selectedBorderId, setAvatarSize, themePreset } = useCustomizationStore();

  const user = useAuthStore((s) => s.user);
  const borderDef = selectedBorderId ? getBorderById(selectedBorderId) : undefined;
  const lottieUrl = borderDef?.lottieUrl;

  const avatarImage = (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-700 to-gray-800"
      style={{ width: 72, height: 72 }}
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt="Avatar"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-xl font-bold text-white">
          {user?.username?.charAt(0).toUpperCase() || 'CG'}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Live Avatar Preview */}
      <section>
        <SectionHeader
          title="Preview"
          subtitle="Your avatar with the currently equipped border"
          icon={<span className="text-lg">👤</span>}
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--token-border-muted)] bg-black/20 p-8">
          <motion.div {...FADE_UP}>
            {lottieUrl ? (
              <Suspense fallback={avatarImage}>
                <LottieBorderRenderer
                  lottieUrl={lottieUrl}
                  avatarSize={64}
                  borderWidth={18}
                  lottieConfig={{ speed: 1 }}
                >
                  {avatarImage}
                </LottieBorderRenderer>
              </Suspense>
            ) : (
              avatarImage
            )}
          </motion.div>

          {selectedBorderId && borderDef ? (
            <div className="text-center">
              <p className="text-sm font-medium text-white">{borderDef.name}</p>
              <p className="text-xs text-white/40">{borderDef.rarity} border</p>
            </div>
          ) : (
            <p className="text-xs text-white/40">No border equipped</p>
          )}

          <p className="max-w-xs text-center text-xs text-white/30">
            Select avatar borders from the{' '}
            <strong className="text-primary-400">Identity → Avatar Borders</strong> section above
          </p>
        </div>
      </section>

      {/* Avatar Size */}
      <section>
        <SectionHeader
          title="Default Size"
          subtitle="Set your preferred avatar size"
          icon={<span className="text-lg">📐</span>}
        />
        <div className="flex items-center gap-4">
          <SizeSelector value={avatarSize} onChange={setAvatarSize} colorPreset={themePreset} />
          <span className="text-sm text-white/50">
            {avatarSize === 'small' ? '48px' : avatarSize === 'medium' ? '64px' : '80px'}
          </span>
        </div>
      </section>

      {/* Premium Upsell */}
      <motion.div
        className="border-purple-500/30 rounded-xl border p-4"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 10%, transparent), rgba(236, 72, 153, 0.1))',
        }}
        {...FADE_UP}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">👑</span>
          <div className="flex-1">
            <h4 className="font-semibold text-white">Unlock Premium Borders</h4>
            <p className="mt-1 text-xs text-white/60">
              Get access to Legendary, Mythic, and themed border collections with CGraph Premium.
            </p>
            <button className="mt-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105">
              Upgrade Now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default AvatarPanel;
