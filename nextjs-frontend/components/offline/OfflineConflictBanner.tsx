'use client';

import { AlertTriangle, CloudUpload, Download } from 'lucide-react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { OfflineConflict } from '@/lib/offline/offlineManager';

interface OfflineConflictBannerProps {
  conflict: OfflineConflict;
  onApplyOffline: () => Promise<void> | void;
  onAcceptServer: () => Promise<void> | void;
  isProcessing?: boolean;
  className?: string;
}

export default function OfflineConflictBanner({
  conflict,
  onApplyOffline,
  onAcceptServer,
  isProcessing,
  className,
}: OfflineConflictBannerProps) {
  const targetLabel = conflict.referenceType === 'maintenance_call' ? 'Chamado' : 'Ordem de Serviço';
  const updatedAt = conflict.serverData?.updated_at || conflict.serverData?.updatedAt;

  return (
    <div
      className={clsx(
        'rounded-xl border-2 border-rose-500/40 bg-rose-950/40 text-rose-100 px-4 py-4 flex flex-col gap-3 shadow-lg shadow-rose-500/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-200">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-rose-100">Conflito detectado</h3>
          <p className="text-sm text-rose-200/80 mt-1">
            As alterações feitas offline para este {targetLabel.toLowerCase()} não puderam ser sincronizadas porque ele foi atualizado por outra pessoa.
            Escolha uma das opções abaixo para seguir.
          </p>
          {updatedAt && (
            <p className="text-xs text-rose-200/70 mt-1">
              Versão mais recente do servidor: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-100">
            <CloudUpload className="w-4 h-4" /> Aplicar minhas alterações offline
          </div>
          <p className="text-xs text-rose-200/70 mt-2">
            Reenvia suas alterações e sobrescreve a versão atual do servidor. Use com cuidado para não perder dados atualizados por outros usuários.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 bg-rose-500/30 hover:bg-rose-500/40 text-rose-50"
            onClick={onApplyOffline}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Sobrescrever com minhas alterações'}
          </Button>
        </div>

        <div className="rounded-lg border border-slate-500/30 bg-slate-800/40 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Download className="w-4 h-4" /> Manter versão do servidor
          </div>
          <p className="text-xs text-slate-300/80 mt-2">
            Descarta suas alterações offline e atualiza o painel com a versão mais recente já sincronizada pelo servidor.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 border border-slate-500/40 text-slate-100 hover:bg-slate-700/60"
            onClick={onAcceptServer}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Descartar e atualizar dados'}
          </Button>
        </div>
      </div>
    </div>
  );
}
