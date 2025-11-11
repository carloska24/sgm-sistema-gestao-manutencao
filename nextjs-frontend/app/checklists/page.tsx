'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { fetchData, postData, putData, deleteData } from '@/lib/api';
import { ChecklistTemplate, ChecklistTemplateItem, ChecklistEntityType } from '@/types';
import {
  Plus,
  Trash2,
  Save,
  RefreshCw,
  XCircle,
  GripVertical,
  AlertCircle,
  Sparkles,
  Copy,
  Search,
  Filter,
  Package,
  Wrench,
  Calendar,
  X,
  CheckCircle,
  Camera,
  FileSignature,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
  ListChecks,
  Brain,
  Globe,
  Zap,
  FileText,
  Clock,
  Star,
  Info,
  Play,
  HelpCircle,
  ChevronUp,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function clsx(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface TemplateFormState {
  id?: number;
  name: string;
  description?: string;
  entity_type: ChecklistEntityType;
  entity_id?: number | null;
  is_active: boolean;
  items: ChecklistTemplateItem[];
}

const defaultItem = (): ChecklistTemplateItem => ({
  title: '',
  order_index: 0,
  input_type: 'boolean',
  required: true,
  requires_photo: false,
  requires_signature: false,
});

const entityOptions: { label: string; value: ChecklistEntityType; icon: any }[] = [
  { label: 'Plano Preventivo', value: 'preventive_plan', icon: Calendar },
  { label: 'Ordem de Manutenção', value: 'maintenance_order', icon: Wrench },
  { label: 'Equipamento', value: 'equipment', icon: Package },
  { label: 'Chamado', value: 'maintenance_call', icon: AlertCircle },
];

const inputOptions = [
  { label: 'Sim/Não', value: 'boolean' },
  { label: 'Numérico', value: 'number' },
  { label: 'Texto', value: 'text' },
  { label: 'Seleção múltipla', value: 'multi' },
];

// Componente de item arrastável melhorado
function SortableItem({
  item,
  index,
  onItemChange,
  onRemove,
}: {
  item: ChecklistTemplateItem;
  index: number;
  onItemChange: (index: number, field: keyof ChecklistTemplateItem, value: unknown) => void;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `item-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      id={`checklist-item-${index}`}
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={clsx(
        'relative rounded-lg border transition-all duration-300 overflow-hidden group scroll-mt-24',
        isDragging
          ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/50 shadow-lg shadow-green-500/20 ring-2 ring-green-500/30'
          : 'bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-slate-700/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/15'
      )}
    >
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/5 group-hover:to-purple-500/0 transition-all duration-300 pointer-events-none" />

      <div className="relative z-10 p-5 space-y-4">
        {/* Header - Número do item e Ações */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="text-slate-500 hover:text-purple-300 cursor-grab active:cursor-grabbing transition-colors p-1.5 rounded hover:bg-purple-500/10"
              title="Arrastar para reordenar"
            >
              <GripVertical className="w-5 h-5" />
            </button>

            {/* Item number - estilo badge premium */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white bg-gradient-to-r from-blue-500/30 to-purple-500/30 px-3 py-1 rounded-full border border-blue-400/40">
                Item #{index + 1}
              </span>
            </div>

            {/* Quick badges inline */}
            <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
              {item.required !== false && (
                <div title="Obrigatório" className="px-2 py-1 text-xs font-medium text-red-300 bg-red-500/20 rounded border border-red-400/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Obr.</span>
                </div>
              )}
              {item.requires_photo && (
                <div title="Requer foto" className="px-2 py-1 text-xs font-medium text-blue-300 bg-blue-500/20 rounded border border-blue-400/30">
                  <Camera className="w-3 h-3" />
                </div>
              )}
              {item.requires_signature && (
                <div title="Requer assinatura" className="px-2 py-1 text-xs font-medium text-purple-300 bg-purple-500/20 rounded border border-purple-400/30">
                  <FileSignature className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Delete button */}
          <button
            type="button"
            className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded transition-all border border-transparent hover:border-red-500/30"
            onClick={() => onRemove(index)}
            aria-label="Remover item"
            title="Remover item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Título - Campo principal */}
        <div>
          <Input
            label="Título do Item"
            value={item.title}
            onChange={e => onItemChange(index, 'title', e.target.value)}
            placeholder="Ex.: Verificar pressão de operação"
            required
            className="bg-slate-800/70 border-slate-600/50 focus:border-purple-500/50"
          />
        </div>

        {/* Instruções */}
        <div className="pt-2">
          <label className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Instruções Detalhadas
          </label>
          <textarea
            value={item.instructions || ''}
            onChange={e => onItemChange(index, 'instructions', e.target.value)}
            rows={3}
            className="w-full bg-slate-800/70 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none text-sm"
            placeholder="Detalhe os passos, procedimentos operacionais padrão (POP) ou observações importantes..."
          />
        </div>

        {/* Opções - Tipo e Flags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-slate-400" />
              Tipo de Resposta
            </label>
            <select
              value={item.input_type || 'boolean'}
              onChange={e => onItemChange(index, 'input_type', e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            >
              {inputOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes compactos */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Requer:</p>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer group hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={item.required !== false}
                  onChange={e => onItemChange(index, 'required', e.target.checked)}
                  className="w-4 h-4 bg-slate-800 border-slate-600 rounded cursor-pointer group-hover:border-red-500/50 transition-colors"
                />
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Obr.
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer group hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={item.requires_photo || false}
                  onChange={e => onItemChange(index, 'requires_photo', e.target.checked)}
                  className="w-4 h-4 bg-slate-800 border-slate-600 rounded cursor-pointer group-hover:border-blue-500/50 transition-colors"
                />
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Foto
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer group hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={item.requires_signature || false}
                  onChange={e => onItemChange(index, 'requires_signature', e.target.checked)}
                  className="w-4 h-4 bg-slate-800 border-slate-600 rounded cursor-pointer group-hover:border-purple-500/50 transition-colors"
                />
                <span className="flex items-center gap-1">
                  <FileSignature className="w-3.5 h-3.5" /> Assin.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Componente de Assistente IA inspirado na tela de planos
function ChecklistAIAssistant({
  entityType,
  entityName,
  entityDetails,
  onGenerateChecklist,
  isLoading,
}: {
  entityType: ChecklistEntityType;
  entityName?: string | null;
  entityDetails?: string | null;
  onGenerateChecklist: (input: { prompt: string; focus?: string }) => Promise<boolean>;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [focus, setFocus] = useState('');
  const { error: showError } = useToast();

  const entityTypeLabel = useMemo(() => {
    switch (entityType) {
      case 'preventive_plan':
        return 'Plano Preventivo';
      case 'maintenance_order':
        return 'Ordem de Manutenção';
      case 'equipment':
        return 'Equipamento';
      case 'maintenance_call':
        return 'Chamado';
      default:
        return null;
    }
  }, [entityType]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showError('Descreva o checklist que deseja gerar.');
      return;
    }

    const success = await onGenerateChecklist({
      prompt,
      focus,
    });

    if (success) {
      setPrompt('');
      setFocus('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-pink-500/30 hover:border-yellow-500/50 transition-all"
      >
        <div className="relative">
          <Brain className="w-4 h-4 text-yellow-400" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <Globe className="w-4 h-4 text-pink-400" />
        Gerar com IA
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-[500px] bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl rounded-xl border border-yellow-500/30 shadow-2xl p-5 z-50"
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/50">
              <div className="p-2.5 bg-gradient-to-br from-yellow-500/30 to-pink-500/30 rounded-lg border border-yellow-500/40">
                <Brain className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Assistente Inteligente de Checklists
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                    AI + Web
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gera itens profissionais de checklist considerando o contexto selecionado.
                </p>
              </div>
            </div>

            {(entityTypeLabel || entityName) && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">
                  {entityTypeLabel ? `${entityTypeLabel} selecionado:` : 'Contexto atual:'}
                </p>
                {entityName ? (
                  <p className="text-sm font-semibold text-white">{entityName}</p>
                ) : (
                  <p className="text-sm text-slate-300">
                    {entityType === 'maintenance_call'
                      ? 'Checklist genérico para chamados de manutenção'
                      : 'Checklist genérico para o tipo selecionado'}
                  </p>
                )}
                {entityDetails && <p className="text-xs text-slate-400 mt-1">{entityDetails}</p>}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Descreva o checklist desejado
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Ex.: Criar checklist preventivo semanal para máquina de solda seletiva, incluindo medições críticas e inspeções visuais."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Foco adicional (opcional)
                </label>
                <input
                  type="text"
                  value={focus}
                  onChange={e => setFocus(e.target.value)}
                  placeholder="Ex.: Priorizar inspeções elétricas e requisitos de segurança."
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                isLoading={isLoading}
                className="flex-1 flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-pink-500/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando checklist...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Checklist
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all border border-slate-700/0 hover:border-slate-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xs text-yellow-300 flex items-start gap-2">
                <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Dica:</strong> Informe tarefas críticas, medições obrigatórias e
                  requisitos de segurança. A IA monta a estrutura completa com itens obrigatórios e
                  opcionais.
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChecklistsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntityType, setFilterEntityType] = useState<ChecklistEntityType | ''>('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [form, setForm] = useState<TemplateFormState>({
    name: '',
    description: '',
    entity_type: 'preventive_plan',
    entity_id: null,
    is_active: true,
    items: [defaultItem()],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [entityOptionsList, setEntityOptionsList] = useState<
    Array<{ id: number; name: string; code?: string }>
  >([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedTemplate = useMemo(
    () => templates.find(tpl => tpl.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const selectedEntityInfo = useMemo(() => {
    if (!form.entity_id) {
      return null;
    }

    const entity = entityOptionsList.find(item => item.id === form.entity_id);
    if (!entity) {
      return null;
    }

    return {
      name: entity.name,
      details: entity.code ? `Código/Referência: ${entity.code}` : null,
    };
  }, [form.entity_id, entityOptionsList]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !filterEntityType || template.entity_type === filterEntityType;
      return matchesSearch && matchesFilter;
    });
  }, [templates, searchQuery, filterEntityType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/checklists`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      const result = await response.json();
      const templatesData =
        result.success && result.data ? result.data : Array.isArray(result) ? result : [];
      setTemplates(templatesData);

      // Se não há templates e não há filtro ativo, limpar filtros
      if (templatesData.length === 0 && !filterEntityType && !searchQuery) {
        // Templates vazios, tudo ok
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      error('Não foi possível carregar os checklists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Função para navegar até um item específico
  const scrollToItem = useCallback(
    (index: number) => {
      const totalItems = form.items.length;
      if (totalItems === 0) return;
      const clampedIndex = Math.max(0, Math.min(totalItems - 1, index));
      setActiveItemIndex(clampedIndex);
    },
    [form.items.length]
  );

  // Navegação com teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (form.items.length === 0) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex =
          e.key === 'ArrowLeft'
            ? Math.max(0, activeItemIndex - 1)
            : Math.min(form.items.length - 1, activeItemIndex + 1);
        scrollToItem(nextIndex);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [form.items.length, activeItemIndex, scrollToItem]);

  useEffect(() => {
    if (form.items.length === 0) {
      setActiveItemIndex(0);
      return;
    }

    if (activeItemIndex > form.items.length - 1) {
      scrollToItem(form.items.length - 1);
    }
  }, [form.items.length, activeItemIndex, scrollToItem]);

  // Carregar lista de entidades baseado no tipo selecionado
  const loadEntityOptions = async (entityType: ChecklistEntityType) => {
    if (!entityType || entityType === 'maintenance_call') {
      setEntityOptionsList([]);
      return;
    }

    try {
      setLoadingEntities(true);
      let endpoint = '';

      switch (entityType) {
        case 'equipment':
          endpoint = '/equipment?limit=1000';
          break;
        case 'maintenance_order':
          endpoint = '/maintenance?limit=1000';
          break;
        case 'preventive_plan':
          endpoint = '/plans?limit=1000';
          break;
        default:
          setEntityOptionsList([]);
          return;
      }

      const data = await fetchData<any[]>(endpoint);

      if (entityType === 'equipment') {
        setEntityOptionsList(
          (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.code,
          }))
        );
      } else if (entityType === 'maintenance_order') {
        setEntityOptionsList(
          (data || []).map((item: any) => ({
            id: item.id,
            name: `${item.equipment_name || 'OS'} - ${item.plan_name || 'Ordem de Manutenção'}`,
            code: item.id?.toString(),
          }))
        );
      } else if (entityType === 'preventive_plan') {
        setEntityOptionsList(
          (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.frequency,
          }))
        );
      }
    } catch (err) {
      console.error('Erro ao carregar entidades:', err);
      error('Erro ao carregar lista de entidades');
      setEntityOptionsList([]);
    } finally {
      setLoadingEntities(false);
    }
  };

  // Carregar entidades quando o tipo mudar
  useEffect(() => {
    if (form.entity_type) {
      loadEntityOptions(form.entity_type);
    } else {
      setEntityOptionsList([]);
    }
  }, [form.entity_type]);

  // Limpar filtros quando não há templates e filtro está ativo
  useEffect(() => {
    if (templates.length === 0 && filterEntityType) {
      // Não limpar automaticamente, deixar o usuário decidir
    }
  }, [templates.length, filterEntityType]);

  useEffect(() => {
    if (selectedTemplate) {
      setForm({
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        description: selectedTemplate.description || '',
        entity_type: selectedTemplate.entity_type,
        entity_id: selectedTemplate.entity_id || null,
        is_active: selectedTemplate.is_active ?? true,
        items: selectedTemplate.items?.length
          ? selectedTemplate.items.map(item => ({
              id: item.id,
              title: item.title,
              instructions: item.instructions || '',
              order_index: item.order_index ?? 0,
              input_type: item.input_type || 'boolean',
              required: item.required !== false,
              requires_photo: item.requires_photo || false,
              requires_signature: item.requires_signature || false,
            }))
          : [defaultItem()],
      });
    }
  }, [selectedTemplate]);

  const resetForm = () => {
    setSelectedTemplateId(null);
    setForm({
      name: '',
      description: '',
      entity_type: 'preventive_plan',
      entity_id: null,
      is_active: true,
      items: [defaultItem()],
    });
  };

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...defaultItem(), order_index: prev.items.length }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order_index: i })),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setForm(prev => {
        const oldIndex = parseInt(String(active.id).replace('item-', ''));
        const newIndex = parseInt(String(over.id).replace('item-', ''));

        return {
          ...prev,
          items: arrayMove(prev.items, oldIndex, newIndex).map((item, i) => ({
            ...item,
            order_index: i,
          })),
        };
      });
    }
  };

  const handleItemChange = (index: number, field: keyof ChecklistTemplateItem, value: unknown) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      error('Nome do checklist é obrigatório');
      return;
    }
    if (form.items.length === 0 || form.items.some(item => !item.title.trim())) {
      error('Adicione pelo menos um item com título');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name: form.name,
        description: form.description,
        entity_type: form.entity_type,
        entity_id: form.entity_id ? Number(form.entity_id) : null,
        is_active: form.is_active,
        items: form.items.map((item, index) => ({
          order_index: index,
          title: item.title,
          instructions: item.instructions,
          input_type: item.input_type || 'boolean',
          required: item.required ?? true,
          requires_photo: item.requires_photo ?? false,
          requires_signature: item.requires_signature ?? false,
        })),
      };

      if (form.id) {
        await putData(`/checklists/${form.id}`, payload);
        success('Checklist atualizado com sucesso');
      } else {
        await postData('/checklists', payload);
        success('Checklist criado com sucesso');
      }

      await loadTemplates();
      resetForm();
    } catch (err) {
      console.error(err);
      error('Erro ao salvar checklist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm('Deseja excluir este checklist? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteData(`/checklists/${id}`);
      success('Checklist excluído com sucesso');
      await loadTemplates();
      if (selectedTemplateId === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      error('Erro ao excluir checklist');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await putData(`/checklists/${id}`, { is_active: !isActive });
      await loadTemplates();
      success(isActive ? 'Checklist desativado' : 'Checklist ativado');
    } catch (err) {
      console.error(err);
      error('Erro ao atualizar status');
    }
  };

  const handleDuplicate = async (template: ChecklistTemplate) => {
    try {
      const payload = {
        name: `${template.name} (Cópia)`,
        description: template.description,
        entity_type: template.entity_type,
        entity_id: null,
        is_active: true,
        items:
          template.items?.map(item => ({
            order_index: item.order_index ?? 0,
            title: item.title,
            instructions: item.instructions,
            input_type: item.input_type || 'boolean',
            required: item.required !== false,
            requires_photo: item.requires_photo || false,
            requires_signature: item.requires_signature || false,
          })) || [],
      };

      await postData('/checklists', payload);
      success('Checklist duplicado com sucesso');
      await loadTemplates();
    } catch (err) {
      console.error(err);
      error('Erro ao duplicar checklist');
    }
  };

  const handleAIGenerate = async ({ prompt, focus }: { prompt: string; focus?: string }) => {
    try {
      setIsAssistantLoading(true);

      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        error('Descreva o checklist que deseja gerar.');
        return false;
      }

      const promptSegments = [trimmedPrompt];
      if (focus && focus.trim()) {
        promptSegments.push(`Áreas de foco adicionais: ${focus.trim()}`);
      }

      const combinedPrompt = promptSegments.join('\n\n');

      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: combinedPrompt,
          entityType: form.entity_type,
          entityId: form.entity_id,
        }),
      });

      if (!response.ok) {
        let message = 'Erro ao gerar checklist com IA.';
        try {
          const errorPayload = await response.json();
          if (errorPayload?.error) {
            message = errorPayload.error;
          }
        } catch {
          // Ignora erro de parsing do corpo
        }
        throw new Error(message);
      }

      const result = await response.json();
      const itens = result.itens; // Assumindo que a API retorna { itens: [...] }
      const tituloSugerido = result.titulo_sugerido;

      if (!Array.isArray(itens) || itens.length === 0) {
        error('A IA não gerou itens de checklist. Tente um prompt diferente.');
        return false;
      }

      const mappedItems: ChecklistTemplateItem[] = itens.map((item: any, index: number) => ({
        title:
          typeof item?.titulo === 'string' && item.titulo.trim()
            ? item.titulo.trim()
            : `Item ${index + 1}`,
        instructions: typeof item?.instrucoes === 'string' ? item.instrucoes : '',
        order_index: index,
        input_type: 'boolean',
        required: item?.obrigatorio ?? true, // Default para true
        requires_photo: item?.requer_foto ?? false,
        requires_signature: item?.requer_assinatura ?? false,
      }));

      setForm(prev => ({
        ...prev,
        name: tituloSugerido && typeof tituloSugerido === 'string' ? tituloSugerido : prev.name,
        items: mappedItems.length ? mappedItems : [defaultItem()],
      }));
      success('Checklist gerado com sucesso! Revise e ajuste conforme necessário.');
      return true;
    } catch (err) {
      console.error('Erro ao gerar checklist com IA:', err);
      const message = err instanceof Error ? err.message : 'Erro ao gerar checklist com IA.';
      error(message);
      return false;
    } finally {
      setIsAssistantLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-full p-4 sm:p-6 lg:p-8">
        {/* HEADER PREMIUM COM DESIGN FORTE */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl border border-purple-500/20 backdrop-blur-sm"
        >
          {/* Background com gradiente profundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800/50 to-slate-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent" />
          
          {/* Glow effects minimalistas */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/5 via-transparent to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent rounded-full blur-3xl" />

          <div className="relative z-10 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Seção Esquerda - Premium */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-5">
                  {/* Ícone com design forte */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl blur-lg" />
                    <div className="relative w-16 h-16 p-3 bg-gradient-to-br from-purple-500/40 to-blue-500/30 rounded-xl border border-purple-400/50 flex items-center justify-center">
                      <Brain className="w-9 h-9 text-purple-200" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-white leading-tight">Checklists Inteligentes</h1>
                    <p className="text-slate-400 text-sm mt-1">Crie templates profissionais com assistência de IA</p>
                    
                    {/* Quick stats em linha */}
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs font-medium text-blue-300 flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" />
                        {templates.length} templates
                      </span>
                      <span className="text-xs font-medium text-green-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {templates.filter(t => t.is_active).length} ativos
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Direita - Ações */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 flex-shrink-0"
              >
                {/* BOTÕES REMOVIDOS DAQUI */}
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Templates */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                Templates Disponíveis
              </h2>
              <span className="text-xs font-semibold text-slate-300 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1.5 rounded-full border border-blue-500/30">
                {filteredTemplates.length}{' '}
                {filteredTemplates.length === 1 ? 'template' : 'templates'}
              </span>
            </div>

            {/* Busca e Filtros */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Filtrar por tipo
                </label>
                <select
                  value={filterEntityType}
                  onChange={e => setFilterEntityType(e.target.value as ChecklistEntityType | '')}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                >
                  <option value="">Todos os tipos</option>
                  {entityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Templates */}
            <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/60 overflow-hidden shadow-xl">
              {loading && (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Carregando templates...</p>
                </div>
              )}
              {!loading && filteredTemplates.length === 0 && (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 mb-1">
                    {searchQuery || filterEntityType
                      ? 'Nenhum template encontrado com os filtros aplicados'
                      : 'Nenhum checklist cadastrado'}
                  </p>
                  {searchQuery || filterEntityType ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterEntityType('');
                      }}
                      className="text-xs text-green-400 hover:text-green-300 mt-2 underline"
                    >
                      Limpar filtros
                    </button>
                  ) : null}
                </div>
              )}
              <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
                {filteredTemplates.map((template, idx) => {
                  const EntityIcon =
                    entityOptions.find(opt => opt.value === template.entity_type)?.icon || Package;
                  const itemCount = template.items?.length || 0;
                  const hasRequiredItems = template.items?.some(item => item.required) || false;
                  const hasPhotos = template.items?.some(item => item.requires_photo) || false;
                  const hasSignatures =
                    template.items?.some(item => item.requires_signature) || false;

                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={clsx(
                        'group p-5 cursor-pointer transition-all border-l-4 relative overflow-hidden',
                        selectedTemplateId === template.id
                          ? 'bg-gradient-to-r from-green-500/10 via-slate-800/70 to-slate-800/70 border-l-green-500 shadow-lg shadow-green-500/10'
                          : 'hover:bg-gradient-to-r hover:from-slate-800/50 hover:via-slate-800/40 hover:to-slate-800/40 border-l-transparent hover:border-l-purple-500/50'
                      )}
                      onClick={() => setSelectedTemplateId(template.id || null)}
                    >
                      <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={clsx(
                              'p-2.5 rounded-lg flex-shrink-0 transition-all',
                              selectedTemplateId === template.id
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-slate-800/50 border border-slate-700/50 group-hover:bg-purple-500/20 group-hover:border-purple-500/30'
                            )}
                          >
                            <EntityIcon
                              className={clsx(
                                'w-5 h-5 transition-colors',
                                selectedTemplateId === template.id
                                  ? 'text-green-400'
                                  : 'text-slate-400 group-hover:text-purple-400'
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-semibold truncate group-hover:text-purple-300 transition-colors">
                                {template.name}
                              </h3>
                              {template.is_active && (
                                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                            </div>

                            {template.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                {template.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-slate-300 capitalize px-2.5 py-1 bg-slate-800/70 rounded-md border border-slate-700/50 flex items-center gap-1.5">
                                <EntityIcon className="w-3 h-3" />
                                {template.entity_type.replace('_', ' ')}
                              </span>

                              <span className="text-xs text-slate-400 px-2.5 py-1 bg-slate-800/50 rounded-md border border-slate-700/30 flex items-center gap-1.5">
                                <ListChecks className="w-3 h-3" />
                                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                              </span>

                              {hasRequiredItems && (
                                <span className="text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded-md border border-red-500/30 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Obrigatórios
                                </span>
                              )}

                              {hasPhotos && (
                                <span className="text-xs text-blue-400 px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/30 flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  Fotos
                                </span>
                              )}

                              {hasSignatures && (
                                <span className="text-xs text-purple-400 px-2 py-1 bg-purple-500/10 rounded-md border border-purple-500/30 flex items-center gap-1">
                                  <FileSignature className="w-3 h-3" />
                                  Assinatura
                                </span>
                              )}

                              <span
                                className={clsx(
                                  'text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5',
                                  template.is_active
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : 'bg-slate-700/50 text-slate-300 border-slate-600'
                                )}
                              >
                                {template.is_active ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Ativo
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    Inativo
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-blue-500/0 hover:border-blue-500/30"
                            onClick={e => {
                              e.stopPropagation();
                              handleDuplicate(template);
                            }}
                            title="Duplicar template"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/0 hover:border-red-500/30"
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(template.id);
                            }}
                            title="Excluir template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Formulário de Edição */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {form.id ? (
                  <>
                    <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                      <Edit className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Editar Template</h2>
                      <p className="text-xs text-slate-400">Modifique os detalhes do checklist</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                      <Plus className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Novo Template</h2>
                      <p className="text-xs text-slate-400">Crie um novo checklist inteligente</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!form.id && (
                  <ChecklistAIAssistant
                    entityType={form.entity_type}
                    entityName={selectedEntityInfo?.name}
                    entityDetails={selectedEntityInfo?.details}
                    onGenerateChecklist={handleAIGenerate}
                    isLoading={isAssistantLoading}
                  />
                )}
                {form.id && (
                  <Button
                    variant="primary"
                    onClick={() => handleToggleActive(form.id, form.is_active)}
                    isLoading={isSaving}
                    className="flex items-center gap-2"
                  >
                    {form.is_active ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Ativar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Card Principal do Formulário */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 shadow-xl p-6 space-y-6 hover:border-slate-600/50 transition-all"
            >
              {/* Informações Básicas - Seção com Card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 pb-6 border-b border-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                    <FileSignature className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Informações Básicas
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome do Checklist"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex.: Checklist Preventivo - Compressor de Ar"
                    required
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      Tipo de Associação
                    </label>
                    <select
                      value={form.entity_type}
                      onChange={e => {
                        const newType = e.target.value as ChecklistEntityType;
                        setForm(prev => ({ ...prev, entity_type: newType, entity_id: null }));
                      }}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    >
                      {entityOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Define onde este checklist será aplicado automaticamente
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-400" />
                      Entidade Específica (opcional)
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (form.entity_type && form.entity_type !== 'maintenance_call') {
                            setShowEntitySelector(true);
                          }
                        }}
                        disabled={
                          !form.entity_type ||
                          form.entity_type === 'maintenance_call' ||
                          loadingEntities
                        }
                        className={clsx(
                          'w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-left text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all flex items-center justify-between',
                          (!form.entity_type ||
                            form.entity_type === 'maintenance_call' ||
                            loadingEntities) &&
                            'opacity-50 cursor-not-allowed',
                          'hover:border-slate-600/50'
                        )}
                      >
                        <span className="truncate">
                          {loadingEntities ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Carregando...
                            </span>
                          ) : form.entity_id ? (
                            entityOptionsList.find(e => e.id === form.entity_id)?.name ||
                            `ID: ${form.entity_id}`
                          ) : (
                            <span className="text-slate-500">
                              Selecione uma entidade específica (opcional)
                            </span>
                          )}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                      </button>
                      {form.entity_id && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, entity_id: null }))}
                          className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title="Remover seleção"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      {form.entity_type === 'maintenance_call'
                        ? 'Chamados não suportam associação específica'
                        : form.entity_id
                        ? 'Checklist será aplicado apenas nesta entidade específica'
                        : 'Deixe vazio para aplicar a todas as entidades deste tipo'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                      placeholder="Descreva o contexto e objetivo deste checklist..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Itens do Checklist - Seção com Card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-4 pt-6 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                      <ListChecks className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                      Itens do Checklist · {form.items.length}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botões de navegação rápida */}
                    {form.items.length > 1 && (
                      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg border border-slate-700/50 p-1">
                        <button
                          onClick={() => {
                            const currentIndex = activeItemIndex ?? 0;
                            if (currentIndex > 0) {
                              scrollToItem(currentIndex - 1);
                            }
                          }}
                          disabled={activeItemIndex === 0 || activeItemIndex === null}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-slate-700/50"
                          title="Item anterior (Ctrl+↑)"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-700/50" />
                        <button
                          onClick={() => {
                            const currentIndex = activeItemIndex ?? 0;
                            if (currentIndex < form.items.length - 1) {
                              scrollToItem(currentIndex + 1);
                            }
                          }}
                          disabled={activeItemIndex === form.items.length - 1 || activeItemIndex === null}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-slate-700/50"
                          title="Próximo item (Ctrl+↓)"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddItem}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Item
                    </Button>
                  </div>
                </div>

                {form.items.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30 border-dashed">
                    <div className="p-4 bg-slate-800/50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-400 mb-2 font-medium">Nenhum item adicionado</p>
                    <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
                      Adicione itens para criar um checklist completo e profissional
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddItem}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Primeiro Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-slate-300">
                          Arraste os itens para reordenar
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {form.items.filter(i => i.required !== false).length} obrigatórios
                      </span>
                    </div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={form.items.map((_, i) => `item-${i}`)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="w-full flex items-center justify-center">
                          <div className="relative w-full">
                            {/* Controles esquerda/direita */}
                            {form.items.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => scrollToItem(Math.max(0, activeItemIndex - 1))}
                                  disabled={activeItemIndex === 0}
                                  className="absolute -left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                  title="Anterior"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => scrollToItem(Math.min(form.items.length - 1, activeItemIndex + 1))}
                                  disabled={activeItemIndex === form.items.length - 1}
                                  className="absolute -right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                  title="Próximo"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </>
                            )}

                            {/* Indicador */}
                            <div className="absolute -top-8 right-0 text-xs text-slate-400">
                              Item {activeItemIndex + 1} de {form.items.length}
                            </div>

                            {/* Card atual */}
                            {form.items[activeItemIndex] && (
                              <SortableItem
                                key={`item-${activeItemIndex}`}
                                item={form.items[activeItemIndex]}
                                index={activeItemIndex}
                                onItemChange={handleItemChange}
                                onRemove={handleRemoveItem}
                              />
                            )}
                          </div>
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
              <Button variant="secondary" onClick={resetForm} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {form.id ? 'Salvar Alterações' : 'Salvar Checklist'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Modal de Seleção de Entidade */}
        <AnimatePresence>
          {showEntitySelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowEntitySelector(false);
                setEntitySearchQuery('');
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-xl border border-slate-700/50 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
              >
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
                        <Filter className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Selecionar{' '}
                          {entityOptions.find(opt => opt.value === form.entity_type)?.label}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Escolha uma entidade específica ou deixe vazio para aplicar a todas
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowEntitySelector(false);
                        setEntitySearchQuery('');
                      }}
                      className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar..."
                      value={entitySearchQuery}
                      onChange={e => setEntitySearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700/50"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingEntities ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                      <span className="ml-3 text-slate-400">Carregando entidades...</span>
                    </div>
                  ) : entityOptionsList.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">Nenhuma entidade encontrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Opção "Todas" */}
                      <button
                        onClick={() => {
                          setForm(prev => ({ ...prev, entity_id: null }));
                          setShowEntitySelector(false);
                          setEntitySearchQuery('');
                        }}
                        className={clsx(
                          'w-full p-4 rounded-lg border transition-all text-left',
                          !form.entity_id
                            ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30'
                            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                              !form.entity_id
                                ? 'border-purple-400 bg-purple-500/20'
                                : 'border-slate-600'
                            )}
                          >
                            {!form.entity_id && <CheckCircle className="w-3 h-3 text-purple-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium">Todas as entidades deste tipo</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Checklist será aplicado automaticamente a todas as entidades do tipo "
                              {entityOptions.find(opt => opt.value === form.entity_type)?.label}"
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Lista de entidades */}
                      {entityOptionsList
                        .filter(
                          entity =>
                            !entitySearchQuery ||
                            entity.name.toLowerCase().includes(entitySearchQuery.toLowerCase()) ||
                            entity.code?.toLowerCase().includes(entitySearchQuery.toLowerCase())
                        )
                        .map(entity => (
                          <button
                            key={entity.id}
                            onClick={() => {
                              setForm(prev => ({ ...prev, entity_id: entity.id }));
                              setShowEntitySelector(false);
                              setEntitySearchQuery('');
                            }}
                            className={clsx(
                              'w-full p-4 rounded-lg border transition-all text-left',
                              form.entity_id === entity.id
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30'
                                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={clsx(
                                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                                  form.entity_id === entity.id
                                    ? 'border-green-400 bg-green-500/20'
                                    : 'border-slate-600'
                                )}
                              >
                                {form.entity_id === entity.id && (
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{entity.name}</p>
                                {entity.code && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Código: {entity.code}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
