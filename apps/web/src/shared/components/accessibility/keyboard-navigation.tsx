import { useEffect } from 'react';

/** Global keyboard navigation: Escape closes modals, Alt+1-9 for sidebar, Alt+M/S for focus. */
export function useKeyboardNavigation(): void {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleEscapeKey(event);
      return;
    }

    if (event.altKey && /^[1-9]$/.test(event.key)) {
      handleQuickNav(event);
      return;
    }

    if (event.altKey && event.key === 'm') {
      event.preventDefault();
      focusMessageInput();
      return;
    }

    if (event.altKey && event.key === 's') {
      event.preventDefault();
      focusSidebar();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

function handleEscapeKey(event: KeyboardEvent): void {
  const modals = document.querySelectorAll('[role="dialog"][open], [aria-modal="true"]');
  if (modals.length > 0) {
    const lastModal = modals[modals.length - 1]!;
    const closeButton = lastModal.querySelector<HTMLButtonElement>(
      'button[data-close], [aria-label="Close"], [aria-label="Close dialog"]'
    );
    if (closeButton) {
      event.preventDefault();
      closeButton.click();
    }
  }
}

function handleQuickNav(event: KeyboardEvent): void {
  const index = parseInt(event.key, 10) - 1;
  const navLinks = document.querySelectorAll<HTMLAnchorElement>(
    'nav[role="navigation"] a[href]'
  );
  if (navLinks[index]) {
    event.preventDefault();
    navLinks[index].click();
    navLinks[index].focus();
  }
}

function focusMessageInput(): void {
  const input = document.querySelector<HTMLElement>(
    '[data-testid="message-input"], textarea[placeholder*="message" i], input[placeholder*="message" i]'
  );
  input?.focus();
}

function focusSidebar(): void {
  const sidebar = document.querySelector<HTMLElement>(
    'aside[role="navigation"], nav[aria-label="Primary"], [data-testid="sidebar"]'
  );
  const firstLink = sidebar?.querySelector<HTMLAnchorElement>('a[href]');
  firstLink?.focus();
}

/** Arrow-key list navigation within a scrollable container. */
export function useListNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  itemSelector: string = '[role="listitem"], [data-message-id]'
): void {
  function handleKeyDown(event: KeyboardEvent) {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(itemSelector)
    );
    if (items.length === 0) return;

    const activeEl = document.activeElement;
    const currentIndex = activeEl instanceof HTMLElement ? items.indexOf(activeEl) : -1;

    if (event.key === 'ArrowDown' || event.key === 'j') {
      event.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]!.focus();
      items[nextIndex]!.scrollIntoView({ block: 'nearest' });
    }

    if (event.key === 'ArrowUp' || event.key === 'k') {
      event.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]!.focus();
      items[prevIndex]!.scrollIntoView({ block: 'nearest' });
    }

    if (event.key === 'Enter' && currentIndex >= 0) {
      const clickable = items[currentIndex]!.querySelector<HTMLElement>(
        'button, a, [role="button"]'
      );
      clickable?.click();
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  });
}
