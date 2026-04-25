import { useEffect, useState } from 'react';
import { apiFetch, formatDateTime } from '../lib/api';
import Badge from '../components/Badge';
import { getUser } from '../lib/auth';

export default function UsersPage() {
  const user = getUser() || {};
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }

    const loadUsers = async () => {
      setLoading(true);
      const data = await apiFetch('/api/auth/users');
      if (data?.success) {
        setUsers(data.users || []);
        setError('');
      } else {
        setError(data?.message || 'Could not load users.');
      }
      setLoading(false);
    };

    loadUsers();
  }, [user.role]);

  if (user.role !== 'admin') {
    return (
      <div className="page-section">
        <section className="card">
          <div className="empty-state">
            <div className="icon">🔒</div>
            <h2 style={{ fontSize: '1.4rem' }}>Admin only area</h2>
            <p>You do not have permission to view all users.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">All Users</h1>
          <p className="section-subtitle">Review the full account list for the society portal.</p>
        </div>
      </div>

      {error ? <div className="notice notice-danger">{error}</div> : null}

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Flat</th>
                <th>Phone</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6"><div className="empty-state"><div className="icon">⏳</div><p>Loading users...</p></div></td></tr> : null}
              {!loading && users.length === 0 ? <tr><td colSpan="6"><div className="empty-state"><div className="icon">👥</div><p>No users found.</p></div></td></tr> : null}
              {!loading && users.map((item) => (
                <tr key={item._id}>
                  <td className="table-name">{item.name}</td>
                  <td className="table-secondary mono">{item.email}</td>
                  <td><Badge tone={item.role === 'admin' ? 'accent' : item.role === 'security' ? 'warning' : 'primary'}>{item.role}</Badge></td>
                  <td><Badge tone="neutral">{item.flatNumber || '—'}</Badge></td>
                  <td className="table-secondary mono">{item.phone || '—'}</td>
                  <td className="table-secondary mono">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
