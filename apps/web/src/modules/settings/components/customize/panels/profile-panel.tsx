/**
 * Profile Panel
 *
 * Customization panel for profile cards, badges, bio, and status display.
 */

import { memo } from 'react';
import { ToggleRow, SectionHeader, OptionButton, PremiumBadge } from '../customization-ui';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { THEME_COLORS as themeColors } from '@/stores/theme';
import { profileStyles } from './profile-panel.constants';
import { ProfileCardPreview } from '../live-preview-panel/profile-card-preview';

// PROFILE PANEL COMPONENT

export const ProfilePanel = memo(function ProfilePanel() {
  const {
    profileCardStyle,
    showBadges,
    showBio,
    showStatus,
    profileColor,
    setProfileCardStyle,
    toggleBadges,
    toggleBio,
    toggleStatus,
  } = useCustomizationStore();

  return (
    <div className="space-y-8">
      {/* Live Profile Preview */}
      <section>
        <SectionHeader
          title="Preview"
          subtitle="See how your profile card looks"
          icon={<span className="text-lg">👤</span>}
        />
        <ProfileCardPreview widthClassName="w-[320px]" />
      </section>

      {/* Card Style */}
      <section>
        <SectionHeader
          title="Card Style"
          subtitle="Choose how your profile is displayed"
          icon={<span className="text-lg">🎨</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {profileStyles.map((style) => (
            <div key={style.id} className="relative">
              <OptionButton
                selected={profileCardStyle === style.id}
                onClick={() => setProfileCardStyle(style.id)}
                icon={<span className="text-xl">{style.icon}</span>}
                label={style.name}
                colorPreset={profileColor}
              />
              {style.premium && <PremiumBadge className="absolute -right-2 -top-2" />}
            </div>
          ))}
        </div>
      </section>

      {/* Display Options */}
      <section>
        <SectionHeader
          title="Display Options"
          subtitle="Control what's visible on your profile"
          icon={<span className="text-lg">👁️</span>}
        />
        <div className="aurora-section-card rounded-xl p-4">
          <ToggleRow
            label="Show Badges"
            description="Display earned achievement badges"
            icon="🏅"
            enabled={showBadges}
            onToggle={toggleBadges}
            colorPreset={profileColor}
          />
          <div className="aurora-divider my-2 border-t" />
          <ToggleRow
            label="Show Bio"
            description="Display your profile biography"
            icon="📝"
            enabled={showBio}
            onToggle={toggleBio}
            colorPreset={profileColor}
          />
          <div className="aurora-divider my-2 border-t" />
          <ToggleRow
            label="Show Status"
            description="Display online/offline status"
            icon="🟢"
            enabled={showStatus}
            onToggle={toggleStatus}
            colorPreset={profileColor}
          />
        </div>
      </section>

      {/* Profile Color */}
      <section>
        <SectionHeader
          title="Profile Color"
          subtitle="Your profile accent is separate from app appearance"
          icon={<span className="text-lg">🔗</span>}
        />
        <div className="aurora-section-card rounded-xl bg-gradient-to-br from-white/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${themeColors[profileColor].primary}, ${themeColors[profileColor].secondary})`,
              }}
            />
            <div>
              <h4 className="font-medium capitalize text-[var(--token-text-primary)]">{profileColor} Profile Color</h4>
              <p className="text-sm text-[var(--token-text-muted)]">Profile cards and actions use this accent</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--token-text-muted)]">
            💡 Tip: Change your profile color in the Color tab
          </p>
        </div>
      </section>

      {/* Pro Tips */}
      <section className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-medium text-amber-300">Pro Tips</h4>
            <ul className="mt-2 space-y-1 text-sm text-[var(--token-text-secondary)]">
              <li>• Premium card style unlocks exclusive animations</li>
              <li>• Combine animated borders with glow effects for maximum impact</li>
              <li>• Use the compact style for dense friend lists</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
});

export default ProfilePanel;
