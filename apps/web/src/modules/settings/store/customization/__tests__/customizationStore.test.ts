import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NAMEPLATE_REGISTRY } from '@cgraph-dev/animation-constants';
import { getFreeBorders, getPremiumBorders } from '@/data/avatar-borders';
import { ALL_BADGES } from '@/data/badgesCollection';
import { ALL_PROFILE_THEMES, DEFAULT_PROFILE_THEME_ID } from '@/data/profileThemes';
import { getPremiumTitles } from '@/data/titlesCollection';
import {
  useCustomizationStore,
  DEFAULT_STATE,
  THEME_COLORS,
} from '../customizationStore';
import {
  persistCustomizationState,
  sanitizeCustomizationPayloadForAccess,
  sanitizeCustomizationStateForAccess,
  userHasPremiumAccess,
} from '../customizationStore.schema';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const { api } = await import('@/lib/api');
type MockFn = ReturnType<typeof vi.fn>;
const mockedApi = {
  get: api.get as unknown as MockFn,
  post: api.post as unknown as MockFn,
  put: api.put as unknown as MockFn,
  delete: api.delete as unknown as MockFn,
  patch: api.patch as unknown as MockFn,
};

beforeEach(() => {
  useCustomizationStore.setState({ ...DEFAULT_STATE });
  vi.clearAllMocks();
});

// Initial State

describe('customizationStore initial state', () => {
  it('has purple theme preset', () => {
    expect(useCustomizationStore.getState().themePreset).toBe('purple');
  });
  it('has aurora effect', () => {
    expect(useCustomizationStore.getState().effectPreset).toBe('aurora');
  });
  it('has normal animation speed', () => {
    expect(useCustomizationStore.getState().animationSpeed).toBe('normal');
  });
  it('has particles enabled', () => {
    expect(useCustomizationStore.getState().particlesEnabled).toBe(true);
  });
  it('has glow border type', () => {
    expect(useCustomizationStore.getState().avatarBorderType).toBe('glow');
  });
  it('is not dirty', () => {
    expect(useCustomizationStore.getState().isDirty).toBe(false);
  });
  it('has no error', () => {
    expect(useCustomizationStore.getState().error).toBeNull();
  });
});

// Theme Actions

describe('theme actions', () => {
  it('setTheme updates themePreset and marks dirty', () => {
    useCustomizationStore.getState().setTheme('purple');
    expect(useCustomizationStore.getState().themePreset).toBe('purple');
    expect(useCustomizationStore.getState().isDirty).toBe(true);
  });

  it('setEffect updates effectPreset', () => {
    useCustomizationStore.getState().setEffect('neon');
    expect(useCustomizationStore.getState().effectPreset).toBe('neon');
  });

  it('setAnimationSpeed updates speed', () => {
    useCustomizationStore.getState().setAnimationSpeed('fast');
    expect(useCustomizationStore.getState().animationSpeed).toBe('fast');
  });

  it('toggleParticles flips particlesEnabled', () => {
    useCustomizationStore.getState().toggleParticles();
    expect(useCustomizationStore.getState().particlesEnabled).toBe(false);
    useCustomizationStore.getState().toggleParticles();
    expect(useCustomizationStore.getState().particlesEnabled).toBe(true);
  });

  it('toggleGlow flips glowEnabled', () => {
    useCustomizationStore.getState().toggleGlow();
    expect(useCustomizationStore.getState().glowEnabled).toBe(false);
  });

  it('toggleBlur flips blurEnabled', () => {
    useCustomizationStore.getState().toggleBlur();
    expect(useCustomizationStore.getState().blurEnabled).toBe(false);
  });

  it('toggleAnimatedBackground', () => {
    useCustomizationStore.getState().toggleAnimatedBackground();
    expect(useCustomizationStore.getState().animatedBackground).toBe(true);
  });
});

// Avatar Actions

