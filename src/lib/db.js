import { openDB } from 'idb';

const DB_NAME = 'task-manager-db';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tasks store
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-status', 'status');
        taskStore.createIndex('by-priority', 'priority');
        taskStore.createIndex('by-updated', 'updatedAt');

        // Sync queue store
        const syncStore = db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
        syncStore.createIndex('by-created', 'createdAt');
        syncStore.createIndex('by-entity', 'entityId');
      }
    });
  }
  return dbPromise;
}

// ── Task CRUD ─────────────────────────────────────────────
export async function getAllTasks() {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function getTask(id) {
  const db = await getDB();
  return db.get('tasks', id);
}

export async function putTask(task) {
  const db = await getDB();
  return db.put('tasks', task);
}

export async function deleteTaskFromDB(id) {
  const db = await getDB();
  return db.delete('tasks', id);
}

export async function getTasksByStatus(status) {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-status', status);
}

// ── Sync Queue CRUD ───────────────────────────────────────
export async function addToSyncQueue(operation) {
  const db = await getDB();
  return db.add('syncQueue', {
    ...operation,
    createdAt: Date.now(),
    retryCount: 0
  });
}

export async function getAllSyncQueueItems() {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-created');
}

export async function removeSyncQueueItem(id) {
  const db = await getDB();
  return db.delete('syncQueue', id);
}

export async function updateSyncQueueItem(item) {
  const db = await getDB();
  return db.put('syncQueue', item);
}

export async function clearSyncQueue() {
  const db = await getDB();
  return db.clear('syncQueue');
}

export async function getPendingSyncCount() {
  const db = await getDB();
  return db.count('syncQueue');
}
