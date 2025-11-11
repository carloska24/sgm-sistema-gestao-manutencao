'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import { useToast } from '@/hooks/useToast';
import { fetchData, deleteData, putData } from '@/lib/api';
import { Equipment } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Wrench,
  X,
  Sparkles,
  Grid3x3,
  Columns,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';

// Componente de ícone SVG animado para Equipamentos - Engrenagem com Chave
const AnimatedAIEquipmentIcon = () => {
  return (
    <motion.div className="relative flex items-center justify-center w-full h-full">
      {/* Halos de brilho animados */}
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ 
          opacity: [0.2, 0.5, 0.3],
          scale: [0.6, 1.1, 0.8],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-cyan-500/15 blur-xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0.15, 0.4, 0.2],
          scale: [0.5, 0.95, 0.7],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      
      {/* SVG principal */}
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
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
        {/* Definições de gradientes e filtros */}
        <defs>
          {/* Gradiente animado que percorre o logo */}
          <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60b7fe" stopOpacity="1">
              <animate
                attributeName="offset"
                values="0%;100%;0%"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#14b5a2" stopOpacity="1">
              <animate
                attributeName="offset"
                values="50%;150%;50%"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#60b7fe" stopOpacity="0.3">
              <animate
                attributeName="offset"
                values="100%;200%;100%"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
          
          {/* Gradiente para brilho percorrendo */}
          <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="45%" stopColor="transparent" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="55%" stopColor="transparent" stopOpacity="0" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              values="0 24 24;360 24 24"
              dur="4s"
              repeatCount="indefinite"
            />
          </linearGradient>
          
          {/* Filtro de brilho */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grupo principal com rotação contínua da engrenagem */}
        <motion.g
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: 'linear',
          }}
          style={{ transformOrigin: '24px 24px' }}
        >
          {/* Engrenagem principal - com gradiente animado */}
          <motion.path
            d="M47,18H43.06a19.76,19.76,0,0,0-1.34-3.24L44.51,12a1,1,0,0,0,0-1.42L37.44,3.49a1,1,0,0,0-1.42,0L33.24,6.28A19.76,19.76,0,0,0,30,4.94V1a1,1,0,0,0-1-1H19a1,1,0,0,0-1,1V4.94a19.76,19.76,0,0,0-3.24,1.34L12,3.49a1,1,0,0,0-1.42,0L3.49,10.56a1,1,0,0,0,0,1.42l2.79,2.78A19.76,19.76,0,0,0,4.94,18H1a1,1,0,0,0-1,1V29a1,1,0,0,0,1,1H4.94a17.56,17.56,0,0,0,.76,2,1,1,0,0,0,1.62.3c5.9-6,5.95-5.81,5.83-6.51C11.23,14.67,25.7,8.28,32.67,17.22A11,11,0,0,1,24,35c-1.77,0-2.13-.43-2.68.12-5.94,5.86-6.05,5.73-5.91,6.45a1,1,0,0,0,.58.73,17.56,17.56,0,0,0,2,.76V47a1,1,0,0,0,1,1H29a1,1,0,0,0,1-1V43.06a19.76,19.76,0,0,0,3.24-1.34L36,44.51a1,1,0,0,0,1.42,0l7.07-7.07a1,1,0,0,0,0-1.42l-2.79-2.78A19.76,19.76,0,0,0,43.06,30H47a1,1,0,0,0,1-1V19A1,1,0,0,0,47,18ZM46,28c-3.74,0-4.39-.23-4.66.74-1.67,6.21-3.63,3.31,1,8l-5.66,5.66c-2.61-2.62-2.94-3.26-3.8-2.77C27.29,42.8,28,39.42,28,46H20c0-5.13.33-4.25-1.81-5l4.18-4.13c13,1.69,20-15.06,9.63-23.14-9-7-22.34.31-20.9,11.87L7,29.81C6.24,27.64,7,28,2,28V20c3.74,0,4.39.23,4.66-.74,1.67-6.21,3.63-3.31-1-8l5.66-5.66c2.61,2.62,2.94,3.26,3.8,2.77C20.71,5.2,20,8.58,20,2h8c0,3.74-.23,4.39.74,4.66,6.21,1.67,3.31,3.63,8-1l5.66,5.66c-2.62,2.61-3.26,2.94-2.77,3.8C42.8,20.71,39.42,20,46,20Z"
            fill="url(#animatedGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.8, 1, 0.9, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            filter="url(#glow)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(96, 183, 254, 0.6))' }}
          />
          
          {/* Camada de brilho que percorre */}
          <motion.path
            d="M47,18H43.06a19.76,19.76,0,0,0-1.34-3.24L44.51,12a1,1,0,0,0,0-1.42L37.44,3.49a1,1,0,0,0-1.42,0L33.24,6.28A19.76,19.76,0,0,0,30,4.94V1a1,1,0,0,0-1-1H19a1,1,0,0,0-1,1V4.94a19.76,19.76,0,0,0-3.24,1.34L12,3.49a1,1,0,0,0-1.42,0L3.49,10.56a1,1,0,0,0,0,1.42l2.79,2.78A19.76,19.76,0,0,0,4.94,18H1a1,1,0,0,0-1,1V29a1,1,0,0,0,1,1H4.94a17.56,17.56,0,0,0,.76,2,1,1,0,0,0,1.62.3c5.9-6,5.95-5.81,5.83-6.51C11.23,14.67,25.7,8.28,32.67,17.22A11,11,0,0,1,24,35c-1.77,0-2.13-.43-2.68.12-5.94,5.86-6.05,5.73-5.91,6.45a1,1,0,0,0,.58.73,17.56,17.56,0,0,0,2,.76V47a1,1,0,0,0,1,1H29a1,1,0,0,0,1-1V43.06a19.76,19.76,0,0,0,3.24-1.34L36,44.51a1,1,0,0,0,1.42,0l7.07-7.07a1,1,0,0,0,0-1.42l-2.79-2.78A19.76,19.76,0,0,0,43.06,30H47a1,1,0,0,0,1-1V19A1,1,0,0,0,47,18ZM46,28c-3.74,0-4.39-.23-4.66.74-1.67,6.21-3.63,3.31,1,8l-5.66,5.66c-2.61-2.62-2.94-3.26-3.8-2.77C27.29,42.8,28,39.42,28,46H20c0-5.13.33-4.25-1.81-5l4.18-4.13c13,1.69,20-15.06,9.63-23.14-9-7-22.34.31-20.9,11.87L7,29.81C6.24,27.64,7,28,2,28V20c3.74,0,4.39.23,4.66-.74,1.67-6.21,3.63-3.31-1-8l5.66-5.66c2.61,2.62,2.94,3.26,3.8,2.77C20.71,5.2,20,8.58,20,2h8c0,3.74-.23,4.39.74,4.66,6.21,1.67,3.31,3.63,8-1l5.66,5.66c-2.62,2.61-3.26,2.94-2.77,3.8C42.8,20.71,39.42,20,46,20Z"
            fill="url(#shineGradient)"
            opacity="0.6"
          />
        </motion.g>
        
        {/* Chave inglesa - com animação de pulso e rotação oposta */}
        <motion.g
          animate={{ 
            rotate: [0, -15, 0, 15, 0],
            scale: [1, 1.05, 1, 0.95, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          style={{ transformOrigin: '24px 24px' }}
        >
          <motion.path
            d="M31.85,21a1,1,0,0,0-.73-.64c-.71-.16-.62,0-4.88,4.23l-1.89-.94-.94-1.89c4.27-4.27,4.39-4.16,4.23-4.88a1,1,0,0,0-.64-.73,8,8,0,0,0-10.41,9.61L2.27,40.28a3.85,3.85,0,0,0,5.45,5.45L22.24,31.41A8,8,0,0,0,31.85,21ZM6.31,44.3A1.85,1.85,0,0,1,3.7,41.69c15.92-16.16,15.27-15.15,15-16a6,6,0,0,1,6-8C21.36,21,20.87,21.16,21.3,22c1.51,3,1.46,3.08,1.86,3.28,2.8,1.4,3.32,1.89,4,1.22l3.17-3.16a6,6,0,0,1-8,6C21.46,29,22.45,28.39,6.31,44.3Z"
            fill="#ffbf31"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.7, 1, 0.8, 1],
              fill: ['#ffbf31', '#ffd93d', '#ffbf31']
            }}
            transition={{ 
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              fill: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            }}
            style={{ filter: 'drop-shadow(0 0 4px rgba(255, 191, 49, 0.8))' }}
          />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
};

