'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, postData, putData } from '@/lib/api';
import { PreventivePlan, MaintenanceOrder } from '@/types';
import Button from '@/components/ui/Button';
import { 
  Edit,
  Power,
  PowerOff,
  Calendar,
  Wrench,
  CheckCircle,
  Clock,
  Play,
  Eye,
  AlertCircle,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [plan, setPlan] = useState<PreventivePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const [expandedSections, setExpandedSections] = useState<{
    instructions: boolean;
    tools: boolean;
    materials: boolean;
    safety: boolean;
  }>({
    instructions: false,
    tools: false,
    materials: false,
    safety: false,
  });

  const canEdit = hasRole(['admin', 'manager']);
  const canExecute = hasRole(['admin', 'manager', 'technician']);
  const planId = params?.id as string;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (planId) {
      loadPlan();
    }
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await fetchData<PreventivePlan>(`/plans/${planId}`);
      setPlan(data);
    } catch (err) {
      showError('Erro ao carregar plano');
      router.push('/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!plan) return;
    try {
      await postData(`/plans/${planId}/toggle`, {});
      success(`Plano ${plan.is_active === 1 ? 'desativado' : 'ativado'} com sucesso`);
      loadPlan();
    } catch (err) {
      showError('Erro ao alterar status do plano');
    }
  };

  const handleGenerateOrder = async () => {
    try {
      await postData(`/plans/${planId}/generate-order`, {});
      success('Ordem de serviço gerada com sucesso');
      loadPlan();
    } catch (err) {
      showError('Erro ao gerar ordem de serviço');
    }
  };

  const handleStartOrder = async (orderId: number) => {
    try {
      console.log('▶️ [DEBUG] Iniciando execução da OS #' + orderId);
      const result = await putData(`/maintenance/${orderId}`, { status: 'in_progress' });
      console.log('✅ [DEBUG] Execução iniciada com sucesso:', result);
      success('Execução iniciada');
      loadPlan();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao iniciar execução:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar execução';
      showError(errorMessage);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      console.log('🔄 [DEBUG] Concluindo OS #' + orderId);
      await postData(`/maintenance/${orderId}/complete`, {});
      console.log('✅ [DEBUG] OS concluída com sucesso');
      success('Ordem de serviço concluída com sucesso!');
      loadPlan();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao concluir OS:', err);
      showError('Erro ao concluir ordem de serviço');
    }
  };

  const getFrequencyLabel = (type: string, value: number) => {
    const labels = {
      days: `A cada ${value} dia(s)`,
      weeks: `A cada ${value} semana(s)`,
      months: `A cada ${value} mês(es)`,
      hours: `A cada ${value} hora(s)`,
      cycles: `A cada ${value} ciclo(s)`,
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      paused: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!plan) return null;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
                {plan.name}
              </h1>
              <p className="text-slate-400">
                {plan.equipment_code} - {plan.equipment_name}
              </p>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleToggle}
                className="flex items-center gap-2"
              >
                {plan.is_active === 1 ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Ativar
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/plans/${planId}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              plan.is_active === 1
                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
            }`}
          >
            {plan.is_active === 1 ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800">
          <div className="flex gap-4">
            {[
              { id: 'info', label: 'Informações', icon: Wrench },
              { id: 'orders', label: 'Ordens de Serviço', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Cards de Estatísticas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Target className="w-5 h-5" />}
                  label="Total de OS"
                  value={(plan.total_orders || 0).toString()}
                  color="blue"
                />
                <StatCard
                  icon={<CheckCircle className="w-5 h-5" />}
                  label="Concluídas"
                  value={(plan.completed_orders || 0).toString()}
                  color="green"
                />
                <StatCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Pendentes"
                  value={(plan.pending_orders || 0).toString()}
                  color="yellow"
                />
                <StatCard
                  icon={<AlertCircle className="w-5 h-5" />}
                  label="Atrasadas"
                  value={(plan.overdue_orders || 0).toString()}
                  color="red"
                  highlight={plan.overdue_orders && plan.overdue_orders > 0}
                />
              </div>

              {/* Grid Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-400" />
                    Informações do Plano
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Nome" value={plan.name} />
                    <InfoRow label="Equipamento" value={`${plan.equipment_code} - ${plan.equipment_name}`} />
                    <InfoRow label="Frequência" value={getFrequencyLabel(plan.frequency_type, plan.frequency_value)} />
                    <InfoRow 
                      label="Data de Início" 
                      value={format(new Date(plan.start_date), 'dd/MM/yyyy', { locale: ptBR })} 
                    />
                    {plan.end_date && (
                      <InfoRow 
                        label="Data de Término" 
                        value={format(new Date(plan.end_date), 'dd/MM/yyyy', { locale: ptBR })} 
                      />
                    )}
                    {plan.estimated_duration && (
                      <InfoRow 
                        label="Duração Estimada" 
                        value={
                          plan.estimated_duration >= 60
                            ? `${Math.floor(plan.estimated_duration / 60)}h ${plan.estimated_duration % 60}min (${plan.estimated_duration} min)`
                            : `${plan.estimated_duration} minutos`
                        }
                      />
                    )}
                    {plan.assigned_to_name && (
                      <InfoRow label="Técnico Responsável" value={plan.assigned_to_name} />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Performance e Métricas
                  </h3>
                  <div className="space-y-3">
                    {plan.total_orders && plan.total_orders > 0 ? (
                      <>
                        <InfoRow 
                          label="Taxa de Conclusão" 
                          value={`${Math.round(((plan.completed_orders || 0) / plan.total_orders) * 100)}%`} 
                        />
                        {plan.compliance_rate !== null && plan.compliance_rate !== undefined && (
                          <InfoRow 
                            label="Taxa de Conformidade" 
                            value={
                              <span className={plan.compliance_rate >= 90 ? 'text-green-400' : plan.compliance_rate >= 70 ? 'text-yellow-400' : 'text-red-400'}>
                                {plan.compliance_rate}%
                              </span>
                            }
                          />
                        )}
                        {plan.avg_execution_time !== null && plan.avg_execution_time !== undefined && (
                          <InfoRow 
                            label="Tempo Médio de Execução" 
                            value={
                              plan.avg_execution_time >= 60
                                ? `${Math.floor(plan.avg_execution_time / 60)}h ${plan.avg_execution_time % 60}min`
                                : `${plan.avg_execution_time} min`
                            }
                          />
                        )}
                        {plan.last_completed_date && (
                          <InfoRow 
                            label="Última OS Concluída" 
                            value={format(new Date(plan.last_completed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })} 
                          />
                        )}
                        {plan.next_scheduled_date && (
                          <InfoRow 
                            label="Próxima OS Agendada" 
                            value={format(new Date(plan.next_scheduled_date), 'dd/MM/yyyy', { locale: ptBR })} 
                          />
                        )}
                        {plan.in_progress_orders && plan.in_progress_orders > 0 && (
                          <InfoRow 
                            label="Em Execução" 
                            value={<span className="text-blue-400">{plan.in_progress_orders}</span>} 
                          />
                        )}
                      </>
                    ) : (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-sm text-center">
                          Nenhuma ordem de serviço gerada ainda
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instruções e Recursos - Layout Compacto */}
              <div className="space-y-3">
                {/* Instruções de Manutenção */}
                {plan.instructions && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <button
                      onClick={() => toggleSection('instructions')}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Instruções de Manutenção
                        </h3>
                      </div>
                      {expandedSections.instructions ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {expandedSections.instructions && (
                      <div className="px-4 pb-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm max-h-[600px] overflow-y-auto">
                            {plan.instructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recursos Necessários - Grid Compacto */}
                {(plan.tools_required || plan.materials_required || plan.safety_procedures) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {plan.tools_required && (
                      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <button
                          onClick={() => toggleSection('tools')}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-750 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-blue-400" />
                            <h4 className="text-sm font-semibold text-white">Ferramentas</h4>
                          </div>
                          {expandedSections.tools ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        {expandedSections.tools && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                              {plan.tools_required}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {plan.materials_required && (
                      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <button
                          onClick={() => toggleSection('materials')}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-750 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-400" />
                            <h4 className="text-sm font-semibold text-white">Materiais</h4>
                          </div>
                          {expandedSections.materials ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        {expandedSections.materials && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                              {plan.materials_required}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {plan.safety_procedures && (
                      <div className="bg-red-900/20 rounded-lg border border-red-500/30 overflow-hidden">
                        <button
                          onClick={() => toggleSection('safety')}
                          className="w-full flex items-center justify-between p-3 hover:bg-red-900/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <h4 className="text-sm font-semibold text-white">Segurança</h4>
                          </div>
                          {expandedSections.safety ? (
                            <ChevronUp className="w-4 h-4 text-red-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-400" />
                          )}
                        </button>
                        {expandedSections.safety && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-red-200 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                              {plan.safety_procedures}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Ordens de Serviço Geradas</h3>
                {canEdit && plan.is_active === 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateOrder}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Gerar OS
                  </Button>
                )}
              </div>

              {plan.orders && plan.orders.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {plan.orders.map((order: MaintenanceOrder, index: number) => {
                    const statusConfig = {
                      pending: {
                        border: 'border-yellow-500/20',
                        badgeBg: 'bg-yellow-500/10',
                        badgeText: 'text-yellow-400',
                        badgeBorder: 'border-yellow-500/30'
                      },
                      in_progress: {
                        border: 'border-blue-500/20',
                        badgeBg: 'bg-blue-500/10',
                        badgeText: 'text-blue-400',
                        badgeBorder: 'border-blue-500/30'
                      },
                      paused: {
                        border: 'border-orange-500/20',
                        badgeBg: 'bg-orange-500/10',
                        badgeText: 'text-orange-400',
                        badgeBorder: 'border-orange-500/30'
                      },
                      completed: {
                        border: 'border-green-500/20',
                        badgeBg: 'bg-green-500/10',
                        badgeText: 'text-green-400',
                        badgeBorder: 'border-green-500/30'
                      },
                      cancelled: {
                        border: 'border-red-500/20',
                        badgeBg: 'bg-red-500/10',
                        badgeText: 'text-red-400',
                        badgeBorder: 'border-red-500/30'
                      },
                    };
                    
                    const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                    const statusLabels: Record<string, string> = {
                      pending: 'Pendente',
                      in_progress: 'Em Execução',
                      paused: 'Pausada',
                      completed: 'Concluída',
                      cancelled: 'Cancelada',
                    };

                    return (
                      <div
                        key={order.id}
                        className={`
                          rounded-lg border 
                          bg-slate-800/50
                          ${config.border}
                          hover:border-opacity-40
                          transition-all duration-200
                        `}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            {/* Conteúdo principal */}
                            <div className="flex-1 min-w-0">
                              {/* Header com OS e Status */}
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h4 className="text-lg font-semibold text-white">
                                  OS #{order.id}
                                </h4>
                                {order.status && (
                                  <span className={`
                                    inline-flex items-center px-2.5 py-1 rounded-full 
                                    text-xs font-medium border
                                    ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}
                                  `}>
                                    {statusLabels[order.status] || order.status}
                                  </span>
                                )}
                              </div>

                              {/* Descrição */}
                              {order.description && (
                                <p className="text-slate-300 text-sm mb-3">
                                  {order.description}
                                </p>
                              )}

                              {/* Instruções */}
                              {order.instructions && (
                                <div className="mb-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                    <p className="text-xs font-medium text-slate-400 uppercase">
                                      Instruções
                                    </p>
                                  </div>
                                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {order.instructions}
                                  </p>
                                </div>
                              )}

                              {/* Informações adicionais */}
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                {order.scheduled_date && (
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                      {format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                                    </span>
                                  </div>
                                )}
                                {order.assigned_to_name && (
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>{order.assigned_to_name}</span>
                                  </div>
                                )}
                                {order.completed_date && (
                                  <div className="flex items-center gap-1.5 text-green-400">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>
                                      {format(new Date(order.completed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </span>
                                  </div>
                                )}
                                {order.execution_time && (
                                  <div className="flex items-center gap-1.5 text-blue-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{order.execution_time} min</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Botões de ação */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {canExecute && order.status === 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleStartOrder(order.id);
                                  }}
                                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400 border border-blue-500/20"
                                  title="Iniciar Execução"
                                  type="button"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              
                              {canExecute && (order.status === 'pending' || order.status === 'in_progress' || order.status === 'paused') && (
                                <button
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja marcar esta OS como concluída?')) {
                                      handleCompleteOrder(order.id);
                                    }
                                  }}
                                  className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors text-green-400 border border-green-500/20"
                                  title="Concluir OS"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => router.push(`/maintenance/${order.id}`)}
                                className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 border border-slate-600"
                                title="Ver Detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  Nenhuma ordem de serviço gerada ainda
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-800">
      <span className="text-slate-400">{label}:</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color = 'blue',
  highlight = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color?: 'blue' | 'green' | 'yellow' | 'red';
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: 'border-blue-500/20 bg-blue-500/10',
    green: 'border-green-500/20 bg-green-500/10',
    yellow: 'border-yellow-500/20 bg-yellow-500/10',
    red: 'border-red-500/20 bg-red-500/10',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  return (
    <div className={`
      p-4 rounded-lg border
      ${colorClasses[color]}
      ${highlight ? 'ring-2 ring-red-500/50' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${iconColorClasses[color]}`}>{value}</p>
        </div>
        <div className={iconColorClasses[color]}>
          {icon}
        </div>
      </div>
    </div>
  );
}

