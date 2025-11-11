'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { ChecklistTemplate, ChecklistTemplateItem, ChecklistResponseStatus, ChecklistEntityType, ChecklistReferenceType } from '@/types';
import { fetchData, postData, uploadFile } from '@/lib/api';
import { cacheChecklist, getCachedChecklist } from '@/lib/offline/indexedDb';
import { enqueueChecklistResponse } from '@/lib/offline/offlineManager';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OfflineQueueIndicator from '@/components/offline/OfflineQueueIndicator';
import { useToast } from '@/hooks/useToast';
import { CheckCircle2, ClipboardCheck, Loader2, Camera, FilePen, CheckCircle, AlertTriangle, X, Image as ImageIcon, Upload, Eye, ChevronDown, ChevronUp, RefreshCw, ChevronLeft, ChevronRight, List } from 'lucide-react';
import SignaturePad from '@/components/ui/SignaturePad';
import StepperView from './ChecklistStepper';

interface ChecklistExecutionPanelProps {
  referenceId: number;
  referenceType: ChecklistReferenceType;
  primaryEntity: { type: ChecklistEntityType; id?: number | null };
  fallbackEntities?: Array<{ type: ChecklistEntityType; id?: number | null }>;
  status: string;
  canExecute: boolean;
  onLoaded?: (hasTemplate: boolean) => void;
}

interface ChecklistItemState {
  item: ChecklistTemplateItem;
  status: ChecklistResponseStatus;
  value?: string;
  notes?: string;
  photo_path?: string | null;
  signature_path?: string | null;
  signature_data?: string | null;
}

