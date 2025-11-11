'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchData, postData, putData } from '@/lib/api';
import {
  cacheCall,
  getCachedCall,
  cacheMaterials,
  getCachedMaterials,
} from '@/lib/offline/indexedDb';
import {
  enqueueCallUpdate,
  enqueueMaterialsUpdate,
  resolveConflict,
} from '@/lib/offline/offlineManager';
import OfflineQueueIndicator from '@/components/offline/OfflineQueueIndicator';
import OfflineConflictBanner from '@/components/offline/OfflineConflictBanner';
import { useOfflineConflicts } from '@/hooks/useOfflineConflicts';
import { MaintenanceCall } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Edit,
  Play,
  CheckCircle,
  Clock,
  User,
  Wrench,
  MessageSquare,
  History,
  ExternalLink,
  AlertCircle,
  Timer,
  Calendar,
  UserCheck,
  TrendingUp,
  Package,
  FileText,
  Info,
  Pause,
  XCircle,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle2,
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Shield,
} from 'lucide-react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';

const ChecklistExecutionPanel = dynamic(() => import('@/components/maintenance/ChecklistExecutionPanel'), {
  ssr: false,
  loading: () => <div className="p-4 bg-slate-800 rounded-lg"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div></div>
});

export default function CallDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const [call, setCall] = useState<MaintenanceCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'activities' | 'history' | 'docs'>('info');
  const [newActivity, setNewActivity] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [selectedPhotoPhase, setSelectedPhotoPhase] = useState<'during' | 'after'>('during');
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
  const [smartChecklistAvailable, setSmartChecklistAvailable] = useState(false);
  const safetySteps = useMemo(() => {
    if (!call?.safety_procedures) return [] as string[];
    return call.safety_procedures
      .split(/\r?\n/)
      .map(item => item.replace(/^[\-\*\d\.\s]+/, '').trim())
      .filter(Boolean);
  }, [call?.id, call?.safety_procedures]);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [safetyChecklistState, setSafetyChecklistState] = useState<boolean[]>([]);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [pendingSafetyAction, setPendingSafetyAction] = useState<'start' | 'resume' | null>(null);
  const [safetyProcessing, setSafetyProcessing] = useState(false);

  const canEdit = hasRole(['admin', 'manager']);
  const canExecute = hasRole(['admin', 'manager', 'technician']);
  const isOwner = call?.created_by === user?.id;
  const isAssigned = call?.assigned_to === user?.id;
  const callId = params?.id as string;
  const numericCallId = callId ? Number(callId) : null;
  const callConflicts = useOfflineConflicts('maintenance_call', numericCallId ?? undefined);
  const activeConflict = callConflicts[0];
  const [conflictAction, setConflictAction] = useState<'apply' | 'accept' | null>(null);
  const requiresSafetyCheck = safetySteps.length > 0;
  const allSafetyChecked =
    safetyChecklistState.length === safetySteps.length
      ? safetyChecklistState.every(Boolean)
      : false;

  useEffect(() => {
    setSafetyAcknowledged(false);
    setSafetyChecklistState(safetySteps.map(() => false));
    setShowSafetyModal(false);
    setPendingSafetyAction(null);
  }, [call?.id, safetySteps]);

  // Função para formatar duração com segundos
  const formatDurationWithSeconds = (minutes: number | null | undefined) => {
    if (!minutes && minutes !== 0) return 'N/A';
    const totalSeconds = Math.floor((minutes || 0) * 60);
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

  // Calcular tempo decorrido quando chamado está em execução ou pausado (atualização em tempo real)
  useEffect(() => {
    if (call?.status === 'execution' && call.started_at) {
      const calculateElapsed = () => {
        const start = new Date(call.started_at!);
        const now = new Date();
        // Calcular diferença em milissegundos para precisão
        const totalMs = now.getTime() - start.getTime();
        const totalMinutes = totalMs / 1000 / 60;
        const totalPausedTime = call.total_paused_time || 0;
        // Subtrair o tempo total de pausas do tempo total decorrido
        const elapsed = Math.max(0, totalMinutes - totalPausedTime);
        setElapsedTime(elapsed);
      };

      calculateElapsed();
      // Atualizar a cada segundo para tempo real
      timerIntervalRef.current = setInterval(calculateElapsed, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    } else if (call?.status === 'paused' && call.started_at) {
      // Se está pausada, calcular tempo até a pausa (considerando pausas anteriores)
      const calculatePaused = () => {
        const start = new Date(call.started_at!);
        const pausedAt = call.paused_at ? new Date(call.paused_at) : new Date();
        // Calcular diferença em milissegundos para precisão
        const totalMs = pausedAt.getTime() - start.getTime();
        const totalMinutes = totalMs / 1000 / 60;
        const totalPausedTime = call.total_paused_time || 0;
        // Tempo decorrido = tempo total - tempo de pausas anteriores
        const elapsed = Math.max(0, totalMinutes - totalPausedTime);
        setElapsedTime(elapsed);
      };

      calculatePaused();
      // Atualizar a cada segundo para consistência
      timerIntervalRef.current = setInterval(calculatePaused, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    } else {
      setElapsedTime(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  }, [call?.status, call?.started_at, call?.paused_at, call?.total_paused_time]);

  useEffect(() => {
    if (canEdit) {
      loadTechnicians();
    }
  }, [canEdit]);

  useEffect(() => {
    if (callId) {
      loadCall();
    }
  }, [callId]);

  const loadCall = async () => {
    if (!numericCallId) return;

    const applyCallState = (data: MaintenanceCall) => {
      setCall(data);
      if (data.execution_notes) {
        setExecutionNotes(data.execution_notes);
      } else {
        setExecutionNotes('');
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
        const cachedCall = await getCachedCall(numericCallId);
        if (cachedCall) {
          const parsedMaterials = applyCallState(cachedCall as MaintenanceCall);
          const cachedMaterials = await getCachedMaterials('maintenance_call', numericCallId);
          if (cachedMaterials?.materials) {
            setMaterials(cachedMaterials.materials);
          } else if (parsedMaterials.length > 0) {
            setMaterials(parsedMaterials);
          }
          return;
        }
      }

      const data = await fetchData<MaintenanceCall>(`/calls/${callId}`);
      const parsedMaterials = applyCallState(data);
      await cacheCall(data);
      if (parsedMaterials.length > 0) {
        await cacheMaterials('maintenance_call', numericCallId, parsedMaterials);
      }
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao carregar chamado:', err);
      const cachedCall = await getCachedCall(numericCallId);
      if (cachedCall) {
        const parsedMaterials = applyCallState(cachedCall as MaintenanceCall);
        const cachedMaterials = await getCachedMaterials('maintenance_call', numericCallId);
        if (cachedMaterials?.materials) {
          setMaterials(cachedMaterials.materials);
        } else if (parsedMaterials.length > 0) {
          setMaterials(parsedMaterials);
        }
        success('Modo offline: exibindo dados mais recentes disponíveis.');
      } else {
        showError('Erro ao carregar chamado');
        router.push('/calls');
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
      await loadCall();
    } catch (err) {
      console.error('Erro ao reenviar alterações offline (chamado):', err);
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
      success('Dados do chamado atualizados com a versão do servidor.');
      await loadCall();
    } catch (err) {
      console.error('Erro ao aceitar versão do servidor (chamado):', err);
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
    if (!numericCallId) return;

    try {
      await postData(`/calls/${callId}/start`, {});
      success('Execução iniciada');
      await loadCall();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao iniciar execução do chamado:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline && call) {
        await enqueueCallUpdate({
          callId: numericCallId,
          data: {},
          endpoint: `/calls/${callId}/start`,
          method: 'POST',
          baselineUpdatedAt: call.updated_at,
        });
        const optimisticCall: MaintenanceCall = {
          ...call,
          status: 'execution',
          started_at: new Date().toISOString(),
        };
        setCall(optimisticCall);
        await cacheCall(optimisticCall);
        success('Execução iniciada offline. Sincronizaremos assim que a conexão retornar.');
        return;
      }
      showError('Erro ao iniciar execução');
    }
  };

  const handleStartExecution = async () => {
    if (!numericCallId) return;

    if (requiresSafetyCheck && !safetyAcknowledged) {
      setPendingSafetyAction('start');
      setShowSafetyModal(true);
      return;
    }

    await executeStartExecution();
  };

  const handlePause = async () => {
    if (!numericCallId) return;

    const payload = { pause_reason: pauseReason.trim() || null };

    try {
      await postData(`/calls/${callId}/pause`, payload);
      success('Chamado pausado com sucesso');
      setShowPauseModal(false);
      setPauseReason('');
      await loadCall();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao pausar chamado:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline && call) {
        await enqueueCallUpdate({
          callId: numericCallId,
          data: payload,
          endpoint: `/calls/${callId}/pause`,
          method: 'POST',
          baselineUpdatedAt: call.updated_at,
        });
        const optimisticCall: MaintenanceCall = {
          ...call,
          status: 'paused',
          pause_reason: payload.pause_reason ?? call.pause_reason,
          paused_at: new Date().toISOString(),
        };
        setCall(optimisticCall);
        await cacheCall(optimisticCall);
        setShowPauseModal(false);
        setPauseReason('');
        success('Pausa registrada offline. Sincronizaremos ao voltar a conexão.');
        return;
      }
      showError('Erro ao pausar chamado');
    }
  };

  const executeResumeExecution = async () => {
    if (!numericCallId) return;

    try {
      await postData(`/calls/${callId}/resume`, {});
      success('Chamado retomado com sucesso');
      await loadCall();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao retomar chamado:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline && call) {
        await enqueueCallUpdate({
          callId: numericCallId,
          data: {},
          endpoint: `/calls/${callId}/resume`,
          method: 'POST',
          baselineUpdatedAt: call.updated_at,
        });
        const optimisticCall: MaintenanceCall = {
          ...call,
          status: 'execution',
          pause_reason: undefined,
          paused_at: undefined,
        };
        setCall(optimisticCall);
        await cacheCall(optimisticCall);
        success('Retomada registrada offline. Sincronizaremos ao voltar a conexão.');
        return;
      }
      showError('Erro ao retomar chamado');
    }
  };

  const handleResume = async () => {
    if (!numericCallId) return;

    if (requiresSafetyCheck && !safetyAcknowledged) {
      setPendingSafetyAction('resume');
      setShowSafetyModal(true);
      return;
    }

    await executeResumeExecution();
  };

  const handleCancel = async () => {
    if (!numericCallId) return;

    const payload: Record<string, any> = {
      status: 'cancelled',
      cancel_reason: cancelReason.trim() || undefined,
    };

    try {
      await putData(`/calls/${callId}`, payload);
      success('Chamado cancelado com sucesso');
      setShowCancelModal(false);
      setCancelReason('');
      await loadCall();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao cancelar chamado:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline && call) {
        await enqueueCallUpdate({
          callId: numericCallId,
          data: payload,
        });
        const optimisticCall: MaintenanceCall = {
          ...call,
          status: 'cancelled',
          cancel_reason: payload.cancel_reason ?? call.cancel_reason,
          cancelled_at: new Date().toISOString(),
        };
        setCall(optimisticCall);
        await cacheCall(optimisticCall);
        setShowCancelModal(false);
        setCancelReason('');
        success('Cancelamento registrado offline. Sincronizaremos ao voltar a conexão.');
        return;
      }
      showError('Erro ao cancelar chamado');
    }
  };

  const handleComplete = async () => {
    if (!numericCallId || !call) return;

    try {
      console.log('🔄 [DEBUG] Concluindo chamado:', callId);

      const trimmedNotes = executionNotes.trim();
      const partsUsedValue =
        materials.length > 0 ? JSON.stringify(materials) : partsUsed.trim() || undefined;

      const updatePayload: Record<string, any> = {};
      if (trimmedNotes) {
        updatePayload.execution_notes = trimmedNotes;
      }
      if (partsUsedValue !== undefined) {
        updatePayload.parts_used = partsUsedValue;
      }

      if (Object.keys(updatePayload).length > 0) {
        await putData(`/calls/${callId}`, updatePayload);
        const updatedCall: MaintenanceCall = {
          ...call,
          execution_notes: updatePayload.execution_notes ?? call.execution_notes,
          parts_used: (updatePayload.parts_used as string | undefined) ?? call.parts_used,
        };
        await cacheCall(updatedCall);
        if (materials.length > 0) {
          await cacheMaterials('maintenance_call', numericCallId, materials);
        }
      }

      await postData(`/calls/${callId}/complete`, {});
      console.log('✅ [DEBUG] Chamado concluído:', callId);
      success('Chamado concluído com sucesso!');

      await loadCall();

      setTimeout(() => {
        router.push('/calls');
      }, 1000);
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao concluir chamado:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        const trimmedNotes = executionNotes.trim();
        const partsUsedValue =
          materials.length > 0 ? JSON.stringify(materials) : partsUsed.trim() || undefined;

        const updatePayload: Record<string, any> = {};
        if (trimmedNotes) {
          updatePayload.execution_notes = trimmedNotes;
        }
        if (partsUsedValue !== undefined) {
          updatePayload.parts_used = partsUsedValue;
        }

        if (Object.keys(updatePayload).length > 0) {
          await enqueueCallUpdate({ callId: numericCallId, data: updatePayload });
        }

        await enqueueCallUpdate({
          callId: numericCallId,
          data: {},
          endpoint: `/calls/${callId}/complete`,
          method: 'POST',
        });

        const optimisticCall: MaintenanceCall = {
          ...call,
          status: 'completed',
          execution_notes: updatePayload.execution_notes ?? call.execution_notes,
          parts_used: (updatePayload.parts_used as string | undefined) ?? call.parts_used,
          completed_at: new Date().toISOString(),
        };
        setCall(optimisticCall);
        await cacheCall(optimisticCall);
        if (materials.length > 0) {
          await cacheMaterials('maintenance_call', numericCallId, materials);
        }
        success('Conclusão registrada offline. Sincronizaremos assim que possível.');
        setTimeout(() => {
          router.push('/calls');
        }, 1000);
        return;
      }
      showError('Erro ao concluir chamado');
    }
  };

  const handleSaveExecutionData = async () => {
    if (!numericCallId) return;

    const trimmedNotes = executionNotes.trim();
    const partsUsedValue =
      materials.length > 0 ? JSON.stringify(materials) : partsUsed.trim() || undefined;

    const payload: Record<string, any> = {};
    if (trimmedNotes) {
      payload.execution_notes = trimmedNotes;
    }
    if (partsUsedValue !== undefined) {
      payload.parts_used = partsUsedValue;
    }

    try {
      if (Object.keys(payload).length === 0) {
        success('Nenhuma alteração para salvar.');
        return;
      }

      await putData(`/calls/${callId}`, payload);
      success('Dados de execução salvos com sucesso');
      if (call) {
        const updatedCall: MaintenanceCall = {
          ...call,
          execution_notes: payload.execution_notes ?? call.execution_notes,
          parts_used: (payload.parts_used as string | undefined) ?? call.parts_used,
        };
        await cacheCall(updatedCall);
      }
      if (materials.length > 0) {
        await cacheMaterials('maintenance_call', numericCallId, materials);
      }
      await loadCall();
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao salvar dados do chamado:', err);
      const isOffline = typeof window !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        if (Object.keys(payload).length > 0) {
          await enqueueCallUpdate({ callId: numericCallId, data: payload });
        }
        if (call) {
          const optimisticCall: MaintenanceCall = {
            ...call,
            execution_notes: payload.execution_notes ?? call.execution_notes,
            parts_used: (payload.parts_used as string | undefined) ?? call.parts_used,
          };
          setCall(optimisticCall);
          await cacheCall(optimisticCall);
        }
        if (materials.length > 0) {
          await cacheMaterials('maintenance_call', numericCallId, materials);
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

  const formatMaterialsText = () => {
    if (materials.length === 0) return '';
    return materials
      .map(m => {
        let text = `${m.name} - ${m.quantity} ${m.unit}`;
        if (m.value) {
          text += ` - R$ ${parseFloat(m.value).toFixed(2).replace('.', ',')}`;
        }
        return text;
      })
      .join('\n');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
      const validFiles = imageFiles.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          showError(`Arquivo ${file.name} excede 10MB`);
          return false;
        }
        return true;
      });

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreviews(prev => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhotoPreview = (index: number) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (phase: 'during' | 'after') => {
    if (photoPreviews.length === 0) return;

    setUploadingPhotos(true);
    try {
      const photosToUpload = photoPreviews;
      setPhotoPreviews([]);

      for (const { file } of photosToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('phase', phase);
        formData.append('document_type', 'photo');

        const token = localStorage.getItem('token');
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          }/calls/${callId}/documents`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao fazer upload de foto');
        }
      }

      success('Fotos enviadas com sucesso');
      await loadCall();
    } catch (err: any) {
      showError(err.message || 'Erro ao fazer upload de fotos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const deletePhoto = async (docId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        }/calls/${callId}/documents/${docId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao deletar foto');
      }

      success('Foto deletada com sucesso');
      await loadCall();
    } catch (err) {
      showError('Erro ao deletar foto');
    }
  };

  const getPhotoUrl = (doc: any) => {
    return `${
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    }/calls/${callId}/documents/${doc.id}/view`;
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;

    setSubmittingActivity(true);
    try {
      await postData(`/calls/${callId}/activities`, { activity: newActivity });
      success('Atividade registrada');
      setNewActivity('');
      loadCall();
    } catch (err) {
      showError('Erro ao registrar atividade');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const data = await fetchData<any[]>('/users/technicians');
      setTechnicians(data);
    } catch (err) {
      console.error('Erro ao carregar técnicos:', err);
    }
  };

  const handleAssign = async (technicianId: string) => {
    try {
      await putData(`/calls/${callId}`, {
        assigned_to: technicianId ? parseInt(technicianId) : null,
      });
      success('Chamado atribuído com sucesso');
      loadCall();
    } catch (err) {
      showError('Erro ao atribuir chamado');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await putData(`/calls/${callId}`, { status });
      success('Status atualizado');
      loadCall();
    } catch (err) {
      showError('Erro ao atualizar status');
    }
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await putData(`/calls/${callId}`, { priority });
      success('Prioridade atualizada');
      loadCall();
    } catch (err) {
      showError('Erro ao atualizar prioridade');
    }
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

  if (!call) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      analysis: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      assigned: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      execution: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      waiting_parts: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <OfflineQueueIndicator className="mb-4" />
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <Button
              variant="secondary"
              onClick={() => router.back()}
            >
              Voltar
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white font-poppins">Chamado #{call.id}</h1>
                {/* Indicador de que o técnico é o atribuído */}
                {isAssigned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400 font-medium"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Você está atribuído</span>
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Wrench className="w-4 h-4" />
                <button
                  onClick={() =>
                    call.equipment_id && router.push(`/equipment/${call.equipment_id}`)
                  }
                  className="hover:text-green-400 transition-colors flex items-center gap-1 group"
                >
                  <span>
                    {call.equipment_code} - {call.equipment_name}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/calls/${callId}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            )}
          </div>
        </div>

        {/* Status, Prioridade e Timer */}
        <div className="flex items-center gap-4 flex-wrap">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
              call.status
            )}`}
          >
            {call.status === 'open' && 'Aberto'}
            {call.status === 'analysis' && 'Em Análise'}
            {call.status === 'assigned' && 'Atribuído'}
            {call.status === 'execution' && 'Em Execução'}
            {call.status === 'paused' && 'Pausado'}
            {call.status === 'waiting_parts' && 'Aguardando Peças'}
            {call.status === 'completed' && 'Concluído'}
            {call.status === 'cancelled' && 'Cancelado'}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getPriorityColor(
              call.priority
            )}`}
          >
            {call.priority === 'low' && 'Baixa'}
            {call.priority === 'medium' && 'Média'}
            {call.priority === 'high' && 'Alta'}
            {call.priority === 'urgent' && 'Urgente'}
          </span>
          {/* Timer em tempo real durante execução */}
          {call.status === 'execution' && elapsedTime !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm text-orange-400 font-medium"
            >
              <Timer className="w-4 h-4 animate-pulse" />
              <span>{formatDurationWithSeconds(elapsedTime)}</span>
            </motion.div>
          )}
          {/* Timer quando pausado */}
          {call.status === 'paused' && elapsedTime !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-400 font-medium"
            >
              <Pause className="w-4 h-4" />
              <span>Tempo decorrido (pausado): {formatDurationWithSeconds(elapsedTime)}</span>
            </motion.div>
          )}
          {/* Tempo de execução final quando concluído */}
          {call.status === 'completed' && call.execution_time && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400 font-medium">
              <Clock className="w-4 h-4" />
              <span>
                {call.execution_time >= 60
                  ? `${Math.floor(call.execution_time / 60)}h ${call.execution_time % 60}min`
                  : `${call.execution_time}min`}
              </span>
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        {canEdit && call.status !== 'completed' && call.status !== 'cancelled' && (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Atribuir para
                </label>
                <select
                  value={call.assigned_to?.toString() || ''}
                  onChange={e => handleAssign(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Não atribuído</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name || tech.username} ({tech.department || tech.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={call.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="open">Aberto</option>
                  <option value="analysis">Em Análise</option>
                  <option value="assigned">Atribuído</option>
                  <option value="execution">Em Execução</option>
                  <option value="waiting_parts">Aguardando Peças</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-300 mb-2">Prioridade</label>
                <select
                  value={call.priority}
                  onChange={e => handlePriorityChange(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Ações de Execução - Cards destacados */}
        <AnimatePresence>
          {canExecute && call.status === 'assigned' && !call.started_at && isAssigned && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-green-500/20 to-green-500/10 border-2 border-green-500/30 rounded-xl p-6 shadow-lg shadow-green-500/10"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Pronto para iniciar</h3>
                <p className="text-sm text-slate-300">
                  Este chamado foi atribuído a você. Clique para iniciar a execução.
                </p>
              </div>
              <Button
                onClick={handleStartExecution}
                variant="primary"
                className="flex items-center justify-center gap-2 w-full py-3 text-base font-semibold"
              >
                <Play className="w-5 h-5" />
                Iniciar Execução
              </Button>
            </motion.div>
          )}

          {canExecute && call.status === 'execution' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 border-2 border-orange-500/30 rounded-xl p-6 shadow-lg shadow-orange-500/10"
            >
              {/* Header com Informações Essenciais */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
                      <Clock className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Manutenção em andamento
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Acompanhe o progresso e gerencie recursos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações de Tempo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {call.started_at && (
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="p-1.5 bg-slate-700/50 rounded-lg">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Iniciado em</p>
                        <p className="text-sm font-semibold text-white">
                          {format(new Date(call.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                  {elapsedTime !== null && (
                    <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <div className="p-1.5 bg-orange-500/20 rounded-lg">
                        <Timer className="w-4 h-4 text-orange-400 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs text-orange-300/70">Tempo decorrido</p>
                        <p className="text-sm font-bold text-orange-400">
                          {formatDurationWithSeconds(elapsedTime)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seção de Materiais Melhorada */}
                <div className="bg-gradient-to-r from-slate-800/60 to-slate-800/40 rounded-xl border-2 border-slate-700/50 p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <Package className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white">Materiais e Peças Utilizados</h4>
                        <p className="text-xs text-slate-400">
                          {materials.length === 0 
                            ? 'Nenhum material registrado ainda' 
                            : `${materials.length} ${materials.length === 1 ? 'item registrado' : 'itens registrados'}`
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowMaterialsModal(true)}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300"
                    >
                      {materials.length === 0 ? (
                        <>
                          <Plus className="w-4 h-4" />
                          Adicionar Material
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4" />
                          Gerenciar ({materials.length})
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Lista Rápida de Materiais (se houver) */}
                  {materials.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex flex-wrap gap-2">
                        {materials.slice(0, 3).map((material, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs"
                          >
                            <span className="text-slate-300 font-medium">{material.name}</span>
                            <span className="text-slate-500 ml-2">
                              {material.quantity} {material.unit}
                            </span>
                          </div>
                        ))}
                        {materials.length > 3 && (
                          <div className="px-3 py-1.5 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400">
                            +{materials.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações Principais */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                <Button
                  onClick={() => setShowPauseModal(true)}
                  variant="secondary"
                  className="flex items-center justify-center gap-2 flex-1 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 font-semibold"
                >
                  <Pause className="w-5 h-5" />
                  Pausar
                </Button>
                <Button
                  onClick={() => setShowCancelModal(true)}
                  variant="secondary"
                  className="flex items-center justify-center gap-2 flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-semibold"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleComplete}
                  variant="primary"
                  className="flex items-center justify-center gap-2 flex-1 py-3 text-base font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                >
                  <CheckCircle className="w-5 h-5" />
                  Concluir Chamado
                </Button>
              </div>
            </motion.div>
          )}

          {canExecute && call.status === 'paused' && (
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
                    {call.pause_reason || 'Manutenção pausada temporariamente.'}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    {call.paused_at && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-4 h-4" />
                        <span>
                          Pausado em:{' '}
                          {format(new Date(call.paused_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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
        </AnimatePresence>

        {/* Checklist Inteligente - Aparece sempre que há execução ou pode executar */}
        {(call.status === 'execution' || call.status === 'paused' || call.status === 'assigned' || call.status === 'open' || call.status === 'analysis') && (
          <ChecklistExecutionPanel
            referenceId={Number(callId)}
            referenceType="maintenance_call"
            primaryEntity={{ type: 'maintenance_call', id: Number(callId) }}
            fallbackEntities={[{ type: 'equipment', id: call.equipment_id }]}
            status={call.status}
            canExecute={canExecute && (isAssigned || canEdit)}
            onLoaded={setSmartChecklistAvailable}
          />
        )}

        {/* Tabs */}
        <div className="border-b border-slate-800">
          <div className="flex gap-4">
            {[
              { id: 'info', label: 'Informações', icon: Wrench },
              { id: 'activities', label: 'Atividades', icon: MessageSquare },
              { id: 'docs', label: 'Documentação', icon: Camera },
              { id: 'history', label: 'Histórico', icon: History },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'docs' && call?.documents && call.documents.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                      {call.documents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Cards de informações principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Wrench className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Informações do Chamado</h3>
                  </div>
                  <div className="space-y-1">
                    <InfoRow
                      label="Equipamento"
                      value={
                        <button
                          onClick={() =>
                            call.equipment_id && router.push(`/equipment/${call.equipment_id}`)
                          }
                          className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1.5 group/btn justify-end"
                        >
                          <span>
                            {call.equipment_code} - {call.equipment_name}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </button>
                      }
                      icon={<Package className="w-5 h-5 text-green-400" />}
                    />
                    <InfoRow
                      label="Tipo de Problema"
                      value={call.problem_type || '-'}
                      icon={<AlertCircle className="w-5 h-5 text-orange-400" />}
                    />
                    <InfoRow
                      label="Descrição"
                      value={call.description}
                      icon={<FileText className="w-5 h-5 text-blue-400" />}
                    />
                    <InfoRow
                      label="Data da Ocorrência"
                      value={
                        call.occurrence_date ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span>
                              {format(new Date(call.occurrence_date), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )
                      }
                      icon={<Calendar className="w-5 h-5 text-blue-400" />}
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Informações de Execução</h3>
                  </div>
                  <div className="space-y-1">
                    <InfoRow
                      label="Criado por"
                      value={
                        <div className="flex items-center gap-1.5 justify-end">
                          <User className="w-4 h-4 text-blue-400" />
                          <span>{call.created_by_full_name || call.created_by_name || '-'}</span>
                        </div>
                      }
                      icon={<User className="w-5 h-5 text-blue-400" />}
                    />
                    <InfoRow
                      label="Atribuído para"
                      value={
                        call.assigned_to_name ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <UserCheck
                              className={`w-4 h-4 ${
                                isAssigned ? 'text-green-400' : 'text-slate-400'
                              }`}
                            />
                            <span className={isAssigned ? 'text-green-400 font-semibold' : ''}>
                              {call.assigned_to_name}
                              {isAssigned && ' (Você)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Não atribuído</span>
                        )
                      }
                      icon={
                        <UserCheck
                          className={`w-5 h-5 ${isAssigned ? 'text-green-400' : 'text-slate-500'}`}
                        />
                      }
                    />
                    {call.assigned_at && (
                      <InfoRow
                        label="Atribuído em"
                        value={
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>
                              {format(new Date(call.assigned_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        }
                        icon={<Clock className="w-5 h-5 text-blue-400" />}
                      />
                    )}
                    {call.started_at && (
                      <InfoRow
                        label="Iniciado em"
                        value={
                          <div className="flex items-center gap-1.5 justify-end">
                            <Play className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400">
                              {format(new Date(call.started_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        }
                        icon={<Play className="w-5 h-5 text-orange-400" />}
                      />
                    )}
                    {call.completed_at && (
                      <InfoRow
                        label="Concluído em"
                        value={
                          <div className="flex items-center gap-1.5 justify-end">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">
                              {format(new Date(call.completed_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        }
                        icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                      />
                    )}
                    {call.execution_time && (
                      <InfoRow
                        label="Tempo de Execução"
                        value={
                          <div className="flex items-center gap-1.5 justify-end">
                            <Timer className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 font-semibold">
                              {call.execution_time >= 60
                                ? `${Math.floor(call.execution_time / 60)}h ${
                                    call.execution_time % 60
                                  }min`
                                : `${call.execution_time}min`}
                            </span>
                          </div>
                        }
                        icon={<Timer className="w-5 h-5 text-blue-400" />}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Observações e Peças Utilizadas (quando houver) */}
              {(call.execution_notes || call.parts_used) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {call.execution_notes && (
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <ClipboardList className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Observações da Execução
                        </h3>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-4">
                        <p className="text-slate-300 whitespace-pre-wrap">{call.execution_notes}</p>
                      </div>
                    </div>
                  )}
                  {call.parts_used && (
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Peças/Materiais Utilizados
                        </h3>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-4">
                        {(() => {
                          try {
                            const parsed = JSON.parse(call.parts_used);
                            if (Array.isArray(parsed)) {
                              return (
                                <div className="space-y-2">
                                  {parsed.map((material: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-slate-800 rounded"
                                    >
                                      <div>
                                        <span className="text-white font-medium">
                                          {material.name}
                                        </span>
                                        <span className="text-slate-400 ml-2">
                                          - {material.quantity} {material.unit}
                                          {material.value && (
                                            <span className="text-green-400 ml-2">
                                              (R${' '}
                                              {parseFloat(material.value)
                                                .toFixed(2)
                                                .replace('.', ',')}
                                              )
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
                                              sum +
                                              parseFloat(m.value || '0') * parseFloat(m.quantity),
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
                            <p className="text-slate-300 whitespace-pre-wrap">{call.parts_used}</p>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Card de contexto adicional */}
              {call.status === 'assigned' && isAssigned && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Chamado atribuído a você</h4>
                      <p className="text-sm text-slate-300">
                        Este chamado foi atribuído a você. Quando estiver pronto, clique em "Iniciar
                        Execução" para começar o trabalho.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Atividades Registradas</h3>

              {/* Formulário de nova atividade */}
              {canExecute && (isAssigned || canEdit) && call.status !== 'completed' && (
                <form onSubmit={handleAddActivity} className="mb-6">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Registre uma atividade realizada..."
                      value={newActivity}
                      onChange={e => setNewActivity(e.target.value)}
                      disabled={submittingActivity}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submittingActivity || !newActivity.trim()}
                    >
                      {submittingActivity ? 'Enviando...' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              )}

              {call.activities && call.activities.length > 0 ? (
                <div className="space-y-3">
                  {call.activities.map(activity => (
                    <div
                      key={activity.id}
                      className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                    >
                      <p className="text-white mb-2">{activity.activity}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        {activity.performed_by_name && (
                          <>
                            <User className="w-4 h-4" />
                            <span>{activity.performed_by_name}</span>
                          </>
                        )}
                        <Clock className="w-4 h-4 ml-2" />
                        <span>
                          {format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  Nenhuma atividade registrada ainda
                </p>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-green-400" />
                Documentação da Manutenção
              </h3>

              {/* Upload de fotos se estiver em execução */}
              {canExecute && (call.status === 'execution' || call.status === 'paused') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 p-6 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-green-500/20 rounded-lg">
                      <Camera className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white">Adicionar Fotos</h4>
                      <p className="text-xs text-slate-400">Documente o progresso da manutenção</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Seleção de fase e botão */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Fase da Documentação
                        </label>
                        <select
                          value={selectedPhotoPhase}
                          onChange={e => setSelectedPhotoPhase(e.target.value as 'during' | 'after')}
                          className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        >
                          <option value="during">📸 Durante a Manutenção</option>
                          <option value="after">✅ Após a Manutenção</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Ação
                        </label>
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            capture="environment"
                            onChange={handlePhotoSelect}
                            className="hidden"
                            id="photo-upload-docs"
                          />
                          <div className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg text-slate-200 hover:text-white hover:from-green-600/30 hover:to-emerald-600/30 hover:border-green-500/50 transition-all duration-200 shadow-lg hover:shadow-green-500/20">
                            <Camera className="w-5 h-5" />
                            <span className="font-medium text-sm">Tirar Foto ou Selecionar</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Preview de fotos */}
                    {photoPreviews.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-300 font-medium">
                            {photoPreviews.length} foto{photoPreviews.length > 1 ? 's' : ''} selecionada{photoPreviews.length > 1 ? 's' : ''}
                          </p>
                          <button
                            onClick={() => setPhotoPreviews([])}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Limpar todas
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-700 hover:border-green-500/50 transition-colors shadow-lg">
                                <img
                                  src={preview.preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                onClick={() => removePhotoPreview(index)}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                title="Remover foto"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-xs text-white font-medium">Foto {index + 1}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => uploadPhotos(selectedPhotoPhase)}
                          disabled={uploadingPhotos}
                          variant="primary"
                          className="w-full flex items-center justify-center gap-2 py-3"
                        >
                          {uploadingPhotos ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Enviando {photoPreviews.length} foto{photoPreviews.length > 1 ? 's' : ''}...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Enviar {photoPreviews.length} Foto{photoPreviews.length > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/30">
                        <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 font-medium mb-1">Nenhuma foto selecionada</p>
                        <p className="text-xs text-slate-500">Selecione ou tire fotos para documentar a manutenção</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Fotos organizadas por fase */}
              {call.documents && call.documents.length > 0 ? (
                <div className="space-y-6">
                  {/* Fotos Durante a Manutenção */}
                  {call.documents.filter(doc => doc.phase === 'during').length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        Durante a Manutenção (
                        {call.documents.filter(doc => doc.phase === 'during').length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {call.documents
                          .filter(doc => doc.phase === 'during')
                          .map(doc => (
                            <div key={doc.id} className="relative group">
                              <a
                                href={getPhotoUrl(doc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={getPhotoUrl(doc)}
                                  alt={doc.file_name}
                                  className="w-full h-48 object-cover rounded-lg border border-slate-700 hover:border-green-500 transition-colors cursor-pointer"
                                />
                              </a>
                              {canExecute &&
                                (call.status === 'execution' || call.status === 'paused') && (
                                  <button
                                    onClick={() => deletePhoto(doc.id)}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Deletar foto"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              <div className="mt-2 text-xs text-slate-400 truncate">
                                {doc.file_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Fotos Após a Manutenção */}
                  {call.documents.filter(doc => doc.phase === 'after').length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Após a Manutenção (
                        {call.documents.filter(doc => doc.phase === 'after').length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {call.documents
                          .filter(doc => doc.phase === 'after')
                          .map(doc => (
                            <div key={doc.id} className="relative group">
                              <a
                                href={getPhotoUrl(doc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={getPhotoUrl(doc)}
                                  alt={doc.file_name}
                                  className="w-full h-48 object-cover rounded-lg border border-slate-700 hover:border-green-500 transition-colors cursor-pointer"
                                />
                              </a>
                              {canExecute &&
                                (call.status === 'execution' || call.status === 'paused') && (
                                  <button
                                    onClick={() => deletePhoto(doc.id)}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Deletar foto"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              <div className="mt-2 text-xs text-slate-400 truncate">
                                {doc.file_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Nenhuma foto documentada ainda</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Histórico de Alterações</h3>
              {call.history && call.history.length > 0 ? (
                <div className="space-y-3">
                  {call.history.map(entry => (
                    <div
                      key={entry.id}
                      className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium mb-1">
                            {entry.action === 'created' && 'Chamado criado'}
                            {entry.action === 'status_changed' &&
                              `Status alterado: ${entry.old_value} → ${entry.new_value}`}
                            {entry.action === 'priority_changed' &&
                              `Prioridade alterada: ${entry.old_value} → ${entry.new_value}`}
                            {entry.action === 'assigned' && entry.new_value
                              ? `Atribuído para técnico #${entry.new_value}`
                              : 'Atribuição removida'}
                            {entry.action === 'started' && 'Execução iniciada'}
                            {entry.action === 'completed' && 'Chamado concluído'}
                            {entry.notes && ` - ${entry.notes}`}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            {entry.performed_by_name && (
                              <>
                                <User className="w-4 h-4" />
                                <span>{entry.performed_by_name}</span>
                              </>
                            )}
                            <Clock className="w-4 h-4 ml-2" />
                            <span>
                              {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Nenhum histórico disponível</p>
              )}
            </div>
          )}
        </div>

        {/* Modal de Pausa */}
        <AnimatePresence>
          {showPauseModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPauseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Pause className="w-6 h-6 text-yellow-400" />
                  Pausar Chamado
                </h3>
                <p className="text-slate-300 mb-4">
                  Informe o motivo da pausa (opcional). O tempo decorrido será registrado e o
                  cronômetro será pausado.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Motivo da Pausa
                  </label>
                  <textarea
                    value={pauseReason}
                    onChange={e => setPauseReason(e.target.value)}
                    placeholder="Ex: Aguardando peça de reposição, pausa para almoço, etc."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px]"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowPauseModal(false);
                      setPauseReason('');
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handlePause}
                    variant="primary"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                  >
                    Confirmar Pausa
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                      Confirmar Segurança do Chamado
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      Certifique-se de executar todos os procedimentos obrigatórios antes de iniciar
                      ou retomar o atendimento.
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
                    Use EPIs apropriados e siga as orientações de segurança da planta. Em caso de
                    dúvida, interrompa o atendimento e contate o responsável.
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

        {/* Modal de Cancelamento */}
        <AnimatePresence>
          {showCancelModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCancelModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-400" />
                  Cancelar Chamado
                </h3>
                <p className="text-slate-300 mb-4">
                  Tem certeza que deseja cancelar este chamado? Esta ação não pode ser desfeita.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Motivo do Cancelamento
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Informe o motivo do cancelamento..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Não Cancelar
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="primary"
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    Confirmar Cancelamento
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group py-3 px-3 rounded-lg hover:bg-slate-800/30 transition-colors border-b border-slate-700/30 last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Ícone - Grande e Colorido */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || <Info className="w-5 h-5 text-slate-500" />}
        </div>

        {/* Label e Valor */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            {/* Label com estilo destacado */}
            <div className="flex-shrink-0 min-w-[140px]">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {label}
              </div>
            </div>

            {/* Valor com destaque */}
            <div className="flex-1 text-right min-w-0">
              <div className="text-sm font-medium text-white">
                {typeof value === 'string' ? <span>{value}</span> : value}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
