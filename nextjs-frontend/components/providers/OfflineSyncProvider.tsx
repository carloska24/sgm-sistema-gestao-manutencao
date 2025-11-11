'use client';

import { ReactNode } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

type OfflineSyncProviderProps = {
  enabled: boolean;
  children: ReactNode;
};

export function OfflineSyncProvider({ enabled, children }: OfflineSyncProviderProps) {
  useOfflineSync(enabled);
  return <>{children}</>;
}
