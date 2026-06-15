import { useEffect, useState } from 'react';

// Client-side seed — replace with a GET /notifications API call when available
const SEED = [
  { id: 'n1', title: 'Task moved to In Progress',  body: "Elena Rostova updated 'Write Token Parser Test Suite'.", time: '2m ago',    read: false },
  { id: 'n2', title: 'New backlog item created',    body: "Marcus Vance added 'Webhook Export Infrastructure'.",  time: '1h ago',    read: false },
  { id: 'n3', title: 'Task marked Completed',       body: "Alex Chen completed 'Configure HTTPS Secret Routes'.", time: '3h ago',    read: true  },
  { id: 'n4', title: 'Story pending review',        body: "'GitHub Credential Exchange Handshake' needs review.", time: 'Yesterday', read: true  },
];

/**
 * @param {{ open, onClose, onUnreadChange }} props
 */
export function NotificationsPanel({ open, onClose, onUnreadChange }) {
  const [notifs, setNotifs] = useState(SEED);

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => { onUnreadChange?.(unread); }, [unread, onUnreadChange]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div className={`panel-backdrop${open ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="side-panel">
        <div className="panel-header">
          <h2 className="panel-title">Notifications</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="text-btn" onClick={markAllRead}>Mark all read</button>
            <button className="modal-close" onClick={onClose} aria-label="Close"><i className="bx bx-x" /></button>
          </div>
        </div>

        <div className="panel-body">
          {notifs.length === 0 && <p>No notifications.</p>}
          {notifs.map(n => (
            <div
              key={n.id}
              className={`notif-item${n.read ? '' : ' unread'}`}
              onClick={() => markRead(n.id)}
            >
              <div className="notif-item-title">{n.title}</div>
              <div className="notif-item-body">{n.body}</div>
              <div className="notif-item-time">{n.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
