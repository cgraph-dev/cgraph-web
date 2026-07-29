/**
 * Customization sidebar navigation.
 */
import { memo } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { categories, type CategoryId } from '@/pages/customize/customizeCategories';

// LOADING SKELETON

export const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-48 rounded-lg bg-white/10" />
    <div className="h-4 w-96 rounded bg-white/5" />
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="aspect-square rounded-xl bg-white/5" />
      ))}
    </div>
    <div className="h-32 rounded-xl bg-white/5" />
  </div>
);

// SIDEBAR NAVIGATION

interface SidebarProps {
  activeCategory: CategoryId;
  onCategoryChange: (id: CategoryId) => void;
}

export const Sidebar = memo(function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  return (
    <aside className="aurora-hub-sidebar flex h-full flex-col py-4">
      <div className="flex-1 overflow-y-auto p-5">
        {/* Header */}
        <div className="mb-8 pl-1">
          <h1 className="aurora-page-title text-2xl">
            Customize
          </h1>
          <p className="mt-1 text-xs font-medium text-[var(--token-text-muted)]">
            Personalize your experience
          </p>
        </div>

        {/* Category Navigation */}
        <nav className="space-y-2">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative w-full overflow-hidden rounded-lg border text-left transition-colors duration-150 ${
                  isActive
                    ? 'border-[color-mix(in_srgb,var(--color-brand-green)_62%,var(--token-card-border))] bg-[color-mix(in_srgb,var(--color-brand-purple)_12%,var(--product-surface-raised))] text-[var(--token-text-primary)] shadow-[var(--product-shadow-control)]'
                    : 'border-transparent text-[var(--token-text-secondary)] hover:border-[var(--product-line)] hover:bg-[var(--product-surface-recessed)] hover:text-[var(--token-text-primary)]'
                }`}
              >
                <div className={`relative z-10 flex items-center gap-3 p-3`}>
                  {/* Category Icon Container */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${
                      isActive
                        ? 'border-[color-mix(in_srgb,var(--color-brand-purple)_48%,var(--product-line))] bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,var(--product-surface-recessed))] text-[var(--color-brand-purple)]'
                        : 'border-transparent bg-[var(--product-surface-recessed)] text-[var(--token-text-muted)] group-hover:text-[var(--token-text-primary)]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-bold transition-colors ${
                        isActive
                        ? 'text-[var(--token-text-primary)]'
                        : 'text-[var(--token-text-secondary)] group-hover:text-[var(--token-text-primary)]'
                      }`}
                    >
                      {cat.label}
                    </div>
                    <div className="truncate text-[11px] font-medium text-[var(--token-text-muted)] transition-colors group-hover:text-[var(--token-text-secondary)]">
                      {cat.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info */}
      <div className="border-t border-[var(--token-border-muted)] bg-black/20 p-5">
        <GlassCard
          variant="default"
          className="aurora-social-panel p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4),rgba(255,255,255,0.02)_0px_1px_1px_inset]"
        >
          <div className="flex items-start gap-3">
            <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-300" />
            <div className="text-xs font-medium leading-relaxed text-[var(--token-text-muted)]">
              <div className="mb-1 text-[13px] font-semibold tracking-tight text-[var(--token-text-primary)]">
                Live Preview
              </div>
              See changes in real-time as you customize. Auto-saves instantly.
            </div>
          </div>
        </GlassCard>
      </div>
    </aside>
  );
});
