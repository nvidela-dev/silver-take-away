'use client';

import { toast } from 'sonner';

// App-wide notifications. A thin wrapper over sonner so every call site shares
// one entry point and the toast layer can be restyled or swapped in a single
// place. Errors intentionally stay inline (next to the form/dialog that raised
// them), so this only exposes success today — see the workspace hooks.
export const notify = {
  success(message: string): void {
    toast.success(message);
  },
};
