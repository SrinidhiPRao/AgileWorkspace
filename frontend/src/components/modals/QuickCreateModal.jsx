import { useEffect, useRef, useState } from 'react';
import { backlogs, features, stories, tasks, users } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSearchContext } from '../../context/SearchContext.jsx';

const KANBAN_VIEWS = ['backlogs', 'features', 'stories', 'tasks'];

/**
 * @param {{ open, currentView, onClose, onCreated }} props
 */
export function QuickCreateModal({ open, currentView, onClose, onCreated }) {
  const { showToast } = useToast();
  const { invalidate } = useSearchContext();
  const titleRef = useRef(null);

  const [type, setType] = useState('backlogs');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [teamList, setTeamList] = useState([]);
  const [saving, setSaving] = useState(false);

  // Parent tracking states (maintaining direct UUID string mappings)
  const [parentId, setParentId] = useState('');
  const [parentTaskId, setParentTaskId] = useState('');
  const [parentOptions, setParentOptions] = useState([]);
  const [existingTasks, setExistingTasks] = useState([]);

  // Pre-select type from current nav view when modal opens
  useEffect(() => {
    if (open) {
      if (KANBAN_VIEWS.includes(currentView)) setType(currentView);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, currentView]);

  // Load active users for the assignee dropdown
  useEffect(() => {
    users.list({ is_active: true, limit: 100 })
      .then(res => setTeamList(res.data ?? []))
      .catch(() => { });
  }, []);

  // Dynamically load parent items strictly according to the API views
  useEffect(() => {
    if (!open) return;

    // Flush selections on context switch
    setParentId('');
    setParentTaskId('');
    setParentOptions([]);
    setExistingTasks([]);

    if (type === 'features') {
      backlogs.list({ limit: 100 }).then(res => setParentOptions(res.data ?? [])).catch(() => { });
    } else if (type === 'stories') {
      features.list({ limit: 100 }).then(res => setParentOptions(res.data ?? [])).catch(() => { });
    } else if (type === 'tasks') {
      stories.list({ limit: 100 }).then(res => setParentOptions(res.data ?? [])).catch(() => { });
      tasks.list({ limit: 100 }).then(res => setExistingTasks(res.data ?? [])).catch(() => { });
    }
  }, [type, open]);

  const reset = () => {
    setTitle('');
    setDesc('');
    setPriority('medium');
    setAssignee('');
    setParentId('');
    setParentTaskId('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) { titleRef.current?.focus(); return; }

    // Strict contract enforcement validation
    if (type !== 'backlogs' && !parentId) {
      const targetLabel = type === 'features' ? 'Backlog' : type === 'stories' ? 'Feature' : 'Story';
      showToast(`Please select a parent ${targetLabel}.`, 'error');
      return;
    }

    setSaving(true);
    try {
      const d = desc.trim() || 'No description provided.';
      const chosenParentId = parentId || null;
      const chosenParentTaskId = parentTaskId || null;

      switch (type) {
        case 'backlogs':
          await backlogs.create({
            title,
            description: d,
            priority,
            status: 'to-do'
          });
          break;
        case 'features':
          await features.create({
            title,
            description: d,
            status: 'to-do',
            backlog_item_id: chosenParentId
          });
          break;
        case 'stories':
          await stories.create({
            title,
            description: d,
            status: 'to-do',
            feature_id: chosenParentId
          });
          break;
        case 'tasks': {
          const created = await tasks.create({
            title,
            description: d,
            status: 'to-do',
            priority,
            due_date: new Date().toISOString().split('T')[0],
            story_id: chosenParentId,
            parent_task_id: chosenParentTaskId,
          });
          if (assignee && created?.task_id) {
            await tasks.assignments.assign(created.task_id, assignee, 'Assigned via Quick Create.');
          }
          break;
        }
      }
      handleClose();
      showToast(`Created "${title}" in ${type}`);
      invalidate();
      onCreated(type);
    } catch (err) {
      showToast(err.message ?? 'Failed to create item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const needsPriority = ['backlogs', 'tasks'].includes(type);
  const needsAssignee = type === 'tasks';
  const hasParent = type !== 'backlogs';

  const getParentLabel = () => {
    if (type === 'features') return 'Parent Backlog *';
    if (type === 'stories') return 'Parent Feature *';
    if (type === 'tasks') return 'Parent Story *';
    return 'Parent';
  };

  const getParentUuidValue = (item) => {
    if (type === 'features') return item.backlog_item_id;
    if (type === 'stories') return item.feature_id;
    if (type === 'tasks') return item.story_id;
    return '';
  };

  return (
    <div className={`modal-backdrop${open ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qcTitle"
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title" id="qcTitle">Quick Create</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close"><i className="bx bx-x" /></button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="qc-type">Type</label>
            <select id="qc-type" className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="backlogs">Backlog</option>
              <option value="features">Feature</option>
              <option value="stories">Story</option>
              <option value="tasks">Task</option>
            </select>
          </div>

          {/* Explicit Parent Dropdown Container */}
          {hasParent && (
            <div className="form-group">
              <label className="form-label" htmlFor="qc-parent">{getParentLabel()}</label>
              <select id="qc-parent" className="form-select" value={parentId} onChange={e => setParentId(e.target.value)}>
                <option value="">Select Parent...</option>
                {parentOptions.map(p => {
                  const targetUuid = getParentUuidValue(p);
                  return <option key={targetUuid} value={targetUuid}>{p.title}</option>;
                })}
              </select>
            </div>
          )}

          {/* Sub-Task Selector Configuration */}
          {type === 'tasks' && (
            <div className="form-group">
              <label className="form-label" htmlFor="qc-parent-task">Parent Task (Optional sub-task)</label>
              <select id="qc-parent-task" className="form-select" value={parentTaskId} onChange={e => setParentTaskId(e.target.value)}>
                <option value="">None (Top-level Task)</option>
                {existingTasks.map(t => (
                  <option key={t.task_id} value={t.task_id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="qc-title">Title</label>
            <input ref={titleRef} id="qc-title" className="form-input" type="text" placeholder="Enter a title…" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="qc-desc">Description</label>
            <textarea id="qc-desc" className="form-input form-textarea" placeholder="Optional description…" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {needsPriority && (
            <div className="form-group">
              <label className="form-label" htmlFor="qc-priority">Priority</label>
              <select id="qc-priority" className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}

          {needsAssignee && (
            <div className="form-group">
              <label className="form-label" htmlFor="qc-assignee">Assign To</label>
              <select id="qc-assignee" className="form-select" value={assignee} onChange={e => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {teamList.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.name ?? u.email}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            <i className="bx bx-plus" /> {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
