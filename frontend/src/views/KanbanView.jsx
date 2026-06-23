import { KanbanBoard } from '../components/kanban/KanbanBoard.jsx';
import { LoadingState, ErrorState } from '../components/ui/EmptyState.jsx';
import { useKanban } from '../hooks/useKanban.js';

/**
 * Generic kanban view. Used by BacklogsView, FeaturesView, StoriesView, TasksView.
 * Search filtering is handled globally by SearchBar — not threaded through here.
 *
 * @param {{ viewType, onNavigate }} props
 */
export function KanbanView({ viewType, onNavigate }) {
  const { records, loading, error, refresh, handleDrop } = useKanban(viewType);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <KanbanBoard
      viewType={viewType}
      records={records}
      onDrop={handleDrop}
      onNavigate={onNavigate}
    />
  );
}
