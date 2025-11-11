'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, deleteData, postData, putData } from '@/lib/api';
import { PreventivePlan } from '@/types';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  Power,
  PowerOff,
  Wrench,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Grid3x3,
  Columns,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de ícone SVG animado para Planos Preventivos - Gráfico/Calendário colorido
const AnimatedAIPlansIcon = () => {
  return (
    <motion.div className="relative flex items-center justify-center w-full h-full">
      {/* Halos de brilho animados com cores vibrantes */}
      <motion.div
        className="absolute inset-0 rounded-full bg-yellow-500/20 blur-2xl"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ 
          opacity: [0.2, 0.5, 0.3],
          scale: [0.6, 1.1, 0.8],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-pink-500/15 blur-xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0.15, 0.4, 0.2],
          scale: [0.5, 0.95, 0.7],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-green-500/10 blur-lg"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ 
          opacity: [0.1, 0.3, 0.15],
          scale: [0.4, 0.85, 0.6],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      
      {/* SVG principal */}
      <motion.svg
        id="fi_18488507"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        data-name="Layer 1"
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
        <motion.g
          animate={{ 
            scale: [1, 1.02, 0.98, 1],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          style={{ transformOrigin: '256px 256px' }}
        >
          <path d="m205.307 361.634h44.231v139.281h-44.231z" fill="#ffeb87" />
          <path d="m178.306 337.7h-146.903c-7.461 0-13.867-3.698-17.597-10.16s-3.731-13.858 0-20.32l73.452-127.222c3.731-6.461 10.136-10.16 17.597-10.16s13.867 3.698 17.597 10.16l73.452 127.222c3.731 6.461 3.731 13.858 0 20.32-3.73 6.462-10.136 10.16-17.597 10.16z" fill="#ff5471" fillRule="evenodd" />
          <path d="m165.556 337.7h-134.153c-7.461 0-13.867-3.698-17.597-10.16s-3.731-13.858 0-20.32l73.452-127.222c2.614-4.527 6.54-7.697 11.222-9.19 4.682 1.493 8.608 4.663 11.222 9.19l73.452 127.222c3.731 6.461 3.731 13.858 0 20.32-3.73 6.462-10.136 10.16-17.597 10.16z" fill="#ff6b84" fillRule="evenodd" />
          <path d="m456.776 279.29h44.231v221.625h-44.231z" fill="#6cbfff" />
          <path d="m288.828 386.516h44.231v114.399h-44.231z" fill="#ff8298" />
          <path d="m373.256 338.217h44.231v162.698h-44.231z" fill="#90ef90" />
          <motion.circle cx="227.423" cy="269.886" fill="#fcdb35" r="22.116"
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
          />
          <motion.circle cx="310.943" cy="318.087" fill="#ff6b84" r="22.116" transform="matrix(.082 -.997 .997 .082 -31.707 601.735)"
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.circle cx="395.371" cy="270.11" fill="#75e075" r="22.116" transform="matrix(.707 -.707 .707 .707 -75.195 358.683)"
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.circle cx="478.892" cy="222.649" fill="#4eb1fc" r="22.116" transform="matrix(.851 -.526 .526 .851 -45.531 285.021)"
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />
          <path d="m223.391 291.634c-10.289-1.895-18.084-10.911-18.084-21.748s7.795-19.852 18.084-21.748c10.289 1.895 18.085 10.91 18.085 21.748s-7.796 19.852-18.085 21.748z" fill="#ffeb87" fillRule="evenodd" />
          <path d="m306.912 339.835c-10.289-1.895-18.084-10.91-18.084-21.748s7.795-19.853 18.084-21.748c10.289 1.895 18.084 10.91 18.084 21.748s-7.796 19.852-18.084 21.748z" fill="#ff8298" fillRule="evenodd" />
          <path d="m391.34 291.858c-10.289-1.895-18.084-10.911-18.084-21.748s7.795-19.853 18.084-21.748c10.289 1.895 18.085 10.911 18.085 21.748s-7.795 19.853-18.085 21.748z" fill="#90ef90" fillRule="evenodd" />
          <path d="m474.861 244.397c-10.289-1.895-18.085-10.911-18.085-21.748s7.795-19.853 18.085-21.748c10.289 1.895 18.085 10.911 18.085 21.748s-7.795 19.853-18.085 21.748z" fill="#6cbfff" fillRule="evenodd" />
          <path d="m240.758 361.634h8.781v139.281h-8.781z" fill="#fcdb35" />
          <path d="m324.278 386.516h8.781v114.399h-8.781z" fill="#ff6b84" />
          <path d="m408.706 338.217h8.781v162.698h-8.781z" fill="#75e075" />
          <path d="m492.227 279.29h8.781v221.625h-8.781z" fill="#4eb1fc" />
          <g fillRule="evenodd">
            <path d="m200.382 27.974c43.214 19.524 64.421 76.101 63 126.001 7.548-9.74 19.178-15.44 31.5-15.44s23.952 5.7 31.5 15.44c0-69.588-56.412-126.001-126-126.001z" fill="#6cbfff" />
            <path d="m200.382 27.974c34.077 15.397 54.466 53.835 60.869 93.87 10.084 2.166 20.546 3.316 31.278 3.316 10.207 0 20.172-1.032 29.799-2.997-14.096-54.187-63.348-94.19-121.946-94.19z" fill="#85caff" />
            <path d="m263.382 153.974c1.421-49.899-19.787-106.476-63-126.001v126.001c7.548-9.74 19.178-15.44 31.5-15.44s23.952 5.7 31.5 15.44z" fill="#40a2f7" />
            <path d="m261.25 121.843c-6.403-40.035-26.791-78.474-60.869-93.87v65.076c17.507 13.903 38.228 23.932 60.869 28.793z" fill="#4eb1fc" />
            <path d="m200.382 27.974c-43.214 19.524-64.421 76.101-63 126.001-7.548-9.74-19.178-15.44-31.5-15.44s-23.952 5.7-31.5 15.44c0-69.588 56.412-126.001 126-126.001z" fill="#40a2f7" />
            <path d="m200.382 27.974c-13.33 6.022-24.563 15.574-33.687 27.364-3.876-6.204-7.305-12.714-10.246-19.487 13.68-5.09 28.48-7.877 43.932-7.877z" fill="#4eb1fc" />
            <path d="m137.382 153.974c-1.421-49.899 19.786-106.476 63-126.001v126.001c-7.548-9.74-19.178-15.44-31.5-15.44s-23.952 5.7-31.5 15.44z" fill="#6cbfff" />
            <path d="m166.695 55.338c9.124-11.79 20.357-21.342 33.687-27.364v65.076c-13.262-10.536-24.678-23.294-33.687-37.712z" fill="#85caff" />
            <path d="m169.484 40.168c-9.402 9.44-17.492 21.142-23.962 34.844-8.78 18.582-14.199 40.124-15.698 61.888-7.189-4.132-15.409-6.417-23.832-6.417-7.738 0-15.332 1.928-22.087 5.453 7.097-46.228 41.17-83.685 85.58-95.767zm22.897 1.567c-28.769 19.787-43.547 59.197-46.44 94.683 6.981-3.823 14.903-5.935 22.984-5.935 8.269 0 16.354 2.213 23.456 6.21v-94.959zm16.002 0c28.789 19.782 43.557 59.188 46.449 94.683-6.982-3.823-14.898-5.935-22.984-5.935-8.269 0-16.359 2.213-23.466 6.21v-94.959zm108.486 94.201c-7.097-46.228-41.17-83.685-85.58-95.767 9.411 9.45 17.511 21.166 23.991 34.887 8.761 18.572 14.17 40.095 15.67 61.84 7.193-4.127 15.424-6.413 23.832-6.413 7.738 0 15.327 1.928 22.087 5.453zm-244.927 25.539c3.23 1.104 6.822.039 8.91-2.666 5.979-7.719 15.38-12.324 25.139-12.324s19.16 4.605 25.144 12.324c1.519 1.952 3.847 3.095 6.33 3.095 2.469 0 4.797-1.143 6.316-3.095 5.983-7.719 15.38-12.324 25.144-12.324 8.895 0 17.478 3.838 23.456 10.356v67.639c0 4.416 3.592 7.999 8.004 7.999s7.999-3.582 7.999-7.999v-67.639c5.988-6.519 14.57-10.356 23.466-10.356 9.763 0 19.165 4.605 25.144 12.324 1.519 1.952 3.847 3.095 6.321 3.095s4.812-1.143 6.33-3.095c5.979-7.719 15.38-12.324 25.139-12.324s19.16 4.605 25.139 12.324c1.538 1.991 3.901 3.1 6.321 3.1.868 0 1.74-.145 2.589-.434 3.24-1.104 5.41-4.147 5.41-7.57 0-71.12-55.76-129.455-125.858-133.611v-9.209c0-4.421-3.582-8.003-7.999-8.003s-8.004 3.582-8.004 8.003v9.209c-70.089 4.156-125.848 62.49-125.848 133.611 0 3.423 2.17 6.466 5.41 7.57zm323.429 122.753c-7.782 0-14.108-6.33-14.108-14.112s6.326-14.117 14.108-14.117 14.122 6.335 14.122 14.117-6.33 14.112-14.122 14.112zm-84.418 47.978c-7.791 0-14.122-6.33-14.122-14.117s6.331-14.112 14.122-14.112 14.107 6.33 14.107 14.112-6.331 14.117-14.107 14.117zm-83.521-48.2c-7.791 0-14.122-6.331-14.122-14.112s6.331-14.117 14.122-14.117 14.108 6.331 14.108 14.117-6.331 14.112-14.108 14.112zm251.494-75.469c7.762 0 14.078 6.33 14.078 14.117s-6.316 14.117-14.078 14.117c-7.811 0-14.127-6.335-14.127-14.117s6.316-14.117 14.127-14.117zm-21.311 35.408-33.046 18.779c.603 2.367.921 4.841.921 7.391 0 16.605-13.51 30.114-30.119 30.114-8.288 0-15.819-3.375-21.272-8.823l-33.957 19.295c.598 2.367.921 4.841.921 7.386 0 16.61-13.51 30.12-30.11 30.12s-30.124-13.51-30.124-30.12c0-2.618.342-5.159.974-7.584l-33.244-19.184c-5.439 5.366-12.907 8.688-21.127 8.688-16.61 0-30.119-13.509-30.119-30.114s13.51-30.119 30.119-30.119 30.11 13.51 30.11 30.119c0 2.618-.342 5.159-.969 7.584l33.248 19.184c5.438-5.366 12.902-8.688 21.132-8.688 8.298 0 15.819 3.375 21.267 8.823l33.962-19.295c-.603-2.362-.921-4.836-.921-7.386 0-16.605 13.51-30.115 30.11-30.115 8.302 0 15.829 3.375 21.282 8.823l33.055-18.78c-.627-2.367-.916-4.845-.916-7.391 0-16.605 13.5-30.115 30.134-30.115s30.086 13.51 30.086 30.115-13.5 30.114-30.086 30.114c-8.341 0-15.862-3.375-21.311-8.823zm-48.123 248.972v-146.696h-28.229v146.696zm7.999-162.698h-44.232c-4.416 0-7.999 3.582-7.999 8.003v162.698c0 4.416 3.582 7.999 7.999 7.999h44.232c4.421 0 7.999-3.582 7.999-7.999v-162.698c0-4.421-3.578-8.003-7.999-8.003zm-92.431 162.698h-28.229v-98.4h28.229zm7.999-114.397h-44.226c-4.421 0-8.004 3.582-8.004 7.999v114.402c0 4.416 3.582 7.999 8.004 7.999h44.226c4.422 0 8.004-3.582 8.004-7.999v-114.402c0-4.416-3.582-7.999-8.004-7.999zm159.945 114.397v-205.623h-28.205v205.623zm8.004-221.62h-44.212c-4.436 0-8.004 3.582-8.004 7.999v221.625c0 4.416 3.568 7.999 8.004 7.999h44.212c4.436 0 8.004-3.582 8.004-7.999v-221.625c0-4.416-3.568-7.999-8.004-7.999zm-386.657-60.856c1.451 1.552 2.131 3.428 2.001 5.549l-3.713 61.01c-.198 3.37-2.98 5.988-6.36 5.988h-2.84c-3.38 0-6.157-2.618-6.369-5.988l-3.707-61.01c-.13-2.121.55-3.997 2.006-5.549 1.461-1.548 3.293-2.338 5.424-2.338h8.138c2.131 0 3.958.791 5.419 2.338zm1.292 97.72c0 5.954-4.831 10.781-10.78 10.781s-10.79-4.826-10.79-10.781 4.831-10.785 10.79-10.785 10.78 4.831 10.78 10.785zm73.339 15.385c-2.29 3.973-6.08 6.157-10.67 6.157h-146.898c-4.59 0-8.379-2.184-10.67-6.157-2.3-3.973-2.3-8.351 0-12.319l73.449-127.222c2.29-3.973 6.08-6.162 10.67-6.162s8.37 2.189 10.67 6.162l73.449 127.222c2.29 3.968 2.29 8.346 0 12.319zm13.852 7.999c-5.193 8.997-14.131 14.16-24.522 14.16h-146.898c-10.4 0-19.334-5.164-24.531-14.16-5.192-9.001-5.192-19.324 0-28.321l73.449-127.222c5.202-8.997 14.141-14.16 24.531-14.16s19.329 5.164 24.522 14.16l73.449 127.222c5.198 9.002 5.198 19.324 0 28.321zm38.706 161.372h-28.229v-123.278h28.229zm8.004-139.281h-44.232c-4.422 0-7.999 3.582-7.999 7.999v139.285c0 4.416 3.577 7.999 7.999 7.999h44.232c4.416 0 7.998-3.582 7.998-7.999v-139.285c0-4.416-3.582-7.999-7.998-7.999z" />
          </g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
};

export default function PlansPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [plans, setPlans] = useState<PreventivePlan[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  // Paginação por coluna no Kanban (6 itens por página)
  const [kanbanPagination, setKanbanPagination] = useState<Record<string, number>>({
    pending: 1,
    in_progress: 1,
    paused: 1,
    completed: 1,
    cancelled: 1,
  });
  const ITEMS_PER_PAGE = 6;
  const [draggedItem, setDraggedItem] = useState<any | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Estados para animação do título com efeito de onda
  const titleText = 'Planos Preventivos';
  const [lettersVisible, setLettersVisible] = useState<boolean[]>([]);

  // Animação de letras com efeito de onda/cascata
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
      }, index * 70); // Delay sequencial para efeito cascata
    });
  }, [titleText]);

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive, pagination?.page || 1]);

  useEffect(() => {
    if (viewMode === 'kanban') {
      // Carregar planos primeiro para que os filtros funcionem corretamente
      if (plans.length === 0) {
        loadPlans();
      }
      loadAllOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, search, filterActive]);

  // Carregar todas as ordens para o Kanban (otimizado - limite reduzido)
  const loadAllOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '500', // Reduzido de 10000 para 500 - suficiente para Kanban
        include_demo: 'true', // Incluir dados demo
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/maintenance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar ordens');
      }

      // Incluir todas as ordens preventivas (mesmo as órfãs, sem plano)
      setOrders(result.data || []);
    } catch (err) {
      console.error('Erro ao carregar ordens:', err);
    }
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const currentPage = pagination?.page || 1;
      const currentLimit = pagination?.limit || 20;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        include_demo: 'true', // Incluir dados demo para que apareçam na listagem
        ...(filterActive && { is_active: filterActive }),
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/plans?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar planos');
      }

      setPlans(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      showError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este plano?')) {
      return;
    }

    try {
      await deleteData(`/plans/${id}`);
      success('Plano deletado com sucesso');
      loadPlans();
    } catch (err) {
      showError('Erro ao deletar plano');
    }
  };

  const handleDeleteOrder = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que o clique abra os detalhes
    if (!confirm('Tem certeza que deseja deletar esta ordem de serviço? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('🗑️ [DEBUG] Frontend: Tentando deletar OS #' + id);
      await deleteData(`/maintenance/${id}`);
      console.log('✅ [DEBUG] Frontend: OS deletada com sucesso');
      success('Ordem de serviço deletada com sucesso');
      // Aguardar um pouco antes de recarregar para garantir que o backend processou
      setTimeout(() => {
        loadAllOrders(); // Recarregar ordens após deletar
      }, 300);
    } catch (err: any) {
      console.error('❌ [DEBUG] Frontend: Erro ao deletar OS:', err);
      const errorMessage = err?.message || 'Erro ao deletar ordem de serviço';
      showError(errorMessage);
    }
  };

  const handleToggle = async (id: number, currentStatus: number) => {
    try {
      await postData(`/plans/${id}/toggle`, {});
      success(`Plano ${currentStatus === 1 ? 'desativado' : 'ativado'} com sucesso`);
      loadPlans();
    } catch (err) {
      showError('Erro ao alterar status do plano');
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

  const filteredPlans = plans.filter((plan) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      plan.name.toLowerCase().includes(searchLower) ||
      plan.equipment_name?.toLowerCase().includes(searchLower) ||
      plan.equipment_code?.toLowerCase().includes(searchLower)
    );
  });

  // Funções para Kanban de Ordens
  const getOrdersByStatus = (status: string) => {
    let filtered = orders;
    
    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(order => 
        order.plan_name?.toLowerCase().includes(searchLower) ||
        order.equipment_name?.toLowerCase().includes(searchLower) ||
        order.equipment_code?.toLowerCase().includes(searchLower) ||
        order.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por plano ativo/inativo
    if (filterActive) {
      const isActive = filterActive === 'true';
      filtered = filtered.filter(order => {
        const plan = plans.find(p => p.id === order.plan_id);
        return plan && (plan.is_active === 1) === isActive;
      });
    }

    return filtered.filter(item => item.status === status);
  };

  // Função para obter ordens paginadas de uma coluna
  const getPaginatedOrders = (status: string) => {
    const allItems = getOrdersByStatus(status);
    const currentPage = kanbanPagination[status] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      items: allItems.slice(startIndex, endIndex),
      total: allItems.length,
      currentPage,
      totalPages: Math.ceil(allItems.length / ITEMS_PER_PAGE),
    };
  };

  // Função para mudar página de uma coluna
  const handleKanbanPageChange = (status: string, direction: 'prev' | 'next') => {
    setKanbanPagination(prev => {
      const currentPage = prev[status] || 1;
      const allItems = getOrdersByStatus(status);
      const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
      
      if (direction === 'prev' && currentPage > 1) {
        return { ...prev, [status]: currentPage - 1 };
      }
      if (direction === 'next' && currentPage < totalPages) {
        return { ...prev, [status]: currentPage + 1 };
      }
      return prev;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', item.id.toString());
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(status);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (!draggedItem || draggedItem.status === targetStatus) {
      setDraggedItem(null);
      return;
    }

    if (!canEdit) {
      showError('Você não tem permissão para alterar o status');
      setDraggedItem(null);
      return;
    }

    // Atualizar status otimisticamente
    setOrders(prev => 
      prev.map(item => 
        item.id === draggedItem.id ? { ...item, status: targetStatus as any } : item
      )
    );

    // Atualizar no backend
    try {
      await putData(`/maintenance/${draggedItem.id}`, { status: targetStatus });
      success('Status da ordem atualizado');
      loadAllOrders();
    } catch (err) {
      showError('Erro ao atualizar status da ordem');
      loadAllOrders(); // Recarregar para reverter mudança otimista
    }
    setDraggedItem(null);
  };

  const kanbanColumns = [
    {
      id: 'pending',
      title: 'Pendente',
      status: 'pending',
      color: 'border-yellow-500/30 bg-yellow-500/5',
      headerColor: 'bg-yellow-500/20 text-yellow-400',
      icon: '📅',
    },
    {
      id: 'in_progress',
      title: 'Em Execução',
      status: 'in_progress',
      color: 'border-blue-500/30 bg-blue-500/5',
      headerColor: 'bg-blue-500/20 text-blue-400',
      icon: '🔧',
    },
    {
      id: 'paused',
      title: 'Pausada',
      status: 'paused',
      color: 'border-orange-500/30 bg-orange-500/5',
      headerColor: 'bg-orange-500/20 text-orange-400',
      icon: '⏸️',
    },
    {
      id: 'completed',
      title: 'Concluída',
      status: 'completed',
      color: 'border-green-500/30 bg-green-500/5',
      headerColor: 'bg-green-500/20 text-green-400',
      icon: '✅',
    },
    {
      id: 'cancelled',
      title: 'Cancelada',
      status: 'cancelled',
      color: 'border-red-500/30 bg-red-500/5',
      headerColor: 'bg-red-500/20 text-red-400',
      icon: '🚫',
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
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-pink-500/10 via-green-500/10 to-blue-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 via-pink-500/20 to-green-500/20 rounded-xl w-20 h-20 flex items-center justify-center">
                  <AnimatedAIPlansIcon />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white flex flex-wrap items-center gap-0.5">
                    {titleText.split('').map((letter, index) => {
                      // Cores do gradiente baseadas no SVG: amarelo, rosa, verde, azul
                      const gradientColors = ['#fcdb35', '#ff6b84', '#90ef90', '#6cbfff', '#ffeb87'];
                      const colorIndex = index % gradientColors.length;
                      
                      return (
                        <motion.span
                          key={index}
                          initial={{ 
                            opacity: 0, 
                            y: 50, 
                            x: -30,
                            rotate: 90,
                            scale: 0,
                            filter: 'blur(10px)'
                          }}
                          animate={lettersVisible[index] ? {
                            opacity: 1,
                            y: 0,
                            x: 0,
                            rotate: 0,
                            scale: [0, 1.3, 0.95, 1],
                            filter: 'blur(0px)'
                          } : {
                            opacity: 0,
                            y: 50,
                            x: -30,
                            rotate: 90,
                            scale: 0,
                            filter: 'blur(10px)'
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                            delay: index * 0.07
                          }}
                          className="inline-block relative"
                          style={{
                            display: 'inline-block',
                            transformOrigin: 'center',
                            background: `linear-gradient(135deg, ${gradientColors[colorIndex]}, ${gradientColors[(colorIndex + 1) % gradientColors.length]}, ${gradientColors[(colorIndex + 2) % gradientColors.length]})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: `0 0 15px ${gradientColors[colorIndex]}40`,
                            fontWeight: 800
                          }}
                        >
                          {letter === ' ' ? '\u00A0' : letter}
                          {/* Efeito de brilho pulsante */}
                          {lettersVisible[index] && (
                            <motion.span
                              className="absolute inset-0"
                              animate={{
                                opacity: [0.3, 0.7, 0.3],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: index * 0.1
                              }}
                              style={{
                                background: `radial-gradient(circle, ${gradientColors[colorIndex]}50, transparent)`,
                                filter: 'blur(6px)',
                                zIndex: -1
                              }}
                            />
                          )}
                        </motion.span>
                      );
                    })}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Powered by AI • Gerencie planos de manutenção preventiva com inteligência e organização</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 pt-1">
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700 shadow-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-yellow-500/20 text-yellow-400 shadow-md'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                  }`}
                  title="Visualização em Grid"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Grid</span>
                  {viewMode === 'grid' && (
                    <motion.div
                      layoutId="activeViewMode"
                      className="absolute inset-0 bg-yellow-500/10 rounded-lg border border-yellow-500/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'kanban'
                      ? 'bg-pink-500/20 text-pink-400 shadow-md'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                  }`}
                  title="Visualização Kanban"
                >
                  <Columns className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Kanban</span>
                  {viewMode === 'kanban' && (
                    <motion.div
                      layoutId="activeViewMode"
                      className="absolute inset-0 bg-pink-500/10 rounded-lg border border-pink-500/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              </div>
              {canEdit && (
                <Button
                  onClick={() => router.push('/plans/new')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Plano
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, equipamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>

        {/* Lista de Planos */}
        {loading ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 border-4 ${viewMode === 'kanban' ? 'border-purple-500' : 'border-green-500'} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
            <p className="text-slate-400">Carregando...</p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Visualização Kanban - Ordens de Manutenção */
          <div className="w-full overflow-x-auto pb-4 -mx-1">
            <div className="inline-flex gap-3 px-1" style={{ minWidth: '100%' }}>
            {kanbanColumns.map((column, colIndex) => {
              const visibleColumnsCount = kanbanColumns.length;
              const columnOrders = getOrdersByStatus(column.status);
              const paginatedData = getPaginatedOrders(column.status);
              const isDraggedOver = draggedOverColumn === column.status;
              const columnWidth = visibleColumnsCount <= 5
                ? `clamp(240px, calc((100% - ${(visibleColumnsCount - 1) * 12}px) / ${visibleColumnsCount}), 360px)`
                : `clamp(220px, calc((100% - ${(visibleColumnsCount - 1) * 12}px) / ${visibleColumnsCount}), 320px)`;
              
              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: colIndex * 0.05 }}
                  className={`flex flex-col rounded-xl border-2 ${column.color} ${
                    isDraggedOver ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900' : ''
                  } transition-all flex-shrink-0`}
                  style={{ 
                    width: columnWidth
                  }}
                  onDragOver={(e) => handleDragOver(e, column.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    handleDrop(e, column.status);
                    // Resetar paginação após drop para mostrar o item movido
                    setKanbanPagination(prev => ({ ...prev, [column.status]: 1 }));
                  }}
                >
                  {/* Header da Coluna */}
                  <div className={`${column.headerColor} px-4 py-3 rounded-t-xl border-b-2 ${column.color.split(' ')[0]}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{column.icon}</span>
                        <h3 className="font-bold text-white">{column.title}</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-900/50 rounded-full text-xs font-semibold text-white">
                        {columnOrders.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards da Coluna */}
                  <div className="flex-1 p-3 min-h-[400px] flex flex-col overflow-hidden">
                    {paginatedData.items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center flex-1">
                        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center mb-2">
                          <Calendar className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-xs text-slate-500">Nenhuma ordem</p>
                      </div>
                    ) : (
                      <>
                        {/* Área scrollável dos cards */}
                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 -mr-1">
                          {paginatedData.items.map((order, index) => {
                            const isDragging = draggedItem?.id === order.id;
                            
                            return (
                              <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                draggable={canEdit}
                                onDragStart={(e) => handleDragStart(e, order)}
                                className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-4 cursor-move hover:border-slate-600 transition-all group ${
                                  isDragging ? 'opacity-50' : ''
                                } ${canEdit ? 'hover:shadow-lg' : ''}`}
                                onClick={() => router.push(`/maintenance/${order.id}`)}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {canEdit && (
                                        <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                                      )}
                                      <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                      <h4 className="text-sm font-semibold text-white truncate">
                                        OS #{order.id}
                                      </h4>
                                    </div>
                                    <p className="text-xs font-semibold text-purple-300 mb-1 truncate">
                                      {order.plan_name || 'Sem plano'}
                                    </p>
                                    <p className="text-xs font-mono text-green-400 mb-2">
                                      {order.equipment_code}
                                    </p>
                                    <p className="text-xs text-slate-300 mb-2 line-clamp-2">
                                      {order.equipment_name || 'Sem equipamento'}
                                    </p>
                                  </div>
                                </div>

                                {order.scheduled_date && (
                                  <p className="text-xs text-slate-500 mb-3">
                                    📅 {format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                                  </p>
                                )}

                                <div 
                                  className="flex items-center gap-2 pt-3 border-t border-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => router.push(`/maintenance/${order.id}`)}
                                    className="flex-1 px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded transition-colors text-slate-300 flex items-center justify-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Detalhes
                                  </button>
                                  {order.plan_id && (
                                    <button
                                      onClick={() => router.push(`/plans/${order.plan_id}`)}
                                      className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded transition-colors text-purple-400"
                                      title="Ver Plano"
                                    >
                                      <Calendar className="w-3 h-3" />
                                    </button>
                                  )}
                                  {canEdit && (
                                    <button
                                      onClick={(e) => handleDeleteOrder(order.id, e)}
                                      className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-red-500/10 rounded transition-colors text-red-400 hover:text-red-300"
                                      title="Deletar OS"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Controles de Paginação - Sempre visíveis na parte inferior */}
                        {paginatedData.totalPages > 1 && (
                          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-700/50 flex-shrink-0 bg-slate-900/30 -mx-3 px-3 pb-2">
                            <button
                              onClick={() => handleKanbanPageChange(column.status, 'prev')}
                              disabled={paginatedData.currentPage === 1}
                              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-all font-medium min-w-[70px] justify-center ${
                                paginatedData.currentPage === 1
                                  ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed opacity-50'
                                  : 'bg-slate-700/80 hover:bg-slate-600 text-white hover:text-white shadow-sm'
                              }`}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              Anterior
                            </button>
                            
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => setKanbanPagination(prev => ({ ...prev, [column.status]: page }))}
                                  className={`min-w-[28px] h-7 text-xs rounded-md transition-all font-semibold ${
                                    page === paginatedData.currentPage
                                      ? 'bg-purple-500 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/30'
                                      : 'bg-slate-700/60 hover:bg-slate-600 text-slate-200 hover:text-white border border-slate-600 hover:border-slate-500'
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => handleKanbanPageChange(column.status, 'next')}
                              disabled={paginatedData.currentPage === paginatedData.totalPages}
                              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-all font-medium min-w-[70px] justify-center ${
                                paginatedData.currentPage === paginatedData.totalPages
                                  ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed opacity-50'
                                  : 'bg-slate-700/80 hover:bg-slate-600 text-white hover:text-white shadow-sm'
                              }`}
                            >
                              Próxima
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Nenhum plano encontrado</p>
            <p className="text-sm text-slate-500 mb-4">
              {search || filterActive
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro plano preventivo'
              }
            </p>
            {canEdit && !search && !filterActive && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/plans/new')}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Plano
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-slate-700 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/plans/${plan.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-white truncate">
                          {plan.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Wrench className="w-4 h-4 flex-shrink-0" />
                        <span className="font-mono text-green-400">{plan.equipment_code}</span>
                        <span className="text-slate-500">•</span>
                        <span className="truncate">{plan.equipment_name}</span>
                      </div>
                    </div>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0',
                        plan.is_active === 1
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      )}
                    >
                      {plan.is_active === 1 ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Inativo</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{getFrequencyLabel(plan.frequency_type, plan.frequency_value)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Wrench className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-white">{plan.total_orders || 0}</span> OS |{' '}
                        <span className="text-green-400">{plan.completed_orders || 0}</span> concluídas
                      </span>
                    </div>
                    {plan.start_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>Início: {format(new Date(plan.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>

                  <div 
                    className="flex items-center gap-2 pt-4 border-t border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/plans/${plan.id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => router.push(`/plans/${plan.id}/edit`)}
                          className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-yellow-400"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(plan.id, plan.is_active)}
                          className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                          title={plan.is_active === 1 ? 'Desativar' : 'Ativar'}
                        >
                          {plan.is_active === 1 ? (
                            <PowerOff className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Power className="w-4 h-4 text-green-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="px-3 py-2 text-sm bg-slate-800 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} planos
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

