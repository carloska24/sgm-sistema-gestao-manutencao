'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import {
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  Download,
  Filter,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  id?: number;
  code?: string;
  name?: string;
  plan_name?: string;
  equipment_name?: string;
  equipment_code?: string;
  total_scheduled?: number;
  completed?: number;
  on_time?: number;
  late?: number;
  overdue?: number;
  compliance_rate?: number;
  on_time_rate?: number;
  total_calls?: number;
  avg_mttr?: number;
  mtbf?: number;
  mtbf_hours?: number;
  corrective_count?: number;
  preventive_count?: number;
  corrective_cost?: number;
  preventive_cost?: number;
  total_cost?: number;
  calls_completed?: number;
  preventives_completed?: number;
  avg_call_time?: number;
  avg_call_time_hours?: number;
  avg_preventive_time_hours?: number;
  total_call_time_hours?: number;
  total_preventive_time_hours?: number;
  total_completed?: number;
  total_hours?: number;
  efficiency?: number;
  period?: string;
  total?: number;
  open?: number;
  urgent?: number;
  high?: number;
  medium?: number;
  low?: number;
  criticality?: string;
  open_calls?: number;
  completed_calls?: number;
  username?: string;
  full_name?: string;
}

export default function ReportsPage() {
  const { error: showError } = useToast();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData[]>([]);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    equipment_id: '',
  });

  const reports = [
    {
      id: 'compliance',
      name: 'Conformidade de Manutenções',
      icon: TrendingUp,
      description: 'Taxa de conformidade das manutenções preventivas',
    },
    {
      id: 'mtbf-mttr',
      name: 'MTBF e MTTR',
      icon: TrendingUp,
      description: 'Tempo médio entre falhas e tempo médio de reparo',
    },
    {
      id: 'costs',
      name: 'Custos de Manutenção',
      icon: DollarSign,
      description: 'Análise de custos por equipamento',
    },
    {
      id: 'technicians-performance',
      name: 'Performance de Técnicos',
      icon: Users,
      description: 'Estatísticas de desempenho dos técnicos',
    },
    {
      id: 'calls-by-period',
      name: 'Chamados por Período',
      icon: FileText,
      description: 'Análise temporal de chamados',
    },
    {
      id: 'critical-equipment',
      name: 'Equipamentos Críticos',
      icon: AlertCircle,
      description: 'Equipamentos com mais chamados',
    },
  ];

  const loadReport = async (reportId: string) => {
    setLoading(true);
    setActiveReport(reportId);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.equipment_id) params.append('equipment_id', filters.equipment_id);
      // Sempre incluir dados demo nos relatórios
      params.append('include_demo', 'true');

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        }/reports/${reportId}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar relatório');
      }

      setData(result.data || []);
    } catch (err) {
      showError('Erro ao carregar relatório');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTechniciansPerformance = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando relatório...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            Nenhum dado de performance encontrado para o período selecionado
          </p>
        </div>
      );
    }

    // Calcular totais para comparação
    const totals = data.reduce(
      (acc, row) => ({
        total_completed: (acc.total_completed || 0) + (row.total_completed || 0),
        calls_completed: (acc.calls_completed || 0) + (row.calls_completed || 0),
        preventives_completed: (acc.preventives_completed || 0) + (row.preventives_completed || 0),
        total_hours: (acc.total_hours || 0) + (row.total_hours || 0),
      }),
      { total_completed: 0, calls_completed: 0, preventives_completed: 0, total_hours: 0 }
    );

    const formatHours = (hours: number) => {
      if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes} min`;
      }
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    const formatTime = (hours: number) => {
      if (hours === 0) return '-';
      if (hours < 0.5) {
        const minutes = Math.round(hours * 60);
        return `${minutes} min`;
      }
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      if (h === 0) return `${m} min`;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    return (
      <div className="space-y-6">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/30 p-4">
            <div className="text-sm text-slate-400 mb-1">Total de Técnicos</div>
            <div className="text-2xl font-bold text-blue-400">{data.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/30 p-4">
            <div className="text-sm text-slate-400 mb-1">Total de Tarefas</div>
            <div className="text-2xl font-bold text-green-400">{totals.total_completed}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/30 p-4">
            <div className="text-sm text-slate-400 mb-1">Total de Horas</div>
            <div className="text-2xl font-bold text-purple-400">
              {formatHours(totals.total_hours || 0)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-lg border border-yellow-500/30 p-4">
            <div className="text-sm text-slate-400 mb-1">Eficiência Média</div>
            <div className="text-2xl font-bold text-yellow-400">
              {(totals.total_hours || 0) > 0
                ? ((totals.total_completed || 0) / (totals.total_hours || 1)).toFixed(2)
                : '0'}{' '}
              tarefas/h
            </div>
          </div>
        </div>

        {/* Tabela de Performance */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Técnico
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">
                  Chamados
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">
                  Preventivas
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">
                  Tempo Médio Chamado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">
                  Tempo Médio Preventiva
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">
                  Horas Totais
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">
                  Eficiência
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.map((row, index) => {
                const efficiency =
                  (row.total_hours || 0) > 0
                    ? ((row.total_completed || 0) / (row.total_hours || 1)).toFixed(2)
                    : '0';

                return (
                  <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-white">
                          {row.full_name || row.username}
                        </div>
                        <div className="text-xs text-slate-400">@{row.username}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                        {row.calls_completed || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 font-semibold">
                        {row.preventives_completed || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-white text-lg">
                        {row.total_completed || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      {row.avg_call_time_hours !== undefined && row.avg_call_time_hours > 0
                        ? formatTime(row.avg_call_time_hours)
                        : (row.calls_completed || 0) > 0
                        ? '-'
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      {row.avg_preventive_time_hours !== undefined &&
                      row.avg_preventive_time_hours > 0
                        ? formatTime(row.avg_preventive_time_hours)
                        : (row.preventives_completed || 0) > 0
                        ? '-'
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300 font-medium">
                      {formatHours(row.total_hours || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          parseFloat(efficiency) >= 1
                            ? 'bg-green-500/20 text-green-400'
                            : parseFloat(efficiency) >= 0.5
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {efficiency} tarefas/h
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderComplianceReport = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando relatório...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            Nenhum dado de conformidade encontrado para o período selecionado
          </p>
        </div>
      );
    }

    // Calcular totais gerais
    const totals = data.reduce(
      (acc, row) => ({
        total_scheduled: (acc.total_scheduled || 0) + (row.total_scheduled || 0),
        completed: (acc.completed || 0) + (row.completed || 0),
        on_time: (acc.on_time || 0) + (row.on_time || 0),
        late: (acc.late || 0) + (row.late || 0),
        overdue: (acc.overdue || 0) + (row.overdue || 0),
      }),
      { total_scheduled: 0, completed: 0, on_time: 0, late: 0, overdue: 0 }
    );

    const overallCompliance =
      (totals.total_scheduled || 0) > 0
        ? Math.round(((totals.completed || 0) / (totals.total_scheduled || 1)) * 100 * 100) / 100
        : 0;

    const overallOnTimeRate =
      (totals.completed || 0) > 0
        ? Math.round(((totals.on_time || 0) / (totals.completed || 1)) * 100 * 100) / 100
        : 0;

    return (
      <div className="space-y-6">
        {/* Cards de Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{totals.total_scheduled || 0}</div>
            <div className="text-xs text-slate-400 mt-1">OS Agendadas</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-xs text-slate-400">Concluídas</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{totals.completed || 0}</div>
            <div className="text-xs text-slate-400 mt-1">
              {(totals.total_scheduled || 0) > 0
                ? `${Math.round(
                    ((totals.completed || 0) / (totals.total_scheduled || 1)) * 100
                  )}% do total`
                : '0% do total'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-400">No Prazo</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{totals.on_time || 0}</div>
            <div className="text-xs text-slate-400 mt-1">
              {(totals.completed || 0) > 0
                ? `${Math.round(
                    ((totals.on_time || 0) / (totals.completed || 1)) * 100
                  )}% das concluídas`
                : '0% das concluídas'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-slate-400">Atrasadas</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{totals.late || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Concluídas fora do prazo</div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-xs text-slate-400">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{totals.overdue || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Atrasadas pendentes</div>
          </div>
        </div>

        {/* Taxa Geral de Conformidade */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Visão Geral de Conformidade
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Taxa de Conformidade Geral</span>
                <span
                  className={`text-lg font-bold ${
                    overallCompliance >= 90
                      ? 'text-green-400'
                      : overallCompliance >= 70
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {overallCompliance.toFixed(2)}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    overallCompliance >= 90
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : overallCompliance >= 70
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(overallCompliance, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Taxa de Conclusão no Prazo</span>
                <span
                  className={`text-lg font-bold ${
                    overallOnTimeRate >= 90
                      ? 'text-green-400'
                      : overallOnTimeRate >= 70
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {overallOnTimeRate.toFixed(2)}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    overallOnTimeRate >= 90
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : overallOnTimeRate >= 70
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(overallOnTimeRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Conformidade */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                  Plano
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                  Equipamento
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                  Agendadas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                  Concluídas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                  No Prazo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                  Atrasadas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                  Pendentes
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                  Conformidade
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">
                  No Prazo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.map((row, index) => {
                const complianceRate = row.compliance_rate || 0;
                const onTimeRate = row.on_time_rate || 0;

                return (
                  <tr key={index} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-white">{row.plan_name || 'N/A'}</div>
                        {row.equipment_code && (
                          <div className="text-xs text-slate-400 mt-0.5">{row.equipment_code}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-300">{row.equipment_name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                        {row.total_scheduled || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-400 font-bold">
                        {row.completed || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        {row.on_time || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                          (row.late || 0) > 0
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-slate-700/50 text-slate-500'
                        }`}
                      >
                        {row.late || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                          (row.overdue || 0) > 0
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700/50 text-slate-500'
                        }`}
                      >
                        {row.overdue || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                complianceRate >= 90
                                  ? 'bg-green-500'
                                  : complianceRate >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(complianceRate, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-bold min-w-[50px] text-right ${
                              complianceRate >= 90
                                ? 'text-green-400'
                                : complianceRate >= 70
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {complianceRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                onTimeRate >= 90
                                  ? 'bg-green-500'
                                  : onTimeRate >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(onTimeRate, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-bold min-w-[50px] text-right ${
                              onTimeRate >= 90
                                ? 'text-green-400'
                                : onTimeRate >= 70
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {onTimeRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReportTable = () => {
    // Renderização específica para Performance de Técnicos
    if (activeReport === 'technicians-performance') {
      return renderTechniciansPerformance();
    }

    // Renderização específica para Conformidade de Manutenções
    if (activeReport === 'compliance') {
      return renderComplianceReport();
    }

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando relatório...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Selecione um relatório para visualizar</p>
        </div>
      );
    }

    const headers = Object.keys(data[0] || {}).filter(
      key => !key.includes('_id') && key !== 'id' && !key.includes('_minutes')
    );

    // Mapeamento de nomes em português
    const headerNames: { [key: string]: string } = {
      username: 'Usuário',
      full_name: 'Nome Completo',
      calls_completed: 'Chamados Concluídos',
      preventives_completed: 'Preventivas Concluídas',
      total_completed: 'Total Concluído',
      avg_call_time_hours: 'Tempo Médio Chamado (h)',
      avg_preventive_time_hours: 'Tempo Médio Preventiva (h)',
      total_call_time_hours: 'Tempo Total Chamados (h)',
      total_preventive_time_hours: 'Tempo Total Preventivas (h)',
      total_hours: 'Total de Horas',
      efficiency: 'Eficiência (tarefas/h)',
      plan_name: 'Plano',
      equipment_code: 'Código',
      equipment_name: 'Equipamento',
      total_scheduled: 'Total Agendadas',
      completed: 'Concluídas',
      on_time: 'No Prazo',
      late: 'Atrasadas (Fora do Prazo)',
      overdue: 'Pendentes Atrasadas',
      compliance_rate: 'Taxa de Conformidade (%)',
      on_time_rate: 'Taxa no Prazo (%)',
      code: 'Código',
      name: 'Nome',
      total_calls: 'Total de Chamados',
      avg_mttr: 'MTTR Médio (min)',
      mtbf_hours: 'MTBF (horas)',
      corrective_count: 'Corretivas',
      preventive_count: 'Preventivas',
      corrective_cost: 'Custo Corretivas (R$)',
      preventive_cost: 'Custo Preventivas (R$)',
      total_cost: 'Custo Total (R$)',
      period: 'Período',
      total: 'Total',
      open: 'Abertos',
      urgent: 'Urgentes',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
      criticality: 'Criticalidade',
      open_calls: 'Chamados Abertos',
      completed_calls: 'Chamados Concluídos',
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              {headers.map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase"
                >
                  {headerNames[header] ||
                    header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-slate-800/50">
                {headers.map(header => {
                  const value = row[header as keyof ReportData];
                  let displayValue = value;

                  if (typeof value === 'number') {
                    if (header.includes('rate') || header.includes('percent')) {
                      displayValue = `${value.toFixed(2)}%`;
                    } else if (header.includes('cost')) {
                      // Formatação monetária correta, tratando valores negativos
                      const absValue = Math.abs(value);
                      const formatted = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(absValue);
                      displayValue = value < 0 ? `-${formatted}` : formatted;
                    } else if (
                      header.includes('mttr') ||
                      (header.includes('time') && !header.includes('hours'))
                    ) {
                      // MTTR e tempos em minutos - tratar valores negativos
                      if (value < 0) {
                        displayValue = `⚠️ ${Math.abs(Math.round(value))} min (dado inválido)`;
                      } else if (value < 60) {
                        displayValue = `${Math.round(value)} min`;
                      } else {
                        const h = Math.floor(value / 60);
                        const m = Math.round(value % 60);
                        displayValue = m > 0 ? `${h}h ${m}min` : `${h}h`;
                      }
                    } else if (header.includes('hours') && header !== 'mtbf_hours') {
                      // Formatar horas de forma legível
                      if (value < 0) {
                        displayValue = `⚠️ ${Math.abs(value).toFixed(1)}h (dado inválido)`;
                      } else if (value < 1) {
                        const minutes = Math.round(value * 60);
                        displayValue = `${minutes} min`;
                      } else {
                        const h = Math.floor(value);
                        const m = Math.round((value - h) * 60);
                        displayValue = m > 0 ? `${h}h ${m}min` : `${h}h`;
                      }
                    } else if (header.includes('mtbf')) {
                      // MTBF - pode ser vazio ou em horas
                      if (value <= 0 || !value) {
                        displayValue = '-';
                      } else {
                        displayValue = `${value.toFixed(1)}h`;
                      }
                    } else {
                      displayValue = value.toString();
                    }
                  }

                  // Determinar cor contextual
                  let cellClass = 'text-slate-300';
                  let bgClass = '';

                  if (header.includes('criticality')) {
                    const critValue = String(value).toLowerCase();
                    if (critValue === 'high' || critValue === 'alta') {
                      cellClass = 'text-red-400 font-semibold';
                      bgClass = 'bg-red-500/10';
                    } else if (critValue === 'medium' || critValue === 'média') {
                      cellClass = 'text-yellow-400';
                      bgClass = 'bg-yellow-500/10';
                    } else {
                      cellClass = 'text-blue-400';
                      bgClass = 'bg-blue-500/10';
                    }
                  } else if (typeof value === 'number') {
                    if (header.includes('cost') && value < 0) {
                      cellClass = 'text-red-400 font-semibold';
                      bgClass = 'bg-red-500/10';
                    } else if (header.includes('mttr') && value < 0) {
                      cellClass = 'text-red-400 font-semibold';
                      bgClass = 'bg-red-500/10';
                    } else if (header.includes('rate') || header.includes('percent')) {
                      if (value >= 90) {
                        cellClass = 'text-green-400 font-semibold';
                        bgClass = 'bg-green-500/10';
                      } else if (value >= 70) {
                        cellClass = 'text-yellow-400';
                        bgClass = 'bg-yellow-500/10';
                      } else if (value < 70) {
                        cellClass = 'text-red-400';
                        bgClass = 'bg-red-500/10';
                      }
                    }
                  }

                  return (
                    <td
                      key={header}
                      className={`px-4 py-3 text-sm ${cellClass} ${bgClass} ${
                        bgClass ? 'rounded' : ''
                      }`}
                      title={
                        header.includes('mttr') && typeof value === 'number' && value < 0
                          ? 'Valor negativo indica dados inconsistentes. Verifique os dados de execução.'
                          : undefined
                      }
                    >
                      {displayValue?.toString() || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6 pt-4">
        {/* Header */}
        <div className="pb-2">
          <h1 className="text-3xl font-bold text-white mb-2 font-poppins">Relatórios</h1>
          <p className="text-slate-400">Análises e estatísticas gerenciais</p>
        </div>

        {/* Filtros */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-300">Filtros:</span>
            </div>
            <div className="flex-1 sm:flex-initial w-full sm:w-auto">
              <label className="block text-xs text-slate-400 mb-1">Data Início</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full sm:w-auto px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1 sm:flex-initial w-full sm:w-auto">
              <label className="block text-xs text-slate-400 mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full sm:w-auto px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="w-full sm:w-auto">
              <button
                onClick={() => {
                  setFilters({ start_date: '', end_date: '', equipment_id: '' });
                  setData([]);
                  setActiveReport(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, index) => {
            const Icon = report.icon;
            const isActive = activeReport === report.id;

            const getColorClasses = (idx: number, active: boolean) => {
              const colors = [
                {
                  bg: 'from-blue-500/20 to-blue-500/10',
                  border: 'border-blue-500/30',
                  text: 'text-blue-400',
                  iconBg: 'bg-blue-500/30',
                },
                {
                  bg: 'from-purple-500/20 to-purple-500/10',
                  border: 'border-purple-500/30',
                  text: 'text-purple-400',
                  iconBg: 'bg-purple-500/30',
                },
                {
                  bg: 'from-green-500/20 to-green-500/10',
                  border: 'border-green-500/30',
                  text: 'text-green-400',
                  iconBg: 'bg-green-500/30',
                },
                {
                  bg: 'from-yellow-500/20 to-yellow-500/10',
                  border: 'border-yellow-500/30',
                  text: 'text-yellow-400',
                  iconBg: 'bg-yellow-500/30',
                },
                {
                  bg: 'from-orange-500/20 to-orange-500/10',
                  border: 'border-orange-500/30',
                  text: 'text-orange-400',
                  iconBg: 'bg-orange-500/30',
                },
                {
                  bg: 'from-red-500/20 to-red-500/10',
                  border: 'border-red-500/30',
                  text: 'text-red-400',
                  iconBg: 'bg-red-500/30',
                },
              ];
              return colors[idx % colors.length];
            };

            const colors = getColorClasses(index, isActive);

            return (
              <motion.button
                key={report.id}
                onClick={() => loadReport(report.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 sm:p-5 rounded-xl border-2 transition-all text-left group w-full ${
                  isActive
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} shadow-lg`
                    : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`p-2 sm:p-3 rounded-xl transition-all flex-shrink-0 ${
                      isActive ? colors.iconBg : 'bg-slate-800 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                        isActive ? colors.text : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold mb-1 text-sm sm:text-base transition-colors ${
                        isActive ? colors.text : 'text-white group-hover:text-slate-200'
                      }`}
                    >
                      {report.name}
                    </h3>
                    <p
                      className={`text-xs transition-colors line-clamp-2 ${
                        isActive ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {report.description}
                    </p>
                    {isActive && data.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-slate-300">
                          {data.length} {data.length === 1 ? 'registro' : 'registros'}
                        </span>
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-green-400"
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Report Data */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {reports.find(r => r.id === activeReport)?.name || 'Selecione um relatório'}
            </h2>
            {data.length > 0 && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm transition-colors"
                onClick={() => {
                  // Exportação será implementada na próxima etapa
                  alert('Exportação será implementada em breve');
                }}
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            )}
          </div>

          {renderReportTable()}
        </div>
      </div>
    </MainLayout>
  );
}
