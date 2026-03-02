import { useState } from 'react';
import {
  Check, Trash2, Circle, AlertCircle, Clock, RefreshCw, ChevronDown, Tag
} from 'lucide-react';

const STATUS_CYCLE = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
const PRIORITY_COLOR = { high: 'red', medium: 'amber', low: 'green' };

export function TaskItem({ task, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const cycleStatus = () => onUpdate(task.id, { status: STATUS_CYCLE[task.status] });

  const syncIcon = {
    synced: <Check size={10} className="icon-green" />,
    pending: <Clock size={10} className="icon-amber" />,
    conflict: <AlertCircle size={10} className="icon-red" />,
  }[task.syncStatus] ?? <RefreshCw size={10} className="icon-blue spin" />;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className={`task-item priority-border-${PRIORITY_COLOR[task.priority]} ${task.status === 'done' ? 'task-done' : ''}`}>
      <div className="task-main" onClick={() => setExpanded((v) => !v)}>
        <button
          className={`status-btn status-${task.status}`}
          onClick={(e) => { e.stopPropagation(); cycleStatus(); }}
          title="Cycle status"
        >
          <Circle size={16} />
        </button>

        <div className="task-content">
          <span className={`task-title ${task.status === 'done' ? 'line-through' : ''}`}>
            {task.title}
          </span>
          <div className="task-meta">
            <span className={`badge priority-badge-${PRIORITY_COLOR[task.priority]}`}>
              {task.priority}
            </span>
            <span className={`status-label status-${task.status}`}>{task.status}</span>
            {isOverdue && <span className="badge badge-red">overdue</span>}
            {task.tags?.map((tag) => (
              <span key={tag} className="tag"><Tag size={9} />{tag}</span>
            ))}
          </div>
        </div>

        <div className="task-right">
          <span className="sync-indicator" title={task.syncStatus}>{syncIcon}</span>
          <ChevronDown size={14} className={`chevron ${expanded ? 'rotated' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="task-expanded">
          {task.description && <p className="task-description">{task.description}</p>}
          {task.dueDate && (
            <p className={`task-due ${isOverdue ? 'text-red' : 'text-muted'}`}>
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
          <div className="task-actions">
            {['todo', 'in-progress', 'done'].map((s) => (
              <button
                key={s}
                className={`btn-status ${task.status === s ? 'active' : ''}`}
                onClick={() => onUpdate(task.id, { status: s })}
              >
                {s}
              </button>
            ))}
            <button className="btn-danger" onClick={() => onDelete(task.id)}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
