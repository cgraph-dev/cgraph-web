/** PreviewCard — static theme sample used by the picker card. */
import type { ProfileThemeConfig } from '@/data/profileThemes';

interface PreviewCardProps {
  theme: ProfileThemeConfig;
}

/** Static miniature profile preview for theme picker cards. */
export default function PreviewCard({ theme }: PreviewCardProps) {
  return (
    <>
      <div className="flex flex-1 items-center justify-center">
        <div className="border-white/12 relative h-20 w-full max-w-[9rem] overflow-hidden rounded-xl border bg-black/30 p-2 shadow-[0_12px_34px_rgba(0,0,0,0.28)]">
          {theme.previewImage && (
            <img
              src={theme.previewImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
              loading="lazy"
            />
          )}
          <div
            className="absolute inset-x-0 top-0 h-6"
            style={{
              background: `linear-gradient(90deg, ${theme.accentPrimary}70, ${theme.accentSecondary}55)`,
            }}
          />
          <div className="relative mt-3 flex items-end gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-bold"
              style={{
                borderColor: theme.accentPrimary,
                color: theme.textColor,
                boxShadow: theme.glowEnabled ? `0 0 18px ${theme.glowColor}55` : undefined,
              }}
            >
              CG
            </div>
            <div className="min-w-0 flex-1 space-y-1 pb-1">
              <div
                className="h-2.5 rounded-full"
                style={{ background: `linear-gradient(90deg, ${theme.textColor}, transparent)` }}
              />
              <div className="h-1.5 w-2/3 rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/45 p-2 backdrop-blur-sm">
        <h3 className="truncate text-sm font-bold" style={{ color: theme.textColor }}>
          {theme.name}
        </h3>
        <p className="truncate text-[10px] opacity-70" style={{ color: theme.textColor }}>
          {theme.description}
        </p>
      </div>
    </>
  );
}
