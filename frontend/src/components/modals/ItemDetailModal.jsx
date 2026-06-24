import { useEffect, useRef, useState } from 'react';
import { Badge } from '../ui/Badge.jsx';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'to-do', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const TYPE_LABELS = {
  backlogs: 'Backlog Item',
  features: 'Feature',
  stories: 'Story',
  tasks: 'Task',
};

const TYPE_ICONS = {
  backlogs: 'bx-archive',
  features: 'bx-rocket',
  stories: 'bx-book-bookmark',
  tasks: 'bx-check-square',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

/** A single read-only metadata row */
function MetaRow({ icon, label, children }) {
  return (
    <div className="detail-meta-row">
      <span className="detail-meta-label">
        <i className={`bx ${icon}`} /> {label}
      </span>
      <span className="detail-meta-value">{children}</span>
    </div>
  );
}

/** Inline-editable field: shows text normally, input when editing */
function EditableField({ label, value, editing, type = 'text', options, onChange, inputRef }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {!editing ? (
        <p className="detail-field-display">{value || <span className="detail-empty">—</span>}</p>
      ) : type === 'select' ? (
        <select className="form-select" value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="form-input form-textarea" value={value} onChange={e => onChange(e.target.value)} ref={inputRef} />
      ) : (
        <input className="form-input" type={type} value={value} onChange={e => onChange(e.target.value)} ref={inputRef} />
      )}
    </div>
  );
}

// ── Delete confirmation step ──────────────────────────────────────────────────

function DeleteConfirm({ item, viewType, onCancel, onConfirm, deleting }) {
  return (
    <div className="delete-confirm">
      <div className="delete-confirm-icon">
        <i className="bx bx-error" />
      </div>
      <h3 className="delete-confirm-title">Delete this {TYPE_LABELS[viewType]}?</h3>
      <p className="delete-confirm-body">
        <strong>"{item.title}"</strong> will be permanently removed.<br></br>
        {''}This cannot be undone.
      </p>
      <div className="delete-confirm-actions">
        <button className="btn btn-ghost" onClick={onCancel} disabled={deleting}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? <><i className="bx bx-loader-alt bx-spin" /> Deleting…</> : <><i className="bx bx-trash" /> Delete</>}
        </button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   open:      boolean,
 *   item:      object|null,   — normalised kanban record
 *   viewType:  string,
 *   onClose:   () => void,
 *   onUpdate:  (id, patch) => Promise<void>,
 *   onDelete:  (id) => Promise<void>,
 *   onNavigate:(view) => void,
 * }} props
 */
