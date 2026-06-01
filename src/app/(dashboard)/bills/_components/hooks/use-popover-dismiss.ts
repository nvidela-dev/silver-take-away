'use client';

import { useEffect, type RefObject } from 'react';

interface UsePopoverDismissOptions {
  containerRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
  enabled: boolean;
}

export function usePopoverDismiss({
  containerRef,
  onDismiss,
  enabled,
}: UsePopoverDismissOptions) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const onPointerDown = (event: MouseEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(event.target as Node)) {
        onDismiss();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [containerRef, enabled, onDismiss]);
}
