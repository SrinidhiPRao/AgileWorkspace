import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn.jsx';

const KANBAN_COLUMNS = [
  { id: 'to-do',       title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed',   title: 'Completed' },
];

/**
 * Full kanban board. Manages the dragged card ID in local state so
 * all columns share it without lifting it further up.
 *
 * @param {{ viewType, records, onDrop, onNavigate, searchQuery }} props
 */
export function KanbanBoard({ viewType, records, onDrop, onNavigate, searchQuery = '' }) {
  const [draggedId, setDraggedId] = useState(null);

  const filteredRecords = searchQuery
    ? records.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : records;

  return (
    <div
      className="kanban-board"
      style={{ '--kanban-cols': KANBAN_COLUMNS.length }}
    >
      {KANBAN_COLUMNS.map(col => (
        <KanbanColumn
          key={col.id}
          column={col}
          viewType={viewType}
          items={filteredRecords.filter(r => r.status === col.id)}
          draggedId={draggedId}
          onDragStart={(id) => setDraggedId(id)}
          onDrop={(id, newStatus) => { setDraggedId(null); onDrop(id, newStatus); }}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