export function ItemDetailModal({ open, item, viewType, onClose, onUpdate, onDelete, onNavigate }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable field state — initialised from item whenever modal opens
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('to-do');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const titleRef = useRef(null);

  // Sync local state when item changes or modal opens
  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? '');
    setDesc(item.description ?? '');
    setStatus(item.status ?? 'to-do');
    setPriority(item.priority ?? 'medium');
    setDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
    setEditing(false);
    setConfirming(false);
    setSaving(false);
    setDeleting(false);
  }, [item, open]);

  // Focus title when editing starts
  useEffect(() => {
    if (editing) setTimeout(() => titleRef.current?.focus(), 50);
  }, [editing]);

  // Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape' || !open) return;
      if (confirming) { setConfirming(false); return; }
      if (editing) { setEditing(false); return; }
      onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, editing, confirming, onClose]);

  if (!item) return null;

  const hasPriority = ['backlogs', 'tasks'].includes(viewType);
  const hasParent = !!item.parentTitle;
  const parentViews = { features: 'backlogs', stories: 'features', tasks: 'stories' };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCopyId = () => {
    navigator.clipboard.writeText(item.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleSave = async () => {
    if (!title.trim()) { titleRef.current?.focus(); return; }
    setSaving(true);
    const patch = { title: title.trim(), description: desc.trim(), status };
    if (hasPriority) patch.priority = priority;
    if (viewType === 'tasks' && dueDate) patch.due_date = dueDate;
    try {
      await onUpdate(item.id, patch);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setTitle(item.title ?? '');
    setDesc(item.description ?? '');
    setStatus(item.status ?? 'to-do');
    setPriority(item.priority ?? 'medium');
    setDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={`modal-backdrop detail-backdrop${open ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && !editing && !confirming && onClose()}
    >
      <div className="modal detail-modal" role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className="modal-header detail-modal-header">
          <div className="detail-modal-title-row">
            {/* Type chip */}
            <span className="detail-type-chip">
              <i className={`bx ${TYPE_ICONS[viewType]}`} />
              {TYPE_LABELS[viewType]}
            </span>

            {/* Status badge (always visible, clickable to quick-change) */}
            {!editing && (
              <StatusPill
                status={item.status}
                onChange={async (newStatus) => {
                  await onUpdate(item.id, { status: newStatus });
                }}
              />
            )}
          </div>

          <div className="detail-modal-actions">

            <button className="modal-close" onClick={onClose} aria-label="Close">
              <i className="bx bx-x" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="modal-body detail-modal-body">

          {/* ── Delete confirmation overlay ── */}
          {confirming ? (
            <DeleteConfirm
              item={item}
              viewType={viewType}
              onCancel={() => setConfirming(false)}
              onConfirm={handleDelete}
              deleting={deleting}
            />
          ) : (
            <>
              {/* Parent breadcrumb */}
              {hasParent && (
                <button
                  className="detail-parent-link"
                  onClick={() => { onClose(); onNavigate?.(parentViews[viewType]); }}
                >
                  <i className="bx bx-link" /> {item.parentTitle}
                </button>
              )}

              {/* Title */}
              <EditableField
                label="Title"
                value={title}
                editing={editing}
                onChange={setTitle}
                inputRef={titleRef}
              />

              {/* Description */}
              <EditableField
                label="Description"
                value={desc}
                editing={editing}
                type="textarea"
                onChange={setDesc}
              />

              {/* Status (in edit mode becomes a select) */}
              {editing && (
                <EditableField
                  label="Status"
                  value={status}
                  editing={editing}
                  type="select"
                  options={STATUS_OPTIONS}
                  onChange={setStatus}
                />
              )}

              {/* Priority (backlogs + tasks) */}
              {hasPriority && (
                <EditableField
                  label="Priority"
                  value={editing ? priority : <Badge priority={item.priority} />}
                  editing={editing}
                  type="select"
                  options={PRIORITY_OPTIONS}
                  onChange={setPriority}
                />
              )}

              {/* Due date (tasks only) */}
              {viewType === 'tasks' && (
                <EditableField
                  label="Due Date"
                  value={editing ? dueDate : formatDate(item.dueDate)}
                  editing={editing}
                  type="date"
                  onChange={setDueDate}
                />
              )}

              {/* Task: assignee (read-only for now — use Quick Create to reassign) */}
              {viewType === 'tasks' && !editing && (
                <MetaRow icon="bx-user" label="Assigned to">
                  {item.assigneeName ?? 'Unassigned'}
                </MetaRow>
              )}

              {/* Subtask indicator */}
              {viewType === 'tasks' && item.parentTaskId && !editing && (
                <MetaRow icon="bx-git-branch" label="Subtask of">
                  <span className="subtask-indicator">Parent task</span>
                </MetaRow>
              )}

              {/* Creator (backlogs) */}
              {viewType === 'backlogs' && !editing && (
                <MetaRow icon="bx-user-circle" label="Created by">
                  {item.creatorName ?? '—'}
                </MetaRow>
              )}

              {/* Timestamps */}
              {!editing && (
                <div className="detail-timestamps">
                  {item.createdAt && (
                    <MetaRow icon="bx-time" label="Created">
                      {formatDate(item.createdAt)}
                    </MetaRow>
                  )}
                  {item.updatedAt && (
                    <MetaRow icon="bx-revision" label="Updated">
                      {formatDate(item.updatedAt)}
                    </MetaRow>
                  )}
                </div>
              )}

              {/* ID (collapsed, for copy) */}
              {!editing && (
                <div className="detail-id-row">
                  <span className="detail-id-label">ID</span>
                  <code className="detail-id-value">{item.id}</code>
                  <button className="detail-id-copy" onClick={handleCopyId} title="Copy ID">
                    <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!confirming && (
          <div className="modal-footer detail-modal-footer">
            {editing ? (
              <>
                <button className="btn btn-ghost" onClick={handleDiscard} disabled={saving}>
                  Discard
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><i className="bx bx-loader-alt bx-spin" /> Saving…</>
                    : <><i className="bx bx-check" /> Save changes</>
                  }
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost detail-footer-delete" onClick={() => setConfirming(true)}>
                  <i className="bx bx-trash" /> Delete
                </button>
                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  <i className="bx bx-edit" /> Edit
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status pill — click to cycle through statuses ─────────────────────────────

const STATUS_CYCLE = ['to-do', 'in-progress', 'completed'];
const STATUS_STYLES = {
  'to-do': { cls: 'status-pill-todo', label: 'To Do' },
  'in-progress': { cls: 'status-pill-inprogress', label: 'In Progress' },
  'completed': { cls: 'status-pill-completed', label: 'Completed' },
};

function StatusPill({ status, onChange }) {
  const [loading, setLoading] = useState(false);
  const current = STATUS_STYLES[status] ?? STATUS_STYLES['to-do'];

  const cycle = async () => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length];
    setLoading(true);
    try { await onChange(next); } finally { setLoading(false); }
  };

  return (
    <button
      className={`status-pill ${current.cls}`}
      onClick={cycle}
      title="Click to change status"
      disabled={loading}
    >
      {loading
        ? <i className="bx bx-loader-alt bx-spin" />
        : <i className="bx bx-radio-circle-marked" />
      }
      {current.label}
    </button>
  );
}
