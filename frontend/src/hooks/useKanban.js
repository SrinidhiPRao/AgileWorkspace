import { useCallback, useEffect, useRef, useState } from 'react';
import { apiForView } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

function normalise(viewType, raw) {
  switch (viewType) {
    case 'backlogs':
      return {
        id: raw.backlog_item_id,
        title: raw.title,
        description: raw.description,
        priority: raw.priority,
        status: raw.status,
        creatorName: raw.created_by?.name ?? '—',
        createdAt: raw.created_at,
      };
    case 'features':
      return {
        id: raw.feature_id,
        title: raw.title,
        description: raw.description,
        status: raw.status,
        parentId: raw.backlog_item_id,
        parentTitle: raw.backlog_item_title ?? null,
      };
    case 'stories':
      return {
        id: raw.story_id,
        title: raw.title,
        description: raw.description,
        status: raw.status,
        parentId: raw.feature_id,
        parentTitle: raw.feature_title ?? null,
      };
    case 'tasks': {
      const first = raw.assignments?.[0];
      return {
        id: raw.task_id,
        title: raw.title,
        description: raw.description,
        status: raw.status,
        priority: raw.priority,
        dueDate: raw.due_date,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        parentId: raw.story_id,
        parentTitle: raw.story_title ?? null,
        parentTaskId: raw.parent_task_id ?? null,
        assigneeName: first?.assigned_to?.name ?? 'Unassigned',
        assigneeId: first?.assigned_to?.user_id ?? null,
      };
    }
    default:
      return raw;
  }
}

export function useKanban(viewType) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const recordsRef = useRef(records);
  recordsRef.current = records;

  const load = useCallback(async () => {
    const api = apiForView(viewType);
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.list({ limit: 200 });
      setRecords((res.data ?? []).map(r => normalise(viewType, r)));
    } catch (err) {
      setError(err.message ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  useEffect(() => { load(); }, [load]);

  // ── Drag-and-drop status change ──────────────────────────────────────────────
  const handleDrop = useCallback(async (id, newStatus) => {
    const record = recordsRef.current.find(r => r.id === id);
    if (!record || record.status === newStatus) return;

    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    try {
      await apiForView(viewType).update(id, { status: newStatus });
    } catch (err) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: record.status } : r));
      showToast(err.message ?? 'Failed to update status.', 'error');
    }
  }, [viewType, showToast]);

  // ── Full field update (from detail modal) ────────────────────────────────────
  const handleUpdate = useCallback(async (id, patch) => {
    const prev = recordsRef.current.find(r => r.id === id);
    if (!prev) return;

    const optimistic = {
      ...prev,
      ...(patch.title != null ? { title: patch.title } : {}),
      ...(patch.description != null ? { description: patch.description } : {}),
      ...(patch.status != null ? { status: patch.status } : {}),
      ...(patch.priority != null ? { priority: patch.priority } : {}),
      ...(patch.due_date != null ? { dueDate: patch.due_date } : {}),
    };

    setRecords(r => r.map(x => x.id === id ? optimistic : x));
    try {
      await apiForView(viewType).update(id, patch);
    } catch (err) {
      setRecords(r => r.map(x => x.id === id ? prev : x));
      showToast(err.message ?? 'Failed to update.', 'error');
      throw err;
    }
  }, [viewType, showToast]);

  // ── Delete (from detail modal) ───────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    const snapshot = recordsRef.current;
    setRecords(r => r.filter(x => x.id !== id));
    try {
      await apiForView(viewType).remove(id);
      showToast('Item deleted.');
    } catch (err) {
      setRecords(snapshot);
      showToast(err.message ?? 'Failed to delete.', 'error');
      throw err;
    }
  }, [viewType, showToast]);

  return { records, loading, error, refresh: load, handleDrop, handleUpdate, handleDelete };
}
