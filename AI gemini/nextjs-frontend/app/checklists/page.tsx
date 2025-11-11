'use client';

import { useEffect, useMemo, useState } from 'react';
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
  ChevronUp,
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
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'border rounded-xl p-5 space-y-4 bg-gradient-to-br from-slate-900/90 to-slate-800/70 relative overflow-hidden',
        isDragging
          ? 'ring-2 ring-green-500/50 border-green-500/50 shadow-lg shadow-green-500/20'
          : 'border-slate-700/50',
        'hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all group'
      )}
    >
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/5 group-hover:to-purple-500/0 transition-all duration-300 pointer-events-none"></div>

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mt-2 text-slate-500 hover:text-purple-400 cursor-grab active:cursor-grabbing transition-colors p-2 rounded-lg hover:bg-purple-500/10 border border-purple-500/0 hover:border-purple-500/30"
            title="Arrastar para reordenar"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-bold text-slate-300 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-2.5 py-1 rounded-md border border-blue-500/30">
                Item #{index + 1}
              </span>
              {item.required !== false && (
                <span className="text-xs text-red-400 flex items-center gap-1 px-2.5 py-1 bg-red-500/10 rounded-md border border-red-500/30 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Obrigatório
                </span>
              )}
              {item.requires_photo && (
                <span className="text-xs text-blue-400 flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 rounded-md border border-blue-500/30 font-medium">
                  <Camera className="w-3 h-3" />
                  Foto
                </span>
              )}
              {item.requires_signature && (
                <span className="text-xs text-purple-400 flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 rounded-md border border-purple-500/30 font-medium">
                  <FileSignature className="w-3 h-3" />
                  Assinatura
                </span>
              )}
            </div>
            <Input
              label="Título do Item"
              value={item.title}
              onChange={e => onItemChange(index, 'title', e.target.value)}
              placeholder="Ex.: Verificar pressão de operação"
              required
              className="bg-slate-800/50 border-slate-700/50 focus:border-purple-500/50"
            />
          </div>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-red-400 mt-8 p-2.5 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/0 hover:border-red-500/30"
          onClick={() => onRemove(index)}
          aria-label="Remover item"
          title="Remover item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          Instruções Detalhadas
        </label>
        <textarea
          value={item.instructions || ''}
          onChange={e => onItemChange(index, 'instructions', e.target.value)}
          rows={3}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
          placeholder="Detalhe os passos, procedimentos operacionais padrão (POP) ou observações importantes..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-slate-400" />
            Tipo de Resposta
          </label>
          <select
            value={item.input_type || 'boolean'}
            onChange={e => onItemChange(index, 'input_type', e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          >
            {inputOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 flex-wrap pt-7">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
            <input
              type="checkbox"
              checked={item.required !== false}
              onChange={e => onItemChange(index, 'required', e.target.checked)}
              className="bg-slate-800 border-slate-600 rounded cursor-pointer group-hover:border-red-500/50 transition-colors"
            />
            <span className="group-hover:text-slate-200 transition-colors flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Obrigatório
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
            <input
              type="checkbox"
              checked={item.requires_photo || false}
              onChange={e => onItemChange(index, 'requires_photo', e.target.checked)}
              className="bg-slate-800 border-slate-600 rounded cursor-pointer group-hover:border-blue-500/50 transition-colors"
            />
            <span className="group-hover:text-slate-200 transition-colors flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" /> Foto
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
            <input
              type="checkbox"
              checked={item.requires_signature || false}
              onChange={e => onItemChange(index, 'requires_signature', e.target.checked)}
              className="bg-slate-800 border-slate-600 rounded cursor-pointer group-hover:border-purple-500/50 transition-colors"
            />
            <span className="group-hover:text-slate-200 transition-colors flex items-center gap-1">
              <FileSignature className="w-3.5 h-3.5" /> Assinatura
            </span>
          </label>
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
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-pink-500/30"
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
            className="absolute top-full mt-2 right-0 w-[500px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-yellow-500/30 shadow-2xl p-5 z-50"
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

      const data = await response.json();
      const itens = Array.isArray(data?.itens) ? data.itens : [];

      if (!itens.length) {
        throw new Error('Nenhum item retornado pela IA. Tente tornar o prompt mais específico.');
      }

      const mappedItems: ChecklistTemplateItem[] = itens.map((item: any, index: number) => ({
        title:
          typeof item?.titulo === 'string' && item.titulo.trim()
            ? item.titulo.trim()
            : `Item ${index + 1}`,
        instructions: typeof item?.instrucoes === 'string' ? item.instrucoes : '',
        order_index: index,
        input_type: 'boolean',
        required: item?.obrigatorio !== undefined ? Boolean(item.obrigatorio) : true,
        requires_photo: false,
        requires_signature: false,
      }));

      setForm(prev => ({
        ...prev,
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
      <div className="space-y-6 max-w-full pt-4 pb-8">
        {/* Header Melhorado com Ícone de IA */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="relative p-4 bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-cyan-600/30 rounded-2xl border border-purple-500/40 shadow-lg shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
              <Brain className="w-10 h-10 text-purple-300 relative z-10 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-ping"></div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 font-poppins flex items-center gap-3">
                Checklists Inteligentes
                <span className="text-sm font-normal text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                  Powered by AI
                </span>
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl">
                Crie templates profissionais e inteligentes para manutenção preventiva e corretiva
                com assistência de IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-1 flex-wrap">
            <ChecklistAIAssistant
              entityType={form.entity_type}
              entityName={selectedEntityInfo?.name}
              entityDetails={selectedEntityInfo?.details}
              onGenerateChecklist={handleAIGenerate}
              isLoading={isAssistantLoading}
            />
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  setLoading(true);
                  const token = localStorage.getItem('token');

                  if (!token) {
                    error('Você precisa estar logado para criar templates');
                    return;
                  }

                  console.log('Criando templates prontos...');

                  const response = await fetch(
                    `${
                      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                    }/checklists/seed-templates`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      credentials: 'include',
                    }
                  );

                  console.log('Resposta recebida:', response.status, response.statusText);

                  const result = await response.json();
                  console.log('Resultado:', result);

                  if (response.ok && result.success) {
                    success(result.message || 'Templates prontos criados com sucesso!');
                    // Aguardar um pouco antes de recarregar para garantir que os dados foram salvos
                    setTimeout(async () => {
                      await loadTemplates();
                    }, 500);
                  } else {
                    const errorMsg =
                      result.error || result.message || 'Erro ao criar templates prontos';
                    console.error('Erro na resposta:', errorMsg);
                    error(errorMsg);
                  }
                } catch (err) {
                  console.error('Erro ao criar templates prontos:', err);
                  error(
                    `Erro ao criar templates prontos: ${
                      err instanceof Error ? err.message : 'Erro desconhecido'
                    }`
                  );
                } finally {
                  setLoading(false);
                }
              }}
              isLoading={loading}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Templates Prontos
            </Button>
            <Button
              variant="secondary"
              onClick={loadTemplates}
              isLoading={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Atualizar
            </Button>
            <Button variant="primary" onClick={resetForm} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Templates Melhorado */}
          <div className="lg:col-span-1 space-y-4">
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
                  ) : (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-slate-500 mb-3">
                        Clique em "Templates Prontos" para criar templates profissionais de
                        manutenção
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');

                            if (!token) {
                              error('Você precisa estar logado para criar templates');
                              return;
                            }

                            console.log('Criando templates prontos...');

                            const response = await fetch(
                              `${
                                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                              }/checklists/seed-templates`,
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                credentials: 'include',
                              }
                            );

                            console.log('Resposta recebida:', response.status, response.statusText);

                            const result = await response.json();
                            console.log('Resultado:', result);

                            if (response.ok && result.success) {
                              success(result.message || 'Templates prontos criados com sucesso!');
                              setTimeout(async () => {
                                await loadTemplates();
                              }, 500);
                            } else {
                              const errorMsg =
                                result.error || result.message || 'Erro ao criar templates prontos';
                              console.error('Erro na resposta:', errorMsg);
                              error(errorMsg);
                            }
                          } catch (err) {
                            console.error('Erro ao criar templates prontos:', err);
                            error(
                              `Erro ao criar templates prontos: ${
                                err instanceof Error ? err.message : 'Erro desconhecido'
                              }`
                            );
                          } finally {
                            setLoading(false);
                          }
                        }}
                        isLoading={loading}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <Sparkles className="w-4 h-4" /> Criar Templates Prontos
                      </Button>
                    </div>
                  )}
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
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/5 group-hover:to-purple-500/0 transition-all duration-300"></div>

                      <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Ícone do tipo de entidade */}
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
                            {/* Nome do template */}
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-semibold truncate group-hover:text-purple-300 transition-colors">
                                {template.name}
                              </h3>
                              {template.is_active && (
                                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                            </div>

                            {/* Descrição */}
                            {template.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                {template.description}
                              </p>
                            )}

                            {/* Badges e informações */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Tipo de associação */}
                              <span className="text-xs font-medium text-slate-300 capitalize px-2.5 py-1 bg-slate-800/70 rounded-md border border-slate-700/50 flex items-center gap-1.5">
                                <EntityIcon className="w-3 h-3" />
                                {template.entity_type.replace('_', ' ')}
                              </span>

                              {/* Contador de itens */}
                              <span className="text-xs text-slate-400 px-2.5 py-1 bg-slate-800/50 rounded-md border border-slate-700/30 flex items-center gap-1.5">
                                <ListChecks className="w-3 h-3" />
                                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                              </span>

                              {/* Indicadores de recursos */}
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

                              {/* Status */}
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

                        {/* Botões de ação */}
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
          </div>

          {/* Formulário de Edição Melhorado */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
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
              {form.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleActive(form.id!, form.is_active)}
                  className="flex items-center gap-2"
                >
                  {form.is_active ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {form.is_active ? 'Desativar' : 'Ativar'}
                </Button>
              )}
            </div>

            {/* Card Principal do Formulário */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 shadow-xl p-6 space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileSignature className="w-4 h-4" />
                    Informações Básicas
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowHelpPanel(prev => !prev)}
                    className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/80"
                  >
                    <HelpCircle className="w-4 h-4" />
                    {showHelpPanel ? 'Ocultar ajuda' : 'Ajuda passo a passo'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Preencha os campos principais do checklist. Se precisar de orientação, clique em{' '}
                  <span className="text-slate-300 font-semibold">Ajuda passo a passo</span>.
                </p>

                {/* Card Explicativo */}
                <AnimatePresence>
                  {showHelpPanel && (
                    <motion.div
                      key="checklist-help"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-lg border border-blue-500/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 flex-shrink-0">
                          <Info className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            Como os Checklists são Aplicados?
                            <Zap className="w-4 h-4 text-yellow-400" />
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            Os checklists são aplicados{' '}
                            <strong className="text-white">automaticamente</strong> quando você cria
                            ou executa uma Ordem de Serviço (OS), Chamado ou Plano Preventivo.
                          </p>

                          {/* Guia Passo a Passo */}
                          <div className="space-y-3 mb-3">
                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold border border-purple-500/30">
                                  1
                                </span>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-white mb-1">
                                    Crie o Checklist Template
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Defina o{' '}
                                    <strong className="text-slate-300">Tipo de Associação</strong>{' '}
                                    (ex: "Equipamento") e opcionalmente selecione uma{' '}
                                    <strong className="text-slate-300">Entidade Específica</strong>{' '}
                                    (ex: um equipamento específico).
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">
                                  2
                                </span>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-white mb-1">
                                    O Sistema Aplica Automaticamente
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Quando você criar ou executar uma{' '}
                                    <strong className="text-slate-300">
                                      Ordem de Serviço (OS)
                                    </strong>{' '}
                                    para um equipamento, o sistema busca automaticamente o checklist
                                    correspondente e o exibe na página de execução da OS.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold border border-blue-500/30">
                                  3
                                </span>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-white mb-1">
                                    Execute o Checklist
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Na página da OS, você verá o checklist aparecer automaticamente.
                                    Preencha os itens, adicione fotos e assinaturas conforme
                                    necessário.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Exemplos Práticos */}
                          <div className="mt-4 pt-3 border-t border-slate-700/50">
                            <p className="text-xs font-semibold text-white mb-2">
                              💡 Exemplos Práticos:
                            </p>
                            <div className="space-y-2 text-xs text-slate-400">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong className="text-slate-300">Checklist Genérico:</strong>{' '}
                                  Tipo "Equipamento" sem entidade específica → Será aplicado a TODOS
                                  os equipamentos quando uma OS for criada.
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong className="text-slate-300">Checklist Específico:</strong>{' '}
                                  Tipo "Equipamento" + selecionar "Compressor de Ar" → Será aplicado
                                  APENAS quando uma OS for criada para esse equipamento específico.
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong className="text-slate-300">Checklist para OS:</strong>{' '}
                                  Tipo "Ordem de Manutenção" → Será aplicado quando você executar
                                  qualquer OS do tipo preventivo.
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Simulação Visual do Processo */}
                          <div className="mt-4 pt-3 border-t border-slate-700/50">
                            <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                              <Play className="w-4 h-4 text-purple-400" />
                              Simulação Completa: Criar Equipamento e Associar Checklist
                            </p>

                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 space-y-4">
                              {/* Passo 1: Criar Equipamento */}
                              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold border border-blue-500/30">
                                    1
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-white mb-1">
                                      Criar o Equipamento
                                    </p>
                                    <div className="text-xs text-slate-400 space-y-1 ml-2">
                                      <p>
                                        • Vá em{' '}
                                        <strong className="text-slate-300">"Equipamentos"</strong> →
                                        Clique em{' '}
                                        <strong className="text-slate-300">
                                          "+ Novo Equipamento"
                                        </strong>
                                      </p>
                                      <p>• Preencha os dados:</p>
                                      <div className="ml-4 bg-slate-800/50 rounded p-2 mt-1 font-mono text-xs">
                                        <div className="text-green-400">Nome:</div> Compressor de Ar
                                        Industrial
                                        <br />
                                        <div className="text-green-400">Código:</div> COMP-001
                                        <br />
                                        <div className="text-green-400">Fabricante:</div> Atlas
                                        Copco
                                        <br />
                                        <div className="text-green-400">Modelo:</div> GA-37
                                        <br />
                                        <div className="text-green-400">Status:</div> Ativo
                                      </div>
                                      <p>
                                        • Clique em{' '}
                                        <strong className="text-slate-300">"Salvar"</strong> →
                                        Equipamento criado com ID:{' '}
                                        <span className="text-purple-400 font-bold">#123</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Passo 2: Criar Checklist */}
                              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold border border-purple-500/30">
                                    2
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-white mb-1">
                                      Criar Checklist para esse Equipamento
                                    </p>
                                    <div className="text-xs text-slate-400 space-y-1 ml-2">
                                      <p>
                                        • Vá em{' '}
                                        <strong className="text-slate-300">
                                          "Checklists Inteligentes"
                                        </strong>{' '}
                                        → Clique em{' '}
                                        <strong className="text-slate-300">
                                          "+ Novo Template"
                                        </strong>
                                      </p>
                                      <p>• Preencha o formulário:</p>
                                      <div className="ml-4 bg-slate-800/50 rounded p-2 mt-1 font-mono text-xs">
                                        <div className="text-green-400">Nome:</div> Checklist
                                        Preventivo - Compressor de Ar
                                        <br />
                                        <div className="text-green-400">
                                          Tipo de Associação:
                                        </div>{' '}
                                        <span className="text-yellow-400">Equipamento</span>
                                        <br />
                                        <div className="text-green-400">
                                          Entidade Específica:
                                        </div>{' '}
                                        <span className="text-purple-400">
                                          Compressor de Ar Industrial (ID: #123)
                                        </span>
                                        <br />
                                        <div className="text-green-400">Itens:</div> Verificar
                                        pressão, Verificar temperatura, Trocar filtros...
                                      </div>
                                      <p>
                                        • Clique em{' '}
                                        <strong className="text-slate-300">
                                          "Salvar Checklist"
                                        </strong>
                                      </p>
                                      <p className="text-yellow-400 mt-2">
                                        ✅ Agora o checklist está associado ao equipamento
                                        "Compressor de Ar Industrial"
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Passo 3: Criar OS */}
                              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20">
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">
                                    3
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-white mb-1">
                                      Criar Ordem de Serviço (OS)
                                    </p>
                                    <div className="text-xs text-slate-400 space-y-1 ml-2">
                                      <p>
                                        • Vá em{' '}
                                        <strong className="text-slate-300">
                                          "Ordens de Manutenção"
                                        </strong>{' '}
                                        → Criar nova OS
                                      </p>
                                      <p>• Selecione:</p>
                                      <div className="ml-4 bg-slate-800/50 rounded p-2 mt-1 font-mono text-xs">
                                        <div className="text-green-400">Equipamento:</div>{' '}
                                        <span className="text-purple-400">
                                          Compressor de Ar Industrial
                                        </span>
                                        <br />
                                        <div className="text-green-400">Tipo:</div> Preventiva
                                        <br />
                                        <div className="text-green-400">Data:</div> Hoje
                                      </div>
                                      <p>
                                        • Clique em{' '}
                                        <strong className="text-slate-300">"Criar OS"</strong>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Passo 4: Checklist Aparece Automaticamente */}
                              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-3 border border-yellow-500/20">
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold border border-yellow-500/30">
                                    4
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-white mb-1">
                                      ✨ Checklist Aparece Automaticamente!
                                    </p>
                                    <div className="text-xs text-slate-400 space-y-1 ml-2">
                                      <p>
                                        • Abra a OS criada → Clique em{' '}
                                        <strong className="text-slate-300">
                                          "Iniciar Execução"
                                        </strong>
                                      </p>
                                      <p>• Na página de execução, você verá:</p>
                                      <div className="ml-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded p-2 mt-1 border border-green-500/30">
                                        <div className="text-green-400 font-semibold mb-1">
                                          📋 Checklist Preventivo - Compressor de Ar
                                        </div>
                                        <div className="text-xs text-slate-300 space-y-1">
                                          ☐ Verificar pressão de operação
                                          <br />
                                          ☐ Verificar temperatura de descarga
                                          <br />
                                          ☐ Trocar filtros de ar
                                          <br />
                                          ☐ Verificar correias
                                          <br />
                                          ...
                                        </div>
                                      </div>
                                      <p className="text-green-400 mt-2">
                                        🎉 O checklist apareceu automaticamente porque está
                                        associado ao equipamento!
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        Agora você pode preencher os itens, adicionar fotos e
                                        assinaturas durante a execução da manutenção.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
              </div>

              {/* Itens do Checklist */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Itens do Checklist ({form.items.length})
                  </h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddItem}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Item
                  </Button>
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
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {form.items.map((item, index) => (
                            <SortableItem
                              key={`item-${index}`}
                              item={item}
                              index={index}
                              onItemChange={handleItemChange}
                              onRemove={handleRemoveItem}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            </div>

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
          </div>
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
