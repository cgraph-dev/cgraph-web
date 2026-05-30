/**
 * Settings API mappers.
 *
 * The runtime-neutral mapping logic is owned by @cgraph-dev/shared-types so web,
 * native, and backend integrations cannot drift.
 */

export {
  narrowApiSettings as narrowToApiSettings,
  settingsFromApi as mapSettingsFromApi,
  settingsToApi as mapSettingsToApi,
} from '@cgraph-dev/shared-types';
