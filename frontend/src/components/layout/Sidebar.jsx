import { useState } from 'react';

const NAV_ITEMS = [
  { view: 'backlogs', icon: 'bx-archive',        label: 'Backlogs' },
  { view: 'features', icon: 'bx-rocket',          label: 'Features' },
  { view: 'stories',  icon: 'bx-book-bookmark',   label: 'Stories' },
  { view: 'tasks',    icon: 'bx-check-square',    label: 'Tasks' },
  { view: 'team',     icon: 'bx-group',           label: 'Team' },
  { view: 'metrics',  icon: 'bx-bar-chart-alt-2', label: 'Metrics' },
];

const FOOTER_ITEMS = [
  { view: 'settings', icon: 'bx-cog', label: 'Settings' },
];

export function Sidebar({ currentView, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <i className="bx bx-layer logo-icon" />
          <span className="logo-text">AgileWorkspace</span>
        </div>
        <button className="toggle-btn" onClick={() => setCollapsed(c => !c)} title="Toggle Sidebar">
          <i className={`bx bx-chevron-left${collapsed ? ' toggle-icon-rotated' : ''}`} />
        </button>
      </div>

      <nav className="sidebar-menu">
        <div className="menu-label">Workspace</div>
        <ul className="menu-list">
          {NAV_ITEMS.map(item => (
            <li key={item.view}>
              <button
                className={`menu-item${currentView === item.view ? ' active' : ''}`}
                onClick={() => onNavigate(item.view)}
              >
                <i className={`bx ${item.icon}`} />
                <span className="menu-text">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="menu-label footer-label">System</div>
        <ul className="menu-list">
          {FOOTER_ITEMS.map(item => (
            <li key={item.view}>
              <button
                className={`menu-item${currentView === item.view ? ' active' : ''}`}
                onClick={() => onNavigate(item.view)}
              >
                <i className={`bx ${item.icon}`} />
                <span className="menu-text">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
