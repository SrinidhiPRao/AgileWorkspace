import { useState } from 'react';
import { Toggle }    from '../components/ui/Toggle.jsx';

const SECTIONS = ['General', 'Notifications', 'Integrations', 'Security'];

const GENERAL_PREFS = [
  ['Default View',   'Backlogs'],
  ['Date Format',    'YYYY-MM-DD'],
  ['Items per Page', '25'],
  ['Workspace Name', 'AgileWorkspace'],
];

const NOTIF_PREFS = [
  ['Task Assignments', true],
  ['Status Changes',   true],
  ['Weekly Digest',    false],
  ['Mention Alerts',   true],
];

export function SettingsView() {
  const [activeSection, setActiveSection] = useState('General');

  return (
    <div className="settings-layout">
      {/* Left nav */}
      <nav className="settings-nav">
        {SECTIONS.map(s => (
          <button
            key={s}
            className={`settings-nav-item${activeSection === s ? ' active' : ''}`}
            onClick={() => setActiveSection(s)}
          >
            {s}
          </button>
        ))}
      </nav>

      {/* Right content */}
      <div className="settings-section">
        {activeSection === 'General' && (
          <div className="settings-card">
            <div className="settings-card-title">General</div>
            {GENERAL_PREFS.map(([label, value]) => (
              <div key={label} className="preference-row">
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: 'var(--colors-secondary)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'Notifications' && (
          <div className="settings-card">
            <div className="settings-card-title">Notifications</div>
            {NOTIF_PREFS.map(([label, def]) => (
              <div key={label} className="preference-row">
                <span>{label}</span>
                <Toggle defaultChecked={def} />
              </div>
            ))}
          </div>
        )}

        {(activeSection === 'Integrations' || activeSection === 'Security') && (
          <div className="settings-card">
            <div className="settings-card-title">{activeSection}</div>
            <p style={{ color: 'var(--colors-secondary)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              {activeSection} configuration coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
