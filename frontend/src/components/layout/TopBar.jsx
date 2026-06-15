import { useAuth } from '../../context/AuthContext.jsx';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * @param {{
 *   searchQuery: string,
 *   onSearchChange: (q: string) => void,
 *   onQuickCreate: () => void,
 *   unreadCount: number,
 *   onNotifications: () => void,
 *   onProfile: () => void,
 * }} props
 */
export function TopBar({ searchQuery, onSearchChange, onQuickCreate, unreadCount, onNotifications, onProfile }) {
  const { currentUser } = useAuth();
  const avatar = initials(currentUser?.name);

  return (
    <header className="top-bar">
      <div className="search-container">
        <i className="bx bx-search search-icon" />
        <input
          type="text"
          placeholder="Global Search…"
          className="search-input"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="top-bar-actions">
        <button className="btn btn-primary" onClick={onQuickCreate} title="Quick Create Item">
          <i className="bx bx-plus" /><span>Quick Create</span>
        </button>

        <button className="icon-btn" onClick={onNotifications} title="Notifications">
          <i className="bx bx-bell" />
          <span className={`notif-badge${unreadCount === 0 ? ' hidden' : ''}`} />
        </button>

        <div className="profile-avatar" onClick={onProfile} title="Profile">
          {avatar}
        </div>
      </div>
    </header>
  );
}
