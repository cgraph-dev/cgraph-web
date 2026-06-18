import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getProfileThemeOrDefault } from '@/data/profileThemes';

import { ProfileBanner } from '../profile-banner';

const handlers = {
  onEditToggle: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('ProfileBanner', () => {
  it('uses the profile theme background as the profile-page header', () => {
    const theme = getProfileThemeOrDefault('signal-noir');
    const { container } = render(
      <ProfileBanner
        theme={theme}
        isOwnProfile={false}
        editMode={false}
        isActioning={false}
        {...handlers}
      />
    );

    const banner = container.querySelector<HTMLElement>('[data-profile-theme-header-image]');
    const image = container.querySelector<HTMLImageElement>('img');

    expect(banner?.dataset.profileThemeHeaderImage).toContain('/profile-background/');
    expect(image?.src).toContain('profile_signal_noir');
  });

  it('does not expose personal banner upload controls in edit mode', () => {
    const theme = getProfileThemeOrDefault('signal-noir');
    const { container, queryByText } = render(
      <ProfileBanner
        theme={theme}
        isOwnProfile={true}
        editMode={true}
        isActioning={false}
        {...handlers}
      />
    );

    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(queryByText('Change Banner')).toBeNull();
  });
});
