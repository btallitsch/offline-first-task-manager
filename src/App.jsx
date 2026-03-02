import { useState, useMemo } from 'react';
import { Plus, Database } from 'lucide-react';
import { useTasks } from './hooks/useTasks';
import { useNetwork } from './hooks/useNetwork';
import { useSync } from './hooks/useSync';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { FilterBar } from './components/FilterBar';
import { SyncStatus } from './components/SyncStatus';

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ query: '', status: 'all', priority: 'all' });

  const { tasks, loading, loadTasks, createTask, updateTask, deleteTask } = useTasks();
  const { isOnline, connectionType, wasOffline, clearWasOffline } = useNetwork();
  const { syncing, lastSync, pendingCount, syncError, sync } = useSync({
    isOnline,
    wasOffline,
    clearWasOffline,
    onSyncComplete: loadTasks
  });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = filters.query.toLowerCase();
      const matchQuery = !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      const matchStatus = filters.status === 'all' || t.status === filters.status;
      const matchPriority = filters.priority === 'all' || t.priority === filters.priority;
      return matchQuery && matchStatus && matchPriority;
    });
  }, [tasks, filters]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    pending: tasks.filter((t) => t.syncStatus === 'pending').length
  }), [tasks]);

  async function handleCreate(data) {
    await createTask(data);
    setShowForm(false);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Database size={22} className="icon-indigo" />
          <div>
            <h1>Task Manager</h1>
            <p className="header-sub">Offline-first · IndexedDB · Service Worker</p>
          </div>
        </div>
        <SyncStatus
          isOnline={isOnline}
          syncing={syncing}
          lastSync={lastSync}
          pendingCount={pendingCount}
          syncError={syncError}
          onManualSync={sync}
        />
      </header>

      <div className="stats-row">
        <div className="stat"><span className="stat-num">{stats.total}</span><span>Total</span></div>
        <div className="stat"><span className="stat-num text-blue">{stats.inProgress}</span><span>In Progress</span></div>
        <div className="stat"><span className="stat-num text-green">{stats.done}</span><span>Done</span></div>
        <div className="stat"><span className="stat-num text-amber">{stats.pending}</span><span>Unsynced</span></div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {showForm ? (
        <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      ) : (
        <button className="btn-add" onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Task
        </button>
      )}

      <TaskList tasks={filtered} loading={loading} onUpdate={updateTask} onDelete={deleteTask} />

      {!isOnline && (
        <div className="offline-banner">
          ✈️ You're offline — changes are saved locally and will sync when reconnected.
        </div>
      )}
    </div>
  );
}
