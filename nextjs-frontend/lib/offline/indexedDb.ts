import { openDB, DBSchema } from 'idb';

type SyncQueueType = 'order-update' | 'call-update' | 'checklist-response' | 'materials-update';

interface SyncQueueItem {
  id: string;
  type: SyncQueueType;
  payload: any;
  createdAt: number;
}

export interface OfflineConflict {
  id: string;
  type: SyncQueueType;
  referenceType?: string;
  referenceId?: number;
  payload: any;
  baselineUpdatedAt?: string;
  serverData: any;
  createdAt: number;
}

interface SgmOfflineDB extends DBSchema {
  orders: {
    key: number;
    value: any;
  };
  calls: {
    key: number;
    value: any;
  };
  checklists: {
    key: string;
    value: {
      templateId: number;
      referenceType: string;
      referenceId: number;
      template: any;
      responses: any[];
      updatedAt: number;
    };
  };
  materials: {
    key: string;
    value: {
      referenceType: string;
      referenceId: number;
      materials: any[];
      updatedAt: number;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
  conflicts: {
    key: string;
    value: OfflineConflict;
  };
}

const DB_NAME = 'sgm-offline';
const DB_VERSION = 2;

export async function getDB() {
  return openDB<SgmOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('orders');
        db.createObjectStore('calls');
        db.createObjectStore('checklists');
        db.createObjectStore('materials');
        db.createObjectStore('syncQueue');
      }
      if (oldVersion < 2) {
        db.createObjectStore('conflicts');
      }
    },
  });
}

export async function cacheOrder(order: any) {
  const db = await getDB();
  await db.put('orders', order, order.id);
}

export async function removeCachedOrder(id: number) {
  const db = await getDB();
  await db.delete('orders', id);
}

export async function getCachedOrder(id: number) {
  const db = await getDB();
  return db.get('orders', id);
}

export async function cacheCall(call: any) {
  const db = await getDB();
  await db.put('calls', call, call.id);
}

export async function getCachedCall(id: number) {
  const db = await getDB();
  return db.get('calls', id);
}

export async function cacheChecklist(referenceType: string, referenceId: number, data: { templateId: number; template: any; responses: any[]; }) {
  const db = await getDB();
  const key = `${referenceType}:${referenceId}`;
  await db.put('checklists', { referenceType, referenceId, ...data, updatedAt: Date.now() }, key);
}

export async function removeCachedChecklist(referenceType: string, referenceId: number) {
  const db = await getDB();
  const key = `${referenceType}:${referenceId}`;
  await db.delete('checklists', key);
}

export async function getCachedChecklist(referenceType: string, referenceId: number) {
  const db = await getDB();
  const key = `${referenceType}:${referenceId}`;
  return db.get('checklists', key);
}

export async function cacheMaterials(referenceType: string, referenceId: number, materials: any[]) {
  const db = await getDB();
  const key = `${referenceType}:${referenceId}`;
  await db.put('materials', { referenceType, referenceId, materials, updatedAt: Date.now() }, key);
}

export async function removeCachedMaterials(referenceType: string, referenceId: number) {
  const db = await getDB();
  const key = `${referenceType}:${referenceId}`;
  await db.delete('materials', key);
}

export async function getCachedMaterials(referenceType: string, referenceId: number) {
  const db = await getDB();
  const key = `${referenceType}:${referenceId}`;
  return db.get('materials', key);
}

export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'createdAt'>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const syncItem: SyncQueueItem = { id, createdAt: Date.now(), ...item };
  await db.put('syncQueue', syncItem, id);
  return syncItem;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function clearSyncItem(id: string) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function clearAllCaches() {
  const db = await getDB();
  await Promise.all([
    db.clear('orders'),
    db.clear('calls'),
    db.clear('checklists'),
    db.clear('materials'),
    db.clear('conflicts'),
    db.clear('syncQueue'),
  ]);
}

export async function addConflict(conflict: Omit<OfflineConflict, 'id' | 'createdAt'>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const record: OfflineConflict = {
    id,
    createdAt: Date.now(),
    ...conflict,
  };
  await db.put('conflicts', record, id);
  return record;
}

export async function getConflicts(): Promise<OfflineConflict[]> {
  const db = await getDB();
  return db.getAll('conflicts');
}

export async function getConflict(id: string) {
  const db = await getDB();
  return db.get('conflicts', id);
}

export async function getConflictsByReference(referenceType: string, referenceId: number) {
  const db = await getDB();
  const all = await db.getAll('conflicts');
  return all.filter((conflict) => conflict.referenceType === referenceType && conflict.referenceId === referenceId);
}

export async function deleteConflict(id: string) {
  const db = await getDB();
  await db.delete('conflicts', id);
}

export async function clearConflicts() {
  const db = await getDB();
  await db.clear('conflicts');
}

export type { SyncQueueType };
