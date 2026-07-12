import { describe, expect, it } from 'vitest';
import { canonicalIdentityFromApi, identityFieldsFromApi } from '../canonicalIdentity';

describe('canonicalIdentityFromApi', () => {
  it('normalizes backend identity and nested customization fields into one projection', () => {
    const identity = canonicalIdentityFromApi({
      id: 'user-1',
      username: 'alice',
      display_name: 'Alice',
      avatar_url: '/avatar.png',
      status: 'online',
      customization: {
        avatar_border_id: 'border-gold',
        title_id: 'title-founder',
        equipped_badges: ['badge-one', 'badge-two'],
        preset_name: 'nameplate-aurora',
        profile_color: 'crimson',
        profile_theme: 'theme-cosmic',
        chat_theme: 'chat-neon',
        font_family: 'Inter',
        entrance_animation: 'spark',
        text_color: '#ffffff',
      },
    });

    expect(identity.displayName).toBe('Alice');
    expect(identity.cosmetics).toMatchObject({
      avatarBorderId: 'border-gold',
      equippedTitleId: 'title-founder',
      equippedBadgeIds: ['badge-one', 'badge-two'],
      equippedNameplateId: 'nameplate-aurora',
      profileColor: 'crimson',
      profileTheme: 'theme-cosmic',
      chatTheme: 'chat-neon',
      displayNameFont: 'Inter',
      displayNameEffect: 'spark',
      displayNameColor: '#ffffff',
    });
  });

  it('supports realtime friend event key names', () => {
    const fields = identityFieldsFromApi({
      from_user_id: 'friend-1',
      from_username: 'friend',
      from_display_name: 'Friend',
      from_avatar_border_id: 'border-event',
      equippedBadgeIds: ['badge-event'],
    });

    expect(fields.id).toBe('friend-1');
    expect(fields.username).toBe('friend');
    expect(fields.displayName).toBe('Friend');
    expect(fields.avatarBorderId).toBe('border-event');
    expect(fields.equippedBadgeIds).toEqual(['badge-event']);
  });
});
