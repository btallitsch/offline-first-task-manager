import {
  getAllSyncQueueItems,
  removeSyncQueueItem,
  updateSyncQueueItem,
  addToSyncQueue,
  getTask,
  putTask
} from './db';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.example.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ── Enqueue an operation ──────────────────────────────────
export async function enqueue(operation) {
  // operation shape: { type: 'CREATE'|'UPDATE'|'DELETE', entityId, payload }
  await addToSyncQueue(operation);
  tryBackgroundSync();
}

function tryBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((reg) => reg.sync.register('task-sync'))
      .catch(console.warn);
  }
}

// ── Process the full queue ────────────────────────────────
export async function processSyncQueue(onProgress) {
  const items = await getAllSyncQueueItems();
  if (!items.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await processItem(item);
      await removeSyncQueueItem(item.id);
      synced++;
      onProgress?.({ synced, failed, total: items.length });
    } catch (err) {
      if (item.retryCount >= MAX_RETRIES) {
        await handleConflict(item, err);
        await removeSyncQueueItem(item.id);
        failed++;
      } else {
        await updateSyncQueueItem({ ...item, retryCount: item.retryCount + 1 });
        failed++;
      }
      onProgress?.({ synced, failed, total: items.length });
    }
  }

  return { synced, failed };
}

// ── Execute one queue item against the API ────────────────
async function processItem(item) {
  const { type, entityId, payload } = item;

  const endpoints = {
    CREATE: () =>
      fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
    UPDATE: () =>
      fetch(`${API_BASE}/tasks/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
    DELETE: () =>
      fetch(`${API_BASE}/tasks/${entityId}`, { method: 'DELETE' })
  };

  const res = await endpoints[type]();

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  // On successful CREATE the server may return a canonical ID — update local record
  if (type === 'CREATE') {
    const serverTask = await res.json();
    const localTask = await getTask(entityId);
    if (localTask && serverTask.id !== entityId) {
      await putTask({ ...localTask, serverId: serverTask.id, syncStatus: 'synced' });
    }
  }

  return res;
}

// ── Conflict resolution (last-write-wins by updatedAt) ────
async function handleConflict(item, err) {
  console.warn(`[SyncQueue] Conflict on item ${item.id}:`, err.message);
  // In a real app you'd fetch the server version and merge/prompt the user
  // For now we mark the local task as conflicted so the UI can surface it
  if (item.entityId) {
    const local = await getTask(item.entityId);
    if (local) {
      await putTask({ ...local, syncStatus: 'conflict', conflictReason: err.message });
    }
  }
}

// ── Deduplication helper (collapse multiple updates → one) ─
export async function deduplicateQueue() {
  const items = await getAllSyncQueueItems();
  const seen = new Map();

  for (const item of items) {
    const key = `${item.type}:${item.entityId}`;
    if (seen.has(key)) {
      await removeSyncQueueItem(seen.get(key).id);
    }
    seen.set(key, item);
  }
}
