import { useRef } from 'react';
import { Badge }  from '../ui/Badge.jsx';

const PARENT_VIEW = { features: 'backlogs', stories: 'features', tasks: 'stories' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Draggable kanban card. Handles its own dragstart/dragend.
 *
 * @param {{ viewType, item, onDragStart, onNavigate }} props
 */
export function KanbanCard({ viewType, item, onDragStart, onNavigate }) {
  const cardRef = useRef(null);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    cardRef.current?.classList.add('dragging');
    onDragStart(item.id);
  };

  const handleDragEnd = () => {
    cardRef.current?.classList.remove('dragging');
  };

  const parentView = PARENT_VIEW[viewType];

  return (
    <div
      ref={cardRef}
      className="card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Parent breadcrumb */}
      {item.parentTitle && (
        <button
          className="card-parent-link"
          onClick={() => onNavigate?.(parentView)}
        >
          <i className="bx bx-link" />
          {' '}{item.parentTitle}
        </button>
      )}

      {/* Subtask badge */}
      {viewType === 'tasks' && item.parentTaskId && (
        <span className="subtask-indicator">
          <i className="bx bx-git-branch" /> Subtask
        </span>
      )}

      <div className="card-title">{item.title}</div>
      <div className="card-desc">{item.description}</div>

      {/* Type-specific meta footer */}
      {viewType === 'backlogs' && (
        <div className="card-meta">
          <Badge priority={item.priority} />
          <span className="card-owner">
            <i className="bx bx-user" /> {item.creatorName ?? '—'}
          </span>
        </div>
      )}

      {viewType === 'tasks' && (
        <div className="card-meta">
          <div className="card-task-footer">
            <div className="card-task-row">
              <Badge priority={item.priority} />
              <span className="card-date">
                <i className="bx bx-calendar" /> {formatDate(item.dueDate)}
              </span>
            </div>
            <div className="card-task-row">
              <span className="card-task-assigned">
                Assigned: <b>{item.assigneeName ?? 'Unassigned'}</b>
              </span>
              {item.updatedAt && (
                <span className="card-date">
                  <i className="bx bx-edit-alt" /> {formatDate(item.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