describe('avatar actions', () => {
  it('setAvatarBorder sets both type and alias', () => {
    useCustomizationStore.getState().setAvatarBorder('fire');
    expect(useCustomizationStore.getState().avatarBorderType).toBe('fire');
    expect(useCustomizationStore.getState().avatarBorder).toBe('fire');
  });

  it('setAvatarBorder accepts shared Lottie border display type', () => {
    useCustomizationStore.getState().setAvatarBorder('lottie');
    expect(useCustomizationStore.getState().avatarBorderType).toBe('lottie');
    expect(useCustomizationStore.getState().avatarBorder).toBe('lottie');
  });

  it('setAvatarBorderColor', () => {
    useCustomizationStore.getState().setAvatarBorderColor('purple');
    expect(useCustomizationStore.getState().avatarBorderColor).toBe('purple');
  });

  it('setAvatarSize', () => {
    useCustomizationStore.getState().setAvatarSize('large');
    expect(useCustomizationStore.getState().avatarSize).toBe('large');
  });
});

// Chat Actions

describe('chat actions', () => {
  it('setChatBubbleStyle sets both style and alias', () => {
    useCustomizationStore.getState().setChatBubbleStyle('rounded');
    expect(useCustomizationStore.getState().chatBubbleStyle).toBe('rounded');
    expect(useCustomizationStore.getState().bubbleStyle).toBe('rounded');
  });

  it('setChatBubbleColor sets both color and chatTheme', () => {
    useCustomizationStore.getState().setChatBubbleColor('cyan');
    expect(useCustomizationStore.getState().chatBubbleColor).toBe('cyan');
    expect(useCustomizationStore.getState().chatTheme).toBe('cyan');
  });

  it('setBubbleBorderRadius', () => {
    useCustomizationStore.getState().setBubbleBorderRadius(24);
    expect(useCustomizationStore.getState().bubbleBorderRadius).toBe(24);
  });

  it('toggleBubbleGlass', () => {
    useCustomizationStore.getState().toggleBubbleGlass();
    expect(useCustomizationStore.getState().bubbleGlassEffect).toBe(false);
  });

  it('toggleGroupMessages', () => {
    useCustomizationStore.getState().toggleGroupMessages();
    expect(useCustomizationStore.getState().groupMessages).toBe(false);
  });

  it('toggleTimestamps', () => {
    useCustomizationStore.getState().toggleTimestamps();
    expect(useCustomizationStore.getState().showTimestamps).toBe(false);
  });

  it('toggleCompactMode', () => {
    useCustomizationStore.getState().toggleCompactMode();
    expect(useCustomizationStore.getState().compactMode).toBe(true);
  });

  it('setChatThemePreset applies the shared T3G preset settings', () => {
    useCustomizationStore.getState().setChatThemePreset('tinted', 'preset:10');

    expect(useCustomizationStore.getState().chatThemeSettings).toMatchObject({
      base: 'tinted',
      presetId: 'preset:10',
      accentColor: 0x0088ff,
      messageColors: [0x517893, 0x285c96],
      wallpaper: {
        intensity: 40,
        backgroundColor: 0x1e3557,
        secondBackgroundColor: 0x182036,
        thirdBackgroundColor: 0x1c4352,
        fourthBackgroundColor: 0x16263a,
        dark: true,
      },
    });
    expect(useCustomizationStore.getState().isDirty).toBe(true);
  });
});

// Profile Actions

describe('profile actions', () => {
  it('setProfileCardStyle sets both style and alias', () => {
    useCustomizationStore.getState().setProfileCardStyle('compact');
    expect(useCustomizationStore.getState().profileCardStyle).toBe('compact');
    expect(useCustomizationStore.getState().profileLayout).toBe('compact');
  });

  it('setProfileTheme sets both selected profile theme and alias', () => {
    useCustomizationStore.getState().setProfileTheme(DEFAULT_PROFILE_THEME_ID);
    expect(useCustomizationStore.getState().selectedProfileThemeId).toBe(
      DEFAULT_PROFILE_THEME_ID
    );
    expect(useCustomizationStore.getState().profileTheme).toBe(DEFAULT_PROFILE_THEME_ID);
  });

  it('setEquippedTitle sets both title and alias', () => {
    useCustomizationStore.getState().setEquippedTitle('king');
    expect(useCustomizationStore.getState().equippedTitle).toBe('king');
    expect(useCustomizationStore.getState().title).toBe('king');
  });

  it('setEquippedBadges', () => {
    useCustomizationStore.getState().setEquippedBadges(['a', 'b']);
    expect(useCustomizationStore.getState().equippedBadges).toEqual(['a', 'b']);
  });

  it('toggleBadges', () => {
    useCustomizationStore.getState().toggleBadges();
    expect(useCustomizationStore.getState().showBadges).toBe(false);
  });
});

