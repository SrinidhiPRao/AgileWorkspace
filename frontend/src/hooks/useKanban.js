import { useCallback, useEffect, useRef, useState } from 'react';
import { apiForView } from '../api/index.js';
import { useToast }   from '../context/ToastContext.jsx';

/**
 * Normalise a raw API record for a given kanban view type into the flat shape
 * that KanbanCard expects.
 */
function normalise(viewType, raw) {
  switch (viewType) {
    case 'backlogs':
      return {
        id:          raw.backlog_item_id,
        title:       raw.title,
        description: raw.description,
        priority:    raw.priority,
        status:      raw.status,
        creatorName: raw.created_by?.name ?? '—',
        createdAt:   raw.created_at,
      };
    case 'features':
      return {
        id:          raw.feature_id,
        title:       raw.title,
        description: raw.description,
        status:      raw.status,
        parentId:    raw.backlog_item_id,
        parentTitle: raw.backlog_item_title ?? null,
      };
    case 'stories':
      return {
        id:          raw.story_id,
        title:       raw.title,
        description: raw.description,
        status:      raw.status,
        parentId:    raw.feature_id,
        parentTitle: raw.feature_title ?? null,
      };
    case 'tasks': {
      const first = raw.assignments?.[0];
      return {
        id:           raw.task_id,
        title:        raw.title,
        description:  raw.description,
        status:       raw.status,
        priority:     raw.priority,
        dueDate:      raw.due_date,
        createdAt:    raw.created_at,
        updatedAt:    raw.updated_at,
        parentId:     raw.story_id,
        parentTitle:  raw.story_title ?? null,
        parentTaskId: raw.parent_task_id ?? null,
        assigneeName: first?.assigned_to?.name ?? 'Unassigned',
        assigneeId:   first?.assigned_to?.user_id ?? null,
      };
    }
    default:
      return raw;
  }
}

/**
 * Manages data fetching and optimistic status updates for a single kanban view.
 *
 * @param {string} viewType - 'backlogs' | 'features' | 'stories' | 'tasks'
 * @returns {{
 *   records: object[],
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => void,
 *   handleDrop: (id: string, newStatus: string) => void,
 * }}
 */
export function useKanban(viewType) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const { showToast } = useToast();

  // Keep a ref so handleDrop always closes over the latest records
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

  /**
   * Optimistic drag-and-drop handler.
   * Updates local state immediately, then PATCHes the API.
   * Rolls back on failure.
   */
  const handleDrop = useCallback(async (id, newStatus) => {
    const current = recordsRef.current;
    const record  = current.find(r => r.id === id);
    if (!record || record.status === newStatus) return;

    // Optimistic update
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

    try {
      const api = apiForView(viewType);
      await api.update(id, { status: newStatus });
    } catch (err) {
      // Roll back
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: record.status } : r));
      showToast(err.message ?? 'Failed to update status.', 'error');
    }
  }, [viewType, showToast]);

  return { records, loading, error, refresh: load, handleDrop };
}
