'use client';

import clsx from 'clsx';
import { WifiOff, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { useOfflineQueueStatus } from '@/hooks/useOfflineQueueStatus';

interface OfflineQueueIndicatorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export default function OfflineQueueIndicator({ className, variant = 'default' }: OfflineQueueIndicatorProps) {
  const { isOnline, queueLength, isSyncing, conflictCount } = useOfflineQueueStatus();

  if (isOnline && queueLength === 0 && conflictCount === 0) {
    return null;
  }

  let icon = <Send className="w-4 h-4" />;
  let title = 'Fila offline aguardando envio';
  let description =
    queueLength > 0 ? `${queueLength} ação(ões) aguardando sincronização` : 'Dados prontos para envio';
  let style = 'bg-amber-500/10 border-amber-500/30 text-amber-200';

  if (conflictCount > 0) {
    icon = <AlertTriangle className="w-4 h-4" />;
    title = 'Conflito de versões detectado';
    description =
      conflictCount === 1
        ? '1 item exige sua atenção para resolver conflito.'
        : `${conflictCount} itens exigem sua atenção para resolver conflito.`;
    style = 'bg-rose-500/10 border-rose-500/40 text-rose-200';
  } else if (!isOnline) {
    icon = <WifiOff className="w-4 h-4" />;
    title = 'Você está offline';
    description =
      queueLength > 0
        ? `${queueLength} ação(ões) serão enviadas automaticamente quando a conexão voltar`
        : 'Suas ações serão registradas e sincronizadas automaticamente quando houver conexão';
    style = 'bg-red-500/10 border-red-500/40 text-red-200';
  } else if (isSyncing) {
    icon = <RefreshCw className="w-4 h-4 animate-spin" />;
    title = 'Sincronizando dados';
    description = queueLength > 0 ? `${queueLength} item(ns) restantes na fila` : 'Finalizando sincronização offline';
    style = 'bg-blue-500/10 border-blue-500/30 text-blue-200';
  }

  const isCompact = variant === 'compact';

  const highlightText =
    conflictCount > 0 || (!isOnline && queueLength > 0) ? 'font-semibold' : isCompact ? 'font-semibold' : 'text-base';

  return (
    <div
      className={clsx(
        'rounded-xl border flex items-start gap-3 transition-colors shadow-sm shadow-black/10 backdrop-blur',
        isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
        style,
        className
      )}
    >
      <div className={clsx('mt-0.5 flex-shrink-0', isCompact ? 'w-4 h-4' : 'w-5 h-5')}>{icon}</div>
      <div>
        <p className={clsx('leading-tight', highlightText)}>{title}</p>
        <p className={clsx('opacity-80 mt-1', isCompact ? '' : 'text-xs')}>{description}</p>
      </div>
    </div>
  );
}
