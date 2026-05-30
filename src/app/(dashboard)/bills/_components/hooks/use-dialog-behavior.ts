'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface UseDialogBehaviorOptions {
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  enabled?: boolean;
}

/**
 * Wires the standard modal dialog behaviours onto a container element:
 *   - locks body scroll while open
 *   - focuses the first focusable inside the container on open
 *   - closes on Escape (event.stopPropagation so nested handlers don't fire)
 *   - traps Tab / Shift-Tab inside the container
 *   - restores focus to the previously-focused element on close
 *
 * Pass `enabled: false` when the dialog markup stays mounted but is logically
 * closed; the hook is a no-op until it flips true.
 */
export function useDialogBehavior({
  containerRef,
  onClose,
  enabled = true,
}: UseDialogBehaviorOptions) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const { activeElement } = document;
    const previouslyFocused = activeElement instanceof HTMLElement ? activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const containerNode = containerRef.current;
    if (containerNode) {
      const focusables = containerNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const target = focusables[0] ?? containerNode;
      target.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerNode) {
        return;
      }
      const focusables = Array.from(
        containerNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusables.length === 0) {
        event.preventDefault();
        containerNode.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus?.();
    };
  }, [containerRef, enabled, onClose]);
}
