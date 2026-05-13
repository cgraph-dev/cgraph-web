/**
 * IdentityCustomization Component
 *
 * Streamlined identity customization page with 6 sections:
 * 1. Avatar Borders - 44 animated borders with search/rarity filtering
 * 2. Titles - 26 animated title styles
 * 3. Badges - 36 badges, equip up to 5
 * 4. Name Styles - Typography and effect customization for username
 * 5. Nameplates - Multi-context username background styles
 */

import { motion, AnimatePresence } from 'motion/react';
import { getRarityColor } from './constants';
import {
  BordersSection,
  TitlesSection,
  BadgesSection,
  NameStylesSection,
  NameplatesSection,
} from './sections';
import { useIdentityCustomization, type SectionId } from './useIdentityCustomization';
import { SearchFilterBar } from './search-filter-bar';
import { SaveButton } from '@/modules/settings/components/customize/ui/save-button';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

/**
 * Identity Customization component.
 */
export default function IdentityCustomization() {
  const {
    activeSection,
    setActiveSection,
    selectedTheme,
    setSelectedTheme,
    searchQuery,
    setSearchQuery,
    selectedRarity,
    setSelectedRarity,
    previewingLockedItem,
    avatarBorderType,
    equippedTitle: title,
    equippedBadges,
    isSaving,
    error,
    isLoadingIdentity,
    filteredBorders,
    filteredTitles,
    filteredBadges,
    handleEquipBorder,
    handleEquipTitle,
    handleToggleBadge,
    handleSaveChanges,
    // Display Name Style
    displayNameFont,
    displayNameEffect,
    displayNameColor,
    displayNameSecondaryColor,
    handleFontChange,
    handleEffectChange,
    handleColorChange,
    handleSecondaryColorChange,
    // Nameplate
    equippedNameplate,
    handleEquipNameplate,
  } = useIdentityCustomization();

  const sectionTabs: { id: SectionId; label: string }[] = [
    { id: 'borders', label: 'Avatar Borders' },
    { id: 'titles', label: 'Titles' },
    { id: 'badges', label: 'Badges' },
    { id: 'name-styles', label: 'Name Styles' },
    { id: 'nameplates', label: 'Nameplates' },
  ];

  if (isLoadingIdentity) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--token-interactive-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs — premium glass style */}
      <div className="border-white/8 flex flex-wrap gap-2 rounded-2xl border bg-slate-950/35 p-2 backdrop-blur-xl">
        {sectionTabs.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all duration-300 ${
                isActive
                  ? 'aurora-social-button border-primary-400/30 from-primary-500/70 via-violet-500/60 to-primary-400/45 bg-gradient-to-r text-white shadow-[0_12px_30px_rgba(76,29,149,0.35)]'
                  : 'aurora-social-button-muted text-white/65 hover:text-white'
              }`}
            >
              <span
                className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}
              >
                {section.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Rarity Filter */}
      <SearchFilterBar
        activeSection={activeSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRarity={selectedRarity}
        onRarityChange={setSelectedRarity}
        selectedTheme={selectedTheme}
        onThemeChange={setSelectedTheme}
      />

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          {...FADE_UP}
          exit={{ opacity: 0, y: -20 }}
          transition={tweens.fast}
        >
          {activeSection === 'borders' && (
            <BordersSection
              borders={filteredBorders}
              selectedBorder={avatarBorderType}
              previewingBorder={previewingLockedItem}
              selectedTheme={selectedTheme}
              setSelectedTheme={setSelectedTheme}
              onEquip={handleEquipBorder}
              hasActiveFilter={searchQuery.length > 0 || selectedRarity !== 'all'}
            />
          )}
          {activeSection === 'titles' && (
            <TitlesSection
              titles={filteredTitles}
              selectedTitle={title}
              previewingTitle={previewingLockedItem}
              onEquip={handleEquipTitle}
            />
          )}
          {activeSection === 'badges' && (
            <BadgesSection
              badges={filteredBadges}
              equippedBadges={equippedBadges}
              onToggle={handleToggleBadge}
              getRarityColor={getRarityColor}
            />
          )}
          {activeSection === 'name-styles' && (
            <NameStylesSection
              selectedFont={displayNameFont}
              selectedEffect={displayNameEffect}
              selectedColor={displayNameColor}
              selectedSecondaryColor={displayNameSecondaryColor}
              onFontChange={handleFontChange}
              onEffectChange={handleEffectChange}
              onColorChange={handleColorChange}
              onSecondaryColorChange={handleSecondaryColorChange}
            />
          )}
          {activeSection === 'nameplates' && (
            <NameplatesSection
              selectedNameplate={equippedNameplate}
              onEquip={handleEquipNameplate}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <SaveButton
        onSave={handleSaveChanges}
        isSaving={isSaving}
        error={error}
        label="Save Changes"
      />
    </div>
  );
}
