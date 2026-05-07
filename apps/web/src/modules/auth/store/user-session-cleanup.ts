import { useCreatorStore } from '@/modules/creator/store';
import { useNodesStore } from '@/modules/nodes/store/nodesStore';
import { usePremiumStore } from '@/modules/premium/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { useSettingsStore } from '@/modules/settings/store/settingsStore';
import { useThemeStore } from '@/stores/theme';

type Resetter = () => void;

const resetters: Resetter[] = [
  () => useCustomizationStore.getState().resetToDefaults(),
  () => useSettingsStore.getState().reset(),
  () => usePremiumStore.getState().reset(),
  () => useNodesStore.getState().reset(),
  () => useCreatorStore.getState().reset(),
  () => useThemeStore.getState().reset(),
];

export function resetUserScopedStores(): void {
  for (const reset of resetters) {
    try {
      reset();
    } catch {
      // Logout cleanup must continue even if a non-auth store is unavailable.
    }
  }
}
