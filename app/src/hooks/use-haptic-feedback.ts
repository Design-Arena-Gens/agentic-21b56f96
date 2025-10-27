'use client';

import { useCallback } from 'react';

export function useHapticFeedback(enabled: boolean) {
  return useCallback(() => {
    if (!enabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(18);
    }
  }, [enabled]);
}
