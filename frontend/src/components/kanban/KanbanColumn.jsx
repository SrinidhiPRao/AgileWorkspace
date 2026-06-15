import { useRef, useState } from 'react';
import { KanbanCard }        from './KanbanCard.jsx';

/**
 * A single kanban column / drop zone.
 *
 * @param {{ column, viewType, items, draggedId, onDragStart, onDrop, onNavigate }} props
 */
export function KanbanColumn({ column, viewType, items, draggedId, onDragStart, onDrop, onNavigate }) {
  const [isOver, setIsOver] = useState(false);
  const zoneRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the zone itself, not a child card
    if (!zoneRef.current?.contains(e.relatedTarget)) setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    if (draggedId) onDrop(draggedId, column.id);
  };

  return (
    <div className="kanban-column" data-status={column.id}>
      <div className="column-header">
        <span>{column.title}</span>
        <span className="column-count">{items.length}</span>
      </div>
      <div
        ref={zoneRef}
        className={`column-cards${isOver ? ' drag-over' : ''}`}
        data-status-lane={column.id}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {items.map(item => (
          <KanbanCard
            key={item.id}
            viewType={viewType}
            item={item}
            onDragStart={onDragStart}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
