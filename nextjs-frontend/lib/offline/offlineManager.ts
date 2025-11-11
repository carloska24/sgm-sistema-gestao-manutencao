import {
  enqueueSync,
  getSyncQueue,
  clearSyncItem,
  addConflict,
  getConflicts,
  deleteConflict,
  getConflict,
  getConflictsByReference,
  cacheOrder,
  cacheCall,
  SyncQueueType,
  OfflineConflict,
} from './indexedDb';
import { fetchData, postData, putData } from '@/lib/api';
import { MaintenanceOrder, MaintenanceCall } from '@/types';

export type { OfflineConflict } from './indexedDb';

export type ConflictResolutionAction = 'applyOffline' | 'acceptServer';

export interface OfflineSyncState {
  isSyncing: boolean;
  queueLength: number;
  conflictCount: number;
  isOnline: boolean;
}

interface QueueItem {
  id: string;
  type: SyncQueueType;
  payload: any;
}

let isSyncing = false;
let listenerInitialized = false;
let stateInitialized = false;
let queueLengthCache = 0;
let conflictCountCache = 0;

const syncListeners = new Set<(state: OfflineSyncState) => void>();

const getIsOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine);

function getState(): OfflineSyncState {
  return {
    isSyncing,
    queueLength: queueLengthCache,
    conflictCount: conflictCountCache,
    isOnline: getIsOnline(),
  };
}

function emitState() {
  const state = getState();
  syncListeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error('Erro ao notificar listener de sincronização offline:', error);
    }
  });
}

async function initializeState() {
  if (stateInitialized) return;
  try {
    const [queue, conflicts] = await Promise.all([getSyncQueue(), getConflicts()]);
    queueLengthCache = queue.length;
    conflictCountCache = conflicts.length;
  } catch (error) {
    console.error('Erro ao inicializar estado offline:', error);
  } finally {
    stateInitialized = true;
    emitState();
  }
}

async function enqueueItem(type: SyncQueueType, payload: any) {
  await initializeState();
  const result = await enqueueSync({ type, payload });
  queueLengthCache += 1;
  emitState();

  if (getIsOnline()) {
    processSyncQueue();
  }

  return result;
}

async function recordConflict(conflict: Omit<OfflineConflict, 'id' | 'createdAt'>) {
  await addConflict(conflict);
  conflictCountCache += 1;
  emitState();
}

async function removeConflict(conflictId: string) {
  await deleteConflict(conflictId);
  conflictCountCache = Math.max(0, conflictCountCache - 1);
  emitState();
}

async function handleOrderUpdate(item: QueueItem) {
  const { orderId, data, endpoint, method = 'PUT', baselineUpdatedAt, force } = item.payload || {};
  if (!orderId) return;

  if (!force && baselineUpdatedAt) {
    try {
      const current = await fetchData<MaintenanceOrder>(`/maintenance/${orderId}`);
      if (current?.updated_at && current.updated_at !== baselineUpdatedAt) {
        await recordConflict({
          type: 'order-update',
          referenceType: 'maintenance_order',
          referenceId: orderId,
          payload: item.payload,
          baselineUpdatedAt,
          serverData: current,
        });
        await clearSyncItem(item.id);
        queueLengthCache = Math.max(0, queueLengthCache - 1);
        emitState();
        return;
      }
    } catch (error) {
      console.warn('Falha ao validar conflito de ordem antes da sincronização:', error);
    }
  }

  const url = endpoint || `/maintenance/${orderId}`;
  if (method === 'POST') {
    await postData(url, data);
  } else {
    await putData(url, data);
  }
  await clearSyncItem(item.id);
  queueLengthCache = Math.max(0, queueLengthCache - 1);
  emitState();
}

async function handleCallUpdate(item: QueueItem) {
  const { callId, data, endpoint, method = 'PUT', baselineUpdatedAt, force } = item.payload || {};
  if (!callId) return;

  if (!force && baselineUpdatedAt) {
    try {
      const current = await fetchData<MaintenanceCall>(`/calls/${callId}`);
      if (current?.updated_at && current.updated_at !== baselineUpdatedAt) {
        await recordConflict({
          type: 'call-update',
          referenceType: 'maintenance_call',
          referenceId: callId,
          payload: item.payload,
          baselineUpdatedAt,
          serverData: current,
        });
        await clearSyncItem(item.id);
        queueLengthCache = Math.max(0, queueLengthCache - 1);
        emitState();
        return;
      }
    } catch (error) {
      console.warn('Falha ao validar conflito de chamado antes da sincronização:', error);
    }
  }

  const url = endpoint || `/calls/${callId}`;
  if (method === 'POST') {
    await postData(url, data);
  } else {
    await putData(url, data);
  }
  await clearSyncItem(item.id);
  queueLengthCache = Math.max(0, queueLengthCache - 1);
  emitState();
}

async function handleChecklistResponse(item: QueueItem) {
  const { templateId, body } = item.payload || {};
  if (!templateId) return;
  await postData(`/checklists/${templateId}/responses`, body);
  await clearSyncItem(item.id);
  queueLengthCache = Math.max(0, queueLengthCache - 1);
  emitState();
}

