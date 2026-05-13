type CustomizationChangeNotifier = () => void;

let notifyCustomizationChange: CustomizationChangeNotifier | null = null;

/**
 * Registers the callback used to fan out profile customization updates.
 */
export function registerCustomizationChangeNotifier(
  notifier: CustomizationChangeNotifier
): () => void {
  notifyCustomizationChange = notifier;

  return () => {
    if (notifyCustomizationChange === notifier) {
      notifyCustomizationChange = null;
    }
  };
}

/**
 * Notifies the current listener that customization state changed elsewhere.
 */
export function notifyCustomizationChanged(): void {
  notifyCustomizationChange?.();
}
