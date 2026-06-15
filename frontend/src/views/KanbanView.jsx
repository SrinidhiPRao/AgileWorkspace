import { KanbanBoard }              from '../components/kanban/KanbanBoard.jsx';
import { LoadingState, ErrorState } from '../components/ui/EmptyState.jsx';
import { useKanban }                from '../hooks/useKanban.js';

/**
 * Generic kanban view. Used by BacklogsView, FeaturesView, StoriesView, TasksView.
 *
 * @param {{ viewType, searchQuery, onNavigate }} props
 */
export function KanbanView({ viewType, searchQuery, onNavigate }) {
  const { records, loading, error, refresh, handleDrop } = useKanban(viewType);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={refresh} />;

  return (
    <KanbanBoard
      viewType={viewType}
      records={records}
      onDrop={handleDrop}
      onNavigate={onNavigate}
      searchQuery={searchQuery}
    />
  );
}
