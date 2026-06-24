import { useState } from 'react';
import { KanbanBoard } from '../components/kanban/KanbanBoard.jsx';
import { ItemDetailModal } from '../components/modals/ItemDetailModal.jsx';
import { LoadingState, ErrorState } from '../components/ui/EmptyState.jsx';
import { useKanban } from '../hooks/useKanban.js';

/**
 * Generic kanban view. Owns the ItemDetailModal open/close state
 * and wires update/delete back into useKanban.
 *
 * @param {{ viewType, searchQuery, onNavigate }} props
 */
export function KanbanView({ viewType, searchQuery = '', onNavigate }) {
  const { records, loading, error, refresh, handleDrop, handleUpdate, handleDelete } = useKanban(viewType);

  const [selectedItem, setSelectedItem] = useState(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <>
      <KanbanBoard
        viewType={viewType}
        records={records}
        onDrop={handleDrop}
        onNavigate={onNavigate}
        onCardClick={setSelectedItem}
        searchQuery={searchQuery}
      />

      <ItemDetailModal
        open={!!selectedItem}
        item={selectedItem}
        viewType={viewType}
        onClose={() => setSelectedItem(null)}
        onUpdate={async (id, patch) => {
          await handleUpdate(id, patch);
          // Keep modal open with updated data
          setSelectedItem(prev => prev
            ? {
              ...prev,
              ...(patch.title != null ? { title: patch.title } : {}),
              ...(patch.description != null ? { description: patch.description } : {}),
              ...(patch.status != null ? { status: patch.status } : {}),
              ...(patch.priority != null ? { priority: patch.priority } : {}),
              ...(patch.due_date != null ? { dueDate: patch.due_date } : {}),
            }
            : null
          );
        }}
        onDelete={async (id) => {
          await handleDelete(id);
          setSelectedItem(null);
        }}
        onNavigate={onNavigate}
      />
    </>
  );
}
