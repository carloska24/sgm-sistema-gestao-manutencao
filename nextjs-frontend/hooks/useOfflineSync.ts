import { useEffect } from 'react';
import { initializeSyncListener, processSyncQueue } from '@/lib/offline/offlineManager';

export function useOfflineSync(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    initializeSyncListener();
    processSyncQueue();
  }, [enabled]);
}
