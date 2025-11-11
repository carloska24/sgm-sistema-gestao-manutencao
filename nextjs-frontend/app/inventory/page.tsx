'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, postData, putData, deleteData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Plus,
  Package,
  Search,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  MapPin,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Settings,
  X,
  CheckCircle,
  ExternalLink,
  Filter,
  ArrowUpDown,
  Warehouse,
  Boxes,
} from 'lucide-react';
import { clsx } from 'clsx';

interface InventoryItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  min_quantity: number;
  max_quantity?: number;
  current_quantity: number;
  unit_cost: number;
  supplier?: string;
  location_id?: number;
  location_name?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface InventoryLocation {
  id: number;
  name: string;
  description?: string;
  address?: string;
  is_active: number;
}

interface InventoryMovement {
  id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  movement_type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: number;
  location_id?: number;
  location_name?: string;
  notes?: string;
  created_by: number;
  created_by_username?: string;
  created_by_name?: string;
  created_at: string;
}

interface InventoryStats {
  total_items: number;
  active_items: number;
  low_stock_items: number;
  total_value: number;
}

interface MaintenanceOrder {
  id: number;
  equipment_name: string;
  equipment_code: string;
  status: string;
}

interface MaintenanceCall {
  id: number;
  equipment_name: string;
  equipment_code: string;
  status: string;
}