// Batch & Legacy

describe('batch and legacy actions', () => {
  it('updateSettings merges and marks dirty', () => {
    useCustomizationStore
      .getState()
      .updateSettings({ themePreset: 'gold', animationSpeed: 'fast' });
    expect(useCustomizationStore.getState().themePreset).toBe('gold');
    expect(useCustomizationStore.getState().animationSpeed).toBe('fast');
    expect(useCustomizationStore.getState().isDirty).toBe(true);
  });

  it('applyServerSettings maps API patches without marking dirty', () => {
    const freeBorder = getFreeBorders()[0];
    expect(freeBorder).toBeDefined();

    useCustomizationStore.setState({ ...DEFAULT_STATE, isDirty: true, lastSyncedAt: null });

    useCustomizationStore.getState().applyServerSettings({
      app_theme: 'emerald',
      background_effect: 'neon',
      chat_theme: 'cyan',
      avatar_border_id: freeBorder!.id,
    });

    expect(useCustomizationStore.getState()).toMatchObject({
      themePreset: 'emerald',
      appTheme: 'emerald',
      effectPreset: 'neon',
      chatBubbleColor: 'cyan',
      chatTheme: 'cyan',
      selectedBorderId: freeBorder!.id,
      isDirty: false,
    });
    expect(useCustomizationStore.getState().lastSyncedAt).toEqual(expect.any(Number));
  });

  it('applyServerSettings rejects stale profile-card layout IDs', () => {
    useCustomizationStore.setState({ ...DEFAULT_STATE, profileCardStyle: 'compact' });

    useCustomizationStore.getState().applyServerSettings({
      profile_layout: 'gaming',
    });

    expect(useCustomizationStore.getState().profileCardStyle).toBe('default');
    expect(useCustomizationStore.getState().profileLayout).toBe('default');
  });

  it('applyServerSettings accepts shared profile theme IDs', () => {
    useCustomizationStore.getState().applyServerSettings({
      profile_theme: DEFAULT_PROFILE_THEME_ID,
    });

    expect(useCustomizationStore.getState().selectedProfileThemeId).toBe(
      DEFAULT_PROFILE_THEME_ID
    );
    expect(useCustomizationStore.getState().profileTheme).toBe(DEFAULT_PROFILE_THEME_ID);
  });

  it('applyServerSettings clears stale profile theme IDs', () => {
    useCustomizationStore.setState({
      ...DEFAULT_STATE,
      selectedProfileThemeId: DEFAULT_PROFILE_THEME_ID,
      profileTheme: DEFAULT_PROFILE_THEME_ID,
    });

    useCustomizationStore.getState().applyServerSettings({
      profile_theme: 'classic-purple',
    });

    expect(useCustomizationStore.getState().selectedProfileThemeId).toBeNull();
    expect(useCustomizationStore.getState().profileTheme).toBeNull();
  });

  it('updateChatStyle sets a key', () => {
    useCustomizationStore.getState().updateChatStyle('chatBubbleStyle', 'cloud');
    expect(useCustomizationStore.getState().chatBubbleStyle).toBe('cloud');
  });

  it('legacy identity updates reject stale profile theme IDs', () => {
    useCustomizationStore
      .getState()
      .updateIdentity('selectedProfileThemeId', 'classic-purple');

    expect(useCustomizationStore.getState().selectedProfileThemeId).toBeNull();
    expect(useCustomizationStore.getState().profileTheme).toBeNull();
  });

  it('resetToDefaults restores defaults and marks dirty', () => {
    useCustomizationStore.getState().setTheme('pink');
    useCustomizationStore.getState().resetToDefaults();
    expect(useCustomizationStore.getState().themePreset).toBe('purple');
    expect(useCustomizationStore.getState().isDirty).toBe(true);
  });

  it('clearError clears error', () => {
    useCustomizationStore.setState({ error: 'some error' });
    useCustomizationStore.getState().clearError();
    expect(useCustomizationStore.getState().error).toBeNull();
  });
});

