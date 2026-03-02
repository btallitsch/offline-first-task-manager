import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function SyncStatus({ isOnline, syncing, lastSync, pendingCount, syncError, onManualSync }) {
  const timeSince = lastSync
    ? formatTimeSince(Date.now() - lastSync)
    : null;

  return (
    <div className="sync-bar">
      <div className="sync-connection">
        {isOnline ? (
          <Wifi size={14} className="icon-green" />
        ) : (
          <WifiOff size={14} className="icon-amber" />
        )}
        <span className={isOnline ? 'text-green' : 'text-amber'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="sync-state">
        {syncing ? (
          <>
            <RefreshCw size={13} className="icon-blue spin" />
            <span className="text-blue">Syncing…</span>
          </>
        ) : syncError ? (
          <>
            <AlertCircle size={13} className="icon-red" />
            <span className="text-red" title={syncError}>Sync error</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Clock size={13} className="icon-amber" />
            <span className="text-amber">{pendingCount} pending</span>
          </>
        ) : (
          <>
            <CheckCircle size={13} className="icon-green" />
            <span className="text-muted">
              {timeSince ? `Synced ${timeSince}` : 'Up to date'}
            </span>
          </>
        )}
      </div>

      {isOnline && !syncing && (
        <button className="btn-icon" onClick={onManualSync} title="Sync now">
          <RefreshCw size={13} />
        </button>
      )}
    </div>
  );
}

function formatTimeSince(ms) {
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
}
