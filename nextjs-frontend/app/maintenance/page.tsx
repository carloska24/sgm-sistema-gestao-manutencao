'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, putData } from '@/lib/api';
import { MaintenanceOrder } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Search,
  Filter,
  Clock,
  User,
  Wrench,
  Calendar,
  FileCheck,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  BarChart3,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de ícone SVG animado para Ordens de Manutenção - Documento com Engrenagem
const AnimatedAIMaintenanceIcon = () => {
  return (
    <motion.div className="relative flex items-center justify-center w-full h-full">
      {/* Halos de brilho animados com cores roxas/azuis */}
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ 
          opacity: [0.2, 0.5, 0.3],
          scale: [0.6, 1.1, 0.8],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-500/15 blur-xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0.15, 0.4, 0.2],
          scale: [0.5, 0.95, 0.7],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      
      {/* SVG principal - Novo SVG fornecido */}
      <motion.svg
        id="fi_11134436"
        enableBackground="new 0 0 512 512"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        className="relative w-14 h-14"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: [0, 1.1, 1],
          rotate: [-180, 0],
        }}
        transition={{ 
          scale: { duration: 0.8, ease: 'easeOut' },
          rotate: { duration: 1, ease: 'easeOut' }
        }}
      >
        <defs>
          <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="256" x2="256" y1=".5" y2="511.5">
            <stop offset="0" stopColor="#17a6d7">
              <animate
                attributeName="stop-color"
                values="#17a6d7;#259adb;#3b87e2;#4380e4;#9735fd;#17a6d7"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset=".0617" stopColor="#259adb">
              <animate
                attributeName="stop-color"
                values="#259adb;#3b87e2;#4380e4;#9735fd;#17a6d7;#259adb"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset=".1856" stopColor="#3b87e2">
              <animate
                attributeName="stop-color"
                values="#3b87e2;#4380e4;#9735fd;#17a6d7;#259adb;#3b87e2"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset=".2649" stopColor="#4380e4">
              <animate
                attributeName="stop-color"
                values="#4380e4;#9735fd;#17a6d7;#259adb;#3b87e2;#4380e4"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="1" stopColor="#9735fd">
              <animate
                attributeName="stop-color"
                values="#9735fd;#17a6d7;#259adb;#3b87e2;#4380e4;#9735fd"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        <motion.path
          d="m351.546 403.461c-30.211-18.494-62.588-36.728-94.016-54.374v-11.03c.924-1.12 1.839-2.258 2.738-3.427 10.405-13.545 18.228-29.213 23.162-46.026 17.502-6.277 30.684-24.522 30.684-43.385 0-9.734-3.57-18.328-10.054-24.2-2.992-2.71-6.479-4.711-10.283-5.965.001-.002.002-.004.003-.006 6.956-17.166 10.909-34.473 10.909-49.613 0-57.857-49.533-104.925-110.414-104.925-60.891 0-110.424 47.068-110.424 104.925 0 15.14 3.972 32.445 10.928 49.62-3.905 1.292-7.473 3.378-10.509 6.193-6.326 5.865-9.809 14.378-9.809 23.971 0 18.862 13.18 37.105 30.68 43.383 4.931 16.813 12.75 32.48 23.15 46.025.957 1.246 1.932 2.458 2.918 3.648v10.73c-29.922 16.757-63.406 35.571-94.226 54.464-11.657 7.186-18.344 19.143-18.344 32.796v64.334c0 3.862 3.134 6.986 6.986 6.986h337.291c3.862 0 6.986-3.124 6.986-6.986v-64.334c-.002-13.671-6.689-25.628-18.356-32.804zm-62.499-175.261c2.105.639 4.002 1.704 5.631 3.179 3.52 3.189 5.46 8.104 5.46 13.841 0 9.329-5.14 18.91-12.553 25.057 1.302-8.045 1.972-16.259 1.972-24.548-.001-4.476-.062-10.839-.51-17.529zm-200.613 17.021c0-5.659 1.895-10.532 5.336-13.723 1.574-1.459 3.409-2.528 5.447-3.194-.202 6.451-.204 12.111-.203 16.452v.974c0 8.289.669 16.502 1.97 24.547-7.41-6.148-12.55-15.728-12.55-25.056zm24.632 4.311c4.238 6.351 8.854 12.422 13.779 18.075 2.365 2.715 6.397 3.184 9.322 1.098 16.867-12.017 36.958-18.364 58.106-18.364 21.159 0 41.259 6.347 58.127 18.364 1.228.878 2.645 1.298 4.052 1.298 1.956 0 3.902-.818 5.27-2.395 4.923-5.651 9.547-11.739 13.784-18.097-.761 28.315-10.024 55.391-26.321 76.607-15.781 20.544-35.796 32.326-54.913 32.326-19.115 0-39.125-11.782-54.898-32.324-16.285-21.211-25.543-48.279-26.308-76.588zm130.491 102.81v.837c0 27.127-22.077 49.194-49.204 49.194-27.107 0-49.164-22.067-49.164-49.194v-.673c15.135 12.84 32.251 19.912 49.082 19.912 16.905 0 34.099-7.131 49.286-20.076zm63.825 141.273h-226.217v-100.154c9.481-5.499 18.993-10.929 28.374-16.238v78.596c0 3.863 3.134 6.986 6.986 6.986h155.516c3.862 0 6.986-3.124 6.986-6.986v-78.576c9.491 5.38 18.973 10.789 28.354 16.238v100.134zm147.841-308.886c-2.166-1.098-4.75-.998-6.817.269-2.076 1.278-3.334 3.533-3.334 5.959v28.374c0 10.28-8.364 18.644-18.643 18.644-10.28 0-18.643-8.364-18.643-18.644v-28.374c0-2.425-1.268-4.681-3.334-5.959-2.076-1.268-4.651-1.367-6.827-.269-21.498 10.929-34.852 32.686-34.852 56.789 0 20.081 9.382 38.804 25.291 50.821v180.827c0 21.139 17.206 38.335 38.365 38.335 21.139 0 38.335-17.196 38.335-38.335v-180.828c15.919-12.007 25.321-30.73 25.321-50.821 0-24.102-13.354-45.86-34.862-56.788zm-21.807 233.723c0 3.852-3.124 6.986-6.986 6.986s-6.986-3.134-6.986-6.986v-57.517c0-3.863 3.124-6.997 6.986-6.997s6.986 3.134 6.986 6.997zm56.27-312.03-14.362-11.448c.12-1.866.18-3.743.15-5.649l14.961-10.679c2.595-1.856 3.603-5.22 2.465-8.194l-9.671-25.21c-1.148-2.964-4.152-4.801-7.306-4.442l-18.284 2.066c-1.238-1.407-2.525-2.775-3.863-4.082l3.024-18.115c.529-3.144-1.138-6.238-4.042-7.535l-24.701-11.009c-2.904-1.297-6.328-.459-8.304 2.026l-11.468 14.372c-1.876-.12-3.753-.17-5.609-.15l-10.679-14.94c-1.846-2.595-5.22-3.613-8.184-2.465l-25.241 9.671c-2.974 1.138-4.801 4.152-4.441 7.316l2.066 18.264c-1.417 1.238-2.775 2.535-4.082 3.872l-18.124-3.024c-3.144-.529-6.238 1.138-7.535 4.052l-10.979 24.672c-1.288 2.904-.459 6.318 2.036 8.304l14.352 11.448c-.12 1.866-.16 3.753-.14 5.649l-14.941 10.679c-2.595 1.846-3.603 5.22-2.465 8.194l9.681 25.2c1.138 2.974 4.142 4.8 7.306 4.441l18.244-2.066c1.248 1.427 2.545 2.805 3.872 4.102l-3.004 18.115c-.519 3.134 1.148 6.228 4.052 7.525l24.662 10.999c2.914 1.298 6.327.469 8.314-2.016l11.458-14.382c1.886.13 3.753.18 5.619.15l10.679 14.951c1.337 1.876 3.473 2.924 5.689 2.924.828 0 1.677-.15 2.495-.459l25.231-9.681c2.974-1.138 4.801-4.142 4.451-7.306l-2.066-18.254c1.397-1.237 2.765-2.535 4.082-3.892l18.115 3.034c3.144.519 6.248-1.148 7.535-4.052l10.979-24.672c1.297-2.905.458-6.318-2.027-8.304zm-51.729-.859c-6.218 13.973-19.991 22.296-34.393 22.296-5.11 0-10.3-1.048-15.26-3.253-18.943-8.434-27.506-30.71-19.073-49.653 8.463-18.933 30.73-27.466 49.653-19.043 9.182 4.082 16.218 11.498 19.821 20.869 3.604 9.382 3.344 19.602-.748 28.784z"
          fill="url(#SVGID_1_)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.9, 1, 0.95, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
    </motion.div>
  );
};

