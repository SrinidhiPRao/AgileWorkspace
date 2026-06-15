import { useEffect, useState }       from 'react';
import { users }                     from '../api/index.js';
import { LoadingState, ErrorState }  from '../components/ui/EmptyState.jsx';

export function TeamView() {
  const [teamList, setTeamList] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    users.list({ limit: 100 })
      .then(res => setTeamList(res.data ?? []))
      .catch(err => setError(err.message ?? 'Failed to load team.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={load} />;
  if (!teamList.length) return <p style={{ color: 'var(--colors-secondary)' }}>No team members found.</p>;

  return (
    <div className="team-grid">
      {teamList.map(member => {
        const initials = (member.name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div key={member.user_id} className="user-card">
            <span className={`status-indicator ${member.is_active ? 'status-active' : 'status-inactive'}`}>
              {member.is_active ? 'Active' : 'Inactive'}
            </span>
            <div className="user-header">
              <div className="user-avatar">{initials}</div>
              <div className="user-identity">
                <h3>{member.name ?? '—'}</h3>
                <p>{member.email ?? '—'}</p>
              </div>
            </div>
            <div className="user-roles">
              {(member.roles ?? []).map((r, i) => (
                <span key={i} className="role-tag">{r.role_name ?? r}</span>
              ))}
              {!member.roles?.length && <span className="role-tag">No roles assigned</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
