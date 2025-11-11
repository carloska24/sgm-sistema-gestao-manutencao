'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, deleteData } from '@/lib/api';
import { Equipment } from '@/types';
import Button from '@/components/ui/Button';
import { 
  Edit, 
  Trash2, 
  Calendar,
  Wrench,
  FileText,
  Download,
  Upload,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  ExternalLink,
  Copy,
  MoreVertical,
  Activity,
  TrendingUp,
  Zap,
  MapPin,
  Building2,
  Package,
  Gauge,
  Battery,
  Fuel,
  Ruler,
  Calendar as CalendarIcon,
  DollarSign,
  History,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Hash
} from 'lucide-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import UploadDocuments from '@/components/equipment/UploadDocuments';

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'documents'>('info');
  const [showUpload, setShowUpload] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [maintenanceStats, setMaintenanceStats] = useState({
    totalCalls: 0,
    totalPreventives: 0,
    openCalls: 0,
    pendingPreventives: 0,
  });

  const canEdit = hasRole(['admin', 'manager']);
  const canCreate = hasRole(['admin', 'manager', 'requester']);
  const equipmentId = params?.id as string;

  useEffect(() => {
    if (equipmentId) {
      loadEquipment();
    }
  }, [equipmentId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const data = await fetchData<Equipment>(`/equipment/${equipmentId}`);
      setEquipment(data);
      
      // Carregar estatísticas de manutenção
      try {
        const [callsData, preventivesData] = await Promise.all([
          fetchData<any[]>(`/calls?equipment_id=${equipmentId}&limit=1000`),
          fetchData<any[]>(`/maintenance?equipment_id=${equipmentId}&limit=1000`),
        ]);
        
        setMaintenanceStats({
          totalCalls: callsData?.length || 0,
          totalPreventives: preventivesData?.length || 0,
          openCalls: callsData?.filter((c: any) => !['completed', 'cancelled'].includes(c.status)).length || 0,
          pendingPreventives: preventivesData?.filter((p: any) => p.status === 'pending').length || 0,
        });
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
      }
    } catch (err) {
      showError('Erro ao carregar equipamento');
      router.push('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (equipment?.code) {
      navigator.clipboard.writeText(equipment.code);
      success('Código copiado para a área de transferência');
    }
  };

  const handleOpenCall = () => {
    router.push(`/calls/new?equipment_id=${equipmentId}`);
  };

  const handleCreatePreventivePlan = () => {
    router.push(`/plans/new?equipment_id=${equipmentId}`);
  };

  const handleDelete = async () => {
    if (!equipment || !confirm(`Tem certeza que deseja deletar o equipamento "${equipment.name}"?`)) {
      return;
    }

    try {
      await deleteData(`/equipment/${equipmentId}`);
      success('Equipamento deletado com sucesso');
      router.push('/equipment');
    } catch (err) {
      showError('Erro ao deletar equipamento');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20', // #22c55e - Sucesso
      inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20', // #64748b - Desabilitado
      maintenance: 'bg-amber-500/10 text-amber-500 border-amber-500/20', // #f59e0b - Aviso
      deactivated: 'bg-red-500/10 text-red-500 border-red-500/20', // #ef4444 - Erro
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getCriticalityColor = (criticality: string) => {
    const colors = {
      low: 'bg-slate-700/50 text-slate-300 border-slate-600/50', // Cinza sutil para Baixa
      medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30', // Âmbar sutil para Média
      high: 'bg-orange-600/15 text-orange-400 border-orange-600/30', // Laranja escuro sutil para Alta (menos chamativo que vermelho)
    };
    return colors[criticality as keyof typeof colors] || colors.medium;
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

  if (!equipment) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pt-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 relative pb-2">
          <div className="flex items-start gap-4 flex-1">
            <Button
              variant="secondary"
              onClick={() => router.back()}
            >
              Voltar
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white font-poppins">
                  {equipment.name}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Código:</span>
                  <button
                    onClick={handleCopyCode}
                    className="font-mono text-green-400 hover:text-green-300 transition-colors flex items-center gap-1.5 group"
                    title="Clique para copiar"
                  >
                    <span>{equipment.code}</span>
                    <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
                {equipment.description && (
                  <span className="text-slate-500">•</span>
                )}
                {equipment.description && (
                  <span className="text-slate-400 text-sm line-clamp-1">
                    {equipment.description.length > 60 
                      ? `${equipment.description.substring(0, 60)}...`
                      : equipment.description
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            {/* Menu de Ações Rápidas */}
            <div className="relative z-30">
              <Button
                variant="primary"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-2 relative z-30"
              >
                <Plus className="w-4 h-4" />
                Ações
                <MoreVertical className="w-4 h-4" />
              </Button>
              <AnimatePresence>
                {showActionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowActionsMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-3 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="py-1">
                      {canCreate && (
                        <>
                          <button
                            onClick={() => {
                              handleOpenCall();
                              setShowActionsMenu(false);
                            }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors flex items-center gap-3 group"
                          >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium text-sm">Abrir Chamado</div>
                                <div className="text-xs text-slate-400 mt-0.5">Criar chamado de manutenção corretiva</div>
                            </div>
                          </button>
                            <div className="h-px bg-slate-700/50 mx-2 my-1" />
                          <button
                            onClick={() => {
                              handleCreatePreventivePlan();
                              setShowActionsMenu(false);
                            }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors flex items-center gap-3 group"
                          >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <Calendar className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium text-sm">Criar Plano Preventivo</div>
                                <div className="text-xs text-slate-400 mt-0.5">Definir plano de manutenção preventiva</div>
                            </div>
                          </button>
                            {canEdit && <div className="h-px bg-slate-700/50 mx-2 my-1" />}
                        </>
                      )}
                      {canEdit && (
                        <>
                          <button
                            onClick={() => {
                              router.push(`/equipment/${equipmentId}/edit`);
                              setShowActionsMenu(false);
                            }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors flex items-center gap-3 group"
                          >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                                <Edit className="w-4 h-4 text-yellow-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium text-sm">Editar Equipamento</div>
                                <div className="text-xs text-slate-400 mt-0.5">Modificar informações do equipamento</div>
                            </div>
                          </button>
                            <div className="h-px bg-slate-700/50 mx-2 my-1" />
                          <button
                            onClick={() => {
                              handleDelete();
                              setShowActionsMenu(false);
                            }}
                              className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 group"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-red-400">Deletar Equipamento</div>
                                <div className="text-xs text-slate-500 mt-0.5">Remover equipamento do sistema</div>
                            </div>
                          </button>
                        </>
                      )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Status Badges e Estatísticas Rápidas */}
        <div className="flex items-center gap-4 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(equipment.status)}`}
          >
            {equipment.status === 'active' && (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Ativo</span>
              </>
            )}
            {equipment.status === 'inactive' && (
              <>
                <Clock className="w-4 h-4" />
                <span>Inativo</span>
              </>
            )}
            {equipment.status === 'maintenance' && (
              <>
                <Wrench className="w-4 h-4" />
                <span>Em Manutenção</span>
              </>
            )}
            {equipment.status === 'deactivated' && (
              <>
                <X className="w-4 h-4" />
                <span>Desativado</span>
              </>
            )}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getCriticalityColor(equipment.criticality)}`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>
              Criticidade: {equipment.criticality === 'low' && 'Baixa'}
              {equipment.criticality === 'medium' && 'Média'}
              {equipment.criticality === 'high' && 'Alta'}
            </span>
          </span>
          {maintenanceStats.openCalls > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="w-4 h-4" />
              <span>{maintenanceStats.openCalls} chamado(s) aberto(s)</span>
            </span>
          )}
          {maintenanceStats.pendingPreventives > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Clock className="w-4 h-4" />
              <span>{maintenanceStats.pendingPreventives} preventiva(s) pendente(s)</span>
            </span>
          )}
        </div>

        {/* Tabs com Contadores */}
        <div className="border-b border-slate-800">
          <div className="flex gap-4">
            {[
              { 
                id: 'info', 
                label: 'Informações', 
                icon: Wrench,
                count: null
              },
              { 
                id: 'history', 
                label: 'Histórico', 
                icon: History,
                count: (equipment.maintenanceHistory?.length || 0) + maintenanceStats.totalCalls
              },
              { 
                id: 'documents', 
                label: 'Documentos', 
                icon: FileText,
                count: equipment.documents?.length || 0
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Cards de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
                  </div>
                  <div className="space-y-1">
                    <InfoRow 
                      label="Nome" 
                      value={equipment.name}
                      icon={<Package className="w-5 h-5 text-blue-400" />}
                    />
                    <InfoRow 
                      label="Código" 
                      value={
                        <button
                          onClick={handleCopyCode}
                          className="font-mono text-green-400 hover:text-green-300 transition-colors flex items-center gap-1.5 group/btn"
                        >
                          <span>{equipment.code}</span>
                          <Copy className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </button>
                      }
                      icon={<FileText className="w-5 h-5 text-green-400" />}
                    />
                    <InfoRow 
                      label="Descrição" 
                      value={equipment.description ? (
                        <div className="max-w-md text-left">
                          <p className="text-white break-words">
                            {equipment.description.length > 200 
                              ? `${equipment.description.substring(0, 200)}...`
                              : equipment.description
                            }
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Não informado</span>
                      )}
                      icon={<FileText className="w-5 h-5 text-purple-400" />}
                    />
                    <InfoRow 
                      label="Modelo" 
                      value={equipment.model || <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Gauge className="w-5 h-5 text-cyan-400" />}
                    />
                    <InfoRow 
                      label="Fabricante" 
                      value={equipment.manufacturer || <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Building2 className="w-5 h-5 text-orange-400" />}
                    />
                    <InfoRow 
                      label="Número de Série" 
                      value={equipment.serial_number || <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Hash className="w-5 h-5 text-indigo-400" />}
                    />
                  </div>
                </div>

                {/* Localização e Status */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Localização e Status</h3>
                  </div>
                  <div className="space-y-1">
                    <InfoRow 
                      label="Localização" 
                      value={equipment.location || <span className="text-slate-500 italic">Não informado</span>}
                      icon={<MapPin className="w-5 h-5 text-red-400" />}
                    />
                    <InfoRow 
                      label="Data de Aquisição" 
                      value={equipment.acquisition_date 
                        ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <CalendarIcon className="w-4 h-4 text-blue-400" />
                            <span>{format(new Date(equipment.acquisition_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )
                        : <span className="text-slate-500 italic">Não informado</span>
                      }
                      icon={<CalendarIcon className="w-5 h-5 text-blue-400" />}
                    />
                    <InfoRow 
                      label="Custo de Aquisição" 
                      value={equipment.acquisition_cost 
                        ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-semibold">
                              R$ {equipment.acquisition_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )
                        : <span className="text-slate-500 italic">Não informado</span>
                      }
                      icon={<DollarSign className="w-5 h-5 text-green-400" />}
                    />
                  </div>
                </div>

                {/* Características Técnicas */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Gauge className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Características Técnicas</h3>
                  </div>
                  <div className="space-y-1">
                    <InfoRow 
                      label="Potência" 
                      value={equipment.power ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span>{equipment.power}</span>
                        </div>
                      ) : <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Zap className="w-5 h-5 text-yellow-400" />}
                    />
                    <InfoRow 
                      label="Capacidade" 
                      value={equipment.capacity || <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Battery className="w-5 h-5 text-cyan-400" />}
                    />
                    <InfoRow 
                      label="Voltagem" 
                      value={equipment.voltage ? (
                        <span className="font-mono">{equipment.voltage}</span>
                      ) : <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Zap className="w-5 h-5 text-blue-400" />}
                    />
                    <InfoRow 
                      label="Tipo de Combustível" 
                      value={equipment.fuel_type || <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Fuel className="w-5 h-5 text-orange-400" />}
                    />
                    <InfoRow 
                      label="Dimensões" 
                      value={equipment.dimensions || <span className="text-slate-500 italic">Não informado</span>}
                      icon={<Ruler className="w-5 h-5 text-purple-400" />}
                    />
                  </div>
                </div>

                {/* Informações de Manutenção */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">Informações de Manutenção</h3>
                  </div>
                  <div className="space-y-1">
                    <InfoRow 
                      label="Última Preventiva" 
                      value={equipment.last_preventive_date 
                        ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>{format(new Date(equipment.last_preventive_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )
                        : <span className="text-slate-500 italic">Nenhuma registrada</span>
                      }
                      icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                    />
                    <InfoRow 
                      label="Última Corretiva" 
                      value={equipment.last_corrective_date 
                        ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span>{format(new Date(equipment.last_corrective_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )
                        : <span className="text-slate-500 italic">Nenhuma registrada</span>
                      }
                      icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                    />
                    <InfoRow 
                      label="Próxima Preventiva" 
                      value={equipment.next_preventive_date 
                        ? (() => {
                            const nextDate = new Date(equipment.next_preventive_date);
                            const daysUntil = differenceInDays(nextDate, new Date());
                            const isOverdue = isPast(nextDate);
                            const isSoon = daysUntil <= 7 && daysUntil >= 0;
                            
                            return (
                              <div className="flex items-center gap-2 justify-end">
                                <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-400' : isSoon ? 'text-yellow-400' : 'text-blue-400'}`} />
                                <span className={isOverdue ? 'text-red-400 font-semibold' : isSoon ? 'text-yellow-400' : ''}>
                                  {format(nextDate, 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                                {isOverdue && (
                                  <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                                    Atrasada
                                  </span>
                                )}
                                {isSoon && !isOverdue && (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                                    Em breve
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        : <span className="text-slate-500 italic">Não agendada</span>
                      }
                      icon={<Calendar className="w-5 h-5 text-blue-400" />}
                    />
                    <InfoRow 
                      label={
                        <div className="flex items-center gap-1.5">
                          <span>MTBF</span>
                          <div className="group/help relative">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/help:block z-10 w-64 p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 shadow-xl">
                              <strong>Mean Time Between Failures:</strong> Tempo médio entre falhas consecutivas do equipamento.
                            </div>
                          </div>
                        </div>
                      }
                      value={equipment.mtbf 
                        ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="font-semibold">{equipment.mtbf.toFixed(2)} horas</span>
                          </div>
                        )
                        : <span className="text-slate-500 italic">Não calculado</span>
                      }
                      icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
                    />
                    <InfoRow 
                      label={
                        <div className="flex items-center gap-1.5">
                          <span>MTTR</span>
                          <div className="group/help relative">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/help:block z-10 w-64 p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 shadow-xl">
                              <strong>Mean Time To Repair:</strong> Tempo médio de reparo após uma falha.
                            </div>
                          </div>
                        </div>
                      }
                      value={equipment.mttr 
                        ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span className="font-semibold">{equipment.mttr.toFixed(2)} horas</span>
                          </div>
                        )
                        : <span className="text-slate-500 italic">Não calculado</span>
                      }
                      icon={<Clock className="w-5 h-5 text-orange-400" />}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Histórico de Manutenções</h3>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>Total: <span className="text-white font-semibold">{maintenanceStats.totalCalls + maintenanceStats.totalPreventives}</span></span>
                  {maintenanceStats.openCalls > 0 && (
                    <span className="text-red-400">• {maintenanceStats.openCalls} aberto(s)</span>
                  )}
                </div>
              </div>
              
              {equipment.maintenanceHistory && equipment.maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {equipment.maintenanceHistory.map((maintenance: any) => {
                    const isPreventive = maintenance.maintenance_type === 'preventive' || maintenance.type === 'preventive';
                    const statusColors = {
                      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                      in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
                      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
                      open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      assigned: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                      execution: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                    };
                    
                    const handleClick = () => {
                      if (isPreventive) {
                        router.push(`/maintenance/${maintenance.id}`);
                      } else {
                        router.push(`/calls/${maintenance.id}`);
                      }
                    };
                    
                    return (
                      <motion.div
                        key={maintenance.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                        onClick={handleClick}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {isPreventive ? (
                                <Calendar className="w-4 h-4 text-blue-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                              <p className="text-white font-medium">
                                {isPreventive ? 'Manutenção Preventiva' : 'Chamado Corretivo'}
                              </p>
                              {maintenance.scheduled_date && (
                                <span className="text-xs text-slate-500">
                                  • {format(new Date(maintenance.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-300 mb-2">
                              {maintenance.description || 'Sem descrição'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              {maintenance.completed_date && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                  <span>Concluída em {format(new Date(maintenance.completed_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                </div>
                              )}
                              {maintenance.execution_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {maintenance.execution_time >= 60 
                                      ? `${Math.floor(maintenance.execution_time / 60)}h ${maintenance.execution_time % 60}min`
                                      : `${maintenance.execution_time} min`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[maintenance.status as keyof typeof statusColors] || 'bg-slate-700 text-slate-300'}`}>
                              {maintenance.status === 'pending' && 'Pendente'}
                              {maintenance.status === 'in_progress' && 'Em Execução'}
                              {maintenance.status === 'paused' && 'Pausada'}
                              {maintenance.status === 'completed' && 'Concluída'}
                              {maintenance.status === 'cancelled' && 'Cancelada'}
                              {maintenance.status === 'open' && 'Aberto'}
                              {maintenance.status === 'assigned' && 'Atribuído'}
                              {maintenance.status === 'execution' && 'Em Execução'}
                            </span>
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                  <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Nenhum histórico de manutenção encontrado</p>
                  <p className="text-sm text-slate-500 mb-4">
                    As manutenções realizadas neste equipamento aparecerão aqui
                  </p>
                  {canCreate && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCreatePreventivePlan}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Plano Preventivo
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Documentos</h3>
                {canEdit && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {showUpload ? 'Cancelar' : 'Enviar Documento'}
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showUpload && canEdit && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-5 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="w-5 h-5 text-blue-400" />
                      <h4 className="text-white font-medium">Enviar Novo Documento</h4>
                    </div>
                    <UploadDocuments
                      equipmentId={parseInt(equipmentId)}
                      onUploadComplete={() => {
                        setShowUpload(false);
                        loadEquipment();
                        success('Documento enviado com sucesso');
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {equipment.documents && equipment.documents.length > 0 ? (
                <div className="space-y-3">
                  {equipment.documents.map((doc) => {
                    const fileExtension = doc.file_name.split('.').pop()?.toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                    const isPdf = fileExtension === 'pdf';
                    
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isImage ? 'bg-blue-500/20' : isPdf ? 'bg-red-500/20' : 'bg-slate-700'
                          }`}>
                            {isImage ? (
                              <FileText className="w-5 h-5 text-blue-400" />
                            ) : isPdf ? (
                              <FileText className="w-5 h-5 text-red-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{doc.file_name}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                              <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                              {doc.uploaded_by_name && (
                                <>
                                  <span>•</span>
                                  <span>Enviado por {doc.uploaded_by_name}</span>
                                </>
                              )}
                              {doc.created_at && (
                                <>
                                  <span>•</span>
                                  <span>{format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/equipment/${equipmentId}/documents/${doc.id}/download`;
                              window.open(url, '_blank');
                            }}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-blue-400" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Tem certeza que deseja deletar "${doc.file_name}"?`)) {
                                  try {
                                    await deleteData(`/equipment/${equipmentId}/documents/${doc.id}`);
                                    success('Documento deletado com sucesso');
                                    loadEquipment();
                                  } catch (err) {
                                    showError('Erro ao deletar documento');
                                  }
                                }
                              }}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Nenhum documento anexado</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Envie manuais, esquemas, fotos ou outros documentos relacionados a este equipamento
                  </p>
                  {canEdit && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowUpload(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Upload className="w-4 h-4" />
                      Enviar Primeiro Documento
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function InfoRow({ 
  label, 
  value, 
  icon 
}: { 
  label: string | React.ReactNode; 
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group py-3 px-3 rounded-lg hover:bg-slate-800/30 transition-colors border-b border-slate-700/30 last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Ícone - Grande e Colorido */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || <Info className="w-5 h-5 text-slate-500" />}
        </div>
        
        {/* Label e Valor */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            {/* Label com estilo destacado */}
            <div className="flex-shrink-0 min-w-[140px]">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {typeof label === 'string' ? label : label}
              </div>
            </div>
            
            {/* Valor com destaque */}
            <div className="flex-1 text-right min-w-0">
              <div className="text-sm font-medium text-white">
                {typeof value === 'string' ? <span>{value}</span> : value}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

