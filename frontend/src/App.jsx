import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { TopBar } from './components/layout/TopBar.jsx';
import { QuickCreateModal } from './components/modals/QuickCreateModal.jsx';
import { NotificationsPanel } from './components/modals/NotificationsPanel.jsx';
import { ProfilePanel } from './components/modals/ProfilePanel.jsx';
import { KanbanView } from './views/KanbanView.jsx';
import { TeamView } from './views/TeamView.jsx';
import { MetricsView } from './views/MetricsView.jsx';
import { SettingsView } from './views/SettingsView.jsx';
import { LoginPage } from './views/LoginPage.jsx';
import { SignupPage } from './views/SignupPage.jsx';
import { EmptyState } from './components/ui/EmptyState.jsx';

const KANBAN_VIEWS = ['backlogs', 'features', 'stories', 'tasks'];

const VIEW_LABELS = {
  backlogs: 'Backlogs', features: 'Features', stories: 'Stories',
  tasks: 'Tasks', team: 'Team', metrics: 'Metrics', settings: 'Settings',
};

// ── Workspace router ──────────────────────────────────────────────────────────
function WorkspaceContent({ currentView, searchQuery, onNavigate }) {
  if (KANBAN_VIEWS.includes(currentView)) {
    return <KanbanView viewType={currentView} searchQuery={searchQuery} onNavigate={onNavigate} />;
  }
  switch (currentView) {
    case 'team': return <TeamView />;
    case 'metrics': return <MetricsView />;
    case 'settings': return <SettingsView />;
    default:
      return (
        <EmptyState
          icon="bx-cog"
          title={`${VIEW_LABELS[currentView] ?? currentView} Dashboard`}
          body="This section is coming soon."
        />
      );
  }
}

// ── Authenticated shell ───────────────────────────────────────────────────────
function AppShell() {
  const [currentView, setCurrentView] = useState('backlogs');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [boardKey, setBoardKey] = useState(0);

  const navigate = useCallback((view) => {
    setCurrentView(view);
    setSearchQuery('');
  }, []);

  const handleCreated = useCallback((type) => {
    navigate(type);
    setBoardKey(k => k + 1);
  }, [navigate]);

  return (
    <div className="app-container">
      <Sidebar currentView={currentView} onNavigate={navigate} />

      <div className="main-wrapper">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onQuickCreate={() => setQuickCreateOpen(true)}
          unreadCount={unreadCount}
          onNotifications={() => { setNotifOpen(true); setProfileOpen(false); }}
          onProfile={() => { setProfileOpen(true); setNotifOpen(false); }}
        />

        <main className="main-workspace">
          <div className="view-header">
            <h1>{VIEW_LABELS[currentView] ?? currentView}</h1>
          </div>
          <WorkspaceContent
            key={`${currentView}-${boardKey}`}
            currentView={currentView}
            searchQuery={searchQuery}
            onNavigate={navigate}
          />
        </main>
      </div>

      <QuickCreateModal
        open={quickCreateOpen}
        currentView={currentView}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setUnreadCount}
      />
      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}

// ── Auth gate — decides what to render based on auth state ───────────────────
function AuthGate() {
  const { token, authChecked } = useAuth();
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'signup'

  // Still verifying the stored token — show nothing to avoid flash
  if (!authChecked) {
    return (
      <div className="auth-boot">
        <i className="bx bx-loader-alt bx-spin auth-boot-icon" />
      </div>
    );
  }

  // Authenticated
  if (token) return <AppShell />;

  // Unauthenticated
  if (authPage === 'signup') {
    return <SignupPage onGoToLogin={() => setAuthPage('login')} />;
  }
  return <LoginPage onGoToSignup={() => setAuthPage('signup')} />;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate />
      </ToastProvider>
    </AuthProvider>
  );
}