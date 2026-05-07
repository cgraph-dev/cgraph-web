export const STORAGE_NAMESPACE = 'cgraph:v1';

export const STORAGE_KEYS = {
  auth: `${STORAGE_NAMESPACE}:auth`,
  adminStore: `${STORAGE_NAMESPACE}:store:admin`,
  channelCollapsedCategories: `${STORAGE_NAMESPACE}:groups:collapsed-categories`,
  creatorStore: `${STORAGE_NAMESPACE}:store:creator`,
  customizationStore: `${STORAGE_NAMESPACE}:store:customization`,
  dunningDismissedUntil: `${STORAGE_NAMESPACE}:premium:dunning-dismissed-until`,
  dismissedAnnouncements: `${STORAGE_NAMESPACE}:forum:dismissed-announcements`,
  emojiRecent: `${STORAGE_NAMESPACE}:emoji:recent`,
  forumSearchHistory: `${STORAGE_NAMESPACE}:forum:search-history`,
  gifFavorites: `${STORAGE_NAMESPACE}:gif:favorites`,
  gifRecent: `${STORAGE_NAMESPACE}:gif:recent`,
  messageSearchRecent: `${STORAGE_NAMESPACE}:chat:message-search-recent`,
  nodesStore: `${STORAGE_NAMESPACE}:store:nodes`,
  notificationSounds: `${STORAGE_NAMESPACE}:notifications:sounds`,
  oauthProvider: `${STORAGE_NAMESPACE}:oauth:provider`,
  oauthState: `${STORAGE_NAMESPACE}:oauth:state`,
  postIconRecentPrefix: `${STORAGE_NAMESPACE}:forum:post-icons:recent`,
  premiumStore: `${STORAGE_NAMESPACE}:store:premium`,
  pushPromptDismissed: `${STORAGE_NAMESPACE}:push:prompt-dismissed`,
  queryCache: `${STORAGE_NAMESPACE}:query-cache`,
  routeReload: `${STORAGE_NAMESPACE}:route:last-reload`,
  searchRecent: `${STORAGE_NAMESPACE}:search:recent`,
  settingsStore: `${STORAGE_NAMESPACE}:store:settings`,
  socketLastSequence: `${STORAGE_NAMESPACE}:socket:last-sequence`,
  socketSessionId: `${STORAGE_NAMESPACE}:socket:session-id`,
  themePreference: `${STORAGE_NAMESPACE}:theme:preferences`,
  themeStore: `${STORAGE_NAMESPACE}:store:theme`,
  threadViewMode: `${STORAGE_NAMESPACE}:forum:thread-view-mode`,
  webPushDeviceId: `${STORAGE_NAMESPACE}:push:device-id`,
} as const;

const LEGACY_LOCAL_STORAGE_KEYS = [
  'cgraph-query-cache',
  'cgraph-customization',
  'cgraph-settings',
  'cgraph-premium',
  'cgraph-nodes',
  'cgraph-creator',
  'cgraph-theme',
  'admin-store',
  'cgraph-theme-preferences',
  'cgraph_device_id',
];
const LEGACY_SESSION_STORAGE_KEYS = ['cgraph-auth-v2', 'ws_session_id', 'ws_last_sequence'];
const USER_SCOPED_LOCAL_STORAGE_KEYS = [
  STORAGE_KEYS.customizationStore,
  STORAGE_KEYS.settingsStore,
  STORAGE_KEYS.premiumStore,
  STORAGE_KEYS.nodesStore,
  STORAGE_KEYS.creatorStore,
  STORAGE_KEYS.themeStore,
];

export function removeLocalStorageKeys(keys: readonly string[]): void {
  removeStorageKeys(window.localStorage, keys);
}

export function removeSessionStorageKeys(keys: readonly string[]): void {
  removeStorageKeys(window.sessionStorage, keys);
}

export function clearCGraphQueryCache(): void {
  removeLocalStorageKeys([STORAGE_KEYS.queryCache, ...LEGACY_LOCAL_STORAGE_KEYS]);
}

export function clearCGraphCacheStorage(): void {
  clearCGraphQueryCache();
  removeLocalStorageByPrefix([`${STORAGE_NAMESPACE}:cache:`, 'cgraph-cache:']);
}

export function clearAuthScopedStorage(): void {
  clearCGraphQueryCache();
  removeLocalStorageKeys([...USER_SCOPED_LOCAL_STORAGE_KEYS, ...LEGACY_LOCAL_STORAGE_KEYS]);
  removeSessionStorageKeys([
    STORAGE_KEYS.auth,
    STORAGE_KEYS.socketSessionId,
    STORAGE_KEYS.socketLastSequence,
    ...LEGACY_SESSION_STORAGE_KEYS,
  ]);
}

function removeStorageKeys(storage: Storage, keys: readonly string[]): void {
  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch (_error) {
      // Storage cleanup is best-effort because browsers can deny access.
    }
  }
}

function removeLocalStorageByPrefix(prefixes: readonly string[]): void {
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        window.localStorage.removeItem(key);
      }
    }
  } catch (_error) {
    // Storage cleanup is best-effort because browsers can deny access.
  }
}
