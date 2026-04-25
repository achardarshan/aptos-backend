import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { apiFetch, formatDateTime, statusTone } from '../lib/api';
import { getUser } from '../lib/auth';

const initialVisitorForm = {
  name: '',
  phone: '',
  flatNumber: '',
  purpose: '',
};

export default function VisitorsPage() {
  const user = getUser() || {};
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [visitorForm, setVisitorForm] = useState(initialVisitorForm);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewVisitor, setReviewVisitor] = useState(null);

  const loadVisitors = async () => {
    setLoading(true);
    const data = await apiFetch('/api/visitors');
    if (data?.success) {
      setVisitors(data.visitors || []);
      setError('');
    } else {
      setError(data?.message || 'Could not load visitors.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  useEffect(() => {
    if (user.role === 'resident' && user.flatNumber) {
      setVisitorForm((current) => ({ ...current, flatNumber: user.flatNumber }));
    }
  }, [user.flatNumber, user.role]);

  const visibleVisitors = useMemo(() => {
    if (filter === 'all') return visitors;
    return visitors.filter((visitor) => visitor.status === filter);
  }, [visitors, filter]);

  const openReview = (visitor) => {
    setReviewVisitor(visitor);
    setReviewOpen(true);
  };

  const createVisitor = async (event) => {
    event.preventDefault();
    setSubmitBusy(true);
    const data = await apiFetch('/api/visitors', {
      method: 'POST',
      body: JSON.stringify(visitorForm),
    });

    if (data?.success) {
      setCreateOpen(false);
      setVisitorForm((current) => ({ ...initialVisitorForm, flatNumber: user.role === 'resident' ? current.flatNumber : '' }));
      await loadVisitors();
    } else {
      setError(data?.message || 'Failed to add visitor.');
    }
    setSubmitBusy(false);
  };

  const updateStatus = async (status) => {
    if (!reviewVisitor) return;
    const data = await apiFetch(`/api/visitors/${reviewVisitor._id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    if (data?.success) {
      setReviewOpen(false);
      setReviewVisitor(null);
      await loadVisitors();
    } else {
      setError(data?.message || 'Could not update visitor status.');
    }
  };

  const markExit = async (visitorId) => {
    const data = await apiFetch(`/api/visitors/${visitorId}/exit`, { method: 'PUT' });
    if (data?.success) {
      await loadVisitors();
    }
  };

  const removeVisitor = async (visitorId) => {
    if (!window.confirm('Delete this visitor record?')) return;
    const data = await apiFetch(`/api/visitors/${visitorId}`, { method: 'DELETE' });
    if (data?.success) {
      await loadVisitors();
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Visitor Log</h1>
          <p className="section-subtitle">Track entry approvals and exits from a cleaner dashboard.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary-button small-button" onClick={loadVisitors}>
            <RefreshCw size={15} /> Refresh
          </button>
          {(user.role === 'admin' || user.role === 'security') ? (
            <button type="button" className="primary-button small-button" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Add Visitor
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="notice notice-danger">{error}</div> : null}

      <div className="tabs">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button key={status} type="button" className={`tab-button ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Flat</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8"><div className="empty-state"><div className="icon">⏳</div><p>Loading visitors...</p></div></td></tr>
              ) : null}
              {!loading && visibleVisitors.length === 0 ? (
                <tr><td colSpan="8"><div className="empty-state"><div className="icon">🚪</div><p>No visitors found.</p></div></td></tr>
              ) : null}
              {!loading && visibleVisitors.map((visitor) => {
                const canReview = (user.role === 'resident' || user.role === 'admin') && visitor.status === 'pending';
                const canExit = (user.role === 'security' || user.role === 'admin') && visitor.status === 'approved' && !visitor.exitTime;
                const canDelete = user.role === 'admin';

                return (
                  <tr key={visitor._id}>
                    <td className="table-name">{visitor.name}</td>
                    <td className="mono table-secondary">{visitor.phone}</td>
                    <td><Badge tone="neutral">{visitor.flatNumber}</Badge></td>
                    <td>{visitor.purpose}</td>
                    <td><Badge tone={statusTone(visitor.status)}>{visitor.status}</Badge></td>
                    <td className="table-secondary mono">{formatDateTime(visitor.entryTime)}</td>
                    <td className="table-secondary mono">{formatDateTime(visitor.exitTime)}</td>
                    <td>
                      <div className="action-row">
                        {canReview ? <button type="button" className="secondary-button small-button" onClick={() => openReview(visitor)}>Review</button> : null}
                        {canExit ? <button type="button" className="success-button small-button" onClick={() => markExit(visitor._id)}>Mark Exit</button> : null}
                        {canDelete ? <button type="button" className="danger-button small-button" onClick={() => removeVisitor(visitor._id)}>Delete</button> : null}
                        {!canReview && !canExit && !canDelete ? <span className="table-secondary">—</span> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={createOpen}
        title="Register visitor"
        subtitle="Add a visitor record at the gate."
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" form="visitor-create-form" className="primary-button" disabled={submitBusy}>{submitBusy ? 'Saving...' : 'Save visitor'}</button>
          </>
        )}
      >
        <form id="visitor-create-form" onSubmit={createVisitor} className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input value={visitorForm.name} onChange={(event) => setVisitorForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={visitorForm.phone} onChange={(event) => setVisitorForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" />
          </div>
          <div className="form-group">
            <label>Flat number</label>
            <input value={visitorForm.flatNumber} onChange={(event) => setVisitorForm((current) => ({ ...current, flatNumber: event.target.value }))} placeholder="A-101" disabled={user.role === 'resident'} />
          </div>
          <div className="form-group">
            <label>Purpose</label>
            <input value={visitorForm.purpose} onChange={(event) => setVisitorForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Delivery, meeting, etc." />
          </div>
        </form>
      </Modal>

      <Modal
        open={reviewOpen}
        title="Review visitor"
        subtitle={reviewVisitor ? `${reviewVisitor.name} · Flat ${reviewVisitor.flatNumber}` : ''}
        onClose={() => setReviewOpen(false)}
        footer={(
          <>
            <button type="button" className="secondary-button" onClick={() => setReviewOpen(false)}>Close</button>
            <button type="button" className="danger-button" onClick={() => updateStatus('rejected')}>Reject</button>
            <button type="button" className="success-button" onClick={() => updateStatus('approved')}>Approve</button>
          </>
        )}
      >
        <div className="panel" style={{ margin: 0, boxShadow: 'none' }}>
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-copy">
                <p>Phone</p>
                <h3 style={{ fontSize: '1.1rem' }}>{reviewVisitor?.phone || '—'}</h3>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-copy">
                <p>Purpose</p>
                <h3 style={{ fontSize: '1.1rem' }}>{reviewVisitor?.purpose || '—'}</h3>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
