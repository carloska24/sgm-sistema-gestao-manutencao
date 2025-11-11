'use client';

import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Wrench,
  ClipboardList,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  ArrowRight,
  Activity,
  CheckCircle,
  XCircle,
  Users,
  PieChart,
  LineChart,
  BarChart3,
  Brain,
  Zap,
  Target,
  DollarSign,
  Shield,
  Package,
  FileCheck,
  AlertTriangle,
  Gauge,
  TrendingDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { fetchData } from '@/lib/api';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Lazy load componentes pesados de gráficos
const Pie = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Pie })), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut })), { ssr: false });

const AIAssistant = dynamic(() => import('@/components/dashboard/AIAssistant'), {
  ssr: false,
  loading: () => <div className="h-32 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div></div>
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnimatedAIDashboardIcon = () => (
  <motion.div className="relative flex items-center justify-center">
    <motion.div
      className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl"
      initial={{ opacity: 0.4, scale: 0.7 }}
      animate={{ opacity: [0.3, 0.6, 0.4], scale: [0.7, 1, 0.85] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute inset-0 rounded-full bg-sky-500/10 blur-xl"
      initial={{ opacity: 0.3, scale: 0.5 }}
      animate={{ opacity: [0.2, 0.45, 0.25], scale: [0.5, 0.9, 0.65] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    />
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className="relative w-20 h-20 drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]"
      initial={{ rotate: -6, scale: 0.9 }}
      animate={{ rotate: [-6, 2, -2, 5, -6], scale: [0.9, 1.02, 0.95, 1.05, 0.9] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.g
        clipRule="evenodd"
        fillRule="evenodd"
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50% 50%' }}
      >
        <motion.path
          d="m226.619 136.53c7.77 2.915 14.925 7.089 21.218 12.27l24.273-5.159c.908-.194 1.796.202 2.26 1.006l16.569 28.698c.464.804.362 1.772-.257 2.461l-16.595 18.43c1.34 8.117 1.338 16.396-.002 24.513l16.597 18.432c.619.689.721 1.657.257 2.461l-16.569 28.698c-.464.803-1.352 1.199-2.26 1.006l-24.266-5.157c-6.295 5.184-13.453 9.357-21.226 12.273l-7.659 23.572c-.287.882-1.074 1.454-2.002 1.454h-33.137c-.928 0-1.715-.571-2.002-1.454l-7.661-23.577c-7.77-2.915-14.925-7.09-21.218-12.27l-24.273 5.16c-.908.194-1.796-.202-2.26-1.006l-16.569-28.698c-.464-.804-.362-1.772.258-2.461l16.595-18.43c-1.339-8.11-1.339-16.406 0-24.515l-16.595-18.43c-.619-.689-.721-1.657-.258-2.461l16.569-28.698c.464-.803 1.352-1.2 2.26-1.006l24.273 5.159c6.293-5.181 13.448-9.355 21.218-12.27l7.661-23.577c.287-.883 1.074-1.454 2.002-1.454h33.137c.928 0 1.715.572 2.002 1.454zm-26.23 26.434c-24.04 0-43.529 19.488-43.529 43.529 0 24.04 19.488 43.529 43.529 43.529 24.04 0 43.529-19.488 43.529-43.529-.001-24.041-19.489-43.529-43.529-43.529z"
          fill="#847784"
          animate={{ opacity: [0.95, 1, 0.85, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="m246.278 147.55c.526.41 1.046.826 1.56 1.25l19.143-4.069 16.52 28.613c.464.804.362 1.772-.257 2.461l-16.595 18.43c1.34 8.117 1.338 16.396-.003 24.513l16.597 18.432c.619.689.721 1.657.257 2.461l-16.52 28.613-19.136-4.067c-.514.423-1.034.84-1.56 1.25l-5.88-1.25c-6.295 5.184-13.453 9.357-21.226 12.273l-7.659 23.572c-.287.882-1.074 1.454-2.002 1.454h-25.698c-.928 0-1.715-.571-2.002-1.454l-7.661-23.577c-7.77-2.915-14.925-7.09-21.218-12.27l-5.879 1.25c-.526-.41-1.046-.826-1.56-1.25l-19.143 4.069-16.52-28.613c-.464-.804-.362-1.772.258-2.461l16.595-18.43c-1.339-8.11-1.339-16.406 0-24.515l-16.595-18.43c-.619-.689-.721-1.657-.258-2.461l16.52-28.613 19.143 4.069c.514-.424 1.034-.84 1.56-1.25l5.879 1.25c6.293-5.181 13.448-9.355 21.218-12.27l7.661-23.577c.287-.883 1.074-1.454 2.002-1.454h25.698c.928 0 1.715.572 2.002 1.454l7.66 23.577c7.77 2.915 14.925 7.089 21.218 12.27zm-53.328 15.414c-24.04 0-43.529 19.488-43.529 43.529 0 24.04 19.488 43.529 43.529 43.529 1.253 0 2.493-.056 3.72-.16 1.226.104 2.467.16 3.72.16 24.04 0 43.529-19.488 43.529-43.529 0-24.04-19.488-43.529-43.529-43.529-1.253 0-2.493.056-3.72.16-1.227-.104-2.467-.16-3.72-.16z"
          fill="#ada0ad"
          animate={{ opacity: [1, 0.85, 1], scale: [1, 1.015, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
        <motion.path
          d="m92.979 153.883c1.011 0 2.01.053 2.994.156-4.328-17.859 9.162-35.23 27.694-35.23 5.671 0 10.956 1.657 15.396 4.513 1.5-30.749 34.68-48.984 61.326-34.625v235.587c-26.646 14.359-59.826-3.876-61.326-34.625-18.719 12.043-43.892-1.284-43.892-23.983 0-2.32.279-4.574.802-6.733-16.844 1.761-31.491-11.421-31.491-28.34 0-10.154 5.311-19.065 13.306-24.112-7.995-5.047-13.306-13.959-13.306-24.112 0-15.737 12.758-28.496 28.497-28.496z"
          fill="#ccc"
          animate={{ opacity: [0.8, 1, 0.85, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
        />
        <motion.path
          d="m132.388 120.169c2.377.763 4.617 1.83 6.676 3.154.074-1.521.229-3.01.454-4.468 6.2-.343 12.08 1.294 17.013 4.468.982-20.134 15.547-34.9 32.966-38.667 3.687.804 7.348 2.132 10.893 4.042v235.587c-3.546 1.911-7.207 3.238-10.893 4.042-17.419-3.767-31.984-18.533-32.966-38.667-5.388 3.466-11.309 4.827-17.012 4.471-.225-1.458-.38-2.949-.454-4.471-2.123 1.366-4.33 2.402-6.573 3.139-11.058-3.564-19.854-13.705-19.854-27.122 0-2.32.279-4.574.802-6.733-16.844 1.761-31.491-11.421-31.491-28.34 0-10.154 5.311-19.065 13.306-24.112-7.995-5.047-13.306-13.959-13.306-24.112 0-16.921 14.649-30.102 31.491-28.34-3.611-14.897 5.178-29.451 18.948-33.871z"
          fill="#e6e6e6"
          animate={{ opacity: [1, 0.9, 1], y: [0, -1.5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <motion.path
          d="m200.389 200.023v12.938h-43.956c-2.405 12.776-11.858 23.3-24.344 27.026-3.419 1.019-7.017-.927-8.036-4.346s.927-7.017 4.346-8.036c14.689-4.384 20.421-22.099 11.365-34.267-2.791-3.75-6.759-6.583-11.365-7.96-3.419-1.019-5.365-4.617-4.346-8.036s4.617-5.365 8.036-4.346c12.488 3.727 21.939 14.249 24.344 27.026h43.956z"
          fill="#ada0ad"
          animate={{ opacity: [0.7, 1, 0.75], x: [0, 2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="m346.471 61.842v91.393c0 127.717-104.472 232.188-232.189 232.188h-29.386c-3.573 0-6.469-2.897-6.469-6.469 0-3.573 2.897-6.469 6.469-6.469h29.385c120.575 0 219.251-98.674 219.251-219.25v-91.393l-25.021 25.021c-2.526 2.526-6.622 2.526-9.148 0s-2.526-6.622 0-9.148l36.064-36.064c2.526-2.526 6.622-2.526 9.148 0l36.064 36.064c2.526 2.526 2.526 6.622 0 9.148s-6.622 2.526-9.148 0z"
          fill="#60b7fe"
          animate={{ opacity: [0.8, 1, 0.85], rotate: [0, 1.5, -1.5, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        {[
          { d: 'm91.632 414.943h45.299v45.299h-45.299z', fill: '#e33f65' },
          { d: 'm191.161 402.421h45.299v57.822h-45.299z', fill: '#ffbf31' },
          { d: 'm290.69 338.845h45.299v121.398h-45.299z', fill: '#14b5a2' },
          { d: 'm390.219 110.79h45.299v349.453h-45.299z', fill: '#60b7fe' },
          { d: 'm91.632 414.943h31.714v45.299h-31.714z', fill: '#fa6e85' },
          { d: 'm191.161 402.421h31.714v57.822h-31.714z', fill: '#ffe177' },
          { d: 'm290.69 338.845h31.714v121.398h-31.714z', fill: '#19cfba' },
          { d: 'm390.219 110.79h31.714v349.453h-31.714z', fill: '#88c8fe' },
        ].map((bar, index) => (
          <motion.path
            key={index}
            d={bar.d}
            fill={bar.fill}
            animate={{ scaleY: [1, 1.08, 0.95, 1.05, 1], opacity: [0.8, 1, 0.9, 1] }}
            transition={{
              duration: 6 + index,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.3,
            }}
            style={{ transformOrigin: '50% 100%' }}
          />
        ))}
      </motion.g>
    </motion.svg>
  </motion.div>
);
interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  inactiveEquipment: number;
  openCalls: number;
  inProgressCalls: number;
  pendingPreventives: number;
  overduePreventives: number;
  complianceRate: number;
  avgMTBF: number;
  avgMTTR: number;
}

interface ChartData {
  status?: string;
  count?: number;
  date?: string;
}

interface MaintenanceTypeStats {
  preventive: number;
  corrective: number;
  predictive: number;
  emergency: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipment: 0,
    activeEquipment: 0,
    inactiveEquipment: 0,
    openCalls: 0,
    inProgressCalls: 0,
    pendingPreventives: 0,
    overduePreventives: 0,
    complianceRate: 0,
    avgMTBF: 0,
    avgMTTR: 0,
  });
  const [loading, setLoading] = useState(true);
  const [callsByStatus, setCallsByStatus] = useState<ChartData[]>([]);
  const [callsByPeriod, setCallsByPeriod] = useState<ChartData[]>([]);
  const [preventivesByStatus, setPreventivesByStatus] = useState<ChartData[]>([]);
  const [equipmentByStatus, setEquipmentByStatus] = useState<ChartData[]>([]);
  const [techniciansPerformance, setTechniciansPerformance] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [maintenanceTypesStats, setMaintenanceTypesStats] = useState<MaintenanceTypeStats>({
    preventive: 0,
    corrective: 0,
    predictive: 0,
    emergency: 0,
  });
  const titleText = 'Dashboard Inteligente';
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedTitle('');
    let timeoutId: ReturnType<typeof setTimeout>;
    let index = 0;

    const type = () => {
      setDisplayedTitle(prev => {
        if (prev.length >= titleText.length) {
          return prev;
        }
        index = prev.length + 1;
        return titleText.slice(0, index);
      });
      if (index < titleText.length) {
        timeoutId = setTimeout(type, 70 + Math.random() * 40);
      }
    };

    timeoutId = setTimeout(type, 200);
    return () => clearTimeout(timeoutId);
  }, [titleText]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        statsData,
        callsStatusData,
        callsPeriodData,
        preventivesStatusData,
        equipmentStatusData,
        techniciansData,
        callsData,
        ordersData,
        equipmentData,
      ] = await Promise.all([
        fetchData<DashboardStats>('/dashboard/stats?include_demo=true'),
        fetchData<ChartData[]>('/dashboard/calls-by-status?include_demo=true'),
        fetchData<ChartData[]>('/dashboard/calls-by-period?days=30&include_demo=true'),
        fetchData<ChartData[]>('/dashboard/preventives-by-status?include_demo=true'),
        fetchData<ChartData[]>('/dashboard/equipment-by-status?include_demo=true'),
        fetchData<any[]>('/reports/technicians-performance?include_demo=true'),
        fetchData<any>('/calls?include_demo=true&limit=20&page=1').catch(() => []),
        fetchData<any>('/maintenance?include_demo=true&limit=20&page=1').catch(() => []),
        fetchData<any>('/equipment?include_demo=true&limit=20&page=1').catch(() => []),
      ]);

      setStats(statsData);
      setCallsByStatus(callsStatusData);
      setCallsByPeriod(callsPeriodData);
      setPreventivesByStatus(preventivesStatusData);
      setEquipmentByStatus(equipmentStatusData);
      setTechniciansPerformance(techniciansData || []);

      const callsList = Array.isArray(callsData?.data)
        ? callsData.data
        : Array.isArray(callsData)
        ? callsData
        : [];
      const ordersList = Array.isArray(ordersData?.data)
        ? ordersData.data
        : Array.isArray(ordersData)
        ? ordersData
        : [];

      setCalls(callsList);
      setOrders(ordersList);
      const equipmentList = Array.isArray(equipmentData?.data)
        ? equipmentData.data
        : Array.isArray(equipmentData)
        ? equipmentData
        : [];
      setEquipment(equipmentList);

      // Calcular estatísticas por tipo de manutenção
      const typeStats: MaintenanceTypeStats = {
        preventive: 0,
        corrective: 0,
        predictive: 0,
        emergency: 0,
      };

      // Contar chamados por tipo
      callsList.forEach((call: any) => {
        if (call.type && typeStats.hasOwnProperty(call.type)) {
          typeStats[call.type as keyof MaintenanceTypeStats]++;
        }
      });

      // Contar ordens por tipo
      ordersList.forEach((order: any) => {
        if (order.type && typeStats.hasOwnProperty(order.type)) {
          typeStats[order.type as keyof MaintenanceTypeStats]++;
        }
      });

      setMaintenanceTypesStats(typeStats);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gráfico de tipos de manutenção
  const maintenanceTypesChart = useMemo(() => {
    const total = Object.values(maintenanceTypesStats).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    return {
      labels: ['Preventiva', 'Corretiva', 'Preditiva', 'Emergencial'],
      datasets: [
        {
          label: 'Quantidade',
          data: [
            maintenanceTypesStats.preventive,
            maintenanceTypesStats.corrective,
            maintenanceTypesStats.predictive,
            maintenanceTypesStats.emergency,
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(249, 115, 22, 0.8)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(147, 51, 234, 1)',
            'rgba(249, 115, 22, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [maintenanceTypesStats]);

  // Gráfico comparativo de tipos por status
  const typesByStatusChart = useMemo(() => {
    const statusCounts: Record<string, Record<string, number>> = {
      preventive: { pending: 0, in_progress: 0, completed: 0 },
      corrective: { open: 0, execution: 0, completed: 0 },
      predictive: { pending: 0, in_progress: 0, completed: 0 },
      emergency: { open: 0, execution: 0, completed: 0 },
    };

    orders.forEach((order: any) => {
      if (order.type && statusCounts[order.type]) {
        const status =
          order.status === 'pending'
            ? 'pending'
            : order.status === 'in_progress'
            ? 'in_progress'
            : 'completed';
        if (statusCounts[order.type][status] !== undefined) {
          statusCounts[order.type][status]++;
        }
      }
    });

    calls.forEach((call: any) => {
      if (call.type && (call.type === 'corrective' || call.type === 'emergency')) {
        const status =
          call.status === 'open'
            ? 'open'
            : call.status === 'execution'
            ? 'execution'
            : call.status === 'completed'
            ? 'completed'
            : 'open';
        if (statusCounts[call.type] && statusCounts[call.type][status] !== undefined) {
          statusCounts[call.type][status]++;
        }
      }
    });

    return {
      labels: ['Preventiva', 'Corretiva', 'Preditiva', 'Emergencial'],
      datasets: [
        {
          label: 'Pendente/Aberto',
          data: [
            statusCounts.preventive.pending,
            statusCounts.corrective.open,
            statusCounts.predictive.pending,
            statusCounts.emergency.open,
          ],
          backgroundColor: 'rgba(234, 179, 8, 0.8)',
          borderColor: 'rgba(234, 179, 8, 1)',
          borderWidth: 2,
        },
        {
          label: 'Em Execução',
          data: [
            statusCounts.preventive.in_progress,
            statusCounts.corrective.execution,
            statusCounts.predictive.in_progress,
            statusCounts.emergency.execution,
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        {
          label: 'Concluído',
          data: [
            statusCounts.preventive.completed,
            statusCounts.corrective.completed,
            statusCounts.predictive.completed,
            statusCounts.emergency.completed,
          ],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, [orders, calls]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e5e7eb',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e5e7eb',
          font: { size: 12 },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e5e7eb',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const maintenanceTypeCards = [
    {
      type: 'preventive',
      label: 'Preventiva',
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      count: maintenanceTypesStats.preventive,
      description: 'Manutenções programadas',
      link: '/maintenance?type=preventive',
    },
    {
      type: 'corrective',
      label: 'Corretiva',
      icon: Wrench,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      count: maintenanceTypesStats.corrective,
      description: 'Reparos após falhas',
      link: '/calls?type=corrective',
    },
    {
      type: 'predictive',
      label: 'Preditiva',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      count: maintenanceTypesStats.predictive,
      description: 'Baseada em monitoramento',
      link: '/maintenance?type=predictive',
    },
    {
      type: 'emergency',
      label: 'Emergencial',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      count: maintenanceTypesStats.emergency,
      description: 'Ação imediata',
      link: '/calls?type=emergency',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-full pb-20">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 p-8 border border-slate-700/50 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-5 mb-3">
                <AnimatedAIDashboardIcon />
                <div className="relative">
                  <motion.h1
                    className="text-4xl font-bold text-white bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent tracking-tight"
                    animate={
                      displayedTitle.length === titleText.length
                        ? {
                            textShadow: [
                              '0 0 10px rgba(16,185,129,0.4)',
                              '0 0 18px rgba(45,212,191,0.65)',
                              '0 0 10px rgba(16,185,129,0.4)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span>{displayedTitle}</span>
                    <span
                      className={`ml-1 text-emerald-300 transition-opacity duration-150 ${
                        showCursor ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      ▍
                    </span>
                  </motion.h1>
                  {displayedTitle.length === titleText.length && (
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: [0, 1, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <p className="text-slate-400 text-sm mt-2">
                    Powered by IA • Análise em tempo real com recomendações inteligentes
                  </p>
                </div>
              </div>
              <p className="text-slate-300 text-lg">
                Bem-vindo,{' '}
                <span className="text-green-400 font-semibold">
                  {user?.full_name || user?.username}
                </span>
                !
              </p>
            </div>
            {/* O botão 'Relatórios' foi removido para manter o header focado nos insights do dashboard. */}
          </div>
        </motion.div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: 'Total de Equipamentos',
              value: stats.totalEquipment,
              icon: Wrench,
              color: 'blue',
              link: '/equipment',
            },
            {
              name: 'Equipamentos Ativos',
              value: stats.activeEquipment,
              icon: CheckCircle,
              color: 'green',
              link: '/equipment?status=active',
            },
            {
              name: 'Chamados Abertos',
              value: stats.openCalls,
              icon: AlertCircle,
              color: 'yellow',
              link: '/calls?status=open',
              urgent: stats.openCalls > 0,
            },
            {
              name: 'Preventivas Atrasadas',
              value: stats.overduePreventives,
              icon: XCircle,
              color: 'red',
              link: '/plans/calendar',
              urgent: stats.overduePreventives > 0,
            },
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            const colorClasses = {
              blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
              green: {
                text: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-500/30',
              },
              yellow: {
                text: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/30',
              },
              red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
            };
            const colors = colorClasses[kpi.color as keyof typeof colorClasses];

            return (
              <motion.div
                key={kpi.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(kpi.link)}
                className={`relative ${colors.bg} ${
                  colors.border
                } border rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all ${
                  kpi.urgent ? 'ring-2 ring-amber-500/20' : ''
                }`}
              >
                {kpi.urgent && (
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                )}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase">{kpi.name}</p>
                  <div className={`${colors.bg} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${colors.text}`}>{loading ? '...' : kpi.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Tipos de Manutenção - Seção Principal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Gauge className="w-6 h-6 text-purple-400" />
              Tipos de Manutenção
            </h2>
          </div>

          {/* Cards de Tipos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {maintenanceTypeCards.map((card, idx) => {
              const Icon = card.icon;
              const total = Object.values(maintenanceTypesStats).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((card.count / total) * 100).toFixed(1) : 0;

              return (
                <motion.div
                  key={card.type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => router.push(card.link)}
                  className={`${card.bgColor} ${card.borderColor} border rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all group`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`${card.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <span className={`text-2xl font-bold ${card.color}`}>{card.count}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{card.label}</h3>
                  <p className="text-xs text-slate-400 mb-2">{card.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                    <span className="text-xs text-slate-500">{percentage}% do total</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Gráficos de Tipos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Distribuição de Tipos */}
            <Card hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-400" />
                  Distribuição por Tipo
                </CardTitle>
                <CardDescription>Proporção de cada tipo de manutenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {maintenanceTypesChart ? (
                    <Doughnut data={maintenanceTypesChart} options={pieChartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      Sem dados disponíveis
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Tipos por Status */}
            <Card hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Tipos por Status
                </CardTitle>
                <CardDescription>Comparação de status entre tipos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {typesByStatusChart ? (
                    <Bar data={typesByStatusChart} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      Sem dados disponíveis
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Métricas Avançadas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Taxa de Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-bold ${
                    stats.complianceRate >= 80
                      ? 'text-green-400'
                      : stats.complianceRate >= 60
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {stats.complianceRate.toFixed(1)}%
                </span>
                {stats.complianceRate >= 95 && <TrendingUp className="w-5 h-5 text-green-400" />}
              </div>
              <p className="text-sm text-slate-400 mt-2">Preventivas executadas no prazo</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                MTTR Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-400">
                  {stats.avgMTTR >= 60
                    ? `${(stats.avgMTTR / 60).toFixed(1)}h`
                    : `${stats.avgMTTR.toFixed(0)}min`}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Tempo médio de reparo</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Eficiência Operacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-purple-400">
                  {stats.totalEquipment > 0
                    ? ((stats.activeEquipment / stats.totalEquipment) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Disponibilidade de equipamentos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-green-400" />
                Tendência de Chamados (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {callsByPeriod.length > 0 ? (
                  <Line
                    data={{
                      labels: callsByPeriod.map(item => {
                        if (item.date) {
                          const date = new Date(item.date);
                          return date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          });
                        }
                        return '';
                      }),
                      datasets: [
                        {
                          label: 'Chamados',
                          data: callsByPeriod.map(item => item.count || 0),
                          borderColor: 'rgba(59, 130, 246, 1)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Sem dados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Performance de Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {techniciansPerformance.length > 0 ? (
                  <Bar
                    data={{
                      labels: techniciansPerformance.map(tech => {
                        const name = tech.full_name || tech.username || 'Técnico';
                        return name.length > 15 ? name.substring(0, 15) + '...' : name;
                      }),
                      datasets: [
                        {
                          label: 'Tarefas Concluídas',
                          data: techniciansPerformance.map(tech => tech.total_completed || 0),
                          backgroundColor: 'rgba(147, 51, 234, 0.8)',
                          borderColor: 'rgba(147, 51, 234, 1)',
                          borderWidth: 2,
                          borderRadius: 6,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Sem dados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assistente IA Flutuante */}
      <AIAssistant
        stats={stats}
        maintenanceTypes={maintenanceTypesStats}
        callsByStatus={callsByStatus}
        callsByPeriod={callsByPeriod}
        preventivesByStatus={preventivesByStatus}
        equipmentByStatus={equipmentByStatus}
        techniciansPerformance={techniciansPerformance}
        calls={calls}
        orders={orders}
        equipment={equipment}
      />
    </MainLayout>
  );
}