export default function ChecklistExecutionPanel({
  referenceId,
  referenceType,
  primaryEntity,
  fallbackEntities = [],
  status,
  canExecute,
  onLoaded,
}: ChecklistExecutionPanelProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [itemsState, setItemsState] = useState<ChecklistItemState[]>([]);
  const [showSignaturePad, setShowSignaturePad] = useState<number | null>(null);
  const [expandedInstructions, setExpandedInstructions] = useState<Set<number>>(new Set());
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [availableTemplates, setAvailableTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [viewMode, setViewMode] = useState<'stepper' | 'list'>('stepper'); // Novo: modo de visualização
  const [currentStep, setCurrentStep] = useState(0); // Novo: passo atual no stepper

  const editableStatuses = new Set([
    'pending',
    'in_progress',
    'paused',
    'open',
    'analysis',
    'assigned',
    'execution',
    'waiting_parts',
  ]);

  const isEditable = canExecute && (status ? editableStatuses.has(status) : false);

  const checkedCount = useMemo(() => itemsState.filter((item) => item.status === 'completed').length, [itemsState]);

  const applyCachedChecklist = async (): Promise<boolean> => {
    const cached = await getCachedChecklist(referenceType, referenceId);
    if (cached?.template) {
      const cachedTemplate = cached.template as ChecklistTemplate;
      const cachedResponses = cached.responses || [];

      const state: ChecklistItemState[] = (cachedTemplate.items || []).map((item) => {
        const response = cachedResponses.find((resp) => resp.item_id === item.id);
        const status = (response?.status as ChecklistResponseStatus) || 'pending';
        return {
          item,
          status,
          value: response?.value ?? '',
          notes: response?.notes ?? '',
          photo_path: response?.photo_path ?? null,
          signature_path: response?.signature_path ?? null,
          signature_data: response?.signature_data ?? null,
        };
      });

      setTemplate(cachedTemplate);
      setItemsState(state);
      if (onLoaded) {
        onLoaded(true);
      }
      return true;
    }
    return false;
  };

  // Carregar todos os checklists disponíveis
  const loadAvailableTemplates = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) return;

    try {
      setLoadingTemplates(true);
      const allTemplates: ChecklistTemplate[] = [];
      const targets = [primaryEntity, ...fallbackEntities];
      const seenIds = new Set<number>();

      // Buscar checklists de todas as entidades relacionadas
      for (const target of targets) {
        // Buscar checklists específicos (com entity_id)
        if (target.id !== undefined && target.id !== null) {
          const specificParams = new URLSearchParams({ 
            entity_type: target.type,
            entity_id: String(target.id)
          });
          const specificTemplates = await fetchData<ChecklistTemplate[]>(`/checklists?${specificParams.toString()}`);
          specificTemplates.forEach(t => {
            if (t.id && !seenIds.has(t.id)) {
              seenIds.add(t.id);
              allTemplates.push(t);
            }
          });
        }
        
        // Buscar checklists genéricos (sem entity_id)
        const genericParams = new URLSearchParams({ entity_type: target.type });
        const genericTemplates = await fetchData<ChecklistTemplate[]>(`/checklists?${genericParams.toString()}`);
        genericTemplates.forEach(t => {
          if (!t.entity_id && t.id && !seenIds.has(t.id)) {
            seenIds.add(t.id);
            allTemplates.push(t);
          }
        });
      }

      setAvailableTemplates(allTemplates);
    } catch (err) {
      console.error('Erro ao carregar checklists disponíveis:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplate = async (templateId?: number) => {
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;

    try {
      setLoading(true);

      if (isOffline) {
        const applied = await applyCachedChecklist();
        if (applied) {
          success('Modo offline: exibindo checklist salvo anteriormente.');
        } else {
          setTemplate(null);
          setItemsState([]);
          if (onLoaded) {
            onLoaded(false);
          }
          error('Checklist não disponível offline para este ativo.');
        }
        return;
      }

      let currentTemplate: ChecklistTemplate | null = null;

      // Se um templateId foi especificado, usar ele
      if (templateId) {
        const detailed = await fetchData<ChecklistTemplate>(`/checklists/${templateId}`);
        currentTemplate = detailed;
      } else {
        // Buscar automaticamente conforme lógica original
        const targets = [primaryEntity, ...fallbackEntities];

      for (const target of targets) {
        const params = new URLSearchParams({ entity_type: target.type });
        if (target.id !== undefined && target.id !== null) {
          params.append('entity_id', String(target.id));
        }
        const templates = await fetchData<ChecklistTemplate[]>(`/checklists?${params.toString()}`);
        if (templates.length) {
          currentTemplate = templates[0];
          break;
          }
        }
      }

      if (onLoaded) {
        onLoaded(!!currentTemplate);
      }

      if (!currentTemplate) {
        setTemplate(null);
        setItemsState([]);
        return;
      }

      const detailed = currentTemplate.id ? await fetchData<ChecklistTemplate>(`/checklists/${currentTemplate.id}`) : currentTemplate;

      let existingResponses: any[] = [];
      try {
        existingResponses = await fetchData<any[]>(
          `/checklists/${currentTemplate.id}/responses?reference_type=${referenceType}&reference_id=${referenceId}`
        );
      } catch (responseError) {
        console.warn('Falha ao buscar respostas do checklist:', responseError);
      }

      const state: ChecklistItemState[] = (detailed.items || []).map((item) => {
        const response = existingResponses.find((resp) => resp.item_id === item.id);
        return {
          item,
          status: (response?.status as ChecklistResponseStatus) || 'pending',
          value: response?.value || '',
          notes: response?.notes || '',
          photo_path: response?.photo_path || null,
          signature_path: response?.signature_path || null,
          signature_data: response?.signature_data || null,
        };
      });

      setTemplate(detailed);
      setItemsState(state);
      setSelectedTemplateId(detailed.id || null);
      setCurrentStep(0); // Resetar para o primeiro passo ao carregar novo template

      const snapshot = state.map((itemState) => ({
        item_id: itemState.item.id,
        status: itemState.status,
        value: itemState.value ?? null,
        notes: itemState.notes ?? null,
        photo_path: itemState.photo_path ?? null,
        signature_path: itemState.signature_path ?? null,
        signature_data: itemState.signature_data ?? null,
      }));

      await cacheChecklist(referenceType, referenceId, {
        templateId: detailed.id ?? currentTemplate.id ?? 0,
        template: detailed,
        responses: snapshot,
      });
    } catch (err) {
      console.error(err);
      const applied = await applyCachedChecklist();
      if (applied) {
        success('Carregamos o checklist salvo anteriormente devido a oscilações de rede.');
      } else {
        setTemplate(null);
        setItemsState([]);
        error('Erro ao carregar checklist');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (newTemplateId: number) => {
    if (newTemplateId === selectedTemplateId) return;
    
    // Confirmar se há dados não salvos
    const hasUnsavedData = itemsState.some(item => 
      item.status === 'completed' || item.value || item.notes || item.photo_path || item.signature_data
    );
    
    if (hasUnsavedData) {
      if (!confirm('Alterar o checklist descartará as respostas não salvas. Deseja continuar?')) {
        return;
      }
    }
    
    setSelectedTemplateId(newTemplateId);
    setCurrentStep(0); // Resetar para o primeiro passo ao trocar de template
    await loadTemplate(newTemplateId);
  };

  useEffect(() => {
    loadAvailableTemplates();
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceId, primaryEntity?.id, primaryEntity?.type]);

  const updateItem = (index: number, partial: Partial<ChecklistItemState>) => {
    setItemsState((prev) => prev.map((item, i) => (i === index ? { ...item, ...partial } : item)));
  };

  const handleToggle = (index: number) => {
    const current = itemsState[index];
    const nextStatus: ChecklistResponseStatus = current.status === 'completed' ? 'pending' : 'completed';
    updateItem(index, { status: nextStatus });
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    if (!template || !file) return;

    const templateId = template.id ?? (template as any)?.template_id ?? 0;
    if (!templateId) {
      error('Checklist inválido para upload de foto.');
      return;
    }

    const itemId = itemsState[index]?.item.id;
    if (!itemId) {
      error('Item de checklist inválido.');
      return;
    }

    try {
      setUploadingPhoto(index);
      const result = await uploadFile(
        `/checklists/${templateId}/responses/${itemId}/photo`,
        file,
        {
          reference_type: referenceType,
          reference_id: String(referenceId),
        }
      );

      updateItem(index, { photo_path: result.data.photo_path });
      success('Foto enviada com sucesso');

      // Recarregar template para sincronizar
      await loadTemplate();
    } catch (err) {
      console.error(err);
      error('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handlePhotoRemove = (index: number) => {
    updateItem(index, { photo_path: null });
  };

  const getPhotoUrl = (photoPath: string | null | undefined) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const filename = photoPath.replace('/uploads/checklists/', '');
    return `${apiUrl}/checklists/photos/${filename}`;
  };

  const validateRequiredItems = (): { valid: boolean; missingItems: string[] } => {
    const missingItems: string[] = [];
    
    itemsState.forEach((itemState, index) => {
      const { item } = itemState;
      
      if (item.required && itemState.status !== 'completed') {
        missingItems.push(`${index + 1}. ${item.title}`);
      }
      
      if (itemState.status === 'completed') {
        if (item.requires_photo && !itemState.photo_path) {
          missingItems.push(`${index + 1}. ${item.title} - Foto obrigatória`);
        }
        
        if (item.requires_signature && !itemState.signature_data && !itemState.signature_path) {
          missingItems.push(`${index + 1}. ${item.title} - Assinatura obrigatória`);
        }
      }
    });
    
    return {
      valid: missingItems.length === 0,
      missingItems,
    };
  };

  const handleSignatureSave = (index: number, signatureDataUrl: string) => {
    updateItem(index, { signature_data: signatureDataUrl });
    setShowSignaturePad(null);
    success('Assinatura capturada com sucesso');
  };

  const handleSubmit = async () => {
    if (!template) return;

    // Validar itens obrigatórios
    const validation = validateRequiredItems();
    if (!validation.valid) {
      error(`Itens obrigatórios não concluídos:\n${validation.missingItems.join('\n')}`);
      return;
    }

    const templateId = template.id ?? (template as any)?.template_id ?? 0;
    if (!templateId) {
      error('Checklist inválido para envio offline.');
      return;
    }

    const payload = {
      template_id: templateId,
      reference_type,
      reference_id: referenceId,
      items: itemsState.map((state) => ({
        item_id: state.item.id!,
        status: state.status,
        value: state.value || null,
        notes: state.notes || null,
        photo_path: state.photo_path || null,
        signature_data: state.signature_data || null,
        signature_path: state.signature_path || null,
      })),
    };

    const snapshot = payload.items;

    try {
      setSaving(true);
      await postData(`/checklists/${templateId}/responses`, payload);
      success('Checklist salvo com sucesso');

      await cacheChecklist(referenceType, referenceId, {
        templateId,
        template,
        responses: snapshot,
      });

      await loadTemplate();
    } catch (err) {
      console.error(err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        await enqueueChecklistResponse({
          templateId,
          referenceType,
          referenceId,
          body: payload,
        });

        await cacheChecklist(referenceType, referenceId, {
          templateId,
          template,
          responses: snapshot,
        });

        success('Checklist salvo offline. Sincronizaremos assim que a conexão retornar.');
        return;
      }
      error('Erro ao salvar respostas do checklist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-emerald-500/30 p-6 shadow-xl">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando checklist...
        </div>
      </div>
    );
  }

  // Se não há template mas há checklists disponíveis, mostrar seletor
  if (!template && availableTemplates.length > 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-emerald-500/30 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Checklist Inteligente</h2>
            <p className="text-sm text-slate-400">
              Selecione um checklist para esta manutenção
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Selecionar Checklist:
          </label>
          <select
            value={selectedTemplateId || ''}
            onChange={(e) => {
              const newId = e.target.value ? Number(e.target.value) : null;
              if (newId) handleTemplateChange(newId);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          >
            <option value="">-- Selecione um checklist --</option>
            {availableTemplates.map((t) => (
              <option key={t.id} value={t.id || ''}>
                {t.name} {t.entity_id ? '(Específico)' : '(Genérico)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            {availableTemplates.length} checklist(s) disponível(is) para esta manutenção
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadAvailableTemplates}
          isLoading={loadingTemplates}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar Lista
        </Button>
      </div>
    );
  }

  // Se não há template e não há checklists disponíveis, mostrar mensagem
  if (!template && availableTemplates.length === 0 && !loadingTemplates) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <ClipboardCheck className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Checklist Inteligente</h2>
            <p className="text-sm text-slate-400">
              Nenhum checklist disponível para esta manutenção
            </p>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-sm text-slate-300 mb-3">
            Não há checklists associados a este equipamento, plano preventivo ou ordem de manutenção.
          </p>
          <p className="text-xs text-slate-500">
            Para criar um checklist, acesse <strong>"Checklists Inteligentes"</strong> no menu e associe um checklist ao equipamento ou plano preventivo relacionado.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadAvailableTemplates}
          isLoading={loadingTemplates}
          className="mt-4 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Verificar Novamente
        </Button>
      </div>
    );
  }

  // Se chegou aqui, template deve existir, mas vamos garantir
  if (!template) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-emerald-500/30 p-6 shadow-xl space-y-6">
      <OfflineQueueIndicator className="mb-2" variant="compact" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white">Checklist obrigatório</h2>
            <p className="text-sm text-slate-400">
              {template?.name || 'Checklist'} • {checkedCount} de {itemsState.length} tarefas concluídas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${template?.is_active ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
            {template?.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Toggle de Modo de Visualização */}
      {itemsState.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Visualização:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setViewMode('stepper');
                  setCurrentStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'stepper'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600'
                }`}
              >
                <ChevronRight className="w-3 h-3" />
                Passo a Passo
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600'
                }`}
              >
                <List className="w-3 h-3" />
                Lista Completa
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {checkedCount} de {itemsState.length} concluídas
          </div>
        </div>
      )}

      {/* Visualização Stepper (Passo a Passo) */}
      {viewMode === 'stepper' && itemsState.length > 0 && (
        <StepperView
          itemsState={itemsState}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          isEditable={isEditable}
          updateItem={updateItem}
          handleToggle={handleToggle}
          handlePhotoUpload={handlePhotoUpload}
          handlePhotoRemove={handlePhotoRemove}
          getPhotoUrl={getPhotoUrl}
          uploadingPhoto={uploadingPhoto}
          fileInputRefs={fileInputRefs}
          showSignaturePad={showSignaturePad}
          setShowSignaturePad={setShowSignaturePad}
          expandedInstructions={expandedInstructions}
          setExpandedInstructions={setExpandedInstructions}
          template={template}
          referenceType={referenceType}
          referenceId={referenceId}
          handleSignatureSave={handleSignatureSave}
        />
      )}

      {/* Visualização Lista (Modo Tradicional) */}
      {viewMode === 'list' && (
      <div className="space-y-4">
        {itemsState.map((itemState, index) => {
          const { item } = itemState;
          const isBoolean = (item.input_type || 'boolean') === 'boolean';
          const isNumber = item.input_type === 'number';
          const isText = item.input_type === 'text';

          return (
            <div
              key={item.id || index}
              className={`rounded-xl border p-4 transition-all ${
                itemState.status === 'completed'
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-slate-700 bg-slate-900 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => isEditable && handleToggle(index)}
                  className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    itemState.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-400'
                  } ${!isEditable ? 'cursor-not-allowed opacity-70' : ''}`}
                  disabled={!isEditable}
                >
                  {itemState.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </button>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-lg font-semibold ${itemState.status === 'completed' ? 'text-green-200' : 'text-white'}`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {item.required && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-300 rounded-full">Obrigatório</span>
                      )}
                      {item.requires_photo && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-300 rounded-full">
                          <Camera className="w-3 h-3" /> Foto
                        </span>
                      )}
                      {item.requires_signature && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-300 rounded-full">
                          <FilePen className="w-3 h-3" /> Assinatura
                        </span>
                      )}
                    </div>
                  </div>

                  {item.instructions && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedInstructions(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(index)) {
                              newSet.delete(index);
                            } else {
                              newSet.add(index);
                            }
                            return newSet;
                          });
                        }}
                        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {expandedInstructions.has(index) ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Ocultar instruções detalhadas
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Ver instruções detalhadas
                          </>
                        )}
                      </button>
                      {expandedInstructions.has(index) && (
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{item.instructions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campo de resposta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {isBoolean ? (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="bg-slate-800 border-slate-600"
                            checked={itemState.status === 'completed'}
                            onChange={() => isEditable && handleToggle(index)}
                            disabled={!isEditable}
                          />
                          Tarefa concluída
                        </label>
                      </div>
                    ) : null}

                    {isNumber && (
                      <Input
                        type="number"
                        label="Valor"
                        value={itemState.value || ''}
                        onChange={(e) => updateItem(index, { value: e.target.value })}
                        disabled={!isEditable}
                      />
                    )}

                    {isText && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Resposta</label>
                        <textarea
                          value={itemState.value || ''}
                          onChange={(e) => updateItem(index, { value: e.target.value })}
                          rows={3}
                          disabled={!isEditable}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Descreva o resultado ou medições feitas..."
                        />
                      </div>
                    )}

                    {!isBoolean && !isNumber && !isText && (
                      <div className="md:col-span-2 text-xs text-slate-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Tipo de entrada "{item.input_type}" ainda não possui componente dedicado. Utilize notas abaixo.
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1">Notas do técnico</label>
                      <textarea
                        value={itemState.notes || ''}
                        onChange={(e) => updateItem(index, { notes: e.target.value })}
                        rows={2}
                        disabled={!isEditable}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Observações adicionais, número de série, valores medidos..."
                      />
                    </div>

                    {/* Assinatura digital */}
                    {(item.requires_signature || itemState.signature_data || itemState.signature_path) && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {item.requires_signature ? 'Assinatura obrigatória' : 'Assinatura (opcional)'}
                        </label>
                        {itemState.signature_data || itemState.signature_path ? (
                          <div className="relative group">
                            <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-slate-700 bg-white p-2">
                              <img
                                src={itemState.signature_data || (itemState.signature_path ? getPhotoUrl(itemState.signature_path) : '') || ''}
                                alt={`Assinatura do item ${item.title}`}
                                className="w-full h-auto max-h-32 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23334155" width="200" height="200"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EAssinatura não encontrada%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              {isEditable && (
                                <button
                                  type="button"
                                  onClick={() => updateItem(index, { signature_data: null, signature_path: null })}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-full text-white transition-colors"
                                  title="Remover assinatura"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {isEditable && (
                              <div className="mt-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setShowSignaturePad(index)}
                                  className="flex items-center gap-2"
                                >
                                  <FilePen className="w-3 h-3" />
                                  Trocar assinatura
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setShowSignaturePad(index)}
                              disabled={!isEditable}
                              className="flex items-center gap-2"
                            >
                              <FilePen className="w-4 h-4" />
                              {item.requires_signature ? 'Adicionar assinatura obrigatória' : 'Adicionar assinatura'}
                            </Button>
                            {item.requires_signature && (
                              <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Assinatura obrigatória para concluir este item
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload de foto */}
                    {(item.requires_photo || itemState.photo_path) && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {item.requires_photo ? 'Foto obrigatória' : 'Foto (opcional)'}
                        </label>
                        {itemState.photo_path ? (
                          <div className="relative group">
                            <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                              <img
                                src={getPhotoUrl(itemState.photo_path) || ''}
                                alt={`Foto do item ${item.title}`}
                                className="w-full h-auto max-h-64 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23334155" width="200" height="200"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagem não encontrada%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              {isEditable && (
                                <button
                                  type="button"
                                  onClick={() => handlePhotoRemove(index)}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-full text-white transition-colors"
                                  title="Remover foto"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {isEditable && (
                              <div className="mt-2">
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer transition-colors">
                                  <Upload className="w-3 h-3" />
                                  Trocar foto
                                  <input
                                    ref={(el) => (fileInputRefs.current[item.id || index] = el)}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handlePhotoUpload(index, file);
                                      }
                                    }}
                                    disabled={!isEditable || uploadingPhoto === index}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {uploadingPhoto === index ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Camera className="w-4 h-4" />
                                  {item.requires_photo ? 'Adicionar foto obrigatória' : 'Adicionar foto'}
                                </>
                              )}
                              <input
                                ref={(el) => (fileInputRefs.current[item.id || index] = el)}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handlePhotoUpload(index, file);
                                  }
                                }}
                                disabled={!isEditable || uploadingPhoto === index}
                              />
                            </label>
                            {item.requires_photo && (
                              <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Foto obrigatória para concluir este item
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-400">
          Checklist associado ao {template.entity_type === 'preventive_plan' ? 'plano preventivo' : 'processo'} ID {template.entity_id || '-'}
        </p>
        {isEditable && (
          <Button variant="primary" onClick={handleSubmit} isLoading={saving} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Salvar respostas
          </Button>
        )}
      </div>

      {/* Modal de Assinatura Digital */}
      {showSignaturePad !== null && (
        <SignaturePad
          title={`Assinatura: ${itemsState[showSignaturePad]?.item.title || 'Item'}`}
          required={itemsState[showSignaturePad]?.item.requires_signature || false}
          onSave={(signatureDataUrl) => handleSignatureSave(showSignaturePad, signatureDataUrl)}
          onCancel={() => setShowSignaturePad(null)}
        />
      )}
    </div>
  );
}
