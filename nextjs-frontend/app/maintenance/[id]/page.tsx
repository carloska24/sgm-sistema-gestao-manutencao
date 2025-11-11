'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, postData, putData, deleteData } from '@/lib/api';
import {
  cacheOrder,
  getCachedOrder,
  cacheMaterials,
  getCachedMaterials,
  removeCachedOrder,
  removeCachedMaterials,
  removeCachedChecklist,
} from '@/lib/offline/indexedDb';
import {
  enqueueOrderUpdate,
  enqueueMaterialsUpdate,
  resolveConflict,
} from '@/lib/offline/offlineManager';
import OfflineQueueIndicator from '@/components/offline/OfflineQueueIndicator';
import OfflineConflictBanner from '@/components/offline/OfflineConflictBanner';
import { useOfflineConflicts } from '@/hooks/useOfflineConflicts';
import { MaintenanceOrder } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Play,
  CheckCircle,
  Clock,
  Calendar,
  Wrench,
  FileText,
  TrendingUp,
  CheckCircle2,
  Info,
  Pause,
  XCircle,
  Upload,
  X,
  Shield,
  Package,
  BookOpen,
  Timer,
  Plus,
  Trash2,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ChecklistExecutionPanel from '@/components/maintenance/ChecklistExecutionPanel';

