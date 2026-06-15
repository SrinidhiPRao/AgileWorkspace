import { useMetrics }               from '../hooks/useMetrics.js';
import { LoadingState, ErrorState } from '../components/ui/EmptyState.jsx';

const COLUMNS = [
  { id: 'to-do',       title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed',   title: 'Completed' },
];

export function MetricsView() {
  const { counts, loading, error } = useMetrics();

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;
  if (!counts) return null;

  const summary = [
    { label: 'Open Backlogs',       value: counts.backlogs.total,  sub: `${counts.backlogs.inProgress} in progress` },
    { label: 'Features',            value: counts.features.total,  sub: `${counts.features.completed} completed` },
    { label: 'Stories',             value: counts.stories.total,   sub: `${counts.stories.inProgress} in progress` },
    { label: 'Tasks',               value: counts.tasks.total,     sub: `${counts.tasks.completed} completed` },
    { label: 'Team Members',        value: counts.team.total,      sub: `${counts.team.active} active` },
    { label: 'High-Priority Items', value: counts.highPriority,    sub: 'across backlogs & tasks', accent: true },
  ];

  const tasksByStatus = COLUMNS.map(c => ({ label: c.title, count: counts.tasks.byStatus[c.id] ?? 0 }));
  const maxCount = Math.max(...tasksByStatus.map(b => b.count), 1);

  return (
    <div>
      <div className="metrics-grid">
        {summary.map(s => (
          <div key={s.label} className="metric-card">
            <span className="metric-label">{s.label}</span>
            <span className={`metric-value${s.accent ? ' metric-accent' : ''}`}>{s.value}</span>
            <span className="metric-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="metrics-chart-area">
        <div className="metrics-chart-label">Task Distribution by Status</div>
        <div className="metrics-bar-chart">
          {tasksByStatus.map(({ label, count }) => (
            <div key={label} className="chart-bar-group">
              <div
                className="chart-bar"
                style={{ height: `${Math.round((count / maxCount) * 90)}px` }}
                title={`${label}: ${count}`}
              />
              <span className="chart-bar-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
