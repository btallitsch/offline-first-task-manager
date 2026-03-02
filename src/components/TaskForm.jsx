import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const PRIORITIES = ['low', 'medium', 'high'];

export function TaskForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: ''
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    });
  };

  return (
    <div className="task-form">
      <div className="form-header">
        <h3>New Task</h3>
        <button className="btn-icon" onClick={onCancel}><X size={16} /></button>
      </div>

      <input
        className="form-input"
        placeholder="Task title *"
        value={form.title}
        onChange={set('title')}
        autoFocus
      />

      <textarea
        className="form-textarea"
        placeholder="Description (optional)"
        value={form.description}
        onChange={set('description')}
        rows={3}
      />

      <div className="form-row">
        <div className="form-field">
          <label>Priority</label>
          <select className="form-select" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Due Date</label>
          <input type="date" className="form-input" value={form.dueDate} onChange={set('dueDate')} />
        </div>
      </div>

      <input
        className="form-input"
        placeholder="Tags (comma-separated)"
        value={form.tags}
        onChange={set('tags')}
      />

      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={!form.title.trim()}>
          <Plus size={14} /> Add Task
        </button>
      </div>
    </div>
  );
}
