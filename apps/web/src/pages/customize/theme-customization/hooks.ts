/**
 * Custom hooks for ThemeCustomization
 */

import { durations } from '@cgraph-dev/animation-constants';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import toast from 'react-hot-toast';
import {
  ALL_PROFILE_THEMES,
  DEFAULT_PROFILE_THEME_ID,
  PROFILE_THEME_CATEGORY_IDS,
  getThemesByCategory,
  type ProfileThemeConfig,
  type ProfileThemeCategory,
  type ProfileThemeId,
} from '@/data/profileThemes';

import type { ThemeCategory } from './types';

const VALID_CATEGORIES: ReadonlyArray<ThemeCategory> = ['profile', 'chat', 'forum', 'app'];
const VALID_PROFILE_FILTERS: ReadonlyArray<ProfileThemeCategory | 'all'> = [
  'all',
  ...PROFILE_THEME_CATEGORY_IDS,
];

/** Narrows a raw URL string to ThemeCategory, falling back to 'profile'. */
function toThemeCategory(raw: string): ThemeCategory {
  return VALID_CATEGORIES.find((c) => c === raw) ?? 'profile';
}

/** Narrows a raw URL string to ProfileThemeCategory | 'all', falling back to 'all'. */
function toProfileThemeCategory(raw: string): ProfileThemeCategory | 'all' {
  return VALID_PROFILE_FILTERS.find((f) => f === raw) ?? 'all';
}

/**
 * Hook for managing theme customization state and actions.
 */
export function useThemeCustomization() {
  const { user } = useAuthStore();
  const store = useCustomizationStore();
  const {
    profileTheme,
    chatTheme,
    forumTheme,
    appTheme,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
  } = store;

  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = toThemeCategory(searchParams.get('category') ?? '');
  const [activeCategory, setActiveCategoryState] = useState<ThemeCategory>(initialCategory);

  const initialProfileFilter = toProfileThemeCategory(searchParams.get('filter') ?? '');
  const [profileThemeCategory, setProfileThemeCategoryState] = useState<
    ProfileThemeCategory | 'all'
  >(initialProfileFilter);

  function setActiveCategory(category: ThemeCategory) {
    setActiveCategoryState(category);
    setSearchParams(
      (prev) => {
        prev.set('category', category);
        return prev;
      },
      { replace: true }
    );
  }

  function setProfileThemeCategory(category: ProfileThemeCategory | 'all') {
    setProfileThemeCategoryState(category);
    setSearchParams(
      (prev) => {
        prev.set('filter', category);
        return prev;
      },
      { replace: true }
    );
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [previewingTheme, setPreviewingTheme] = useState<ProfileThemeId | null>(null);

  // Get profile themes from new data file
  const newProfileThemes = useMemo(() => {
    if (profileThemeCategory === 'all') {
      return ALL_PROFILE_THEMES;
    }
    // Narrowed: 'all' case handled above, so profileThemeCategory is ProfileThemeCategory
    return getThemesByCategory(profileThemeCategory);
  }, [profileThemeCategory]);

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  // Create selectedThemes object from store state
  const selectedThemes: Record<ThemeCategory, string> & { profile: ProfileThemeId } = {
    profile: previewingTheme ?? profileTheme ?? DEFAULT_PROFILE_THEME_ID,
    chat: chatTheme,
    forum: forumTheme ?? 'forum-default',
    app: appTheme,
  };

  // Filter profile themes by search
  const filteredNewProfileThemes = useMemo(() => {
    if (!searchQuery) return newProfileThemes;
    return newProfileThemes.filter(
      (theme) =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [newProfileThemes, searchQuery]);

  async function handleSaveThemes() {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (previewingTheme) {
      toast.error('Premium theme selected! Purchase premium to save these customizations.', {
        duration: 4000,
      });
      return;
    }

    try {
      await saveCustomizations(user.id);
      toast.success('Theme settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save themes');
    }
  }

  function isThemeActive(themeId: ProfileThemeId) {
    return selectedThemes.profile === themeId;
  }

  function isThemePreviewing(themeId: ProfileThemeId) {
    return previewingTheme === themeId;
  }

  function handleApplyProfileTheme(theme: ProfileThemeConfig) {
    const isLocked = theme.tier !== 'free' && !theme.unlocked;

    if (isLocked) {
      setPreviewingTheme(theme.id);
      toast('Previewing theme — Unlock to save', {
        duration: durations.cinematic.ms,
      });
      return;
    }

    setPreviewingTheme(null);
    store.setProfileTheme(theme.id);
    toast.success(`Applied "${theme.name}" theme!`);
  }

  return {
    // State
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    profileThemeCategory,
    setProfileThemeCategory,
    selectedThemes,
    isSaving,
    error,

    // Derived data
    filteredNewProfileThemes,

    // Handlers
    handleSaveThemes,
    isThemeActive,
    isThemePreviewing,
    handleApplyProfileTheme,
  };
}