async function handleMaterialsUpdate(item: QueueItem) {
  const { referenceType, referenceId, data, endpoint, baselineUpdatedAt, force } = item.payload || {};
  if (!referenceType || referenceId === undefined) return;

  if (!force && baselineUpdatedAt) {
    try {
      if (referenceType === 'maintenance_order') {
        const current = await fetchData<MaintenanceOrder>(`/maintenance/${referenceId}`);
        if (current?.updated_at && current.updated_at !== baselineUpdatedAt) {
          await recordConflict({
            type: 'materials-update',
            referenceType,
            referenceId,
            payload: item.payload,
            baselineUpdatedAt,
            serverData: current,
          });
          await clearSyncItem(item.id);
          queueLengthCache = Math.max(0, queueLengthCache - 1);
          emitState();
          return;
        }
      } else if (referenceType === 'maintenance_call') {
        const current = await fetchData<MaintenanceCall>(`/calls/${referenceId}`);
        if (current?.updated_at && current.updated_at !== baselineUpdatedAt) {
          await recordConflict({
            type: 'materials-update',
            referenceType,
            referenceId,
            payload: item.payload,
            baselineUpdatedAt,
            serverData: current,
          });
          await clearSyncItem(item.id);
          queueLengthCache = Math.max(0, queueLengthCache - 1);
          emitState();
          return;
        }
      }
    } catch (error) {
      console.warn('Falha ao validar conflito de materiais antes da sincronização:', error);
    }
  }

  if (endpoint) {
    await postData(endpoint, data);
  } else if (referenceType === 'maintenance_order') {
    await putData(`/maintenance/${referenceId}`, data);
  } else if (referenceType === 'maintenance_call') {
    await putData(`/calls/${referenceId}`, data);
  }
  await clearSyncItem(item.id);
  queueLengthCache = Math.max(0, queueLengthCache - 1);
  emitState();
}

async function handleQueueItem(item: QueueItem) {
  try {
    switch (item.type) {
      case 'order-update':
        await handleOrderUpdate(item);
        break;
      case 'call-update':
        await handleCallUpdate(item);
        break;
      case 'checklist-response':
        await handleChecklistResponse(item);
        break;
      case 'materials-update':
        await handleMaterialsUpdate(item);
        break;
      default:
        console.warn('Tipo de item offline desconhecido:', item.type);
        await clearSyncItem(item.id);
        queueLengthCache = Math.max(0, queueLengthCache - 1);
        emitState();
        break;
    }
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar item offline:', error);
    return false;
  }
}

export async function enqueueOrderUpdate(payload: any) {
  return enqueueItem('order-update', payload);
}

export async function enqueueCallUpdate(payload: any) {
  return enqueueItem('call-update', payload);
}

export async function enqueueChecklistResponse(payload: any) {
  return enqueueItem('checklist-response', payload);
}

export async function enqueueMaterialsUpdate(payload: any) {
  return enqueueItem('materials-update', payload);
}

export async function processSyncQueue(force = false) {
  if (isSyncing) return;
  if (!force && (typeof window === 'undefined' || !getIsOnline())) return;

  await initializeState();

  isSyncing = true;
  emitState();

  try {
    const queue = await getSyncQueue();
    queueLengthCache = queue.length;
    emitState();

    for (const item of queue) {
      const shouldContinue = await handleQueueItem(item as QueueItem);
      if (!shouldContinue) {
        break;
      }
    }
  } finally {
    isSyncing = false;
    emitState();
  }
}

export async function getOfflineQueueLength() {
  await initializeState();
  return queueLengthCache;
}

export function getOfflineSyncState(): OfflineSyncState {
  return getState();
}

export function subscribeOfflineSync(listener: (state: OfflineSyncState) => void) {
  syncListeners.add(listener);
  listener(getState());
  initializeState().catch(() => undefined);
  return () => {
    syncListeners.delete(listener);
  };
}

export async function getConflictsForReference(referenceType: string, referenceId: number) {
  await initializeState();
  return getConflictsByReference(referenceType, referenceId);
}

export async function resolveConflict(conflictId: string, action: ConflictResolutionAction) {
  const conflict = await getConflict(conflictId);
  if (!conflict) return null;

  if (action === 'applyOffline') {
    const payload = {
      ...conflict.payload,
      force: true,
    };
    switch (conflict.type) {
      case 'order-update':
        await enqueueOrderUpdate(payload);
        break;
      case 'call-update':
        await enqueueCallUpdate(payload);
        break;
      case 'materials-update':
        await enqueueMaterialsUpdate(payload);
        break;
      case 'checklist-response':
        await enqueueChecklistResponse(payload);
        break;
      default:
        break;
    }
  } else if (action === 'acceptServer') {
    if (conflict.referenceType === 'maintenance_order' && conflict.serverData) {
      await cacheOrder(conflict.serverData);
    } else if (conflict.referenceType === 'maintenance_call' && conflict.serverData) {
      await cacheCall(conflict.serverData);
    }
  }

  await removeConflict(conflictId);

  if (action === 'applyOffline') {
    processSyncQueue();
  }

  return conflict.serverData;
}

export function initializeSyncListener() {
  if (typeof window === 'undefined' || listenerInitialized) return;

  listenerInitialized = true;
  initializeState().catch(() => undefined);

  window.addEventListener('online', () => {
    emitState();
    processSyncQueue();
  });

  window.addEventListener('offline', () => {
    emitState();
  });

  setInterval(() => {
    processSyncQueue();
  }, 30000);
}
