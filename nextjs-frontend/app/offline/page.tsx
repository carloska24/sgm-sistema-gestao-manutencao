'use client';

import Button from '@/components/ui/Button';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <WifiOff className="w-16 h-16 text-green-400" />
          <h1 className="text-2xl font-bold text-white">Você está offline</h1>
          <p className="text-slate-400">
            Não foi possível se conectar ao servidor. Algumas informações podem não estar atualizadas. Assim que a conexão retornar, suas atividades serão sincronizadas.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="primary" className="w-full">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
