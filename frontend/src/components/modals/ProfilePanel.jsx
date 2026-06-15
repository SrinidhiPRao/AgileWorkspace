import { useEffect } from 'react';
import { useAuth }   from '../../context/AuthContext.jsx';
import { Toggle }    from '../ui/Toggle.jsx';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * @param {{ open, onClose }} props
 */
export function ProfilePanel({ open, onClose }) {
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const name  = currentUser?.name  ?? 'Jordan Davies';
  const email = currentUser?.email ?? 'jordan.d@agile.internal';
  const roles = currentUser?.roles ?? [{ role_name: 'Product Owner' }, { role_name: 'Admin' }];
  const isActive = currentUser?.is_active ?? true;

  return (
    <div className={`panel-backdrop${open ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="side-panel">
        <div className="panel-header">
          <h2 className="panel-title">Profile</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="bx bx-x" /></button>
        </div>

        <div className="panel-body">
          {/* Hero card */}
          <div className="profile-hero">
            <div className="profile-avatar-lg">{initials(name)}</div>
            <div>
              <h3 className="profile-name">{name}</h3>
              <p className="profile-email">{email}</p>
              <span className={`status-indicator profile-status-inline ${isActive ? 'status-active' : 'status-inactive'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Roles */}
          <div className="profile-section-label">Roles</div>
          <div className="user-roles">
            {roles.map((r, i) => (
              <span key={i} className="role-tag">{r.role_name ?? r}</span>
            ))}
          </div>

          {/* Preferences */}
          <div className="profile-section-label">Preferences</div>
          <div className="preference-row">
            <span>Email Notifications</span>
            <Toggle defaultChecked />
          </div>
          <div className="preference-row">
            <span>Compact Card View</span>
            <Toggle />
          </div>

          {/* Account */}
          <div className="profile-section-label">Account</div>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem' }}
            onClick={async () => { await logout(); onClose(); }}
          >
            <i className="bx bx-log-out" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
