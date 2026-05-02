/**
 * Main customization page layout.
 */
import { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { categories, type CategoryId } from '@/pages/customize/customizeCategories';
import { Sidebar, LoadingSkeleton } from '@/pages/customize/customize-sidebar';

const IdentityCustomization = lazy(() => import('./identity-customization'));
const ThemeCustomization = lazy(() => import('./theme-customization'));
const BubblesCustomization = lazy(() => import('./bubbles-customization'));
const EffectsCustomization = lazy(() => import('./effects-customization'));
const CosmeticsInventoryPage = lazy(() => import('@/modules/cosmetics/pages/inventory-page'));
const CosmeticsShopPage = lazy(() => import('@/modules/cosmetics/pages/shop-page'));

import { LivePreviewPanel } from '@/modules/settings/components/customize';
import { FADE_IN } from '@/lib/animations/transitions';

export default function Customize() {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const navigate = useNavigate();

  const isValidCategory = (cat: string | undefined): cat is CategoryId => {
    return categories.some((c) => c.id === cat);
  };

  const activeCategory: CategoryId = isValidCategory(urlCategory) ? urlCategory : 'identity';

  function handleCategoryChange(id: CategoryId) {
    navigate(`../${id}`, { relative: 'path' });
  }

  // Always guaranteed to have a valid category (fallback to first)
  const category = categories.find((cat) => cat.id === activeCategory) ?? categories[0]!;
  const CategoryIcon = category.icon;

  return (
    <div className="aurora-hub-shell">
      {/* Left Sidebar - Category Navigation */}
      <Sidebar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      {/* Main Content Area */}
      <main className="aurora-hub-main">
        <div className="mx-auto max-w-4xl p-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aurora-page-header"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="aurora-page-icon p-3">
                <CategoryIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="aurora-page-title text-3xl">{category.label}</h2>
                <p className="text-sm text-[var(--token-text-secondary)]">{category.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Content Area - Renders category-specific components */}
          <motion.div key={activeCategory} {...FADE_IN} transition={{ duration: 0.15 }}>
            {/* IMPORTANT: hover3D disabled to prevent performance issues with particle animations */}
            <GlassCard
              variant="frosted"
              hover3D={false}
              className="aurora-content-panel overflow-visible p-8"
            >
              <Suspense fallback={<LoadingSkeleton />}>
                {activeCategory === 'identity' && <IdentityCustomization />}
                {activeCategory === 'themes' && <ThemeCustomization />}
                {activeCategory === 'bubbles' && <BubblesCustomization />}
                {activeCategory === 'effects' && <EffectsCustomization />}
                {activeCategory === 'inventory' && <CosmeticsInventoryPage />}
                {activeCategory === 'shop' && <CosmeticsShopPage />}
              </Suspense>
            </GlassCard>
          </motion.div>
        </div>
      </main>

      {/* Right Panel - Live Preview */}
      <aside className="aurora-hub-preview overflow-y-auto">
        <div className="p-4">
          <Suspense
            fallback={
              <GlassCard variant="crystal" glow glowColor="var(--glow-accent)" className="p-4">
                <div className="text-center text-sm text-[var(--token-text-muted)]">
                  <SparklesIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
                  <p>Loading preview...</p>
                </div>
              </GlassCard>
            }
          >
            <LivePreviewPanel />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}
