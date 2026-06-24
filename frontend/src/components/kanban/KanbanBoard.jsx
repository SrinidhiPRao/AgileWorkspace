import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn.jsx';

const KANBAN_COLUMNS = [
  { id: 'to-do', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
];

/**
 * @param {{ viewType, records, onDrop, onNavigate, onCardClick, searchQuery }} props
 */
export function KanbanBoard({ viewType, records, onDrop, onNavigate, onCardClick, searchQuery = '' }) {
  const [draggedId, setDraggedId] = useState(null);

  const filtered = searchQuery
    ? records.filter(r =>
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : records;

  return (
    <div className="kanban-board" style={{ '--kanban-cols': KANBAN_COLUMNS.length }}>
      {KANBAN_COLUMNS.map(col => (
        <KanbanColumn
          key={col.id}
          column={col}
          viewType={viewType}
          items={filtered.filter(r => r.status === col.id)}
          draggedId={draggedId}
          onDragStart={(id) => setDraggedId(id)}
          onDrop={(id, newStatus) => { setDraggedId(null); onDrop(id, newStatus); }}
          onNavigate={onNavigate}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
