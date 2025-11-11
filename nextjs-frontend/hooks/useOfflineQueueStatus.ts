'use client';

import { useEffect, useState } from 'react';
import { OfflineSyncState, subscribeOfflineSync, getOfflineSyncState } from '@/lib/offline/offlineManager';

const DEFAULT_STATE: OfflineSyncState = {
  isSyncing: false,
  queueLength: 0,
  conflictCount: 0,
  isOnline: true,
};

export function useOfflineQueueStatus() {
  const [state, setState] = useState<OfflineSyncState>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_STATE;
    }
    const initial = getOfflineSyncState();
    return {
      ...initial,
      isOnline: navigator.onLine,
    };
  });

  useEffect(() => {
    const unsubscribe = subscribeOfflineSync((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStatusChange = () => {
      setState((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
      }));
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return state;
}
