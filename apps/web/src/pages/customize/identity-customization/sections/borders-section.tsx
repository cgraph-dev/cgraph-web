/**
 * BordersSection Component
 *
 * Displays the borders selection grid with theme filtering and animations.
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Border } from '../types';
import { ALL_BORDERS, getLegacyBordersByTheme, type BorderTheme } from '@/data/avatar-borders';
import ThemedBorderCard from '@/modules/settings/components/customize/themed-border-card';
import { FADE_IN } from '@/lib/animations/transitions';

export interface BordersSectionProps {
  borders: Border[];
  selectedBorder: string | null;
  previewingBorder: string | null;
  selectedTheme: BorderTheme | 'all';
  setSelectedTheme: (theme: BorderTheme | 'all') => void;
  onEquip: (borderId: string, border: Border) => void;
  /** Whether the parent has an active search/rarity filter */
  hasActiveFilter?: boolean;
}

/**
 */
/**
 * Borders Section section component.
 */
export function BordersSection({
  borders,
  selectedBorder,
  previewingBorder,
  selectedTheme,
  setSelectedTheme,
  onEquip,
  hasActiveFilter = false,
}: BordersSectionProps) {
  const [showAnimations, setShowAnimations] = useState(true);

  // Get borders from the new collection system
  const themedBorders = useMemo(() => {
    if (selectedTheme === 'all') {
      return ALL_BORDERS;
    }
    return getLegacyBordersByTheme(selectedTheme);
  }, [selectedTheme]);

  // Filter by search query from parent (using the borders prop for search results)
  const displayBorders = useMemo(() => {
    // If parent has an active search/rarity filter, cross-reference with themed borders
    if (hasActiveFilter && borders.length > 0) {
      const borderIds = new Set(borders.map((b) => b.id));
      // Show only themed borders that match the parent filter
      return themedBorders.filter((tb) => borderIds.has(tb.id));
    }
    // No active filter — show all themed borders (respects theme selector)
    return themedBorders;
  }, [borders, themedBorders, hasActiveFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-2">
        <label className="group flex cursor-pointer items-center gap-3">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={showAnimations}
              onChange={(e) => setShowAnimations(e.target.checked)}
              className="peer sr-only"
            />
            <div className="aurora-social-toggle h-4 w-8 rounded-full border-0 backdrop-blur-md" />
            <div className="aurora-social-toggle-thumb absolute left-[2px] top-[2px] h-3 w-3 rounded-full" />
          </div>
          <span className="group-hover:text-white/78 text-xs font-bold tracking-tight text-white/60 transition-colors">
            SHOW ANIMATIONS
          </span>
        </label>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold tracking-widest text-white/55 backdrop-blur-md">
          {displayBorders.length} BORDERS
        </div>
      </div>

      {/* Borders Grid */}
      <motion.div className="grid grid-cols-4 gap-4 lg:grid-cols-5 xl:grid-cols-6" layout>
        <AnimatePresence mode="popLayout">
          {displayBorders.map((border, index) => {
            const isSelected = selectedBorder === border.id;
            const isPreviewing = previewingBorder === border.id;

            return (
              <motion.div
                key={border.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  delay: Math.min(index * 0.02, 0.3),
                  layout: { duration: durations.slow.ms / 1000 },
                }}
              >
                <ThemedBorderCard
                  border={border}
                  isSelected={isSelected || isPreviewing}
                  onSelect={() => {
                    // Map to old border format for handler
                    const oldBorder: Border = {
                      id: border.id,
                      name: border.name,

                      rarity: border.rarity === 'free' ? 'common' : border.rarity,
                      animation: border.animationType,
                      colors: border.colors,
                      unlocked: border.unlocked,
                      unlockRequirement: border.unlockRequirement,
                    };
                    onEquip(border.id, oldBorder);
                  }}
                  showAnimation={showAnimations}
                  size="md"
                  allowPreview={true}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {displayBorders.length === 0 && (
        <motion.div className="col-span-full py-16 text-center" {...FADE_IN}>
          <MagnifyingGlassIcon className="mx-auto mb-4 h-10 w-10 text-[var(--token-text-muted)]" />
          <p className="text-white/55">No borders found matching your filters.</p>
          <button
            onClick={() => setSelectedTheme('all')}
            className="aurora-social-button mt-4 rounded-xl px-4 py-2 text-sm text-white"
          >
            View all borders
          </button>
        </motion.div>
      )}
    </div>
  );
}