// Fetch & Save

describe('fetchCustomizations', () => {
  it('fetches and applies server data', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: { theme_preset: 'pink', effect_preset: 'neon' } },
    });
    await useCustomizationStore.getState().fetchCustomizations();
    expect(useCustomizationStore.getState().isLoading).toBe(false);
    expect(useCustomizationStore.getState().isDirty).toBe(false);
  });

  it('hydrates source-shaped chat theme settings from the backend payload', async () => {
    const customColor = {
      start: { hue: 220, saturation: 88, lightness: 0.42 },
      end: { hue: 260, saturation: 76, lightness: 0.36 },
      deg: 42,
    };

    mockedApi.get.mockResolvedValueOnce({
      data: {
        data: {
          chat_theme_settings: {
            base: 'tinted',
            preset_id: 'preset:10',
            accent_color: 0x0088ff,
            message_colors: [0x517893, 0x285c96],
            wallpaper: {
              intensity: 40,
              background_color: 0x1e3557,
              second_background_color: 0x182036,
              third_background_color: 0x1c4352,
              fourth_background_color: 0x16263a,
              dark: true,
            },
          },
          default_conversation_color: {
            color: 'custom',
            custom_color_data: { id: 'custom-blue', value: customColor },
          },
          custom_chat_colors: {
            colors: { 'custom-blue': customColor },
            version: 1,
            order: ['custom-blue'],
          },
          conversation_chat_theme_overrides: {
            'conversation-1': {
              conversation_color: 'custom',
              custom_color_id: 'custom-blue',
              custom_color: customColor,
            },
          },
        },
      },
    });

    await useCustomizationStore.getState().fetchCustomizations();

    expect(useCustomizationStore.getState().chatThemeSettings).toMatchObject({
      base: 'tinted',
      presetId: 'preset:10',
      accentColor: 0x0088ff,
      messageColors: [0x517893, 0x285c96],
      wallpaper: {
        intensity: 40,
        backgroundColor: 0x1e3557,
        secondBackgroundColor: 0x182036,
        thirdBackgroundColor: 0x1c4352,
        fourthBackgroundColor: 0x16263a,
        dark: true,
      },
    });
    expect(useCustomizationStore.getState().defaultConversationColor).toEqual({
      color: 'custom',
      customColorData: { id: 'custom-blue', value: customColor },
    });
    expect(useCustomizationStore.getState().customChatColors).toEqual({
      colors: { 'custom-blue': customColor },
      version: 1,
      order: ['custom-blue'],
    });
    expect(useCustomizationStore.getState().conversationChatThemeOverrides).toEqual({
      'conversation-1': {
        conversationColor: 'custom',
        customColorId: 'custom-blue',
        customColor,
      },
    });
  });

  it('sets global and per-conversation named chat colors through one persisted state owner', () => {
    useCustomizationStore.getState().setDefaultConversationColor('crimson');
    useCustomizationStore.getState().setConversationChatThemeColor('conversation-1', 'teal');

    expect(useCustomizationStore.getState()).toMatchObject({
      defaultConversationColor: { color: 'crimson' },
      conversationChatThemeOverrides: {
        'conversation-1': { conversationColor: 'teal' },
      },
      isDirty: true,
    });
  });

  it('creates and edits a custom color while updating every active reference', () => {
    const originalColor = { start: { hue: 220, saturation: 84 }, deg: 180 };
    const colorId = useCustomizationStore.getState().addCustomChatColor(originalColor);
    const updatedColor = {
      start: { hue: 120, saturation: 70 },
      end: { hue: 180, saturation: 80 },
      deg: 270,
    };

    useCustomizationStore
      .getState()
      .setConversationChatThemeColor('conversation-1', 'custom', {
        id: colorId,
        value: originalColor,
      });
    useCustomizationStore.getState().editCustomChatColor(colorId, updatedColor);

    expect(useCustomizationStore.getState()).toMatchObject({
      defaultConversationColor: {
        color: 'custom',
        customColorData: { id: colorId, value: updatedColor },
      },
      customChatColors: {
        colors: { [colorId]: updatedColor },
        order: [colorId],
      },
      conversationChatThemeOverrides: {
        'conversation-1': {
          conversationColor: 'custom',
          customColorId: colorId,
          customColor: updatedColor,
        },
      },
    });
  });

  it('removes a custom color and resets every default or conversation reference atomically', () => {
    const removedColor = { start: { hue: 220, saturation: 84 }, deg: 180 };
    const keptColor = { start: { hue: 40, saturation: 70 } };

    useCustomizationStore.setState({
      ...DEFAULT_STATE,
      defaultConversationColor: {
        color: 'custom',
        customColorData: { id: 'remove', value: removedColor },
      },
      customChatColors: {
        colors: { remove: removedColor, keep: keptColor },
        version: 1,
        order: ['remove', 'keep'],
      },
      conversationChatThemeOverrides: {
        affected: {
          conversationColor: 'custom',
          customColorId: 'remove',
          customColor: removedColor,
        },
        unaffected: { conversationColor: 'teal' },
      },
    });

    useCustomizationStore.getState().removeCustomChatColor('remove');

    expect(useCustomizationStore.getState()).toMatchObject({
      defaultConversationColor: { color: 'ultramarine' },
      customChatColors: {
        colors: { keep: keptColor },
        order: ['keep'],
      },
      conversationChatThemeOverrides: {
        affected: {},
        unaffected: { conversationColor: 'teal' },
      },
    });
  });

  it('resets a single conversation independently from the global default and other overrides', () => {
    useCustomizationStore.setState({
      ...DEFAULT_STATE,
      defaultConversationColor: { color: 'crimson' },
      conversationChatThemeOverrides: {
        first: { conversationColor: 'teal' },
        second: { conversationColor: 'violet' },
      },
    });

    useCustomizationStore.getState().resetConversationChatThemeColor('first');

    expect(useCustomizationStore.getState()).toMatchObject({
      defaultConversationColor: { color: 'crimson' },
      conversationChatThemeOverrides: {
        second: { conversationColor: 'violet' },
      },
    });

    useCustomizationStore.getState().resetAllConversationChatThemeColors();
    useCustomizationStore.getState().resetDefaultConversationColor();

    expect(useCustomizationStore.getState()).toMatchObject({
      defaultConversationColor: { color: 'ultramarine' },
      conversationChatThemeOverrides: {},
    });
  });

  it('uses server-cleared identity cosmetics over stale custom_config values', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        data: {
          avatar_border_id: null,
          title_id: null,
          equipped_nameplate: null,
          custom_config: {
            avatar_border_id: 'border-stone',
            title_id: 'title-founder',
            equipped_nameplate: 'plate_gilded_sapphire_loop_01',
          },
        },
      },
    });

    await useCustomizationStore.getState().fetchCustomizations();

    expect(useCustomizationStore.getState()).toMatchObject({
      selectedBorderId: null,
      equippedTitle: null,
      title: null,
      equippedNameplate: null,
    });
  });

  it('handles fetch failure', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
    await useCustomizationStore.getState().fetchCustomizations();
    expect(useCustomizationStore.getState().isLoading).toBe(false);
    expect(useCustomizationStore.getState().error).toBe('Network error');
  });

  it('uses server-cleared identity cosmetics after save responses with stale custom_config values', async () => {
    useCustomizationStore.setState({
      ...DEFAULT_STATE,
      selectedBorderId: 'border-stone',
      equippedTitle: 'title-founder',
      title: 'title-founder',
      equippedNameplate: 'plate_gilded_sapphire_loop_01',
    });
    mockedApi.patch.mockResolvedValueOnce({
      data: {
        data: {
          avatar_border_id: null,
          title_id: null,
          equipped_nameplate: null,
          custom_config: {
            avatar_border_id: 'border-stone',
            title_id: 'title-founder',
            equipped_nameplate: 'plate_gilded_sapphire_loop_01',
          },
        },
      },
    });

    await useCustomizationStore.getState().saveCustomizations();

    expect(useCustomizationStore.getState()).toMatchObject({
      selectedBorderId: null,
      equippedTitle: null,
      title: null,
      equippedNameplate: null,
      isDirty: false,
    });
  });
});

