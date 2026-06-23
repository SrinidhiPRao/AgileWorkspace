import { useAuth } from '../../context/AuthContext.jsx';
import { SearchBar } from '../search/SearchBar.jsx';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * @param {{
 *   onNavigate:      (view: string) => void,
 *   onQuickCreate:   () => void,
 *   unreadCount:     number,
 *   onNotifications: () => void,
 *   onProfile:       () => void,
 * }} props
 */
export function TopBar({ onNavigate, onQuickCreate, unreadCount, onNotifications, onProfile }) {
  const { currentUser } = useAuth();
  const avatar = initials(currentUser?.name);

  return (
    <header className="top-bar">
      {/* SearchBar is fully self-contained — owns input, dropdown, keyboard nav */}
      <SearchBar onNavigate={onNavigate} />

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
