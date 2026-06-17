import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getProfileThemeOrDefault } from '@/data/profileThemes';

import { ProfileBanner } from '../profile-banner';

const handlers = {
  onUploadClick: vi.fn(),
  onEditToggle: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onBannerChange: vi.fn(),
};

describe('ProfileBanner', () => {
  it('uses the profile theme background as the profile-page header when no custom banner exists', () => {
    const theme = getProfileThemeOrDefault('signal-noir');
    const { container } = render(
      <ProfileBanner
        theme={theme}
        isOwnProfile={false}
        editMode={false}
        isUploading={false}
        isActioning={false}
        bannerInputRef={createRef<HTMLInputElement>()}
        {...handlers}
      />
    );

    const banner = container.querySelector<HTMLElement>('[data-profile-theme-header-image]');
    const image = container.querySelector<HTMLImageElement>('img');

    expect(banner?.dataset.profileThemeHeaderImage).toContain('/profile-background/');
    expect(image?.src).toContain('profile_signal_noir_founder');
  });

  it('keeps a user-uploaded banner ahead of the profile theme fallback', () => {
    const theme = getProfileThemeOrDefault('signal-noir');
    const { container } = render(
      <ProfileBanner
        bannerUrl="/uploads/banner.gif"
        theme={theme}
        isOwnProfile={false}
        editMode={false}
        isUploading={false}
        isActioning={false}
        bannerInputRef={createRef<HTMLInputElement>()}
        {...handlers}
      />
    );

    const banner = container.querySelector<HTMLElement>('.group');
    const image = container.querySelector<HTMLImageElement>('img');

    expect(banner?.dataset.profileThemeHeaderImage).toBeUndefined();
    expect(image?.src).toContain('/uploads/banner.gif');
  });
});