describe('persistCustomizationState', () => {
  it('saves chat theme payloads using backend snake_case keys', async () => {
    const customColor = {
      start: { hue: 220, saturation: 88, lightness: 0.42 },
      end: { hue: 260, saturation: 76, lightness: 0.36 },
      deg: 42,
    };

    mockedApi.patch.mockResolvedValueOnce({
      data: { data: {} },
    });

    await persistCustomizationState({
      ...DEFAULT_STATE,
      chatThemeSettings: {
        base: 'tinted',
        presetId: 'preset:10',
        accentColor: 0x0088ff,
        messageColors: [0x517893, 0x285c96],
        wallpaper: {
          intensity: 40,
          backgroundColor: 0x1e3557,
          secondBackgroundColor: 0x182036,
          thirdBackgroundColor: 0x1c4352,
          fourthBackgroundColor: 0x16263a,
          dark: true,
        },
      },
      defaultConversationColor: {
        color: 'custom',
        customColorData: { id: 'custom-blue', value: customColor },
      },
      customChatColors: {
        colors: { 'custom-blue': customColor },
        version: 1,
        order: ['custom-blue'],
      },
      conversationChatThemeOverrides: {
        'conversation-1': {
          conversationColor: 'custom',
          customColorId: 'custom-blue',
          customColor,
        },
      },
    });

    const payload = mockedApi.patch.mock.calls[0]?.[1];

    expect(payload).toMatchObject({
      chat_theme_settings: {
        base: 'tinted',
        preset_id: 'preset:10',
        accent_color: 0x0088ff,
        message_colors: [0x517893, 0x285c96],
        wallpaper: {
          intensity: 40,
          background_color: 0x1e3557,
          second_background_color: 0x182036,
          third_background_color: 0x1c4352,
          fourth_background_color: 0x16263a,
          dark: true,
        },
      },
      default_conversation_color: {
        color: 'custom',
        custom_color_data: { id: 'custom-blue', value: customColor },
      },
      custom_chat_colors: {
        colors: { 'custom-blue': customColor },
        version: 1,
        order: ['custom-blue'],
      },
      conversation_chat_theme_overrides: {
        'conversation-1': {
          conversation_color: 'custom',
          custom_color_id: 'custom-blue',
          custom_color: customColor,
        },
      },
    });
    expect(payload.custom_config).toMatchObject({
      chat_theme_settings: payload.chat_theme_settings,
      default_conversation_color: payload.default_conversation_color,
      custom_chat_colors: payload.custom_chat_colors,
      conversation_chat_theme_overrides: payload.conversation_chat_theme_overrides,
    });
  });
});