export default function MaintenanceOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [order, setOrder] = useState<MaintenanceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [observations, setObservations] = useState('');
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [materials, setMaterials] = useState<
    Array<{
      id: string;
      name: string;
      quantity: string;
      unit: string;
      value?: string;
    }>
  >([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    name: '',
    quantity: '',
    unit: 'peças',
    customUnit: '',
    value: '',
  });
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [materialStockInfo, setMaterialStockInfo] = useState<{ name: string; available: number; unit: string; min: number | null } | null>(null);
  const [partsUsed, setPartsUsed] = useState('');
  const [checklistItems, setChecklistItems] = useState<
    { id: string; text: string; checked: boolean }[]
  >([]);
  const [smartChecklistAvailable, setSmartChecklistAvailable] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const safetySteps = useMemo(() => {
    if (!order?.safety_procedures) {
      return [] as string[];
    }
    return order.safety_procedures
      .split(/\r?\n/)
      .map(item => item.replace(/^[\-\*\d\.\s]+/, '').trim())
      .filter(Boolean);
  }, [order?.safety_procedures]);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [safetyChecklistState, setSafetyChecklistState] = useState<boolean[]>([]);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [pendingSafetyAction, setPendingSafetyAction] = useState<'start' | 'resume' | null>(null);
  const [safetyProcessing, setSafetyProcessing] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  const canExecute = hasRole(['admin', 'manager', 'technician']);
  const canEdit = hasRole(['admin', 'manager']);
  const orderId = params?.id as string;
  const numericOrderId = orderId ? Number(orderId) : null;
  const requiresSafetyCheck = safetySteps.length > 0;
  const allSafetyChecked =
    safetyChecklistState.length === safetySteps.length
      ? safetyChecklistState.every(Boolean)
      : false;
  const orderConflicts = useOfflineConflicts('maintenance_order', numericOrderId ?? undefined);
  const activeConflict = orderConflicts[0];
  const [conflictAction, setConflictAction] = useState<'apply' | 'accept' | null>(null);

  useEffect(() => {
    setSafetyAcknowledged(false);
    setSafetyChecklistState(safetySteps.map(() => false));
    setShowSafetyModal(false);
    setPendingSafetyAction(null);
  }, [order?.id, safetySteps]);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  // Carregar inventário quando o modal de materiais for aberto
  useEffect(() => {
    if (showMaterialsModal) {
      const loadInventory = async () => {
        try {
          const items = await fetchData<any[]>('/inventory/items');
          setInventoryItems(items || []);
        } catch (err) {
          console.error('Erro ao carregar inventário:', err);
        }
      };
      loadInventory();
    }
  }, [showMaterialsModal]);

  // Buscar informações de estoque quando o nome do material mudar
  useEffect(() => {
    if (!currentMaterial.name.trim() || !showMaterialsModal) {
      setMaterialStockInfo(null);
      return;
    }

    const searchName = currentMaterial.name.toLowerCase().trim();
    const foundItem = inventoryItems.find(
      (item) =>
        item.code?.toLowerCase() === searchName ||
        item.name?.toLowerCase().includes(searchName) ||
        searchName.includes(item.name?.toLowerCase() || '')
    );

    if (foundItem) {
      setMaterialStockInfo({
        name: foundItem.name,
        available: foundItem.current_quantity,
        unit: foundItem.unit || 'un',
        min: foundItem.min_quantity || null,
      });
    } else {
      setMaterialStockInfo(null);
    }
  }, [currentMaterial.name, inventoryItems, showMaterialsModal]);

  // Calcular tempo decorrido quando OS está em execução (atualização em tempo real)
  useEffect(() => {
    if (order?.status === 'in_progress' && order.started_at) {
      const calculateElapsed = () => {
        const start = new Date(order.started_at!);
        const now = new Date();
        // Calcular diferença em milissegundos para precisão
        const totalMs = now.getTime() - start.getTime();
        // Converter pausas de minutos para milissegundos
        const totalPausedTimeMs = (order.total_paused_time || 0) * 60 * 1000;
        // Tempo decorrido em milissegundos = tempo total - tempo de pausas
        const elapsedMs = Math.max(0, totalMs - totalPausedTimeMs);
        // Converter para minutos (com decimais para precisão de segundos)
        const elapsedMinutes = elapsedMs / 1000 / 60;
        setElapsedTime(elapsedMinutes);
      };

      calculateElapsed();
      // Atualizar a cada segundo para tempo real
      const interval = setInterval(calculateElapsed, 1000);

      return () => clearInterval(interval);
    } else if (order?.status === 'paused' && order.started_at) {
      // Se está pausada, calcular tempo até a pausa (considerando pausas anteriores)
      const calculatePaused = () => {
        const start = new Date(order.started_at!);
        const pausedAt = order.paused_at ? new Date(order.paused_at) : new Date();
        // Calcular diferença em milissegundos para precisão
        const totalMs = pausedAt.getTime() - start.getTime();
        // Converter pausas de minutos para milissegundos
        const totalPausedTimeMs = (order.total_paused_time || 0) * 60 * 1000;
        // Tempo decorrido em milissegundos = tempo até a pausa - tempo de pausas anteriores
        const elapsedMs = Math.max(0, totalMs - totalPausedTimeMs);
        // Converter para minutos (com decimais para precisão de segundos)
        const elapsedMinutes = elapsedMs / 1000 / 60;
        setElapsedTime(elapsedMinutes);
      };

      calculatePaused();
      // Não precisa atualizar quando pausada, mas mantemos para consistência
      const interval = setInterval(calculatePaused, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedTime(null);
    }
  }, [order?.status, order?.started_at, order?.paused_at, order?.total_paused_time]);

  const loadOrder = async () => {
    if (!numericOrderId) return;

    const numericId = numericOrderId;
    const applyOrderState = (data: MaintenanceOrder) => {
      setOrder(data);
      if (data.observations) {
        setObservations(data.observations);
      }

      let parsedMaterials: typeof materials = [];

      if (data.parts_used) {
        setPartsUsed(data.parts_used);
        try {
          const parsed = JSON.parse(data.parts_used);
          if (Array.isArray(parsed)) {
            setMaterials(parsed);
            parsedMaterials = parsed;
          }
        } catch {
          // Mantém compatibilidade com texto simples
        }
      } else {
        setPartsUsed('');
        setMaterials([]);
      }

      return parsedMaterials;
    };

    try {
      setLoading(true);

      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        const cachedOrder = await getCachedOrder(numericId);
        if (cachedOrder) {
          const parsedMaterials = applyOrderState(cachedOrder as MaintenanceOrder);
          const cachedMaterials = await getCachedMaterials('maintenance_order', numericId);
          if (cachedMaterials?.materials) {
            setMaterials(cachedMaterials.materials);
          } else if (parsedMaterials.length > 0) {
            setMaterials(parsedMaterials);
          }
          return;
        }
      }

      const data = await fetchData<MaintenanceOrder>(`/maintenance/${orderId}`);
      const parsedMaterials = applyOrderState(data);
      await cacheOrder(data);
      if (parsedMaterials.length > 0) {
        await cacheMaterials('maintenance_order', numericId, parsedMaterials);
      }
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao carregar OS:', err);
      const cachedOrder = await getCachedOrder(numericId);
      if (cachedOrder) {
        const parsedMaterials = applyOrderState(cachedOrder as MaintenanceOrder);
        const cachedMaterials = await getCachedMaterials('maintenance_order', numericId);
        if (cachedMaterials?.materials) {
          setMaterials(cachedMaterials.materials);
        } else if (parsedMaterials.length > 0) {
          setMaterials(parsedMaterials);
        }
        success('Modo offline: exibindo dados mais recentes disponíveis.');
      } else {
        showError('Erro ao carregar ordem de serviço');
        router.push('/plans');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyConflict = async () => {
    if (!activeConflict) return;
    try {
      setConflictAction('apply');
      await resolveConflict(activeConflict.id, 'applyOffline');
      success('Alterações offline reenviadas. Sincronizaremos assim que possível.');
      await loadOrder();
    } catch (err) {
      console.error('Erro ao reenviar alterações offline após conflito:', err);
      showError('Erro ao reenviar alterações offline. Tente novamente.');
    } finally {
      setConflictAction(null);
    }
  };

  const handleAcceptConflict = async () => {
    if (!activeConflict) return;
    try {
      setConflictAction('accept');
      await resolveConflict(activeConflict.id, 'acceptServer');
      success('Dados atualizados com a versão mais recente do servidor.');
      await loadOrder();
    } catch (err) {
      console.error('Erro ao aceitar versão do servidor após conflito:', err);
      showError('Erro ao atualizar com a versão do servidor.');
    } finally {
      setConflictAction(null);
    }
  };

  const toggleSafetyItem = (index: number) => {
    setSafetyChecklistState(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleCancelSafetyModal = () => {
    setShowSafetyModal(false);
    setPendingSafetyAction(null);
    setSafetyChecklistState(safetySteps.map(() => false));
  };

  const handleConfirmSafety = async () => {
    if (!pendingSafetyAction) return;

    setSafetyProcessing(true);
    setSafetyAcknowledged(true);

    try {
      if (pendingSafetyAction === 'start') {
        await executeStartExecution();
      } else if (pendingSafetyAction === 'resume') {
        await executeResumeExecution();
      }
      setShowSafetyModal(false);
      setPendingSafetyAction(null);
    } finally {
      setSafetyProcessing(false);
    }
  };

  const executeStartExecution = async () => {
    if (!numericOrderId) return;

    try {
      console.log('▶️ [DEBUG] Iniciando execução da OS #' + orderId);
      await putData(`/maintenance/${orderId}`, { status: 'in_progress' });
      console.log('✅ [DEBUG] Execução iniciada');
      success('Execução iniciada');
      await loadOrder();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao iniciar execução:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        await enqueueOrderUpdate({
          orderId: numericOrderId,
          data: { status: 'in_progress' },
          baselineUpdatedAt: order?.updated_at,
        });
        if (order) {
          const optimisticOrder: MaintenanceOrder = {
            ...order,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            paused_at: undefined,
          };
          setOrder(optimisticOrder);
          await cacheOrder(optimisticOrder);
        }
        success('Execução iniciada offline. Sincronizaremos assim que a conexão retornar.');
        return;
      }
      showError('Erro ao iniciar execução');
    }
  };

  const handleStartExecution = async () => {
    if (!numericOrderId) return;

    if (requiresSafetyCheck && !safetyAcknowledged) {
      setPendingSafetyAction('start');
      setShowSafetyModal(true);
      return;
    }

    await executeStartExecution();
  };

  const handleSaveExecutionData = async () => {
    if (!numericOrderId) return;

    const partsUsedValue =
      materials.length > 0 ? JSON.stringify(materials) : partsUsed.trim() || undefined;

    const payload: Record<string, any> = {
      observations: observations.trim() || undefined,
      parts_used: partsUsedValue,
    };

    try {
      await putData(`/maintenance/${orderId}`, payload);
      success('Dados de execução salvos com sucesso');
      if (order) {
        const updatedOrder: MaintenanceOrder = {
          ...order,
          observations: payload.observations ?? order.observations,
          parts_used: (payload.parts_used as string | undefined) ?? order.parts_used,
        };
        await cacheOrder(updatedOrder);
      }
      if (materials.length > 0) {
        await cacheMaterials('maintenance_order', numericOrderId, materials);
      }
      await loadOrder();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao salvar dados de execução:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        await enqueueOrderUpdate({
          orderId: numericOrderId,
          data: payload,
          baselineUpdatedAt: order?.updated_at,
        });
        if (order) {
          const optimisticOrder: MaintenanceOrder = {
            ...order,
            observations: payload.observations ?? order.observations,
            parts_used: (payload.parts_used as string | undefined) ?? order.parts_used,
          };
          setOrder(optimisticOrder);
          await cacheOrder(optimisticOrder);
        }
        if (materials.length > 0) {
          await cacheMaterials('maintenance_order', numericOrderId, materials);
        }
        success('Dados armazenados offline. Enviaremos quando estiver online.');
        return;
      }
      showError('Erro ao salvar dados de execução');
    }
  };

  const addMaterial = () => {
    if (!currentMaterial.name.trim() || !currentMaterial.quantity.trim()) {
      showError('Preencha nome e quantidade do material');
      return;
    }

    if (currentMaterial.unit === 'outro' && !currentMaterial.customUnit.trim()) {
      showError('Digite a unidade de medida quando selecionar "Outro"');
      return;
    }

    const finalUnit =
      currentMaterial.unit === 'outro' ? currentMaterial.customUnit.trim() : currentMaterial.unit;

    const newMaterial = {
      id: Date.now().toString(),
      name: currentMaterial.name.trim(),
      quantity: currentMaterial.quantity.trim(),
      unit: finalUnit,
      value: currentMaterial.value.trim() || undefined,
    };

    setMaterials([...materials, newMaterial]);
    setCurrentMaterial({
      name: '',
      quantity: '',
      unit: 'peças',
      customUnit: '',
      value: '',
    });
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const validateInventory = async (materialsToValidate: typeof materials): Promise<{ valid: boolean; errors: string[] }> => {
    if (materialsToValidate.length === 0) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    
    try {
      // Buscar todos os itens do inventário
      const inventoryItems = await fetchData<any[]>('/inventory/items');
      
      for (const material of materialsToValidate) {
        const quantity = parseFloat(material.quantity) || 0;
        if (quantity <= 0) continue;

        // Tentar encontrar o item por código ou nome
        let item = inventoryItems.find(
          (inv) => inv.code?.toLowerCase() === material.name.toLowerCase() ||
                   inv.name?.toLowerCase().includes(material.name.toLowerCase())
        );

        if (!item) {
          // Se não encontrou, pode ser um material não cadastrado (permitir com aviso)
          continue;
        }

        // Verificar estoque disponível
        if (item.current_quantity < quantity) {
          errors.push(
            `Estoque insuficiente para "${item.name}": disponível ${item.current_quantity} ${item.unit}, necessário ${quantity} ${item.unit}`
          );
        }

        // Verificar estoque mínimo
        if (item.min_quantity && (item.current_quantity - quantity) < item.min_quantity) {
          errors.push(
            `Atenção: Após esta baixa, "${item.name}" ficará abaixo do estoque mínimo (${item.min_quantity} ${item.unit})`
          );
        }
      }
    } catch (err) {
      console.error('Erro ao validar estoque:', err);
      // Em caso de erro, permitir continuar (modo offline ou erro de rede)
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleComplete = async () => {
    if (!numericOrderId) return;

    if (!showCompleteModal) {
      // Validar estoque antes de mostrar o modal
      if (materials.length > 0) {
        const validation = await validateInventory(materials);
        if (!validation.valid) {
          showError(
            `Problemas de estoque detectados:\n${validation.errors.join('\n')}\n\nDeseja continuar mesmo assim?`
          );
          // Continuar para mostrar modal mesmo com avisos
        }
      }
      setShowCompleteModal(true);
      return;
    }

    const partsUsedValue =
      materials.length > 0 ? JSON.stringify(materials) : partsUsed.trim() || null;

    const payload = {
      observations: observations.trim() || null,
      parts_used: partsUsedValue,
    };

    try {
      setCompleting(true);
      console.log('🔄 [DEBUG] Concluindo OS #' + orderId);
      await postData(`/maintenance/${orderId}/complete`, payload);
      console.log('✅ [DEBUG] OS concluída com sucesso');
      success('Ordem de serviço concluída com sucesso!');

      if (order) {
        const optimisticOrder: MaintenanceOrder = {
          ...order,
          status: 'completed',
          observations: payload.observations ?? order.observations,
          parts_used: (payload.parts_used as string | null) ?? order.parts_used,
          completed_date: new Date().toISOString(),
        };
        await cacheOrder(optimisticOrder);
      }

      await loadOrder();
      setShowCompleteModal(false);

      setTimeout(() => {
        router.push('/plans');
      }, 2000);
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao concluir OS:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        await enqueueOrderUpdate({
          orderId: numericOrderId,
          data: payload,
          endpoint: `/maintenance/${orderId}/complete`,
          method: 'POST',
          baselineUpdatedAt: order?.updated_at,
        });
        if (order) {
          const optimisticOrder: MaintenanceOrder = {
            ...order,
            status: 'completed',
            observations: payload.observations ?? order.observations,
            parts_used: (payload.parts_used as string | null) ?? order.parts_used,
            completed_date: new Date().toISOString(),
          };
          setOrder(optimisticOrder);
          await cacheOrder(optimisticOrder);
        }
        if (materials.length > 0) {
          await cacheMaterials('maintenance_order', numericOrderId, materials);
        }
        setShowCompleteModal(false);
        success('Conclusão registrada offline. Sincronizaremos assim que possível.');
        setTimeout(() => {
          router.push('/plans');
        }, 2000);
        return;
      }
      showError('Erro ao concluir ordem de serviço');
    } finally {
      setCompleting(false);
    }
  };

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePause = async () => {
    if (!numericOrderId) return;

    const payload = { pause_reason: pauseReason.trim() || null };

    try {
      await postData(`/maintenance/${orderId}/pause`, payload);
      success('Manutenção pausada com sucesso');
      setShowPauseModal(false);
      setPauseReason('');
      await loadOrder();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao pausar manutenção:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline && order) {
        await enqueueOrderUpdate({
          orderId: numericOrderId,
          data: payload,
          endpoint: `/maintenance/${orderId}/pause`,
          method: 'POST',
          baselineUpdatedAt: order?.updated_at,
        });
        const optimisticOrder: MaintenanceOrder = {
          ...order,
          status: 'paused',
          pause_reason: payload.pause_reason ?? order.pause_reason,
          paused_at: new Date().toISOString(),
        };
        setOrder(optimisticOrder);
        await cacheOrder(optimisticOrder);
        setShowPauseModal(false);
        setPauseReason('');
        success('Pausa registrada offline. Sincronizaremos ao voltar a conexão.');
        return;
      }
      showError('Erro ao pausar manutenção');
    }
  };

  const executeResumeExecution = async () => {
    if (!numericOrderId) return;

    try {
      await postData(`/maintenance/${orderId}/resume`, {});
      success('Manutenção retomada com sucesso');
      await loadOrder();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao retomar manutenção:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline && order) {
        await enqueueOrderUpdate({
          orderId: numericOrderId,
          data: {},
          endpoint: `/maintenance/${orderId}/resume`,
          method: 'POST',
          baselineUpdatedAt: order?.updated_at,
        });
        const optimisticOrder: MaintenanceOrder = {
          ...order,
          status: 'in_progress',
          pause_reason: undefined,
          paused_at: undefined,
          resume_count: (order.resume_count || 0) + 1,
        };
        setOrder(optimisticOrder);
        await cacheOrder(optimisticOrder);
        success('Retomada registrada offline. Sincronizaremos ao voltar a conexão.');
        return;
      }
      showError('Erro ao retomar manutenção');
    }
  };

  const handleResume = async () => {
    if (!numericOrderId) return;

    if (requiresSafetyCheck && !safetyAcknowledged) {
      setPendingSafetyAction('resume');
      setShowSafetyModal(true);
      return;
    }

    await executeResumeExecution();
  };

  const handleCancel = async () => {
    if (!numericOrderId) return;

    const payload = { cancel_reason: cancelReason.trim() || null };

    try {
      await postData(`/maintenance/${orderId}/cancel`, payload);
      success('Manutenção cancelada com sucesso');
      setShowCancelModal(false);
      setCancelReason('');
      await loadOrder();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao cancelar manutenção:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline && order) {
        await enqueueOrderUpdate({
          orderId: numericOrderId,
          data: payload,
          endpoint: `/maintenance/${orderId}/cancel`,
          method: 'POST',
          baselineUpdatedAt: order?.updated_at,
        });
        const optimisticOrder: MaintenanceOrder = {
          ...order,
          status: 'cancelled',
          cancel_reason: payload.cancel_reason ?? order.cancel_reason,
          cancelled_at: new Date().toISOString(),
        };
        setOrder(optimisticOrder);
        await cacheOrder(optimisticOrder);
        setShowCancelModal(false);
        setCancelReason('');
        success('Cancelamento registrado offline. Sincronizaremos ao voltar a conexão.');
        return;
      }
      showError('Erro ao cancelar manutenção');
    }
  };

  const handleDeleteOrder = async () => {
    if (!numericOrderId) return;

    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      showError('Não é possível excluir uma OS no modo offline. Conecte-se à internet e tente novamente.');
      return;
    }

    try {
      setDeleting(true);
      await deleteData(`/maintenance/${orderId}`);
      await removeCachedOrder(numericOrderId);
      await removeCachedMaterials('maintenance_order', numericOrderId);
      await removeCachedChecklist('maintenance_order', numericOrderId);
      success('Ordem de manutenção excluída com sucesso');
      setShowDeleteModal(false);
      router.push('/maintenance');
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao excluir manutenção:', err);
      showError('Erro ao excluir ordem de manutenção');
    } finally {
      setDeleting(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file =>
        file.type.startsWith('image/')
      );

      selectedFiles.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          showError(`Arquivo ${file.name} excede 10MB`);
          return;
        }

        const reader = new FileReader();
        reader.onload = e => {
          setPhotoPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
        setPhotos(prev => [...prev, file]);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadOrderPhotos = async () => {
    if (photos.length === 0) return;

    setUploadingPhotos(true);
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('document_type', 'maintenance_photo');
        formData.append('order_id', orderId);

        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/equipment/${
            order?.equipment_id
          }/documents`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao fazer upload');
        }
      }
      success('Fotos enviadas com sucesso!');
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (err) {
      showError('Erro ao enviar fotos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      paused: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Execução',
      paused: 'Pausada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes && minutes !== 0) return 'N/A';
    if (minutes < 60) return `${Math.floor(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatDurationWithSeconds = (minutes: number | null | undefined) => {
    if (!minutes && minutes !== 0) return 'N/A';
    // Converter minutos para segundos com precisão
    const totalSeconds = Math.round((minutes || 0) * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min ${secs}s` : `${hours}h ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}min ${secs}s`;
    }
    return `${secs}s`;
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

  if (!order) return null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <OfflineQueueIndicator className="mb-4" />
        {activeConflict && (
          <OfflineConflictBanner
            conflict={activeConflict}
            onApplyOffline={handleApplyConflict}
            onAcceptServer={handleAcceptConflict}
            isProcessing={conflictAction !== null}
            className="mb-2"
          />
        )}
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
            >
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
                Ordem de Serviço #{order.id}
              </h1>
              <p className="text-slate-400">
                {order.equipment_code} - {order.equipment_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                Excluir OS
              </Button>
            )}
          </div>
        </div>

        {/* Ações de Execução - Banner Principal */}
        {canExecute && order.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Play className="w-6 h-6 text-blue-400" />
                  Pronto para executar?
                </h3>
                <p className="text-slate-300">
                  Inicie a execução quando começar a trabalhar no equipamento. O tempo será
                  registrado automaticamente.
                </p>
              </div>
              <Button
                onClick={handleStartExecution}
                variant="primary"
                size="lg"
                className="flex items-center gap-2 px-6"
              >
                <Play className="w-5 h-5" />
                Iniciar Execução
              </Button>
            </div>
          </motion.div>
        )}

        {canExecute && order.status === 'in_progress' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 border-2 border-orange-500/30 rounded-xl p-6 shadow-lg shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Manutenção em andamento
                </h3>
                <p className="text-sm text-slate-300 mb-3">
                  Execute todas as tarefas abaixo antes de concluir.
                </p>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  {order.started_at && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-4 h-4" />
                      <span>
                        Iniciado:{' '}
                        {format(new Date(order.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {elapsedTime !== null && (
                    <div className="flex items-center gap-1.5 text-orange-400 font-medium">
                      <Timer className="w-4 h-4 animate-pulse" />
                      <span>Tempo decorrido: {formatDurationWithSeconds(elapsedTime)}</span>
                    </div>
                  )}
                  {order.estimated_duration && elapsedTime !== null && (
                    <div className="text-slate-400">
                      (Estimado: {formatDuration(order.estimated_duration)})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seção de Observações e Peças Utilizadas */}
            <div className="space-y-4 mb-6 mt-6 pb-6 border-t border-orange-500/20 pt-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <ClipboardList className="w-4 h-4 inline mr-2" />
                  Observações da Execução
                </label>
                <textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Descreva o trabalho realizado, problemas encontrados, soluções aplicadas..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px] resize-y"
                  rows={4}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    <Package className="w-4 h-4 inline mr-2" />
                    Peças/Materiais Utilizados
                  </label>
                  <Button
                    onClick={() => setShowMaterialsModal(true)}
                    variant="secondary"
                    className="flex items-center gap-2 text-sm py-2"
                  >
                    <Plus className="w-4 h-4" />
                    Gerenciar Materiais
                  </Button>
                </div>
                {materials.length > 0 ? (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <div className="space-y-2">
                      {materials.map(material => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-2 bg-slate-800 rounded"
                        >
                          <div className="flex-1">
                            <span className="text-white font-medium">{material.name}</span>
                            <span className="text-slate-400 ml-2">
                              - {material.quantity} {material.unit}
                              {material.value && (
                                <span className="text-green-400 ml-2">
                                  (R$ {parseFloat(material.value).toFixed(2).replace('.', ',')})
                                </span>
                              )}
                            </span>
                          </div>
                          <button
                            onClick={() => removeMaterial(material.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Remover material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total de itens:</span>
                        <span className="text-white font-semibold">{materials.length}</span>
                      </div>
                      {materials.some(m => m.value) && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-slate-400">Valor total:</span>
                          <span className="text-green-400 font-semibold">
                            R${' '}
                            {materials
                              .filter(m => m.value)
                              .reduce(
                                (sum, m) =>
                                  sum + parseFloat(m.value || '0') * parseFloat(m.quantity),
                                0
                              )
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-slate-400">
                    Nenhum material adicionado. Clique em "Gerenciar Materiais" para adicionar.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveExecutionData}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Dados
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowPauseModal(true)}
                variant="secondary"
                className="flex items-center justify-center gap-2 flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Pause className="w-5 h-5" />
                Pausar
              </Button>
              <Button
                onClick={() => setShowCancelModal(true)}
                variant="secondary"
                className="flex items-center justify-center gap-2 flex-1 py-3 bg-red-500 hover:bg-red-600 text-white"
              >
                <XCircle className="w-5 h-5" />
                Cancelar
              </Button>
              <Button
                onClick={() => setShowCompleteModal(true)}
                variant="primary"
                disabled={completing}
                className="flex items-center justify-center gap-2 flex-1 py-3 text-base font-semibold bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="w-5 h-5" />
                {completing ? 'Concluindo...' : 'Concluir OS'}
              </Button>
            </div>
          </motion.div>
        )}

        {canExecute && order.status === 'paused' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6 shadow-lg shadow-yellow-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Pause className="w-5 h-5 text-yellow-400" />
                  Manutenção Pausada
                </h3>
                <p className="text-sm text-slate-300 mb-3">
                  {order.pause_reason || 'Manutenção pausada temporariamente.'}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  {order.paused_at && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-4 h-4" />
                      <span>
                        Pausado em:{' '}
                        {format(new Date(order.paused_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {elapsedTime !== null && (
                    <div className="flex items-center gap-1.5 text-yellow-400 font-medium">
                      <Timer className="w-4 h-4" />
                      <span>Tempo decorrido: {formatDurationWithSeconds(elapsedTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleResume}
                variant="primary"
                className="flex items-center justify-center gap-2 flex-1 py-3 bg-green-500 hover:bg-green-600 text-white"
              >
                <Play className="w-5 h-5" />
                Retomar Execução
              </Button>
              <Button
                onClick={() => setShowCancelModal(true)}
                variant="secondary"
                className="flex items-center justify-center gap-2 flex-1 py-3 bg-red-500 hover:bg-red-600 text-white"
              >
                <XCircle className="w-5 h-5" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {order.status === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">OS Cancelada</h3>
                {order.cancel_reason && (
                  <p className="text-sm text-red-300 mt-1">
                    <strong>Motivo:</strong> {order.cancel_reason}
                  </p>
                )}
                {order.cancelled_at && (
                  <p className="text-sm text-slate-400 mt-1">
                    Cancelada em{' '}
                    {format(new Date(order.cancelled_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {order.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">OS Concluída</h3>
                {order.completed_date && (
                  <p className="text-sm text-slate-400">
                    Concluída em{' '}
                    {format(new Date(order.completed_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* INSTRUÇÕES - PRIORIDADE MÁXIMA */}
        {order.instructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-green-500/30 overflow-hidden shadow-xl"
          >
            <button
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Wrench className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-white">Instruções de Manutenção</h2>
                  <p className="text-sm text-slate-400">Siga todas as etapas abaixo cuidadosamente</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 hidden sm:block">
                  {instructionsExpanded ? 'Recolher' : 'Expandir'}
                </span>
                {instructionsExpanded ? (
                  <ChevronUp className="w-6 h-6 text-green-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-green-400" />
                )}
              </div>
            </button>
            
            {instructionsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-6"
              >
                <div className="bg-slate-950 rounded-lg border border-slate-700 p-5">
                  <div className="text-slate-200 whitespace-pre-wrap leading-relaxed text-base font-mono max-h-[600px] overflow-y-auto">
                    {order.instructions}
                  </div>
                </div>
                {(order.status === 'pending' || order.status === 'in_progress') && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-300 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>
                        Execute todas as etapas antes de marcar como concluída. Se encontrar problemas,
                        anote nas observações.
                      </span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        <ChecklistExecutionPanel
          referenceId={Number(orderId)}
          referenceType="maintenance_order"
          primaryEntity={{ type: 'maintenance_order', id: Number(orderId) }}
          fallbackEntities={[
            { type: 'preventive_plan', id: order.plan_id ?? undefined },
            { type: 'equipment', id: order.equipment_id },
          ]}
          status={order.status}
          canExecute={canExecute}
          onLoaded={setSmartChecklistAvailable}
        />

        {/* Checklist baseado nas instruções (fallback) */}
        {!smartChecklistAvailable &&
          checklistItems.length > 0 &&
          (order.status === 'pending' ||
            order.status === 'in_progress' ||
            order.status === 'paused') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-blue-500/30 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Checklist de Execução</h3>
                    <p className="text-sm text-slate-400">
                      {checklistItems.filter(i => i.checked).length} de {checklistItems.length}{' '}
                      concluídas
                    </p>
                  </div>
                </div>
                {/* Barra de Progresso */}
                <div className="hidden sm:block w-32">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                      style={{
                        width: `${
                          (checklistItems.filter(i => i.checked).length / checklistItems.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-1">
                    {Math.round(
                      (checklistItems.filter(i => i.checked).length / checklistItems.length) * 100
                    )}
                    %
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <motion.label
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      item.checked
                        ? 'bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10'
                        : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 hover:shadow-lg'
                    }`}
                  >
                    {/* Checkbox customizado e profissional */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="sr-only"
                      />
                      <div
                        className={`
                      w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                      ${
                        item.checked
                          ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/50'
                          : 'bg-slate-700 border-slate-600 group-hover:border-blue-400 group-hover:bg-slate-600'
                      }
                    `}
                      >
                        {item.checked && (
                          <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                        )}
                      </div>
                      {/* Indicador numérico */}
                      {!item.checked && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Texto da tarefa */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`
                      text-base leading-relaxed transition-all duration-200
                      ${item.checked ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}
                    `}
                      >
                        {item.text}
                      </p>
                    </div>

                    {/* Ícone de confirmação */}
                    {item.checked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                          <CheckCircle className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                      </motion.div>
                    )}
                  </motion.label>
                ))}
              </div>

              {/* Mensagem de conclusão */}
              {checklistItems.every(item => item.checked) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <CheckCircle className="w-6 h-6 text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-green-300 font-semibold text-lg">
                        ✅ Todas as tarefas concluídas!
                      </p>
                      <p className="text-sm text-green-400/80">
                        Você pode prosseguir para concluir a ordem de serviço.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Progresso visual (mobile) */}
              {checklistItems.some(i => !i.checked) && (
                <div className="sm:hidden mt-4 pt-4 border-t border-slate-700">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                      style={{
                        width: `${
                          (checklistItems.filter(i => i.checked).length / checklistItems.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-2">
                    {checklistItems.filter(i => i.checked).length} de {checklistItems.length}{' '}
                    concluídas (
                    {Math.round(
                      (checklistItems.filter(i => i.checked).length / checklistItems.length) * 100
                    )}
                    %)
                  </p>
                </div>
              )}
            </motion.div>
          )}

        {/* Recursos Necessários: Ferramentas, Materiais, Segurança, Manual */}
        {(order.tools_required ||
          order.materials_required ||
          order.safety_procedures ||
          order.manual_reference ||
          order.equipment_manual) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Ferramentas Necessárias */}
            {order.tools_required && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  Ferramentas Necessárias
                </h3>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{order.tools_required}</p>
                </div>
              </div>
            )}

            {/* Materiais Necessários */}
            {order.materials_required && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  Materiais Necessários
                </h3>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{order.materials_required}</p>
                </div>
              </div>
            )}

            {/* Procedimentos de Segurança */}
            {order.safety_procedures && (
              <div className="bg-red-900/20 rounded-xl border-2 border-red-500/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  ⚠️ Procedimentos de Segurança
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 border border-red-500/20">
                  <p className="text-red-200 whitespace-pre-wrap font-medium">
                    {order.safety_procedures}
                  </p>
                </div>
              </div>
            )}

            {/* Manual do Equipamento */}
            {(order.manual_reference || order.equipment_manual) && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-yellow-400" />
                  Manual do Equipamento
                </h3>
                <div className="space-y-2">
                  {order.manual_reference && (
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Referência:</p>
                      <p className="text-slate-300">{order.manual_reference}</p>
                    </div>
                  )}
                  {order.equipment_manual && (
                    <a
                      href={`${
                        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                      }/equipment/${order.equipment_id}/documents/${order.equipment_manual}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-yellow-400 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Abrir Manual (PDF)
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Upload de Fotos */}
        {(order.status === 'in_progress' || order.status === 'paused') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Fotos da Manutenção
            </h3>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400 mr-2" />
                  <span className="text-slate-400">Clique para selecionar fotos</span>
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Formatos permitidos: JPG, PNG, GIF (máx. 10MB por arquivo)
                </p>
              </div>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-slate-700"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length > 0 && (
                <Button
                  onClick={uploadOrderPhotos}
                  disabled={uploadingPhotos}
                  variant="primary"
                  className="w-full"
                >
                  {uploadingPhotos ? 'Enviando...' : `Enviar ${photos.length} Foto(s)`}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Informações e Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Informações Básicas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações
            </h3>
            <div className="space-y-3">
              <InfoRow label="Plano Preventivo" value={order.plan_name || 'N/A'} />
              <InfoRow
                label="Equipamento"
                value={`${order.equipment_code} - ${order.equipment_name}`}
              />
              {order.scheduled_date && (
                <InfoRow
                  label="Data Agendada"
                  value={format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                />
              )}
              {order.assigned_to_name && <InfoRow label="Técnico" value={order.assigned_to_name} />}
            </div>
          </motion.div>

          {/* Métricas de Tempo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tempo de Execução
            </h3>
            <div className="space-y-4">
              {order.estimated_duration && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-slate-400 mb-1">Tempo Estimado</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatDuration(order.estimated_duration)}
                  </p>
                </div>
              )}
              {order.status === 'in_progress' && elapsedTime !== null && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-slate-400 mb-1">Tempo Decorrido</p>
                  <p className="text-xl font-bold text-green-400 animate-pulse">
                    {formatDurationWithSeconds(elapsedTime)}
                  </p>
                </div>
              )}
              {order.status === 'paused' && elapsedTime !== null && (
                <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-xs text-slate-400 mb-1">Tempo Decorrido (Pausado)</p>
                  <p className="text-xl font-bold text-orange-400">
                    {formatDurationWithSeconds(elapsedTime)}
                  </p>
                </div>
              )}
              {order.execution_time !== null && order.execution_time !== undefined && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-slate-400 mb-1">Tempo Real</p>
                  <p className="text-xl font-bold text-green-400">
                    {formatDuration(order.execution_time)}
                  </p>
                  {order.estimated_duration && (
                    <p className="text-xs text-slate-400 mt-1">
                      {order.execution_time <= order.estimated_duration ? (
                        <span className="text-green-400">✅ Dentro do estimado</span>
                      ) : (
                        <span className="text-yellow-400">
                          ⚠️ {formatDuration(order.execution_time - order.estimated_duration)} acima
                          do estimado
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
              {order.status === 'pending' && !order.estimated_duration && (
                <p className="text-sm text-slate-400 italic">Tempo estimado não definido</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Timeline / Histórico */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900 rounded-xl border border-slate-800 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Histórico da OS
          </h3>
          <div className="space-y-3">
            <TimelineItem
              icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />}
              label="Criada"
              date={order.created_at}
              active
            />
            {order.scheduled_date && (
              <TimelineItem
                icon={<Calendar className="w-5 h-5 text-yellow-400" />}
                label="Agendada para"
                date={order.scheduled_date}
                active={order.status !== 'pending'}
              />
            )}
            {order.started_at && (
              <TimelineItem
                icon={<Play className="w-5 h-5 text-green-400" />}
                label="Execução iniciada"
                date={order.started_at}
                active
              />
            )}
            {order.paused_at && (
              <TimelineItem
                icon={<Pause className="w-5 h-5 text-orange-400" />}
                label={`Pausada${
                  order.resume_count
                    ? ` (${order.resume_count} vez${order.resume_count > 1 ? 'es' : ''} retomada)`
                    : ''
                }`}
                date={order.paused_at}
                active={order.status === 'paused'}
              />
            )}
            {order.cancelled_at && (
              <TimelineItem
                icon={<XCircle className="w-5 h-5 text-red-400" />}
                label="Cancelada"
                date={order.cancelled_at}
                active
              />
            )}
            {order.completed_date && (
              <TimelineItem
                icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                label="Concluída"
                date={order.completed_date}
                active
              />
            )}
          </div>
        </motion.div>

        {/* Observações e Materiais (se houver) */}
        {(order.observations || order.parts_used) && order.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.observations && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-green-400" />
                    Observações
                  </h3>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-slate-300 whitespace-pre-wrap">{order.observations}</p>
                  </div>
                </div>
              )}
              {order.parts_used && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Peças/Materiais Utilizados
                  </h3>
                  <div className="bg-slate-800 rounded-lg p-4">
                    {(() => {
                      try {
                        const parsed = JSON.parse(order.parts_used);
                        if (Array.isArray(parsed)) {
                          return (
                            <div className="space-y-2">
                              {parsed.map((material: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-slate-900 rounded"
                                >
                                  <div>
                                    <span className="text-white font-medium">{material.name}</span>
                                    <span className="text-slate-400 ml-2">
                                      - {material.quantity} {material.unit}
                                      {material.value && (
                                        <span className="text-green-400 ml-2">
                                          (R${' '}
                                          {parseFloat(material.value).toFixed(2).replace('.', ',')})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {parsed.some((m: any) => m.value) && (
                                <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between">
                                  <span className="text-slate-400">Valor total:</span>
                                  <span className="text-green-400 font-semibold">
                                    R${' '}
                                    {parsed
                                      .filter((m: any) => m.value)
                                      .reduce(
                                        (sum: number, m: any) =>
                                          sum + parseFloat(m.value || '0') * parseFloat(m.quantity),
                                        0
                                      )
                                      .toFixed(2)
                                      .replace('.', ',')}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }
                      } catch {
                        // Se não for JSON, exibir como texto
                      }
                      return (
                        <p className="text-slate-300 whitespace-pre-wrap">{order.parts_used}</p>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Modal de Segurança (EPI/Procedimentos) */}
        <AnimatePresence>
          {showSafetyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCancelSafetyModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-slate-900 rounded-xl border-2 border-emerald-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl shadow-emerald-500/20"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Confirmar Procedimentos de Segurança
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      Antes de iniciar ou retomar a execução, revise e confirme cada procedimento
                      obrigatório abaixo.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {safetySteps.map((step, index) => (
                    <label
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/20 bg-slate-800/60 hover:border-emerald-400/40 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={safetyChecklistState[index] || false}
                        onChange={() => toggleSafetyItem(index)}
                        className="mt-1 w-5 h-5 rounded border-emerald-500/50 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-100 leading-relaxed">{step}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3 mt-6">
                  <p className="text-xs text-slate-400 flex-1">
                    Todas as etapas devem ser confirmadas para liberar a execução. Em caso de
                    dúvida, interrompa e procure o responsável de segurança.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleCancelSafetyModal}
                      disabled={safetyProcessing}
                      className="border border-slate-700 text-slate-200"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmSafety}
                      disabled={!allSafetyChecked || safetyProcessing}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {safetyProcessing
                        ? 'Validando...'
                        : pendingSafetyAction === 'resume'
                        ? 'Confirmar e Retomar'
                        : 'Confirmar e Iniciar'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Materiais */}
        <AnimatePresence>
          {showMaterialsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowMaterialsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-400" />
                    Gerenciar Materiais Utilizados
                  </h3>
                  <button
                    onClick={() => setShowMaterialsModal(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Formulário de adição */}
                <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Material
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nome do Material/Peça *
                      </label>
                      <Input
                        value={currentMaterial.name}
                        onChange={e =>
                          setCurrentMaterial({ ...currentMaterial, name: e.target.value })
                        }
                        placeholder="Ex: Parafuso M8x20, Óleo hidráulico 46..."
                        className="w-full"
                      />
                      {materialStockInfo && (
                        <div className={`mt-2 p-2 rounded-lg border ${
                          parseFloat(currentMaterial.quantity) > materialStockInfo.available
                            ? 'bg-red-500/10 border-red-500/30'
                            : (materialStockInfo.min !== null && 
                                (materialStockInfo.available - (parseFloat(currentMaterial.quantity) || 0)) < materialStockInfo.min)
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-green-500/10 border-green-500/30'
                        }`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">
                              <strong>{materialStockInfo.name}</strong> - Estoque disponível:
                            </span>
                            <span className={`font-semibold ${
                              parseFloat(currentMaterial.quantity) > materialStockInfo.available
                                ? 'text-red-400'
                                : (materialStockInfo.min !== null && 
                                    (materialStockInfo.available - (parseFloat(currentMaterial.quantity) || 0)) < materialStockInfo.min)
                                ? 'text-amber-400'
                                : 'text-green-400'
                            }`}>
                              {materialStockInfo.available} {materialStockInfo.unit}
                            </span>
                          </div>
                          {materialStockInfo.min !== null && (
                            <div className="mt-1 text-xs text-slate-400">
                              Estoque mínimo: {materialStockInfo.min} {materialStockInfo.unit}
                              {parseFloat(currentMaterial.quantity) > 0 && (
                                <span className="ml-2">
                                  Após baixa: {Math.max(0, materialStockInfo.available - parseFloat(currentMaterial.quantity))} {materialStockInfo.unit}
                                </span>
                              )}
                            </div>
                          )}
                          {parseFloat(currentMaterial.quantity) > materialStockInfo.available && (
                            <div className="mt-1 text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Estoque insuficiente!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Quantidade *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentMaterial.quantity}
                        onChange={e =>
                          setCurrentMaterial({ ...currentMaterial, quantity: e.target.value })
                        }
                        placeholder="Ex: 4, 2.5, 10..."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Unidade de Medida *
                      </label>
                      <select
                        value={currentMaterial.unit}
                        onChange={e =>
                          setCurrentMaterial({ ...currentMaterial, unit: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="peças">Peças</option>
                        <option value="unidades">Unidades</option>
                        <option value="Kg">Kg (Quilogramas)</option>
                        <option value="g">g (Gramas)</option>
                        <option value="L">L (Litros)</option>
                        <option value="mL">mL (Mililitros)</option>
                        <option value="m">m (Metros)</option>
                        <option value="cm">cm (Centímetros)</option>
                        <option value="mm">mm (Milímetros)</option>
                        <option value="m²">m² (Metros quadrados)</option>
                        <option value="rolos">Rolos</option>
                        <option value="latas">Latas</option>
                        <option value="frascos">Frascos</option>
                        <option value="pacotes">Pacotes</option>
                        <option value="caixas">Caixas</option>
                        <option value="outro">Outro</option>
                      </select>
                      {currentMaterial.unit === 'outro' && (
                        <Input
                          value={currentMaterial.customUnit}
                          onChange={e =>
                            setCurrentMaterial({ ...currentMaterial, customUnit: e.target.value })
                          }
                          placeholder="Digite a unidade (ex: metros cúbicos, galões, etc.)"
                          className="w-full mt-2"
                        />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Valor Unitário (R$) - Opcional
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentMaterial.value}
                        onChange={e =>
                          setCurrentMaterial({ ...currentMaterial, value: e.target.value })
                        }
                        placeholder="Ex: 15.50"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addMaterial}
                    variant="primary"
                    className="w-full mt-4 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Material
                  </Button>
                </div>

                {/* Lista de materiais */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Materiais Adicionados ({materials.length})
                  </h4>
                  {materials.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {materials.map(material => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">{material.name}</div>
                            <div className="text-sm text-slate-400 mt-1">
                              {material.quantity} {material.unit}
                              {material.value && (
                                <span className="text-green-400 ml-2">
                                  • R$ {parseFloat(material.value).toFixed(2).replace('.', ',')} un.
                                  • Total: R${' '}
                                  {(parseFloat(material.value) * parseFloat(material.quantity))
                                    .toFixed(2)
                                    .replace('.', ',')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeMaterial(material.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                            title="Remover material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-900 rounded-lg border border-slate-700">
                      Nenhum material adicionado ainda
                    </div>
                  )}
                </div>

                {/* Resumo */}
                {materials.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">Total de itens:</span>
                      <span className="text-white font-semibold">{materials.length}</span>
                    </div>
                    {materials.some(m => m.value) && (
                      <div className="flex justify-between items-center pt-2 border-t border-blue-500/20">
                        <span className="text-slate-300">Valor total estimado:</span>
                        <span className="text-green-400 font-bold text-lg">
                          R${' '}
                          {materials
                            .filter(m => m.value)
                            .reduce(
                              (sum, m) => sum + parseFloat(m.value || '0') * parseFloat(m.quantity),
                              0
                            )
                            .toFixed(2)
                            .replace('.', ',')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowMaterialsModal(false);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      handleSaveExecutionData();
                      setShowMaterialsModal(false);
                    }}
                    variant="primary"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Salvar e Fechar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Conclusão */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Concluir Ordem de Serviço</h3>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Antes de concluir, verifique:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-slate-300">
                    <li>Todas as instruções foram seguidas</li>
                    <li>Manutenção foi executada corretamente</li>
                    <li>Equipamento está funcionando normalmente</li>
                    <li>Ferramentas foram guardadas</li>
                    <li>Área está limpa</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    placeholder="Anote problemas encontrados, peças substituídas, observações importantes..."
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Essas observações ficarão registradas no histórico da OS
                  </p>
                </div>

                {/* Resumo de Materiais */}
                {materials.length > 0 && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Materiais Registrados ({materials.length})
                      </h4>
                      <Button
                        onClick={() => {
                          setShowCompleteModal(false);
                          setShowMaterialsModal(true);
                        }}
                        variant="secondary"
                        className="text-xs py-1 px-2"
                      >
                        Editar
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {materials.map(material => (
                        <div
                          key={material.id}
                          className="text-sm text-slate-300 bg-slate-800/50 rounded p-2"
                        >
                          <span className="font-medium">{material.name}</span>
                          <span className="text-slate-400 ml-2">
                            - {material.quantity} {material.unit}
                            {material.value && (
                              <span className="text-green-400 ml-2">
                                (R$ {parseFloat(material.value).toFixed(2).replace('.', ',')})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    {materials.some(m => m.value) && (
                      <div className="mt-3 pt-3 border-t border-blue-500/20 flex justify-between">
                        <span className="text-slate-300 font-medium">Valor total:</span>
                        <span className="text-green-400 font-bold">
                          R${' '}
                          {materials
                            .filter(m => m.value)
                            .reduce(
                              (sum, m) => sum + parseFloat(m.value || '0') * parseFloat(m.quantity),
                              0
                            )
                            .toFixed(2)
                            .replace('.', ',')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowCompleteModal(false)}
                  disabled={completing}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  disabled={completing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {completing ? 'Concluindo...' : 'Confirmar Conclusão'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Pausa */}
        {showPauseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-2xl w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Pause className="w-6 h-6 text-orange-400" />
                Pausar Manutenção
              </h3>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-sm text-orange-300">
                    <strong>Quando pausar:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-slate-300">
                    <li>Falta de peças/materiais</li>
                    <li>Problemas de segurança</li>
                    <li>Equipamento precisa ser desligado</li>
                    <li>Necessita apoio de outro técnico</li>
                    <li>Outros imprevistos</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Motivo da Pausa{' '}
                    <span className="text-slate-500">(opcional, mas recomendado)</span>
                  </label>
                  <textarea
                    value={pauseReason}
                    onChange={e => setPauseReason(e.target.value)}
                    placeholder="Ex: Aguardando chegada do filtro de óleo..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPauseModal(false);
                    setPauseReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePause}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Confirmar Pausa
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Cancelamento */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl border border-red-500/30 p-6 max-w-2xl w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-400" />
                Cancelar Manutenção
              </h3>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-300 mb-2">
                    <strong>⚠️ Atenção:</strong> Esta ação não pode ser desfeita!
                  </p>
                  <p className="text-sm text-slate-300">
                    <strong>Quando cancelar:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-slate-300">
                    <li>Equipamento foi desativado/descomissionado</li>
                    <li>Plano preventivo foi desativado</li>
                    <li>Manutenção não é mais necessária</li>
                    <li>Erro no agendamento</li>
                  </ul>
                  <p className="text-sm text-yellow-300 mt-3">
                    💡 <strong>Dica:</strong> Se você vai retomar depois, use "Pausar" ao invés de
                    "Cancelar".
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Motivo do Cancelamento <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Ex: Equipamento foi desativado e não será mais utilizado..."
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    O motivo é obrigatório para cancelamento
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCancel}
                  disabled={!cancelReason.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmar Cancelamento
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Exclusão */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl border border-red-500/30 p-6 max-w-lg w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-400" />
                Excluir Ordem de Serviço
              </h3>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-slate-300 space-y-2">
                  <p className="text-red-300">
                    <strong>Esta ação é permanente.</strong> A OS e o histórico associado serão removidos
                    definitivamente do sistema.
                  </p>
                  <p>
                    Use a exclusão apenas para registros criados por engano. Para interromper uma OS em
                    andamento utilize as ações de <strong>Pausar</strong> ou <strong>Cancelar</strong>.
                  </p>
                </div>
                <p className="text-sm text-slate-400">
                  Confirme digitando em mente que esta exclusão não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteOrder}
                  isLoading={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir definitivamente
                </Button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-800">
      <span className="text-slate-400">{label}:</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  active: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${active ? 'opacity-100' : 'opacity-50'}`}>{icon}</div>
      <div className="flex-1">
        <p className={`text-sm ${active ? 'text-white' : 'text-slate-500'}`}>{label}</p>
        <p className="text-xs text-slate-400">
          {format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
