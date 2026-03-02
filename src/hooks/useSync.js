import { useState, useEffect, useRef, useCallback } from 'react';
import { processSyncQueue, deduplicateQueue } from '../lib/syncQueue';
import { getPendingSyncCount } from '../lib/db';

export function useSync({ isOnline, wasOffline, clearWasOffline, onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const syncLock = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingSyncCount();
    setPendingCount(count);
  }, []);

  const sync = useCallback(async () => {
    if (syncLock.current || !isOnline) return;
    syncLock.current = true;
    setSyncing(true);
    setSyncError(null);

    try {
      await deduplicateQueue();
      const stats = await processSyncQueue((progress) => {
        setSyncStats(progress);
      });
      setLastSync(Date.now());
      setSyncStats(stats);
      onSyncComplete?.();
    } catch (err) {
      setSyncError(err.message);
    } finally {
      syncLock.current = false;
      setSyncing(false);
      await refreshPendingCount();
    }
  }, [isOnline, onSyncComplete, refreshPendingCount]);

  // Sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      clearWasOffline();
      sync();
    }
  }, [wasOffline, isOnline, sync, clearWasOffline]);

  // Periodic sync every 30s while online
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(sync, 30_000);
    return () => clearInterval(interval);
  }, [isOnline, sync]);

  // Listen for SW background sync messages
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED') sync();
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, [sync]);

  // Initial pending count
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  return { syncing, lastSync, pendingCount, syncError, syncStats, sync, refreshPendingCount };
}
