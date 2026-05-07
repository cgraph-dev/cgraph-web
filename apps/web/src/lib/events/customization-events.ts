export const CUSTOMIZATION_CHANGED_EVENT = 'cgraph:customization-changed';

export function dispatchCustomizationChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(CUSTOMIZATION_CHANGED_EVENT));
}
