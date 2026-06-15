export function Badge({ priority }) {
  if (!priority) return null;
  return <span className={`card-badge badge-${priority}`}>{priority}</span>;
}