export default function EquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    criticality: '',
    manufacturer: '',
    location: '',
  });
  const [uniqueManufacturers, setUniqueManufacturers] = useState<string[]>([]);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [sortBy, setSortBy] = useState<
    'name' | 'code' | 'manufacturer' | 'location' | 'criticality'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [draggedItem, setDraggedItem] = useState<Equipment | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  // Paginação por coluna no Kanban (6 itens por página)
  const [kanbanPagination, setKanbanPagination] = useState<Record<string, number>>({
    active: 1,
    critical: 1,
    maintenance: 1,
    inactive: 1,
    deactivated: 1,
  });
  const ITEMS_PER_PAGE = 6;

  const canEdit = hasRole(['admin', 'manager']);

  // Estados para animação do título com letras caindo
  const titleText = 'Equipamentos e Máquinas';
  const [lettersVisible, setLettersVisible] = useState<boolean[]>([]);

  // Animação de letras caindo
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
      }, index * 80 + Math.random() * 40);
    });
  }, [titleText]);

  useEffect(() => {
    loadEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    filters.status,
    filters.criticality,
    filters.manufacturer,
    filters.location,
    pagination?.page || 1,
  ]);

  const [creatingDemo, setCreatingDemo] = useState(false);

  const handleCreateDemo = async () => {
    // Prevenir múltiplos cliques
    if (creatingDemo || loading) return;

    if (
      !confirm(
        'Isso criará dados demo completos e realistas para todo o sistema:\n\n' +
        '• 10 Equipamentos industriais com especificações detalhadas\n' +
        '• Chamados de manutenção corretiva com histórico\n' +
        '• Planos preventivos e ordens de serviço\n' +
        '• Inventário completo com 4 locações e 20+ itens\n' +
        '• Movimentações de estoque (entradas, saídas, ajustes)\n' +
        '• Dados vinculados e consistentes com datas realistas\n\n' +
        'Os dados serão removidos automaticamente ao fazer logout.\n\n' +
        'Deseja continuar?'
      )
    ) {
      return;
    }

    try {
      setCreatingDemo(true);
      setLoading(true);

      const token = localStorage.getItem('token');
      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      }/demo/create-equipment`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao criar dados demo');
      }

      success(result.message || 'Dados demo criados com sucesso!');

      // Resetar paginação
      setPagination(prev => ({ ...prev, page: 1 }));

      // Aguardar um pouco antes de recarregar para garantir que os dados foram inseridos
      setTimeout(() => {
        loadEquipment();
      }, 300);
    } catch (err) {
      console.error('Erro ao criar dados demo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar dados demo';
      showError(errorMessage);
    } finally {
      setLoading(false);
      setCreatingDemo(false);
    }
  };

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const currentPage = pagination?.page || 1;
      const currentLimit = pagination?.limit || 20;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        include_demo: 'true', // Incluir dados demo para que apareçam na listagem
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.criticality && { criticality: filters.criticality }),
        ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
        ...(filters.location && { location: filters.location }),
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        }/equipment?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Erro ao carregar equipamentos');
      }

      const equipmentData = result.data || [];
      setEquipment(equipmentData);
      
      // Extrair fabricantes e localizações únicos para os filtros
      const manufacturers = [...new Set(equipmentData.map((eq: Equipment) => eq.manufacturer).filter(Boolean))].sort() as string[];
      const locations = [...new Set(equipmentData.map((eq: Equipment) => eq.location).filter(Boolean))].sort() as string[];
      setUniqueManufacturers(manufacturers);
      setUniqueLocations(locations);
      
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err);
      showError('Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o equipamento "${name}"?`)) {
      return;
    }

    try {
      await deleteData(`/equipment/${id}`);
      success('Equipamento deletado com sucesso');
      loadEquipment();
    } catch (err) {
      showError('Erro ao deletar equipamento');
    }
  };

  const handleStatusUpdate = async (equipmentId: number, newStatus: string) => {
    try {
      await putData(`/equipment/${equipmentId}`, { status: newStatus });
      success('Status do equipamento atualizado');
      loadEquipment();
    } catch (err) {
      showError('Erro ao atualizar status do equipamento');
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: Equipment) => {
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
    setEquipment(prev =>
      prev.map(item =>
        item.id === draggedItem.id ? { ...item, status: targetStatus as any } : item
      )
    );

    // Atualizar no backend
    await handleStatusUpdate(draggedItem.id, targetStatus);
    setDraggedItem(null);
  };

  const kanbanColumns = [
    {
      id: 'active',
      title: 'Ativo',
      status: 'active',
      color: 'border-green-500/30 bg-green-500/5',
      headerColor: 'bg-green-500/20 text-green-400',
      icon: '✓',
      filterType: 'status' as const,
    },
    {
      id: 'critical',
      title: 'Crítico',
      status: 'critical',
      color: 'border-orange-500/30 bg-orange-500/5',
      headerColor: 'bg-orange-500/20 text-orange-400',
      icon: '⚠️',
      filterType: 'criticality' as const,
    },
    {
      id: 'maintenance',
      title: 'Em Manutenção',
      status: 'maintenance',
      color: 'border-amber-500/30 bg-amber-500/5',
      headerColor: 'bg-amber-500/20 text-amber-400',
      icon: '🔧',
      filterType: 'status' as const,
    },
    {
      id: 'inactive',
      title: 'Inativo',
      status: 'inactive',
      color: 'border-blue-500/30 bg-blue-500/5',
      headerColor: 'bg-blue-500/20 text-blue-400',
      icon: '⏸️',
      filterType: 'status' as const,
    },
    {
      id: 'deactivated',
      title: 'Desativado',
      status: 'deactivated',
      color: 'border-purple-500/30 bg-purple-500/5',
      headerColor: 'bg-purple-500/20 text-purple-400',
      icon: '🚫',
      filterType: 'status' as const,
    },
  ];

  const getEquipmentByStatus = (status: string, filterType?: 'status' | 'criticality') => {
    if (filterType === 'criticality') {
      // Para a coluna "Crítico", filtrar por criticidade alta
      return sortEquipment(equipment.filter(item => item.criticality === 'high'));
    }
    return sortEquipment(equipment.filter(item => item.status === status));
  };

  // Função para obter equipamentos paginados de uma coluna
  const getPaginatedEquipment = (status: string, filterType?: 'status' | 'criticality') => {
    const allItems = getEquipmentByStatus(status, filterType);
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
      const column = kanbanColumns.find(col => col.status === status);
      const allItems = getEquipmentByStatus(status, column?.filterType);
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

  const getCriticalityIcon = (criticality: string) => {
    if (criticality === 'high') return <AlertTriangle className="w-3 h-3" />;
    if (criticality === 'medium') return <AlertCircle className="w-3 h-3" />;
    return <Info className="w-3 h-3" />;
  };

  const sortEquipment = (items: Equipment[]) => {
    const sorted = [...items].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'code':
          aValue = a.code.toLowerCase();
          bValue = b.code.toLowerCase();
          break;
        case 'manufacturer':
          aValue = (a.manufacturer || '').toLowerCase();
          bValue = (b.manufacturer || '').toLowerCase();
          break;
        case 'location':
          aValue = (a.location || '').toLowerCase();
          bValue = (b.location || '').toLowerCase();
          break;
        case 'criticality':
          const criticalityOrder = { high: 3, medium: 2, low: 1 };
          aValue = criticalityOrder[a.criticality as keyof typeof criticalityOrder] || 0;
          bValue = criticalityOrder[b.criticality as keyof typeof criticalityOrder] || 0;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  // Aplicar ordenação aos equipamentos
  const sortedEquipment = sortEquipment(equipment);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-full pb-20">
        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 p-8 border border-slate-700/50 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl w-20 h-20 flex items-center justify-center">
                  <AnimatedAIEquipmentIcon />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex flex-wrap items-center gap-0.5">
                    {titleText.split('').map((letter, index) => (
                      <motion.span
                        key={index}
                        initial={{ 
                          opacity: 0, 
                          y: -50, 
                          rotate: -180,
                          scale: 0
                        }}
                        animate={lettersVisible[index] ? {
                          opacity: 1,
                          y: 0,
                          rotate: 0,
                          scale: [0, 1.2, 1]
                        } : {
                          opacity: 0,
                          y: -50,
                          rotate: -180,
                          scale: 0
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                          delay: index * 0.05
                        }}
                        className="inline-block"
                        style={{
                          display: 'inline-block',
                          transformOrigin: 'center'
                        }}
                      >
                        {letter === ' ' ? '\u00A0' : letter}
                      </motion.span>
                    ))}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Powered by AI • Gestão inteligente de equipamentos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700 shadow-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-blue-500/20 text-blue-400 shadow-md'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                  }`}
                  title="Visualização em Grid"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Grid</span>
                  {viewMode === 'grid' && (
                    <motion.div
                      layoutId="activeViewMode"
                      className="absolute inset-0 bg-blue-500/10 rounded-lg border border-blue-500/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'kanban'
                      ? 'bg-blue-500/20 text-blue-400 shadow-md'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                  }`}
                  title="Visualização Kanban"
                >
                  <Columns className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Kanban</span>
                  {viewMode === 'kanban' && (
                    <motion.div
                      layoutId="activeViewMode"
                      className="absolute inset-0 bg-blue-500/10 rounded-lg border border-blue-500/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              </div>
              <Button
                variant="secondary"
                onClick={handleCreateDemo}
                disabled={creatingDemo || loading}
                isLoading={creatingDemo}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Demo
              </Button>
              {canEdit && (
                <Button
                  onClick={() => router.push('/equipment/new')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Equipamento
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Busca */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar por nome, código ou descrição..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="pl-10 pr-10"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400 whitespace-nowrap hidden sm:inline">Ordenar:</label>
              <select
                value={sortBy}
                onChange={e => {
                  setSortBy(e.target.value as any);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[140px]"
              >
                <option value="name">Nome</option>
                <option value="code">Código</option>
                <option value="manufacturer">Fabricante</option>
                <option value="location">Localização</option>
                <option value="criticality">Criticidade</option>
              </select>
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  setPagination({ ...pagination, page: 1 });
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
                title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Botão Filtros */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {Object.values(filters).some(f => f) && (
                <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  {Object.values(filters).filter(f => f).length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={e => {
                    setFilters({ ...filters, status: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="maintenance">Em Manutenção</option>
                  <option value="deactivated">Desativado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Criticidade</label>
                <select
                  value={filters.criticality}
                  onChange={e => {
                    setFilters({ ...filters, criticality: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todas</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fabricante</label>
                <select
                  value={filters.manufacturer}
                  onChange={e => {
                    setFilters({ ...filters, manufacturer: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todos</option>
                  {uniqueManufacturers.map(manufacturer => (
                    <option key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Localização</label>
                <select
                  value={filters.location}
                  onChange={e => {
                    setFilters({ ...filters, location: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todas</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando...</p>
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
            <Wrench className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Nenhum equipamento encontrado</p>
            <p className="text-sm text-slate-500 mb-4">
              {search || Object.values(filters).some(f => f)
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro equipamento'}
            </p>
            {canEdit && !search && !Object.values(filters).some(f => f) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/equipment/new')}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Equipamento
              </Button>
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          /* Visualização Kanban */
          <div className="w-full overflow-x-auto pb-4 -mx-1">
            <div className="inline-flex gap-3 px-1" style={{ minWidth: '100%' }}>
              {kanbanColumns.map((column, colIndex) => {
                const visibleColumnsCount = kanbanColumns.length;
                const columnWidth =
                  visibleColumnsCount <= 5
                    ? `clamp(240px, calc((100% - ${
                        (visibleColumnsCount - 1) * 12
                      }px) / ${visibleColumnsCount}), 360px)`
                    : `clamp(220px, calc((100% - ${
                        (visibleColumnsCount - 1) * 12
                      }px) / ${visibleColumnsCount}), 320px)`;
                const columnEquipment = getEquipmentByStatus(column.status, column.filterType);
                const paginatedData = getPaginatedEquipment(column.status, column.filterType);
                const isDraggedOver = draggedOverColumn === column.status;

                return (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: colIndex * 0.1 }}
                    className={`flex flex-col rounded-xl border-2 ${column.color} ${
                      isDraggedOver
                        ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-slate-900'
                        : ''
                    } transition-all flex-shrink-0`}
                    style={{ width: columnWidth }}
                    onDragOver={e => {
                      // Só permitir drag over se for uma coluna de status (não criticality)
                      if (column.filterType === 'status') {
                        handleDragOver(e, column.status);
                      }
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={e => {
                      // Só permitir drop se for uma coluna de status (não criticality)
                      if (column.filterType === 'status') {
                        handleDrop(e, column.status);
                        // Resetar paginação após drop para mostrar o item movido
                        setKanbanPagination(prev => ({ ...prev, [column.status]: 1 }));
                      } else {
                        e.preventDefault();
                        showError(
                          'Não é possível mover equipamentos para a coluna Crítico. A criticidade deve ser alterada nas configurações do equipamento.'
                        );
                      }
                    }}
                  >
                    {/* Header da Coluna */}
                    <div
                      className={`${column.headerColor} px-4 py-3 rounded-t-xl border-b-2 ${
                        column.color.split(' ')[0]
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{column.icon}</span>
                          <h3 className="font-bold text-white">{column.title}</h3>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-900/50 rounded-full text-xs font-semibold text-white">
                          {columnEquipment.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards da Coluna */}
                    <div className="flex-1 p-3 space-y-3 min-h-[400px] flex flex-col">
                      {paginatedData.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center flex-1">
                          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center mb-2">
                            <Wrench className="w-6 h-6 text-slate-600" />
                          </div>
                          <p className="text-xs text-slate-500">Nenhum equipamento</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 space-y-3">
                            {paginatedData.items.map((item, index) => {
                              const isDragging = draggedItem?.id === item.id;

                              return (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-4 transition-all group ${
                                    isDragging ? 'opacity-50' : ''
                                  } ${
                                    canEdit && column.filterType === 'status'
                                      ? 'cursor-move hover:border-slate-600 hover:shadow-lg'
                                      : 'cursor-pointer hover:border-slate-600'
                                  }`}
                                  onClick={() => router.push(`/equipment/${item.id}`)}
                                >
                                  <div
                                    draggable={canEdit && column.filterType === 'status'}
                                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                                      if (column.filterType === 'status') {
                                        handleDragStart(e, item);
                                      } else {
                                        e.preventDefault();
                                      }
                                    }}
                                    onDragEnd={() => {
                                      if (draggedItem?.id === item.id) {
                                        setDraggedItem(null);
                                      }
                                    }}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          {canEdit && column.filterType === 'status' && (
                                            <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                                          )}
                                          <Wrench className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                          <h4 className="text-sm font-semibold text-white truncate">
                                            {item.name}
                                          </h4>
                                        </div>
                                        <p className="text-xs font-mono text-green-400 mb-2">
                                          {item.code}
                                        </p>
                                      </div>
                                    </div>

                                    {item.model && (
                                      <p className="text-xs text-slate-400 mb-2 truncate">
                                        {item.model}
                                      </p>
                                    )}

                                    {item.manufacturer && (
                                      <div className="flex items-start gap-2 text-xs mb-2">
                                        <span className="font-medium text-slate-500 min-w-[60px]">
                                          Fabricante:
                                        </span>
                                        <span className="text-slate-300 font-medium">
                                          {item.manufacturer}
                                        </span>
                                      </div>
                                    )}

                                    {item.location && (
                                      <div className="flex items-start gap-2 text-xs mb-3">
                                        <span className="font-medium text-slate-500 min-w-[60px]">
                                          Localização:
                                        </span>
                                        <span className="text-slate-300 font-medium flex items-center gap-1">
                                          <span className="text-slate-600">📍</span>
                                          {item.location}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2 mb-3">
                                      <span
                                        className={clsx(
                                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border',
                                          getCriticalityColor(item.criticality)
                                        )}
                                      >
                                        {getCriticalityIcon(item.criticality)}
                                        {item.criticality === 'low' && 'Baixa'}
                                        {item.criticality === 'medium' && 'Média'}
                                        {item.criticality === 'high' && 'Alta'}
                                      </span>
                                    </div>

                                    <div
                                      className="flex items-center gap-2 pt-3 border-t border-slate-800"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => router.push(`/equipment/${item.id}`)}
                                        className="flex-1 px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded transition-all text-slate-300 hover:text-white flex items-center justify-center gap-1 font-medium hover:shadow-md"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        Detalhes
                                      </button>
                                      {canEdit && (
                                        <>
                                          <button
                                            onClick={() =>
                                              router.push(`/equipment/${item.id}/edit`)
                                            }
                                            className="px-3.5 py-2 text-xs bg-slate-800 hover:bg-yellow-500/20 rounded transition-all text-yellow-400 hover:text-yellow-300 border border-yellow-500/0 hover:border-yellow-500/30 hover:shadow-md group"
                                            title="Editar equipamento"
                                          >
                                            <Edit className="w-5 h-5 transition-transform" />
                                          </button>
                                          <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="px-3.5 py-2 text-xs bg-slate-800 hover:bg-red-500/20 rounded transition-all text-red-400 hover:text-red-300 border border-red-500/0 hover:border-red-500/30 hover:shadow-md group"
                                            title="Deletar equipamento"
                                          >
                                            <Trash2 className="w-5 h-5 transition-transform" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Controles de Paginação */}
                          {paginatedData.totalPages > 1 && (
                            <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800">
                              <button
                                onClick={() => handleKanbanPageChange(column.status, 'prev')}
                                disabled={paginatedData.currentPage === 1}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all ${
                                  paginatedData.currentPage === 1
                                    ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                <ChevronLeft className="w-3 h-3" />
                                Anterior
                              </button>

                              <div className="flex items-center gap-1">
                                {Array.from(
                                  { length: paginatedData.totalPages },
                                  (_, i) => i + 1
                                ).map(page => (
                                  <button
                                    key={page}
                                    onClick={() =>
                                      setKanbanPagination(prev => ({
                                        ...prev,
                                        [column.status]: page,
                                      }))
                                    }
                                    className={`w-7 h-7 text-xs rounded transition-all ${
                                      page === paginatedData.currentPage
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 font-semibold'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>

                              <button
                                onClick={() => handleKanbanPageChange(column.status, 'next')}
                                disabled={paginatedData.currentPage === paginatedData.totalPages}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all ${
                                  paginatedData.currentPage === paginatedData.totalPages
                                    ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                Próxima
                                <ChevronRight className="w-3 h-3" />
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
        ) : (
          /* Visualização Grid */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {sortedEquipment.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-800 p-6 hover:border-slate-700 hover:shadow-xl hover:shadow-green-500/10 transition-all cursor-pointer group"
                  onClick={() => router.push(`/equipment/${item.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-sm font-mono text-green-400 mb-3">{item.code}</p>
                      {item.model && <p className="text-sm text-slate-400 mb-3">{item.model}</p>}
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {item.manufacturer && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-slate-500 min-w-[80px]">Fabricante:</span>
                        <span className="text-slate-200 font-medium">{item.manufacturer}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-slate-500 min-w-[80px]">
                          Localização:
                        </span>
                        <span className="text-slate-200 font-medium flex items-center gap-1">
                          <span className="text-slate-500">📍</span>
                          {item.location}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                        getStatusColor(item.status)
                      )}
                    >
                      {item.status === 'active' && '✓ Ativo'}
                      {item.status === 'inactive' && '○ Inativo'}
                      {item.status === 'maintenance' && '⚙ Manutenção'}
                      {item.status === 'deactivated' && '✗ Desativado'}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                        getCriticalityColor(item.criticality)
                      )}
                    >
                      {getCriticalityIcon(item.criticality)}
                      {item.criticality === 'low' && 'Baixa'}
                      {item.criticality === 'medium' && 'Média'}
                      {item.criticality === 'high' && 'Alta'}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-2 pt-4 border-t border-slate-800"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/equipment/${item.id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-all text-slate-300 hover:text-white flex items-center justify-center gap-2 font-medium hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => router.push(`/equipment/${item.id}/edit`)}
                          className="px-3.5 py-2.5 text-sm bg-slate-800 hover:bg-yellow-500/20 rounded-lg transition-all text-yellow-400 hover:text-yellow-300 border border-yellow-500/0 hover:border-yellow-500/30 hover:shadow-md group"
                          title="Editar equipamento"
                        >
                          <Edit className="w-5 h-5 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="px-3.5 py-2.5 text-sm bg-slate-800 hover:bg-red-500/20 rounded-lg transition-all text-red-400 hover:text-red-300 border border-red-500/0 hover:border-red-500/30 hover:shadow-md group"
                          title="Deletar equipamento"
                        >
                          <Trash2 className="w-5 h-5 transition-transform" />
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
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} equipamentos
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
