'use client';

import { useCallback, useEffect, useState } from 'react';
import { OfflineConflict, getConflictsForReference, subscribeOfflineSync } from '@/lib/offline/offlineManager';

export function useOfflineConflicts(referenceType: string, referenceId?: number | null) {
  const [conflicts, setConflicts] = useState<OfflineConflict[]>([]);

  const loadConflicts = useCallback(async () => {
    if (referenceId === undefined || referenceId === null) {
      setConflicts([]);
      return;
    }
    try {
      const data = await getConflictsForReference(referenceType, referenceId);
      setConflicts(data);
    } catch (error) {
      console.error('Erro ao carregar conflitos offline:', error);
    }
  }, [referenceType, referenceId]);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  useEffect(() => {
    const unsubscribe = subscribeOfflineSync(() => {
      loadConflicts();
    });
    return () => {
      unsubscribe?.();
    };
  }, [loadConflicts]);

  return conflicts;
}
