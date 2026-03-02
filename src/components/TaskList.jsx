import { TaskItem } from './TaskItem';
import { CheckSquare } from 'lucide-react';

export function TaskList({ tasks, loading, onUpdate, onDelete }) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <p>Loading tasks…</p>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="empty-state">
        <CheckSquare size={48} className="icon-muted" />
        <h3>No tasks here</h3>
        <p>Create a task to get started</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
