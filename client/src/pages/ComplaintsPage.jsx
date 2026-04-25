import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { apiFetch, formatDateTime, formatStatus, statusTone } from '../lib/api';
import { getUser } from '../lib/auth';

const initialComplaintForm = {
  title: '',
  description: '',
  category: 'other',
  priority: 'medium',
};

export default function ComplaintsPage() {
  const user = getUser() || {};
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialComplaintForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);
  const [updateComplaint, setUpdateComplaint] = useState(null);
  const [updateOpen, setUpdateOpen] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);
    const data = await apiFetch('/api/complaints');
    if (data?.success) {
      setComplaints(data.complaints || []);
      setError('');
    } else {
      setError(data?.message || 'Could not load complaints.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const visibleComplaints = useMemo(() => {
    if (filter === 'all') return complaints;
    return complaints.filter((complaint) => complaint.status === filter);
  }, [complaints, filter]);

  const submitComplaint = async (event) => {
    event.preventDefault();
    const data = await apiFetch('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(form),
    });

    if (data?.success) {
      setCreateOpen(false);
      setForm(initialComplaintForm);
      await loadComplaints();
    } else {
      setError(data?.message || 'Failed to submit complaint.');
    }
  };

  const submitUpdate = async (event) => {
    event.preventDefault();
    if (!updateComplaint) return;

    const data = await apiFetch(`/api/complaints/${updateComplaint._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: updateComplaint.status,
        adminNote: updateComplaint.adminNote || '',
      }),
    });

    if (data?.success) {
      setUpdateOpen(false);
      setUpdateComplaint(null);
      await loadComplaints();
    } else {
      setError(data?.message || 'Could not update the complaint.');
    }
  };

  const deleteComplaint = async (complaintId) => {
    if (!window.confirm('Delete this complaint?')) return;
    const data = await apiFetch(`/api/complaints/${complaintId}`, { method: 'DELETE' });
    if (data?.success) {
      await loadComplaints();
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Complaints</h1>
          <p className="section-subtitle">Track issues from submission to resolution with cleaner state handling.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary-button small-button" onClick={loadComplaints}>
            <RefreshCw size={15} /> Refresh
          </button>
          {(user.role === 'admin' || user.role === 'resident') ? (
            <button type="button" className="primary-button small-button" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> New Complaint
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="notice notice-danger">{error}</div> : null}

      <div className="tabs">
        {['all', 'pending', 'in-progress', 'resolved'].map((status) => (
          <button key={status} type="button" className={`tab-button ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
            {status === 'all' ? 'All' : formatStatus(status)}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Flat</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7"><div className="empty-state"><div className="icon">⏳</div><p>Loading complaints...</p></div></td></tr> : null}
              {!loading && visibleComplaints.length === 0 ? <tr><td colSpan="7"><div className="empty-state"><div className="icon">📭</div><p>No complaints found.</p></div></td></tr> : null}
              {!loading && visibleComplaints.map((complaint) => (
                <tr key={complaint._id}>
                  <td className="table-name">{complaint.title}</td>
                  <td><Badge tone="neutral">{complaint.category}</Badge></td>
                  <td><Badge tone={complaint.priority === 'high' ? 'danger' : complaint.priority === 'medium' ? 'warning' : 'neutral'}>{complaint.priority}</Badge></td>
                  <td><Badge tone="neutral">{complaint.flatNumber}</Badge></td>
                  <td><Badge tone={statusTone(complaint.status)}>{formatStatus(complaint.status)}</Badge></td>
                  <td className="table-secondary mono">{formatDateTime(complaint.createdAt)}</td>
                  <td>
                    <div className="action-row">
                      <button type="button" className="secondary-button small-button" onClick={() => setDetailComplaint(complaint)}>View</button>
                      {user.role === 'admin' ? (
                        <>
                          <button type="button" className="success-button small-button" onClick={() => { setUpdateComplaint(complaint); setUpdateOpen(true); }}>Update</button>
                          <button type="button" className="danger-button small-button" onClick={() => deleteComplaint(complaint._id)}>Delete</button>
                        </>
                      ) : null}
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
        title="New complaint"
        subtitle="Describe the issue you want resolved."
        onClose={() => setCreateOpen(false)}
        wide
        footer={(
          <>
            <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" form="complaint-create-form" className="primary-button">Submit complaint</button>
          </>
        )}
      >
        <form id="complaint-create-form" onSubmit={submitComplaint} className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Title</label>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Short issue summary" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              <option value="maintenance">Maintenance</option>
              <option value="security">Security</option>
              <option value="noise">Noise</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Explain the issue in detail." />
          </div>
        </form>
      </Modal>

      <Modal
        open={updateOpen}
        title="Update complaint"
        subtitle={updateComplaint ? updateComplaint.title : ''}
        onClose={() => setUpdateOpen(false)}
        footer={(
          <>
            <button type="button" className="secondary-button" onClick={() => setUpdateOpen(false)}>Cancel</button>
            <button type="submit" form="complaint-update-form" className="primary-button">Save changes</button>
          </>
        )}
      >
        <form id="complaint-update-form" onSubmit={submitUpdate} className="form-grid">
          <div className="form-group">
            <label>Status</label>
            <select value={updateComplaint?.status || 'pending'} onChange={(event) => setUpdateComplaint((current) => ({ ...current, status: event.target.value }))}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="form-group">
            <label>Admin note</label>
            <textarea value={updateComplaint?.adminNote || ''} onChange={(event) => setUpdateComplaint((current) => ({ ...current, adminNote: event.target.value }))} placeholder="Add a note for the resident." />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailComplaint)}
        title={detailComplaint?.title || ''}
        subtitle={detailComplaint ? `${detailComplaint.category} · Flat ${detailComplaint.flatNumber}` : ''}
        onClose={() => setDetailComplaint(null)}
      >
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-copy">
              <p>Status</p>
              <h3 style={{ fontSize: '1.15rem' }}>{detailComplaint ? formatStatus(detailComplaint.status) : '—'}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-copy">
              <p>Priority</p>
              <h3 style={{ fontSize: '1.15rem' }}>{detailComplaint?.priority || '—'}</h3>
            </div>
          </div>
        </div>
        <div className="panel" style={{ margin: 0, boxShadow: 'none' }}>
          <p className="card-subtitle">{detailComplaint?.description || '—'}</p>
          {detailComplaint?.adminNote ? <div className="notice notice-info" style={{ marginTop: '1rem' }}>{detailComplaint.adminNote}</div> : null}
        </div>
      </Modal>
    </div>
  );
}
