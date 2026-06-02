'use client';

import { useEffect, type RefObject } from 'react';

interface UsePopoverDismissOptions {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onDismiss: () => void;
}

export function usePopoverDismiss({
  containerRef,
  enabled,
  onDismiss,
}: UsePopoverDismissOptions) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const onPointerDown = (event: MouseEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(event.target instanceof Node ? event.target : null)) {
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
