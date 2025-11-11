'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/useToast';
import { MaintenanceOrder } from '@/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  isPast,
  isToday as isTodayDate,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Clock,
  Wrench,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Pause,
  Filter,
  Eye,
  Calendar as CalendarIcon,
  ExternalLink,
  Plus,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CalendarPage() {
  const router = useRouter();
  const { error: showError, success } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const isOverdue = (order: MaintenanceOrder) => {
    if (!order.scheduled_date || order.status === 'completed' || order.status === 'cancelled')
      return false;
    const scheduled = parseISO(order.scheduled_date);
    return isPast(scheduled) && !isTodayDate(scheduled);
  };

  // Calcular estatísticas
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    overdue: orders.filter(isOverdue).length,
  };

  useEffect(() => {
    loadOrders();
  }, [currentDate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        }/maintenance/calendar/events?start_date=${start}&end_date=${end}&include_demo=true`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar calendário');
      }

      setOrders(result.data || []);
    } catch (err) {
      showError('Erro ao carregar calendário');
    } finally {
      setLoading(false);
    }
  };


  // Calcular primeiro e último dia da semana do mês para exibir dias vazios
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getOrdersForDay = (day: Date) => {
    let dayOrders = orders.filter(order => {
      if (!order.scheduled_date) return false;
      return isSameDay(parseISO(order.scheduled_date), day);
    });

    // Aplicar filtro de status
    if (statusFilter !== 'all') {
      dayOrders = dayOrders.filter(order => order.status === statusFilter);
    }

    return dayOrders;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        color: 'bg-yellow-500',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        icon: Clock,
        label: 'Pendente',
      },
      in_progress: {
        color: 'bg-blue-500',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        icon: Wrench,
        label: 'Em Execução',
      },
      paused: {
        color: 'bg-orange-500',
        borderColor: 'border-orange-500/30',
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        icon: Pause,
        label: 'Pausada',
      },
      completed: {
        color: 'bg-green-500',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-400',
        bgColor: 'bg-green-500/10',
        icon: CheckCircle2,
        label: 'Concluída',
      },
      cancelled: {
        color: 'bg-red-500',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
        icon: XCircle,
        label: 'Cancelada',
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
              Calendário de Manutenções
            </h1>
            <p className="text-slate-400">
              Visualize todas as manutenções preventivas agendadas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToToday}
              className="flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Hoje
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/plans')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Plano
            </Button>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-lg border border-slate-700 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 rounded-lg border border-yellow-500/20 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 rounded-lg border border-blue-500/20 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Em Execução</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 rounded-lg border border-green-500/20 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Concluídas</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`bg-slate-800/50 rounded-lg border p-4 ${
              stats.overdue > 0 ? 'border-red-500/30 ring-2 ring-red-500/20' : 'border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${stats.overdue > 0 ? 'text-red-400' : 'text-slate-500'}`} />
              <span className="text-xs text-slate-400">Atrasadas</span>
            </div>
            <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-400' : 'text-slate-500'}`}>
              {stats.overdue}
            </p>
          </motion.div>
        </div>

        {/* Filtros e Estatísticas */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'pending', 'in_progress', 'completed'].map(status => {
                  const config =
                    status === 'all'
                      ? { color: 'bg-slate-600', label: 'Todos', icon: CalendarIcon }
                      : getStatusConfig(status);
                  const Icon = status === 'all' ? CalendarIcon : config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === status
                          ? `${config.color} text-white shadow-lg`
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {status === 'all' ? 'Todos' : config.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="text-slate-400">
                <span className="text-white font-semibold">{filteredOrders.length}</span> manutenções
                {statusFilter !== 'all' && (
                  <span className="text-slate-500"> ({getStatusConfig(statusFilter).label})</span>
                )}
              </div>
              {stats.overdue > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.overdue} atrasada(s)
                </span>
              )}
            </div>
          </div>

          {/* Legenda de Status */}
          <div className="flex items-center gap-6 flex-wrap pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Legenda:</span>
            </div>
            {Object.entries({
              pending: 'Pendente',
              in_progress: 'Em Execução',
              paused: 'Pausada',
              completed: 'Concluída',
              cancelled: 'Cancelada',
            }).map(([status, label]) => {
              const config = getStatusConfig(status);
              const Icon = config.icon;
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <Icon className={`w-3 h-3 ${config.textColor}`} />
                  <span className="text-xs text-slate-300">{label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 ml-auto">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-xs text-slate-300">Atrasada</span>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth('prev')}
              title="Mês anterior"
            >
              Anterior
            </Button>
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              {!isTodayDate(currentDate) && (
                <button
                  onClick={goToToday}
                  className="ml-2 px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full hover:bg-green-500/30 transition-colors"
                >
                  Ir para hoje
                </button>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth('next')}
              title="Próximo mês"
            >
              Próximo
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week Days Header */}
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-slate-400 py-3 border-b border-slate-700"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayOrders = getOrdersForDay(day);
              const isToday = isTodayDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const overdueOrders = dayOrders.filter(isOverdue);
              const dayKey = format(day, 'yyyy-MM-dd');
              const isExpanded = expandedDays.has(dayKey);
              const maxVisible = isExpanded ? dayOrders.length : 3;
              const visibleOrders = dayOrders.slice(0, maxVisible);
              const remainingCount = dayOrders.length - maxVisible;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`min-h-[120px] p-2 border-2 rounded-xl transition-all ${
                    isToday
                      ? 'bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20'
                      : isCurrentMonth
                      ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-900/30 border-slate-800 opacity-50'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`text-sm font-bold ${
                        isToday
                          ? 'text-green-400'
                          : isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    {overdueOrders.length > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" title={`${overdueOrders.length} atrasada(s)`} />
                        {overdueOrders.length > 1 && (
                          <span className="text-xs text-red-400 font-semibold">{overdueOrders.length}</span>
                        )}
                      </div>
                    )}
                    {dayOrders.length > 0 && !isToday && (
                      <span className="text-xs text-slate-500 font-medium">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {visibleOrders.map(order => {
                      const config = getStatusConfig(order.status);
                      const isOverdueOrder = isOverdue(order);
                      return (
                        <motion.button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all border group ${
                            isOverdueOrder
                              ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                              : `${config.bgColor} ${config.borderColor} ${config.textColor} hover:opacity-90`
                          }`}
                          title={`${order.equipment_code} - ${order.plan_name || order.description || 'Manutenção Preventiva'}`}
                        >
                          <div className="flex items-center gap-1">
                            {(() => {
                              const Icon = config.icon;
                              return <Icon className={`w-3 h-3 flex-shrink-0 ${isOverdueOrder ? 'text-red-400' : config.textColor}`} />;
                            })()}
                            <span className="truncate font-semibold font-mono">{order.equipment_code}</span>
                            {isOverdueOrder && (
                              <AlertTriangle className="w-2.5 h-2.5 text-red-400 flex-shrink-0 ml-auto" />
                            )}
                          </div>
                          {order.plan_name && (
                            <div className="text-[10px] truncate mt-0.5 opacity-80">
                              {order.plan_name.substring(0, 18)}
                              {order.plan_name.length > 18 ? '...' : ''}
                            </div>
                          )}
                          {order.assigned_to_name && (
                            <div className="text-[9px] opacity-70 mt-0.5 truncate">
                              👤 {order.assigned_to_name}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                    {remainingCount > 0 && (
                      <motion.button
                        onClick={() => {
                          setExpandedDays(prev => {
                            const newSet = new Set(prev);
                            newSet.add(dayKey);
                            return newSet;
                          });
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-xs text-blue-400 px-2 py-1 text-center bg-blue-500/10 hover:bg-blue-500/20 rounded border border-blue-500/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        +{remainingCount} mais
                      </motion.button>
                    )}
                    {isExpanded && remainingCount === 0 && dayOrders.length > 3 && (
                      <motion.button
                        onClick={() => {
                          setExpandedDays(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(dayKey);
                            return newSet;
                          });
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-xs text-slate-400 px-2 py-1 text-center bg-slate-900/50 hover:bg-slate-900/70 rounded border border-slate-700 transition-colors"
                      >
                        Mostrar menos
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected Order Details Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-6 h-6 text-blue-400" />
                      <h3 className="text-2xl font-bold text-white">
                        OS #{selectedOrder.id}
                      </h3>
                      {isOverdue(selectedOrder) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Atrasada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="font-mono text-green-400">{selectedOrder.equipment_code}</span>
                      <span>•</span>
                      <span>{selectedOrder.equipment_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                    title="Fechar"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedOrder.plan_name && (
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-400">Plano Preventivo</span>
                      </div>
                      <p className="text-white font-semibold">{selectedOrder.plan_name}</p>
                    </div>
                  )}

                  {selectedOrder.scheduled_date && (
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-slate-400">Data Agendada</span>
                      </div>
                      <p className="text-white font-semibold">
                        {format(parseISO(selectedOrder.scheduled_date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      {isOverdue(selectedOrder) && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Atrasada
                        </p>
                      )}
                    </div>
                  )}

                  {selectedOrder.assigned_to_name && (
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-slate-400">Técnico Responsável</span>
                      </div>
                      <p className="text-white font-semibold">
                        {selectedOrder.assigned_to_full_name || selectedOrder.assigned_to_name}
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-slate-400">Status</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const config = getStatusConfig(selectedOrder.status);
                        const Icon = config.icon;
                        return (
                          <>
                            <div
                              className={`px-4 py-2 rounded-lg ${config.bgColor} ${config.borderColor} border flex items-center gap-2`}
                            >
                              <Icon className={`w-4 h-4 ${config.textColor}`} />
                              <span className={`font-semibold ${config.textColor}`}>
                                {config.label}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {selectedOrder.description && (
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-400">Descrição</span>
                      </div>
                      <p className="text-white">{selectedOrder.description}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <Button
                      onClick={() => {
                        router.push(`/maintenance/${selectedOrder.id}`);
                        setSelectedOrder(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes Completos
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedOrder(null)}
                      className="px-4"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
