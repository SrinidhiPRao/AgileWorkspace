import { useRef, useState } from 'react';
import { Badge } from '../ui/Badge.jsx';

const PARENT_VIEW = { features: 'backlogs', stories: 'features', tasks: 'stories' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Draggable kanban card.
 * Click opens the detail modal; drag moves the card between columns.
 * We distinguish click from drag by tracking whether the pointer moved
 * more than a few pixels between mousedown and mouseup.
 *
 * @param {{ viewType, item, onDragStart, onNavigate, onCardClick }} props
 */
export function KanbanCard({ viewType, item, onDragStart, onNavigate, onCardClick }) {
  const cardRef = useRef(null);
  const dragMoved = useRef(false);   // true once dragstart fires
  const parentView = PARENT_VIEW[viewType];

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    dragMoved.current = true;
    cardRef.current?.classList.add('dragging');
    onDragStart(item.id);
  };

  const handleDragEnd = () => {
    cardRef.current?.classList.remove('dragging');
    // Reset after a tick so the click handler (which fires after dragend) can read it
    setTimeout(() => { dragMoved.current = false; }, 0);
  };

  const handleClick = (e) => {
    // Don't open modal if the user was dragging or clicked the parent breadcrumb
    if (dragMoved.current) return;
    if (e.target.closest('.card-parent-link')) return;
    onCardClick?.(item);
  };

  return (
    <div
      ref={cardRef}
      className="card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onCardClick?.(item)}
      aria-label={`Open ${item.title}`}
    >
      {/* Parent breadcrumb */}
      {item.parentTitle && (
        <button
          className="card-parent-link"
          onClick={e => { e.stopPropagation(); onNavigate?.(parentView); }}
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

      {/* Backlogs meta */}
      {viewType === 'backlogs' && (
        <div className="card-meta">
          <Badge priority={item.priority} />
          <span className="card-owner">
            <i className="bx bx-user" /> {item.creatorName ?? '—'}
          </span>
        </div>
      )}

      {/* Tasks meta */}
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

      {/* Hover hint — always visible on focus, visible on hover via CSS */}
      <div className="card-open-hint" aria-hidden="true">
        <i className="bx bx-expand-alt" /> Open
      </div>
    </div>
  );
}