describe('sanitizeCustomizationPayloadForAccess', () => {
  it('clears premium-only cosmetics for non-premium saves while preserving free cosmetics', () => {
    const freeBorder = getFreeBorders()[0];
    const premiumBorder = getPremiumBorders()[0];
    const premiumTitle = getPremiumTitles()[0];
    const freeBadge = ALL_BADGES.find((badge) => badge.unlocked);
    const premiumBadge = ALL_BADGES.find((badge) => !badge.unlocked);
    const freeNameplate = NAMEPLATE_REGISTRY.find((plate) => plate.free);
    const premiumNameplate = NAMEPLATE_REGISTRY.find((plate) => !plate.free);
    const freeTheme = ALL_PROFILE_THEMES.find((theme) => theme.tier === 'free');
    const premiumThemeId =
      ALL_PROFILE_THEMES.find((theme) => theme.tier !== 'free')?.id ?? 'premium-theme-for-test';

    expect(freeBorder).toBeDefined();
    expect(premiumBorder).toBeDefined();
    expect(premiumTitle).toBeDefined();
    expect(freeBadge).toBeDefined();
    expect(premiumBadge).toBeDefined();
    expect(freeNameplate).toBeDefined();
    expect(premiumNameplate).toBeDefined();
    expect(freeTheme).toBeDefined();

    const freePayload = {
      avatar_border_id: freeBorder!.id,
      title_id: null,
      equipped_badges: [freeBadge!.id],
      equipped_nameplate: freeNameplate!.id,
      profile_theme: freeTheme!.id,
    };

    expect(sanitizeCustomizationPayloadForAccess(freePayload, false)).toEqual(freePayload);

    expect(
      sanitizeCustomizationPayloadForAccess(
        {
          avatar_border_id: premiumBorder!.id,
          title_id: premiumTitle!.id,
          equipped_badges: [freeBadge!.id, premiumBadge!.id],
          equipped_nameplate: premiumNameplate!.id,
          profile_theme: premiumThemeId,
        },
        false
      )
    ).toEqual({
      avatar_border_id: null,
      title_id: null,
      equipped_badges: [freeBadge!.id],
      equipped_nameplate: null,
      profile_theme: DEFAULT_PROFILE_THEME_ID,
    });
  });

  it('preserves premium cosmetics while premium access is active', () => {
    const premiumBorder = getPremiumBorders()[0];
    const premiumTitle = getPremiumTitles()[0];
    const premiumBadge = ALL_BADGES.find((badge) => !badge.unlocked);
    const premiumNameplate = NAMEPLATE_REGISTRY.find((plate) => !plate.free);
    const premiumThemeId =
      ALL_PROFILE_THEMES.find((theme) => theme.tier !== 'free')?.id ?? 'premium-theme-for-test';

    expect(premiumBorder).toBeDefined();
    expect(premiumTitle).toBeDefined();
    expect(premiumBadge).toBeDefined();
    expect(premiumNameplate).toBeDefined();

    const payload = {
      avatar_border_id: premiumBorder!.id,
      title_id: premiumTitle!.id,
      equipped_badges: [premiumBadge!.id],
      equipped_nameplate: premiumNameplate!.id,
      profile_theme: premiumThemeId,
    };

    expect(sanitizeCustomizationPayloadForAccess(payload, true)).toEqual(payload);
  });

  it('clears stale premium local state after access expires', () => {
    const premiumBorder = getPremiumBorders()[0];
    const premiumTitle = getPremiumTitles()[0];
    const premiumBadge = ALL_BADGES.find((badge) => !badge.unlocked);
    const premiumNameplate = NAMEPLATE_REGISTRY.find((plate) => !plate.free);

    expect(premiumBorder).toBeDefined();
    expect(premiumTitle).toBeDefined();
    expect(premiumBadge).toBeDefined();
    expect(premiumNameplate).toBeDefined();

    const next = sanitizeCustomizationStateForAccess(
      {
        ...DEFAULT_STATE,
        selectedBorderId: premiumBorder!.id,
        equippedTitle: premiumTitle!.id,
        title: premiumTitle!.id,
        equippedBadges: [premiumBadge!.id],
        equippedNameplate: premiumNameplate!.id,
      },
      false
    );

    expect(next).toMatchObject({
      selectedBorderId: null,
      equippedTitle: null,
      title: null,
      equippedBadges: [],
      equippedNameplate: null,
    });
  });

  it('treats expired premium subscriptions as non-premium', () => {
    expect(
      userHasPremiumAccess({
        isPremium: true,
        subscription: {
          tier: 'premium',
          status: 'active',
          expiresAt: '2000-01-01T00:00:00.000Z',
        },
      })
    ).toBe(false);

    expect(
      userHasPremiumAccess({
        isPremium: true,
        subscription: {
          tier: 'premium',
          status: 'active',
          expiresAt: '2999-01-01T00:00:00.000Z',
        },
      })
    ).toBe(true);
  });
});

// Constants

describe('constants', () => {
  it('THEME_COLORS has emerald', () => {
    expect(THEME_COLORS.emerald).toBeDefined();
    expect(THEME_COLORS.emerald.primary).toBe('#10b981');
  });

});
