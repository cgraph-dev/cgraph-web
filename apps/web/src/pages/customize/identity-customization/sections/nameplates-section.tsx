/**
 * NameplatesSection Component
 *
 * Advanced nameplate selection with category filtering and Lottie-backed previews.
 * Uses the shared NAMEPLATE_REGISTRY from @cgraph/animation-constants.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import {
  NAMEPLATE_REGISTRY,
  NAMEPLATE_CATEGORIES,
  type NameplateEntry,
  type NameplateRarity,
  type NameplateCategory,
} from '@cgraph/animation-constants';
import { NameplateRenderer } from '@/components/ui/nameplate-renderer';

export interface NameplatesSectionProps {
  selectedNameplate: string | null;
  onEquip: (nameplateId: string | null) => void;
  ownedNameplateIds: readonly string[];
}

const RARITY_COLORS: Record<NameplateRarity, string> = {
  free: '#9ca3af',
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f97316',
  mythic: '#ec4899',
};

const RARITY_LABELS: Record<NameplateRarity, string> = {
  free: 'Free',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
};

const CATEGORY_ICONS: Record<string, string> = {
  all: '✦',
  basic: '◻',
  metallic: '⚙',
  nature: '♣',
  cyberpunk: '⚡',
  elemental: '◆',
  cosmic: '✧',
  fantasy: '♥',
  dark: '◈',
  divine: '♛',
  mythical: '♦',
};

/**
 * Single nameplate row with live preview and details.
 */
function NameplateRow({
  plate,
  isSelected,
  isOwned,
  onSelect,
}: {
  plate: NameplateEntry;
  isSelected: boolean;
  isOwned: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={() => isOwned && onSelect()}
      className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left backdrop-blur-3xl transition-all duration-300 ${
        isSelected
          ? 'border-[var(--token-interactive-primary)]/20 bg-[var(--token-interactive-primary)]/10 ring-[var(--token-interactive-primary)]/50 scale-[1.01] ring-2'
          : 'border-[var(--token-border-muted)] bg-[var(--token-bg-primary)/0.3] hover:border-[var(--token-card-border)] hover:bg-[var(--token-card-bg)/0.4]'
      } ${isOwned ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
    >
      <div className="flex items-center gap-4">
        {/* Live nameplate preview */}
        <div className="flex w-48 shrink-0 items-center justify-center">
          <NameplateRenderer
            nameplate={plate}
            username="CryptoNinja"
            size="md"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--token-text-primary)]">
              {plate.name}
            </span>
            <span
              className="rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
              style={{
                color: RARITY_COLORS[plate.rarity],
                backgroundColor: `${RARITY_COLORS[plate.rarity]}15`,
                border: `1px solid ${RARITY_COLORS[plate.rarity]}30`,
              }}
            >
              {RARITY_LABELS[plate.rarity]}
            </span>
            {plate.textEffect !== 'none' && (
              <span className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-tertiary)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--token-text-muted)]">
                {plate.textEffect}
              </span>
            )}
            {!isOwned && (
              <span className="rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-tertiary)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--token-text-muted)]">
                Locked
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--token-text-muted)]">
            {plate.description}
          </p>
          {/* Feature badges */}
          <div className="mt-1 flex flex-wrap gap-1">
            {plate.emblem && (
              <span className="rounded bg-[var(--token-bg-tertiary)] px-1 py-0.5 text-[9px] text-[var(--token-text-muted)]">
                {plate.emblem} emblem
              </span>
            )}
            {plate.borderStyle !== 'none' && (
              <span className="rounded bg-[var(--token-bg-tertiary)] px-1 py-0.5 text-[9px] text-[var(--token-text-muted)]">
                {plate.borderStyle} border
              </span>
            )}
          </div>
        </div>

        {/* Equipped indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--token-interactive-primary)] text-[var(--token-text-on-primary)]"
          >
            <motion.span initial={{ rotate: -45 }} animate={{ rotate: 0 }}>
              ✓
            </motion.span>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Nameplates section with category filtering and advanced previews.
 */
export function NameplatesSection({
  selectedNameplate,
  onEquip,
  ownedNameplateIds,
}: NameplatesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<NameplateCategory>('all');
  const ownedNameplates = useMemo(() => new Set(ownedNameplateIds), [ownedNameplateIds]);

  const filteredPlates = useMemo(() => {
    if (activeCategory === 'all') return NAMEPLATE_REGISTRY;
    return NAMEPLATE_REGISTRY.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="space-y-5">
      {/* Description */}
      <div>
        <p className="text-sm text-[var(--token-text-muted)]">
          Choose how your name appears across CGraph — in friend lists, group channels, forum posts,
          and online member panels. Showing {NAMEPLATE_REGISTRY.length} nameplates.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['Friend List', 'Groups', 'Forums', 'Chat', 'Profile Card', 'Online Members'].map(
          (place) => (
            <span
              key={place}
              className="rounded-full border border-[var(--token-border-muted)] bg-[var(--token-bg-tertiary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--token-text-muted)]"
            >
              {place}
            </span>
          )
        )}
      </div>

      <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 py-4">
        {NAMEPLATE_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'primary' : 'glass'}
            onClick={() => setActiveCategory(cat)}
            className={`group flex shrink-0 items-center justify-center rounded-2xl px-6 py-3 transition-all duration-300 ${
              activeCategory === cat
                ? 'aurora-social-button border-primary-400/30 from-primary-500/70 via-violet-500/60 to-primary-400/45 scale-[1.05] bg-gradient-to-r text-white shadow-[0_12px_30px_rgba(76,29,149,0.35)] ring-0'
                : 'aurora-social-button-muted text-white/72 hover:scale-[1.05] hover:text-white'
            }`}
          >
            <span className="mr-2 text-lg leading-none transition-transform group-hover:rotate-12 group-hover:scale-125">
              {CATEGORY_ICONS[cat] ?? '•'}
            </span>
            <span className="font-bold capitalize tracking-tight">{cat}</span>
          </Button>
        ))}
      </div>

      {/* Nameplate list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredPlates.map((plate, index) => {
            const isNonePlate = plate.id === 'plate_none';
            const isOwned = isNonePlate || ownedNameplates.has(plate.id);

            return (
              <motion.div
                key={plate.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
              >
                <NameplateRow
                  plate={plate}
                  isOwned={isOwned}
                  isSelected={selectedNameplate === plate.id || (!selectedNameplate && isNonePlate)}
                  onSelect={() => onEquip(isNonePlate ? null : plate.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredPlates.length === 0 && (
        <div className="py-8 text-center text-sm text-[var(--token-text-muted)]">
          No nameplates in this category yet.
        </div>
      )}
    </div>
  );
}
