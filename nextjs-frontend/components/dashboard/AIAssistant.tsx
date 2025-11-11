'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Brain,
  MessageSquare,
  Send,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Wrench,
  Activity,
  RotateCcw, // Adicionando o ícone para limpar o chat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchData } from '@/lib/api';

interface MaintenanceTypeStats {
  preventive: number;
  corrective: number;
  predictive: number;
  emergency: number;
}

interface ChartData {
  status?: string;
  count?: number;
  date?: string;
  value?: number;
}

interface AIAssistantProps {
  stats: any;
  maintenanceTypes: MaintenanceTypeStats;
  callsByStatus: ChartData[];
  callsByPeriod: ChartData[];
  preventivesByStatus: ChartData[];
  equipmentByStatus: ChartData[];
  techniciansPerformance: any[];
  calls: any[];
  orders: any[];
  equipment: any[];
  onClose?: () => void;
}

export default function AIAssistant({
  stats,
  maintenanceTypes,
  callsByStatus,
  callsByPeriod,
  preventivesByStatus,
  equipmentByStatus,
  techniciansPerformance,
  calls,
  orders,
  equipment,
  onClose,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu assistente de IA para gestão de manutenção. Posso ajudar você a analisar dados, identificar problemas e sugerir melhorias. Como posso ajudar?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const initialMessages = useMemo(() => [
    {
      role: 'assistant' as const,
      content: 'Olá! Sou seu assistente de IA para gestão de manutenção. Posso ajudar você a analisar dados, identificar problemas e sugerir melhorias. Como posso ajudar?',
    },
  ], []);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleClearChat = () => {
    setMessages(initialMessages);
  };

  const insights = useMemo(() => {
    const totalEquipment = stats?.totalEquipment || 0;
    const activeEquipment = stats?.activeEquipment || 0;
    const inactiveEquipment = stats?.inactiveEquipment || 0;
    const openCalls = stats?.openCalls || 0;
    const inProgressCalls = stats?.inProgressCalls || 0;
    const pendingPreventives = stats?.pendingPreventives || 0;
    const overduePreventives = stats?.overduePreventives || 0;
    const complianceRate = stats?.complianceRate || 0;
    const avgMTBF = stats?.avgMTBF || 0;
    const avgMTTR = stats?.avgMTTR || 0;

    const equipmentAvailability =
      totalEquipment > 0 ? (activeEquipment / totalEquipment) * 100 : 0;

    const totalOrders = orders?.length || 0;
    const totalCalls = calls?.length || 0;
    const totalPreventives = orders?.filter((o) => o.type === 'preventive').length || 0;
    const totalCorrectives = calls?.filter((c) => c.type === 'corrective').length || 0;

    const maintenanceSummary = {
      preventive: maintenanceTypes?.preventive || 0,
      corrective: maintenanceTypes?.corrective || 0,
      predictive: maintenanceTypes?.predictive || 0,
      emergency: maintenanceTypes?.emergency || 0,
    };

    const topTechnician = [...(techniciansPerformance || [])]
      .sort((a, b) => (b.completed || 0) - (a.completed || 0))[0];

    const callTrend = (() => {
      if (!Array.isArray(callsByPeriod) || callsByPeriod.length < 2) return null;
      const sorted = [...callsByPeriod].sort(
        (a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime()
      );
      const first = sorted[0]?.count || 0;
      const last = sorted[sorted.length - 1]?.count || 0;
      if (last > first) {
        return {
          direction: 'up',
          variation: first === 0 ? 100 : ((last - first) / first) * 100,
          first,
          last,
        };
      }
      if (last < first) {
        return {
          direction: 'down',
          variation: first === 0 ? 0 : ((first - last) / first) * 100,
          first,
          last,
        };
      }
      return { direction: 'flat', variation: 0, first, last };
    })();

    const criticalAlerts: string[] = [];
    if (complianceRate < 80) {
      criticalAlerts.push('Taxa de conformidade abaixo de 80%');
    }
    if (overduePreventives > 0) {
      criticalAlerts.push(`${overduePreventives} preventiva(s) atrasada(s)`);
    }
    if (avgMTTR > 240) {
      criticalAlerts.push(`MTTR elevado (${(avgMTTR / 60).toFixed(1)}h)`);
    }
    if (openCalls > 10) {
      criticalAlerts.push(`${openCalls} chamados abertos`);
    }

    const equipmentByStatusMap = equipmentByStatus?.reduce<Record<string, number>>((acc, item) => {
      if (!item?.status) return acc;
      acc[item.status] = (acc[item.status] || 0) + (item.count || 0);
      return acc;
    }, {}) || {};

    const callsByStatusMap = callsByStatus?.reduce<Record<string, number>>((acc, item) => {
      if (!item?.status) return acc;
      acc[item.status] = (acc[item.status] || 0) + (item.count || 0);
      return acc;
    }, {}) || {};

    const preventivesStatusMap =
      preventivesByStatus?.reduce<Record<string, number>>((acc, item) => {
        if (!item?.status) return acc;
        acc[item.status] = (acc[item.status] || 0) + (item.count || 0);
        return acc;
      }, {}) || {};

    const latestCalls = [...(calls || [])]
      .sort(
        (a, b) =>
          new Date(b.created_at || b.createdAt || 0).getTime() -
          new Date(a.created_at || a.createdAt || 0).getTime()
      )
      .slice(0, 3);

    const latestOrders = [...(orders || [])]
      .sort(
        (a, b) =>
          new Date(b.scheduled_date || b.scheduledDate || 0).getTime() -
          new Date(a.scheduled_date || a.scheduledDate || 0).getTime()
      )
      .slice(0, 3);

    return {
      totalEquipment,
      activeEquipment,
      inactiveEquipment,
      openCalls,
      inProgressCalls,
      pendingPreventives,
      overduePreventives,
      complianceRate,
      avgMTBF,
      avgMTTR,
      equipmentAvailability,
      totalOrders,
      totalCalls,
      totalPreventives,
      totalCorrectives,
      maintenanceSummary,
      topTechnician,
      callTrend,
      criticalAlerts,
      equipmentByStatusMap,
      callsByStatusMap,
      preventivesStatusMap,
      latestCalls,
      latestOrders,
      totalEquipmentList: equipment || [],
    };
  }, [
    stats,
    maintenanceTypes,
    callsByStatus,
    callsByPeriod,
    preventivesByStatus,
    equipmentByStatus,
    techniciansPerformance,
    calls,
    orders,
    equipment,
  ]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const newMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/dashboard-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          context: insights, // Enviando todo o contexto de dados
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.details ? ` Detalhes: ${errorData.details}` : '';
        throw new Error(
          (errorData.error || 'A IA não conseguiu processar a solicitação.') + detail
        );
      }

      const result = await response.json();
      const assistantResponse = result.response || 'Não obtive uma resposta. Tente novamente.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantResponse }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${errorMessage}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-purple-500/50 transition-all"
      >
        <Brain className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Assistente IA</h3>
            <p className="text-xs text-slate-400">Análise inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-md"
            title="Limpar conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-md"
            title="Fechar assistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                  : 'bg-slate-700/50 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo..."
            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

