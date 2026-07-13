/**
 * Main customization page layout.
 */
import { lazy, Suspense, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { categories, type CategoryId } from '@/pages/customize/customizeCategories';
import { Sidebar, LoadingSkeleton } from '@/pages/customize/customize-sidebar';

// Lazy load heavy customization components for better performance
const IdentityCustomization = lazy(() => import('./identity-customization'));
const ThemeCustomization = lazy(() => import('./theme-customization'));
const BubblesCustomization = lazy(() => import('./bubbles-customization'));
const CosmeticsInventoryPage = lazy(() => import('@/modules/cosmetics/pages/inventory-page'));
const CosmeticsShopPage = lazy(() => import('@/modules/cosmetics/pages/shop-page'));

// New V2 panels for enhanced experience (optional use)
import { LivePreviewPanel } from '@/modules/settings/components/customize';
import { FADE_IN } from '@/lib/animations/transitions';

/**
 * Customize Hub - Main Page
 *
 * Revolutionary customization interface with 5 comprehensive categories:
 * 1. Identity - Avatar borders (44), titles (26), badges (36), name styles, nameplates, profile effects
 * 2. Themes - Aurora, Dark, Light app themes
 * 3. Chat Styling - Bubble customization, effects, reactions
 *
 * Layout: 3-panel design (sidebar, main content, live preview)
 */

/**
 * Customize component.
 */
export default function Customize() {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const navigate = useNavigate();

  // Validate URL category or default to 'identity'
  const isValidCategory = (cat: string | undefined): cat is CategoryId => {
    return categories.some((c) => c.id === cat);
  };

  const activeCategory: CategoryId = isValidCategory(urlCategory) ? urlCategory : 'identity';

  useEffect(() => {
    if (urlCategory === 'effects') {
      navigate('../themes', { relative: 'path', replace: true });
    }
  }, [navigate, urlCategory]);

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
      <section className="aurora-hub-main" aria-labelledby="customize-page-title" tabIndex={0}>
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
                <h2 id="customize-page-title" className="aurora-page-title text-3xl">
                  {category.label}
                </h2>
                <p className="text-sm text-[var(--token-text-secondary)]">{category.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Content Area - Renders category-specific components */}
          <motion.div key={activeCategory} {...FADE_IN} transition={{ duration: 0.15 }}>
            <GlassCard variant="frosted" className="aurora-content-panel overflow-visible p-8">
              <Suspense fallback={<LoadingSkeleton />}>
                {activeCategory === 'identity' && <IdentityCustomization />}
                {activeCategory === 'themes' && <ThemeCustomization />}
                {activeCategory === 'bubbles' && <BubblesCustomization />}
                {activeCategory === 'inventory' && <CosmeticsInventoryPage />}
                {activeCategory === 'shop' && <CosmeticsShopPage />}
              </Suspense>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Right Panel - Live Preview */}
      <aside className="aurora-hub-preview overflow-y-auto">
        <div className="p-4">
          {/* Header is handled inside LivePreviewPanel */}

          {/* Use the enhanced LivePreviewPanel if available, fallback to placeholder */}
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
