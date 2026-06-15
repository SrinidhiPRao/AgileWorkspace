/**
 * Shared empty / loading / error states used across views.
 */

export function EmptyState({ icon = 'bx-inbox', title, body, action }) {
  return (
    <div className="empty-view-box">
      <i className={`bx ${icon}`} />
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export function LoadingState() {
  return (
    <EmptyState
      icon="bx-loader-alt bx-spin"
      title="Loading…"
      body="Fetching data from the server."
    />
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon="bx-error-circle"
      title="Something went wrong"
      body={message}
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
  );
}