export default function MaintenanceOrdersPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Carregando...</p>
            </div>
          </div>
        </MainLayout>
      }
    >
      <MaintenanceOrdersPageContent />
    </Suspense>
  );
}

function MaintenanceOrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    segment: (searchParams.get('segment') as 'all' | 'planned' | 'reactive') || 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Estados para animação do título com letras caindo
  const titleText = 'Ordens de Manutenção';
  const [lettersVisible, setLettersVisible] = useState<boolean[]>([]);

  // Animação de letras caindo sequencialmente
  useEffect(() => {
    const letters = titleText.split('');
    setLettersVisible(new Array(letters.length).fill(false));
    
    letters.forEach((_, index) => {
      setTimeout(() => {
        setLettersVisible(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, index * 80); // Delay sequencial sem random
    });
  }, [titleText]);

  const isOverdue = (order: MaintenanceOrder) => {
    if (!order.scheduled_date || order.status === 'completed' || order.status === 'cancelled') return false;
    return isPast(new Date(order.scheduled_date)) && !isToday(new Date(order.scheduled_date));
  };

  const segmentOptions = [
    {
      value: 'all',
      label: 'Visão 360º',
      description: 'Monitore todas as ordens de manutenção em um único painel',
      icon: FileCheck,
    },
    {
      value: 'planned',
      label: 'Planejamento Preventivo',
      description: 'Pipeline de ordens preventivas e preditivas',
      icon: Shield,
    },
    {
      value: 'reactive',
      label: 'Intervenções Reativas',
      description: 'Ordens corretivas e emergenciais geradas via chamados',
      icon: Wrench,
    },
  ] as const;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadOrders();
  }, [search, filters.status, pagination.page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        include_demo: 'true',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/maintenance?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar ordens de manutenção');
      }

      setOrders(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      showError('Erro ao carregar ordens de manutenção');
    } finally {
      setLoading(false);
    }
  };

  const plannedOrders = useMemo(
    () =>
      orders
        .filter((order) => order.type === 'preventive' || order.type === 'predictive')
        .sort((a, b) => {
          const dateA = a.scheduled_date ? new Date(a.scheduled_date).getTime() : Number.MAX_SAFE_INTEGER;
          const dateB = b.scheduled_date ? new Date(b.scheduled_date).getTime() : Number.MAX_SAFE_INTEGER;
          return dateA - dateB;
        }),
    [orders]
  );

  const reactiveOrders = useMemo(
    () =>
      orders
        .filter((order) => order.type === 'corrective' || order.type === 'emergency')
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }),
    [orders]
  );

  const applyStatusFilter = (list: MaintenanceOrder[]) => {
    if (!filters.status) return list;
    return list.filter((order) => order.status === filters.status);
  };

  const plannedFiltered = useMemo(() => applyStatusFilter(plannedOrders), [plannedOrders, filters.status]);
  const reactiveFiltered = useMemo(() => applyStatusFilter(reactiveOrders), [reactiveOrders, filters.status]);

  const plannedStats = useMemo(() => {
    const total = plannedFiltered.length;
    const pending = plannedFiltered.filter((o) => o.status === 'pending').length;
    const inProgress = plannedFiltered.filter((o) => o.status === 'in_progress').length;
    const overdue = plannedFiltered.filter((o) => isOverdue(o)).length;
    const next7Days = plannedFiltered.filter((o) => {
      if (!o.scheduled_date) return false;
      const diff = differenceInDays(new Date(o.scheduled_date), new Date());
      return diff >= 0 && diff <= 7;
    }).length;

    return { total, pending, inProgress, overdue, next7Days };
  }, [plannedFiltered]);

  const reactiveStats = useMemo(() => {
    const total = reactiveFiltered.length;
    const awaiting = reactiveFiltered.filter((o) => o.status === 'pending').length;
    const executing = reactiveFiltered.filter((o) => o.status === 'in_progress').length;
    const completed = reactiveFiltered.filter((o) => o.status === 'completed').length;

    return { total, awaiting, executing, completed };
  }, [reactiveFiltered]);

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    pending: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
    in_progress: { label: 'Em Execução', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Play },
    paused: { label: 'Pausada', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Pause },
    completed: { label: 'Concluída', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle2 },
    cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status];
    if (!config) return <FileCheck className="w-4 h-4" />;
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getMaintenanceBadge = (order: MaintenanceOrder) => {
    const type = order.type;
    const config =
      type === 'preventive'
        ? { label: 'Preventiva', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Shield }
        : type === 'predictive'
        ? { label: 'Preditiva', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: TrendingUp }
        : type === 'emergency'
        ? { label: 'Emergencial', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle }
        : { label: 'Corretiva', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Wrench };

    const Icon = config.icon;
    return (
      <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1', config.color, config.bg, config.border)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const shouldShowPlanned = filters.segment === 'all' || filters.segment === 'planned';
  const shouldShowReactive = filters.segment === 'all' || filters.segment === 'reactive';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-full pb-20">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 p-8 border border-slate-700/50 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl w-20 h-20 flex items-center justify-center">
                  <AnimatedAIMaintenanceIcon />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white flex flex-wrap items-center gap-0.5">
                    {titleText.split('').map((letter, index) => {
                      return (
                        <motion.span
                          key={index}
                          initial={{ 
                            opacity: 0, 
                            y: -70, 
                            rotate: 180,
                            scale: 0,
                            filter: 'blur(12px)'
                          }}
                          animate={lettersVisible[index] ? {
                            opacity: 1,
                            y: 0,
                            rotate: 0,
                            scale: [0, 1.4, 0.9, 1],
                            filter: 'blur(0px)'
                          } : {
                            opacity: 0,
                            y: -70,
                            rotate: 180,
                            scale: 0,
                            filter: 'blur(12px)'
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 22,
                            delay: index * 0.08
                          }}
                          className="inline-block relative"
                          style={{
                            display: 'inline-block',
                            transformOrigin: 'center',
                            background: 'linear-gradient(135deg, #17a6d7, #259adb, #3b87e2, #4380e4, #9735fd)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: '0 0 12px rgba(151, 53, 253, 0.5)',
                            fontWeight: 800
                          }}
                        >
                          {letter === ' ' ? '\u00A0' : letter}
                        </motion.span>
                      );
                    })}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Powered by AI • Conduza o planejamento preventivo e as intervenções corretivas com prioridade</p>
                </div>
              </div>
            </div>
            {/* O botão 'Abrir Planos Preventivos' foi removido daqui para simplificar a interface do header. */}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
          <div className="bg-gradient-to-br from-blue-500/10 to-slate-900/60 rounded-xl border border-blue-500/30 p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Pipeline Preventivo & Preditivo</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ordens derivadas de planos programados com foco em disponibilidade, conformidade e redução de paradas. Mantenha o backlog saudável e evite atrasos.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-slate-900/60 rounded-xl border border-amber-500/30 p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 flex-shrink-0">
                <Wrench className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Intervenções Reativas</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ordens geradas a partir de chamados corretivos ou emergenciais. Garanta triagem rápida, priorização eficiente e execução controlada.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-4 border border-slate-700/50 relative z-10">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-400" />
            Visão Operacional
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {segmentOptions.map(({ value, label, description, icon: Icon }) => {
              const isActive = filters.segment === value;
              return (
                <button
                  key={value}
                  onClick={() => setFilters((prev) => ({ ...prev, segment: value }))}
                  className={clsx(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                    isActive
                      ? 'bg-slate-800 border-blue-500/40 shadow-lg'
                      : 'bg-slate-900/40 border-slate-700/60 hover:border-slate-600/60'
                  )}
                >
                  <div className={clsx('p-2 rounded-md', isActive ? 'bg-blue-500/20' : 'bg-slate-800/70')}>
                    <Icon className={clsx('w-4 h-4', isActive ? 'text-blue-300' : 'text-slate-400')} />
                  </div>
                  <div>
                    <p className={clsx('text-sm font-semibold', isActive ? 'text-white' : 'text-slate-200')}>{label}</p>
                    <p className="text-xs text-slate-400 leading-snug">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por equipamento, OS ou plano..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50"
              />
            </div>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-700/50">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="">Todos</option>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {shouldShowPlanned && (
          <section className="space-y-4">
            <header className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Planejamento Preventivo & Preditivo</h2>
                <p className="text-xs text-slate-400">
                  Controle de execução dos planos e prontidão para as próximas janelas de manutenção.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {plannedFiltered.length} ordem{plannedFiltered.length === 1 ? '' : 's'} em exibição
              </span>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard icon={BarChart3} label="Total planejadas" value={plannedStats.total} color="text-blue-300" />
              <StatCard icon={Clock} label="Pendentes" value={plannedStats.pending} color="text-yellow-300" />
              <StatCard icon={Play} label="Em execução" value={plannedStats.inProgress} color="text-green-300" />
              <StatCard icon={AlertTriangle} label="Atrasadas" value={plannedStats.overdue} color="text-red-300" />
              <StatCard icon={Calendar} label="Próx. 7 dias" value={plannedStats.next7Days} color="text-purple-300" />
            </div>

            {loading ? (
              <LoadingState />
            ) : plannedFiltered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {plannedFiltered.map((order, idx) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const overdue = isOverdue(order);
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={clsx(
                        'bg-slate-900/70 rounded-xl border p-5 hover:border-slate-600/60 transition-all cursor-pointer relative overflow-hidden',
                        overdue && 'border-red-500/50 shadow-md shadow-red-500/20'
                      )}
                      onClick={() => router.push(`/maintenance/${order.id}`)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 hover:from-blue-500/5 hover:via-blue-500/5 hover:to-blue-500/0 transition-all duration-300" />
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1', status.color, status.bg, status.border)}>
                              {getStatusIcon(order.status)}
                              {status.label}
                            </span>
                            {getMaintenanceBadge(order)}
                            {order.plan_name && (
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-800/70 text-slate-300 border-slate-700/60">
                                Plano: {order.plan_name}
                              </span>
                            )}
                          </div>
                          {overdue && (
                            <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full border border-red-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Atrasada
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-white font-semibold text-lg mb-1">{order.equipment_name || 'Equipamento'}</h3>
                          {order.equipment_code && <p className="text-xs text-slate-500 font-mono">Código: {order.equipment_code}</p>}
                        </div>

                        {order.scheduled_date && (
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-400">Data agendada</p>
                              <p className={clsx('text-sm font-medium', overdue ? 'text-red-300' : 'text-slate-200')}>
                                {format(new Date(order.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        )}

                        {order.assigned_to_name && (
                          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                            <User className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-400">Responsável</p>
                              <p className="text-sm text-slate-200 font-medium">{order.assigned_to_name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={CalendarIcon} message="Nenhuma OS preventiva / preditiva encontrada" />
            )}
          </section>
        )}

        {shouldShowReactive && (
          <section className="space-y-4">
            <header className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Intervenções Corretivas & Emergenciais</h2>
                <p className="text-xs text-slate-400">
                  Ordens derivadas de chamados, priorizadas por criticidade e impacto operacional.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {reactiveFiltered.length} ordem{reactiveFiltered.length === 1 ? '' : 's'} em exibição
              </span>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={BarChart3} label="Total reativas" value={reactiveStats.total} color="text-amber-300" />
              <StatCard icon={Clock} label="Aguardando ação" value={reactiveStats.awaiting} color="text-yellow-300" />
              <StatCard icon={Play} label="Em execução" value={reactiveStats.executing} color="text-cyan-300" />
              <StatCard icon={CheckCircle2} label="Concluídas" value={reactiveStats.completed} color="text-green-300" />
            </div>

            {loading ? (
              <LoadingState />
            ) : reactiveFiltered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {reactiveFiltered.map((order, idx) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const createdDate = order.created_at ? new Date(order.created_at) : null;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-slate-900/70 rounded-xl border border-slate-700/60 p-5 hover:border-slate-600 transition-all cursor-pointer"
                      onClick={() => router.push(`/maintenance/${order.id}`)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1', status.color, status.bg, status.border)}>
                            {getStatusIcon(order.status)}
                            {status.label}
                          </span>
                          {getMaintenanceBadge(order)}
                          {order.priority && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-800/60 text-slate-300 border-slate-700/60">
                              Prioridade: {order.priority}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-white font-semibold text-lg mb-1">{order.equipment_name || 'Equipamento'}</h3>
                          {order.description && <p className="text-sm text-slate-400 line-clamp-2">{order.description}</p>}
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">Registrada em</p>
                            <p className="text-sm text-slate-200 font-medium">
                              {createdDate ? format(createdDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                            </p>
                          </div>
                        </div>

                        {order.assigned_to_name && (
                          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                            <User className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-400">Responsável</p>
                              <p className="text-sm text-slate-200 font-medium">{order.assigned_to_name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Wrench} message="Nenhuma OS corretiva ou emergencial em aberto" />
            )}
          </section>
        )}
      </div>
    </MainLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-900/70 rounded-lg border border-slate-700/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={clsx('w-5 h-5', color)} />
      </div>
      <p className={clsx('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-20 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30 border-dashed relative z-10">
      <Icon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400 font-medium mb-1">{message}</p>
      <p className="text-xs text-slate-500">Mantenha o monitoramento constante para agir rapidamente quando necessário.</p>
    </div>
  );
}