export default function InventoryPage() {
  const { hasRole, user } = useAuth();
  const { success, error: showError } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_items: 0,
    active_items: 0,
    low_stock_items: 0,
    total_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'items' | 'locations' | 'movements'>('items');
  const [filters, setFilters] = useState({
    category: '',
    location_id: '',
    low_stock: false,
  });
  const [showItemModal, setShowItemModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => {
    loadData();
  }, [selectedTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, locationsResponse, movementsResponse, statsResponse] = await Promise.all([
        fetchData<any>('/inventory/items'),
        fetchData<any>('/inventory/locations'),
        fetchData<any>('/inventory/movements'),
        fetchData<any>('/inventory/stats'),
      ]);

      setItems(Array.isArray(itemsResponse) ? itemsResponse : (itemsResponse?.data || []));
      setLocations(Array.isArray(locationsResponse) ? locationsResponse : (locationsResponse?.data || []));
      setMovements(Array.isArray(movementsResponse) ? movementsResponse : (movementsResponse?.data || []));
      setStats(statsResponse?.data || statsResponse || {
        total_items: 0,
        active_items: 0,
        low_stock_items: 0,
        total_value: 0,
      });
    } catch (err) {
      console.error('Erro ao carregar inventário:', err);
      showError('Erro ao carregar dados do inventário');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_quantity <= item.min_quantity) {
      return { 
        color: 'text-red-400', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/30', 
        label: 'Estoque Baixo',
        indicator: '🔴'
      };
    }
    if (item.max_quantity && item.current_quantity >= item.max_quantity) {
      return { 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/30', 
        label: 'Estoque Máximo',
        indicator: '🔵'
      };
    }
    return { 
      color: 'text-green-400', 
      bg: 'bg-green-500/10', 
      border: 'border-green-500/30', 
      label: 'Estoque Normal',
      indicator: '🟢'
    };
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.location_id && item.location_id !== Number(filters.location_id)) {
      return false;
    }
    if (filters.low_stock && item.current_quantity > item.min_quantity) {
      return false;
    }
    return true;
  });

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof InventoryItem];
        let bVal: any = b[sortConfig.key as keyof InventoryItem];

        if (sortConfig.key === 'current_quantity' || sortConfig.key === 'unit_cost' || sortConfig.key === 'min_quantity') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else {
          aVal = String(aVal || '').toLowerCase();
          bVal = String(bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [items, search, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;
    try {
      await deleteData(`/inventory/items/${id}`);
      success('Item deletado com sucesso');
      loadData();
    } catch (err) {
      showError('Erro ao deletar item');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta locação?')) return;
    try {
      await deleteData(`/inventory/locations/${id}`);
      success('Locação deletada com sucesso');
      loadData();
    } catch (err) {
      showError('Erro ao deletar locação');
    }
  };

  const handleSaveItem = async (formData: Partial<InventoryItem>) => {
    try {
      if (editingItem) {
        await putData(`/inventory/items/${editingItem.id}`, formData);
        success('Item atualizado com sucesso');
      } else {
        await postData('/inventory/items', formData);
        success('Item criado com sucesso');
      }
      setShowItemModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      showError('Erro ao salvar item');
    }
  };

  const handleSaveLocation = async (formData: Partial<InventoryLocation>) => {
    try {
      if (editingLocation) {
        await putData(`/inventory/locations/${editingLocation.id}`, formData);
        success('Locação atualizada com sucesso');
      } else {
        await postData('/inventory/locations', formData);
        success('Locação criada com sucesso');
      }
      setShowLocationModal(false);
      setEditingLocation(null);
      loadData();
    } catch (err) {
      showError('Erro ao salvar locação');
    }
  };

  const handleSaveMovement = async (formData: Partial<InventoryMovement>) => {
    try {
      await postData('/inventory/movements', formData);
      success('Movimentação registrada com sucesso');
      setShowExitModal(false);
      setShowEntryModal(false);
      setShowAdjustmentModal(false);
      setSelectedItemForAction(null);
      loadData();
    } catch (err) {
      showError('Erro ao registrar movimentação');
    }
  };

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];
  }, [items]);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-full pt-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
              <Warehouse className="w-8 h-8 text-blue-400" />
            </div>
          <div>
              <h1 className="text-3xl font-bold text-white mb-1 font-poppins flex items-center gap-3">
                Almoxarifado e Controle de Estoque
              </h1>
              <p className="text-slate-400 text-sm">
                Gestão completa de materiais MRO, movimentações e controle de estoque
              </p>
          </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            {canEdit && selectedTab === 'items' && (
                  <Button onClick={() => { setEditingItem(null); setShowItemModal(true); }} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo Item
                  </Button>
                )}
            {canEdit && selectedTab === 'locations' && (
                  <Button onClick={() => { setEditingLocation(null); setShowLocationModal(true); }} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nova Locação
                  </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/30 p-5 hover:border-blue-500/50 transition-all cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Boxes className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Total de Itens</p>
              <p className="text-3xl font-bold text-blue-400">{stats.total_items}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/30 p-5 hover:border-green-500/50 transition-all cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Itens Ativos</p>
              <p className="text-3xl font-bold text-green-400">{stats.active_items}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl border border-red-500/30 p-5 hover:border-red-500/50 transition-all cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Estoque Baixo</p>
              <p className="text-3xl font-bold text-red-400">{stats.low_stock_items}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/30 p-5 hover:border-purple-500/50 transition-all cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
            </div>
              <div>
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Valor Total</p>
                <p className="text-2xl font-bold text-purple-400">
                  R$ {stats.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setSelectedTab('items')}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center gap-2',
              selectedTab === 'items'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            )}
          >
            <Package className="w-4 h-4" />
            Itens ({items.length})
          </button>
          <button
            onClick={() => setSelectedTab('locations')}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center gap-2',
              selectedTab === 'locations'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            )}
          >
            <MapPin className="w-4 h-4" />
            Locações ({locations.length})
          </button>
          <button
            onClick={() => setSelectedTab('movements')}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center gap-2',
              selectedTab === 'movements'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
            Movimentações ({movements.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando...</p>
          </div>
        ) : selectedTab === 'items' ? (
          <>
            {/* Filtros */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-5 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Filtros e Busca</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome, código ou descrição..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700/50 focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  >
                    <option value="">Todas</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Locação</label>
                  <select
                    value={filters.location_id}
                    onChange={(e) => setFilters({ ...filters, location_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  >
                    <option value="">Todas</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.low_stock}
                    onChange={(e) => setFilters({ ...filters, low_stock: e.target.checked })}
                    className="bg-slate-800 border-slate-600 rounded cursor-pointer group-hover:border-green-500/50 transition-colors"
                  />
                  <span className="group-hover:text-slate-200 transition-colors">Mostrar apenas estoque baixo</span>
                </label>
                {sortConfig && (
                  <button
                    onClick={() => setSortConfig(null)}
                    className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" /> Limpar ordenação
                  </button>
                )}
              </div>
            </div>

            {/* Tabela de Itens */}
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 shadow-xl">
                <div className="p-4 bg-slate-800/50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Package className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 mb-2 text-lg">Nenhum item encontrado</p>
                <p className="text-slate-500 text-sm mb-6">Comece adicionando seu primeiro item de inventário</p>
                {canEdit && (
                  <Button onClick={() => { setEditingItem(null); setShowItemModal(true); }} className="flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" /> Criar Primeiro Item
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/70 border-b border-slate-700/50 backdrop-blur-sm">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th 
                          className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 hover:bg-slate-800/50 transition-all group"
                          onClick={() => handleSort('code')}
                        >
                          <div className="flex items-center gap-2">
                            Código (SKU)
                            {sortConfig?.key === 'code' && (
                              <span className="text-green-400 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            {(!sortConfig || sortConfig?.key !== 'code') && (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 hover:bg-slate-800/50 transition-all group"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Descrição
                            {sortConfig?.key === 'name' && (
                              <span className="text-green-400 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            {(!sortConfig || sortConfig?.key !== 'name') && (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 hover:bg-slate-800/50 transition-all group"
                          onClick={() => handleSort('current_quantity')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            Quantidade
                            {sortConfig?.key === 'current_quantity' && (
                              <span className="text-green-400 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            {(!sortConfig || sortConfig?.key !== 'current_quantity') && (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Localização
                        </th>
                        <th 
                          className="px-4 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 hover:bg-slate-800/50 transition-all group"
                          onClick={() => handleSort('min_quantity')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            Ponto de Pedido
                            {sortConfig?.key === 'min_quantity' && (
                              <span className="text-green-400 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            {(!sortConfig || sortConfig?.key !== 'min_quantity') && (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 hover:bg-slate-800/50 transition-all group"
                          onClick={() => handleSort('unit_cost')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            Custo Unitário
                            {sortConfig?.key === 'unit_cost' && (
                              <span className="text-green-400 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                            {(!sortConfig || sortConfig?.key !== 'unit_cost') && (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredAndSortedItems.map((item) => {
                const stockStatus = getStockStatus(item);
                        const totalValue = item.current_quantity * item.unit_cost;
                return (
                          <tr 
                    key={item.id}
                            className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/30"
                          >
                            <td className="px-4 py-4">
                              <span className={clsx('px-2.5 py-1.5 text-xs font-medium rounded-md border', stockStatus.bg, stockStatus.border, stockStatus.color)}>
                                {stockStatus.indicator} {stockStatus.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-mono text-sm text-green-400 font-semibold">{item.code}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="text-white font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</div>
                                )}
                        {item.category && (
                                  <span className="inline-block mt-1.5 px-2 py-0.5 text-xs bg-slate-800/70 text-slate-300 rounded-md border border-slate-700/50">
                            {item.category}
                          </span>
                        )}
                      </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className={clsx(
                                  'text-sm font-semibold',
                                  item.current_quantity <= item.min_quantity ? 'text-red-400' : 'text-white'
                                )}>
                          {item.current_quantity} {item.unit}
                        </span>
                      {item.max_quantity && (
                                  <span className="text-xs text-slate-500 mt-0.5">Máx: {item.max_quantity}</span>
                                )}
                        </div>
                            </td>
                            <td className="px-4 py-4">
                              {item.location_name ? (
                                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{item.location_name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600 italic">Sem localização</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-sm text-slate-300">{item.min_quantity} {item.unit}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-sm text-slate-300">
                          R$ {item.unit_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-sm font-semibold text-purple-400">
                                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                        <button
                                  onClick={() => { setSelectedItemForAction(item); setShowExitModal(true); }}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/30 hover:border-red-500/50"
                                  title="Saída (Check-out)"
                        >
                                  <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                                  onClick={() => { setSelectedItemForAction(item); setShowEntryModal(true); }}
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all border border-green-500/30 hover:border-green-500/50"
                                  title="Entrada (Check-in)"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setSelectedItemForAction(item); setShowAdjustmentModal(true); }}
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all border border-blue-500/30 hover:border-blue-500/50"
                                  title="Ajuste de Estoque"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => { setEditingItem(item); setShowItemModal(true); }}
                                      className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-all border border-yellow-500/30 hover:border-yellow-500/50"
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/30 hover:border-red-500/50"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                                  </>
                    )}
                              </div>
                            </td>
                          </tr>
                );
              })}
                    </tbody>
                  </table>
            </div>
              </div>
            )}
          </>
        ) : selectedTab === 'locations' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{location.name}</h3>
                      {location.address && (
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {location.address}
                        </p>
                      )}
                    </div>
                    <span
                      className={clsx(
                        'px-2 py-1 text-xs font-medium rounded border',
                        location.is_active === 1
                          ? 'bg-green-500/10 text-green-400 border-green-500/30'
                          : 'bg-slate-700 text-slate-300'
                      )}
                    >
                      {location.is_active === 1 ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  {location.description && <p className="text-sm text-slate-300 mb-4">{location.description}</p>}

                  {canEdit && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => { setEditingLocation(location); setShowLocationModal(true); }}
                        className="flex-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-yellow-400 flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="px-3 py-2 text-sm bg-slate-800 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {locations.length === 0 && (
              <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
                <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Nenhuma locação cadastrada</p>
                {canEdit && (
                  <Button onClick={() => { setEditingLocation(null); setShowLocationModal(true); }} className="flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" /> Criar Primeira Locação
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-3">
              {movements.map((movement) => (
                <motion.div
                  key={movement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 rounded-lg border border-slate-800 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={clsx(
                            'px-2 py-1 text-xs font-medium rounded border',
                            movement.movement_type === 'entry'
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : movement.movement_type === 'exit'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          )}
                        >
                          {movement.movement_type === 'entry' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                          {movement.movement_type === 'exit' && <TrendingDown className="w-3 h-3 inline mr-1" />}
                          {movement.movement_type === 'adjustment' && <RefreshCw className="w-3 h-3 inline mr-1" />}
                          {movement.movement_type === 'transfer' && <ArrowUpDown className="w-3 h-3 inline mr-1" />}
                          {movement.movement_type === 'entry' ? 'Entrada' : movement.movement_type === 'exit' ? 'Saída' : movement.movement_type === 'adjustment' ? 'Ajuste' : 'Transferência'}
                        </span>
                        <span className="text-sm font-semibold text-white">{movement.item_name}</span>
                        <span className="text-xs font-mono text-green-400">{movement.item_code}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-400">
                        <div>
                          <span className="font-medium">Quantidade:</span> {movement.quantity} un
                        </div>
                        {movement.unit_cost && (
                          <div>
                            <span className="font-medium">Custo unitário:</span> R$ {movement.unit_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        {movement.location_name && (
                          <div>
                            <span className="font-medium">Locação:</span> {movement.location_name}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Data:</span>{' '}
                          {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      {movement.notes && <p className="text-sm text-slate-300 mt-2">{movement.notes}</p>}
                      {movement.reference_type && movement.reference_id && (
                        <p className="text-xs text-slate-500 mt-2">
                          Referência: {movement.reference_type} #{movement.reference_id}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {movements.length === 0 && (
              <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
                <ArrowUpDown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Nenhuma movimentação registrada</p>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showItemModal && (
          <ItemModal
            item={editingItem}
            locations={locations}
            onClose={() => { setShowItemModal(false); setEditingItem(null); }}
            onSave={handleSaveItem}
          />
        )}

        {showLocationModal && (
          <LocationModal
            location={editingLocation}
            onClose={() => { setShowLocationModal(false); setEditingLocation(null); }}
            onSave={handleSaveLocation}
          />
        )}

        {showExitModal && (
          <ExitModal
            item={selectedItemForAction}
            locations={locations}
            onClose={() => { setShowExitModal(false); setSelectedItemForAction(null); }}
            onSave={handleSaveMovement}
          />
        )}

        {showEntryModal && (
          <EntryModal
            item={selectedItemForAction}
            locations={locations}
            onClose={() => { setShowEntryModal(false); setSelectedItemForAction(null); }}
            onSave={handleSaveMovement}
          />
        )}

        {showAdjustmentModal && (
          <AdjustmentModal
            item={selectedItemForAction}
            locations={locations}
            onClose={() => { setShowAdjustmentModal(false); setSelectedItemForAction(null); }}
            onSave={handleSaveMovement}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Modal de Item (Redesenhado)
function ItemModal({
  item,
  locations,
  onClose,
  onSave,
}: {
  item: InventoryItem | null;
  locations: InventoryLocation[];
  onClose: () => void;
  onSave: (data: Partial<InventoryItem>) => void;
}) {
  const [form, setForm] = useState({
    code: item?.code || '',
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || '',
    unit: item?.unit || 'un',
    min_quantity: item?.min_quantity || 0,
    max_quantity: item?.max_quantity || undefined,
    current_quantity: item?.current_quantity || 0,
    unit_cost: item?.unit_cost || 0,
    supplier: item?.supplier || '',
    location_id: item?.location_id || undefined,
    is_active: item?.is_active !== undefined ? item.is_active === 1 : true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.code.trim()) newErrors.code = 'Código é obrigatório';
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (form.min_quantity < 0) newErrors.min_quantity = 'Quantidade mínima não pode ser negativa';
    if (form.max_quantity !== undefined && form.max_quantity < form.min_quantity) {
      newErrors.max_quantity = 'Quantidade máxima deve ser maior que a mínima';
    }
    if (form.current_quantity < 0) newErrors.current_quantity = 'Quantidade atual não pode ser negativa';
    if (form.unit_cost < 0) newErrors.unit_cost = 'Custo unitário não pode ser negativo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-xl border border-slate-800 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{item ? 'Editar Item' : 'Novo Item de Inventário'}</h2>
            <p className="text-sm text-slate-400 mt-1">Cadastre ou edite um item do almoxarifado</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
            <Input
                  label="Código (SKU) *"
              value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
                  error={errors.code}
                  placeholder="Ex: ROL-6205"
            />
                <p className="text-xs text-slate-500 mt-1">Identificador único do item</p>
              </div>
              <div>
            <Input
                  label="Nome do Item *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
                  error={errors.name}
                  placeholder="Ex: Rolamento Axial 6205"
            />
          </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
              <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Descrição detalhada do item, especificações técnicas, etc."
          />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
            <Input
              label="Categoria"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Rolamentos, Filtros, Correias..."
            />
              </div>
              <div>
            <Input
                  label="Unidade de Medida"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="un, kg, m, L..."
            />
          </div>
            </div>
          </div>

          {/* Controle de Estoque */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-400" />
              Controle de Estoque
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
            <Input
              type="number"
                  label="Quantidade Mínima (Ponto de Pedido) *"
              value={form.min_quantity}
              onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
              min="0"
                  error={errors.min_quantity}
                  required
            />
                <p className="text-xs text-slate-500 mt-1">Nível que dispara alerta de estoque baixo</p>
              </div>
              <div>
            <Input
              type="number"
              label="Quantidade Máxima"
                  value={form.max_quantity || ''}
              onChange={(e) => setForm({ ...form, max_quantity: e.target.value ? Number(e.target.value) : undefined })}
              min="0"
                  error={errors.max_quantity}
            />
                <p className="text-xs text-slate-500 mt-1">Capacidade máxima de armazenamento</p>
              </div>
              <div>
            <Input
              type="number"
                  label="Quantidade Atual *"
              value={form.current_quantity}
              onChange={(e) => setForm({ ...form, current_quantity: Number(e.target.value) })}
              min="0"
                  error={errors.current_quantity}
                  required
            />
                <p className="text-xs text-slate-500 mt-1">Quantidade disponível no momento</p>
          </div>
            </div>
          </div>

          {/* Informações Financeiras e Localização */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Informações Financeiras e Localização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
            <Input
              type="number"
                  label="Custo Unitário (R$) *"
              value={form.unit_cost}
              onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })}
              min="0"
              step="0.01"
                  error={errors.unit_cost}
                  required
            />
                <p className="text-xs text-slate-500 mt-1">Custo médio de aquisição</p>
              </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Locação</label>
              <select
                value={form.location_id || ''}
                onChange={(e) => setForm({ ...form, location_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Nenhuma</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
                <p className="text-xs text-slate-500 mt-1">Local físico onde o item está armazenado</p>
            </div>
          </div>
            <div className="mt-4">
          <Input
                label="Fornecedor Principal"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Nome do fornecedor"
          />
            </div>
            <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="bg-slate-800 border-slate-600"
            />
              <label className="text-sm text-slate-300">Item ativo no sistema</label>
          </div>
        </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {item ? 'Salvar Alterações' : 'Criar Item'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Modal de Locação
function LocationModal({
  location,
  onClose,
  onSave,
}: {
  location: InventoryLocation | null;
  onClose: () => void;
  onSave: (data: Partial<InventoryLocation>) => void;
}) {
  const [form, setForm] = useState({
    name: location?.name || '',
    description: location?.description || '',
    address: location?.address || '',
    is_active: location?.is_active !== undefined ? location.is_active === 1 : true,
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-xl border border-slate-800 p-6 max-w-lg w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{location ? 'Editar Locação' : 'Nova Locação'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Endereço"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ex: Armazém A, Prateleira 12, Caixa 3"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="bg-slate-800 border-slate-600"
            />
            <label className="text-sm text-slate-300">Locação ativa</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(form)}>Salvar</Button>
        </div>
      </motion.div>
    </div>
  );
}

// Modal de Saída (Check-out) - Integrado com OS
function ExitModal({
  item,
  locations,
  onClose,
  onSave,
}: {
  item: InventoryItem | null;
  locations: InventoryLocation[];
  onClose: () => void;
  onSave: (data: Partial<InventoryMovement>) => void;
}) {
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([]);
  const [maintenanceCalls, setMaintenanceCalls] = useState<MaintenanceCall[]>([]);
  const [form, setForm] = useState({
    item_id: item?.id || undefined,
    movement_type: 'exit' as const,
    quantity: 1,
    unit_cost: item?.unit_cost || undefined,
    reference_type: undefined as 'maintenance_order' | 'maintenance_call' | undefined,
    reference_id: undefined as number | undefined,
    location_id: item?.location_id || undefined,
    notes: '',
  });

  useEffect(() => {
    loadReferences();
  }, []);

  const loadReferences = async () => {
    try {
      setLoading(true);
      const [ordersResponse, callsResponse] = await Promise.all([
        fetchData<any>('/maintenance?status=execution&limit=50'),
        fetchData<any>('/calls?status=execution&limit=50'),
      ]);

      const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);
      const calls = Array.isArray(callsResponse) ? callsResponse : (callsResponse?.data || []);

      setMaintenanceOrders(orders);
      setMaintenanceCalls(calls);
    } catch (err) {
      console.error('Erro ao carregar referências:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.item_id || !form.quantity || form.quantity <= 0) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }
    if (form.quantity > (item?.current_quantity || 0)) {
      showError('Quantidade solicitada maior que o estoque disponível');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-xl border border-slate-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowDown className="w-6 h-6 text-red-400" />
              Saída de Material (Check-out)
            </h2>
            <p className="text-sm text-slate-400 mt-1">Registre a saída de material para uso em manutenção</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Item Selecionado */}
          {item && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-semibold text-green-400">{item.code}</span>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Estoque disponível: <span className="text-white font-semibold">{item.current_quantity} {item.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div>
            <Input
              type="number"
              label="Quantidade a Retirar *"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              min="1"
              max={item?.current_quantity || 9999}
              required
            />
            {item && form.quantity > item.current_quantity && (
              <p className="text-xs text-red-400 mt-1">Quantidade maior que o estoque disponível!</p>
            )}
          </div>

          {/* Vinculação com OS ou Chamado */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-400" />
              Vincular a Ordem de Serviço ou Chamado (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Referência</label>
            <select
                  value={form.reference_type || ''}
                  onChange={(e) => {
                    setForm({ 
                      ...form, 
                      reference_type: e.target.value as any || undefined,
                      reference_id: undefined 
                    });
                  }}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                  <option value="">Nenhuma</option>
                  <option value="maintenance_order">Ordem de Manutenção (OS)</option>
                  <option value="maintenance_call">Chamado de Manutenção</option>
            </select>
          </div>
              {form.reference_type && (
          <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {form.reference_type === 'maintenance_order' ? 'Ordem de Manutenção' : 'Chamado'}
                  </label>
            <select
                    value={form.reference_id || ''}
                    onChange={(e) => setForm({ ...form, reference_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                    <option value="">Selecione...</option>
                    {form.reference_type === 'maintenance_order' 
                      ? maintenanceOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            OS #{order.id} - {order.equipment_code} ({order.equipment_name})
                          </option>
                        ))
                      : maintenanceCalls.map((call) => (
                          <option key={call.id} value={call.id}>
                            Chamado #{call.id} - {call.equipment_code} ({call.equipment_name})
                          </option>
                        ))
                    }
            </select>
          </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Ao vincular a uma OS ou Chamado, o custo do material será automaticamente adicionado aos custos da manutenção
            </p>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Motivo da saída, técnico responsável, etc."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Registrar Saída
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Modal de Entrada (Check-in) - Integrado com OC
function EntryModal({
  item,
  locations,
  onClose,
  onSave,
}: {
  item: InventoryItem | null;
  locations: InventoryLocation[];
  onClose: () => void;
  onSave: (data: Partial<InventoryMovement>) => void;
}) {
  const { error: showError } = useToast();
  const [form, setForm] = useState({
    item_id: item?.id || undefined,
    movement_type: 'entry' as const,
    quantity: 1,
    unit_cost: item?.unit_cost || undefined,
    reference_type: undefined as 'purchase' | undefined,
    reference_id: undefined as number | undefined,
    location_id: item?.location_id || undefined,
    notes: '',
  });

  const handleSubmit = () => {
    if (!form.item_id || !form.quantity || form.quantity <= 0) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-xl border border-slate-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowUp className="w-6 h-6 text-green-400" />
              Entrada de Material (Check-in)
            </h2>
            <p className="text-sm text-slate-400 mt-1">Registre a entrada de material recebido</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Item Selecionado */}
          {item && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-semibold text-green-400">{item.code}</span>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Estoque atual: <span className="text-white font-semibold">{item.current_quantity} {item.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantidade e Custo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <Input
              type="number"
                label="Quantidade Recebida *"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                min="1"
              required
            />
            </div>
            <div>
            <Input
              type="number"
                label="Custo Unitário (R$) *"
              value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })}
              min="0"
              step="0.01"
                required
            />
              <p className="text-xs text-slate-500 mt-1">Custo de aquisição desta entrada</p>
          </div>
          </div>

          {/* Vinculação com Ordem de Compra */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-400" />
              Vincular a Ordem de Compra (Opcional)
            </h3>
          <div>
              <Input
                type="number"
                label="ID da Ordem de Compra"
                value={form.reference_id || ''}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : undefined;
                  setForm({ 
                    ...form, 
                    reference_id: id,
                    reference_type: id ? 'purchase' : undefined
                  });
                }}
                placeholder="Número da OC"
              />
              <p className="text-xs text-slate-500 mt-1">
                Se o material foi recebido através de uma ordem de compra, informe o número da OC
              </p>
            </div>
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Locação de Armazenamento</label>
            <select
              value={form.location_id || ''}
              onChange={(e) => setForm({ ...form, location_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Nenhuma</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
            <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Fornecedor, número da nota fiscal, condições de recebimento, etc."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Registrar Entrada
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Modal de Ajuste de Inventário
function AdjustmentModal({
  item,
  locations,
  onClose,
  onSave,
}: {
  item: InventoryItem | null;
  locations: InventoryLocation[];
  onClose: () => void;
  onSave: (data: Partial<InventoryMovement>) => void;
}) {
  const [form, setForm] = useState({
    item_id: item?.id || undefined,
    movement_type: 'adjustment' as const,
    quantity: item?.current_quantity || 0,
    unit_cost: item?.unit_cost || undefined,
    reference_type: undefined as 'adjustment' | undefined,
    reference_id: undefined as number | undefined,
    location_id: item?.location_id || undefined,
    notes: '',
  });

  const handleSubmit = () => {
    if (!form.item_id || form.quantity < 0) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }
    if (!form.notes.trim()) {
      showError('É obrigatório informar o motivo do ajuste');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-xl border border-slate-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-blue-400" />
              Ajuste de Inventário
            </h2>
            <p className="text-sm text-slate-400 mt-1">Corrija discrepâncias entre o sistema e o estoque físico</p>
            </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Item Selecionado */}
          {item && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-semibold text-green-400">{item.code}</span>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Estoque no sistema: <span className="text-white font-semibold">{item.current_quantity} {item.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantidade Ajustada */}
          <div>
              <Input
                type="number"
              label="Nova Quantidade (após contagem física) *"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              min="0"
              required
            />
            {item && form.quantity !== item.current_quantity && (
              <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  Diferença: {form.quantity > item.current_quantity ? '+' : ''}
                  {form.quantity - item.current_quantity} {item.unit}
                  {form.quantity > item.current_quantity ? ' (aumento)' : ' (redução)'}
                </p>
              </div>
            )}
          </div>

          {/* Motivo do Ajuste */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Motivo do Ajuste * <span className="text-red-400">(Obrigatório)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Descreva o motivo do ajuste: contagem física, item danificado, perda, etc."
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              É obrigatório informar o motivo para rastreabilidade e auditoria
            </p>
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Locação</label>
            <select
              value={form.location_id || ''}
              onChange={(e) => setForm({ ...form, location_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Nenhuma</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
        </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Registrar Ajuste
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
