import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { apiFetch, formatDateTime, statusTone } from '../lib/api';
import { getUser } from '../lib/auth';

const initialStaffForm = {
  name: '',
  phone: '',
  type: 'maid',
  flatNumber: '',
};

const todayValue = () => new Date().toISOString().split('T')[0];

export default function StaffPage() {
  const user = getUser() || {};
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialStaffForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const loadStaff = async () => {
    setLoading(true);
    const data = await apiFetch('/api/staff');
    if (data?.success) {
      setStaff(data.staff || []);
      setError('');
    } else {
      setError(data?.message || 'Could not load staff.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (user.role === 'resident' && user.flatNumber) {
      setForm((current) => ({ ...current, flatNumber: user.flatNumber }));
    }
  }, [user.flatNumber, user.role]);

  const staffRows = useMemo(() => staff.map((item) => {
    const todayAttendance = item.attendance?.find((entry) => entry.date === todayValue());
    return {
      ...item,
      todayAttendance,
    };
  }), [staff]);

  const submitStaff = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      flatNumber: user.role === 'resident' ? user.flatNumber : form.flatNumber,
    };

    const data = await apiFetch('/api/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data?.success) {
      setCreateOpen(false);
      setForm((current) => ({ ...initialStaffForm, flatNumber: user.role === 'resident' ? current.flatNumber : '' }));
      await loadStaff();
    } else {
      setError(data?.message || 'Could not add staff.');
    }
  };

  const markAttendance = async (staffId, status) => {
    const data = await apiFetch(`/api/staff/${staffId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ date: todayValue(), status }),
    });

    if (data?.success) {
      await loadStaff();
    }
  };

  const deleteStaff = async (staffId) => {
    if (!window.confirm('Remove this staff record?')) return;
    const data = await apiFetch(`/api/staff/${staffId}`, { method: 'DELETE' });
    if (data?.success) {
      await loadStaff();
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Staff Management</h1>
          <p className="section-subtitle">Manage helpers and daily attendance with cleaner controls.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary-button small-button" onClick={loadStaff}>
            <RefreshCw size={15} /> Refresh
          </button>
          {(user.role === 'admin' || user.role === 'resident') ? (
            <button type="button" className="primary-button small-button" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Add Staff
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="notice notice-danger">{error}</div> : null}

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Flat</th>
                <th>Attendance</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7"><div className="empty-state"><div className="icon">⏳</div><p>Loading staff...</p></div></td></tr> : null}
              {!loading && staffRows.length === 0 ? <tr><td colSpan="7"><div className="empty-state"><div className="icon">👷</div><p>No staff records found.</p></div></td></tr> : null}
              {!loading && staffRows.map((item) => (
                <tr key={item._id}>
                  <td className="table-name">{item.name}</td>
                  <td><Badge tone="neutral">{item.type}</Badge></td>
                  <td className="mono table-secondary">{item.phone}</td>
                  <td><Badge tone="neutral">{item.flatNumber}</Badge></td>
                  <td>
                    {item.todayAttendance ? (
                      <Badge tone={statusTone(item.todayAttendance.status)}>{item.todayAttendance.status}</Badge>
                    ) : (
                      <div className="action-row">
                        {(user.role === 'admin' || user.role === 'resident') ? (
                          <>
                            <button type="button" className="success-button small-button" onClick={() => markAttendance(item._id, 'present')}>Present</button>
                            <button type="button" className="danger-button small-button" onClick={() => markAttendance(item._id, 'absent')}>Absent</button>
                          </>
                        ) : <span className="table-secondary">Not marked</span>}
                      </div>
                    )}
                  </td>
                  <td className="table-secondary mono">{formatDateTime(item.updatedAt || item.createdAt)}</td>
                  <td>
                    <div className="action-row">
                      <button type="button" className="secondary-button small-button" onClick={() => setSelectedStaff(item)}>View</button>
                      {user.role === 'admin' ? <button type="button" className="danger-button small-button" onClick={() => deleteStaff(item._id)}>Remove</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={createOpen}
        title="Add staff"
        subtitle="Register a new domestic helper or driver."
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" form="staff-create-form" className="primary-button">Save staff</button>
          </>
        )}
      >
        <form id="staff-create-form" onSubmit={submitStaff} className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              <option value="maid">Maid</option>
              <option value="cook">Cook</option>
              <option value="driver">Driver</option>
              <option value="gardener">Gardener</option>
              <option value="watchman">Watchman</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Flat number</label>
            <input value={form.flatNumber} onChange={(event) => setForm((current) => ({ ...current, flatNumber: event.target.value }))} placeholder="A-101" disabled={user.role === 'resident'} />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedStaff)}
        title={selectedStaff?.name || ''}
        subtitle={selectedStaff ? `${selectedStaff.type} · Flat ${selectedStaff.flatNumber}` : ''}
        onClose={() => setSelectedStaff(null)}
      >
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-copy">
              <p>Phone</p>
              <h3 style={{ fontSize: '1.1rem' }}>{selectedStaff?.phone || '—'}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-copy">
              <p>Attendance</p>
              <h3 style={{ fontSize: '1.1rem' }}>{selectedStaff?.todayAttendance?.status || 'Not marked'}</h3>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
