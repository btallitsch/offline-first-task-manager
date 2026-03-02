import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getAllTasks, putTask, deleteTaskFromDB } from '../lib/db';
import { enqueue } from '../lib/syncQueue';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllTasks();
      all.sort((a, b) => b.updatedAt - a.updatedAt);
      setTasks(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (data) => {
    const task = {
      id: uuidv4(),
      title: data.title,
      description: data.description || '',
      status: 'todo',
      priority: data.priority || 'medium',
      tags: data.tags || [],
      dueDate: data.dueDate || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending'
    };
    await putTask(task);
    await enqueue({ type: 'CREATE', entityId: task.id, payload: task });
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateTask = useCallback(async (id, changes) => {
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changes, updatedAt: Date.now(), syncStatus: 'pending' };
    await putTask(updated);
    await enqueue({ type: 'UPDATE', entityId: id, payload: updated });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, [tasks]);

  const deleteTask = useCallback(async (id) => {
    await deleteTaskFromDB(id);
    await enqueue({ type: 'DELETE', entityId: id, payload: null });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reorderTask = useCallback(async (id, newStatus) => {
    return updateTask(id, { status: newStatus });
  }, [updateTask]);

  return { tasks, loading, loadTasks, createTask, updateTask, deleteTask, reorderTask };
}
