import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Zap } from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { apiFetch, formatCurrency, formatDateTime, statusTone } from '../lib/api';
import { getUser } from '../lib/auth';

const initialPaymentForm = {
  title: '',
  amount: '',
  month: '',
  flatNumber: '',
  dueDate: '',
};

const initialBulkForm = {
  title: '',
  amount: '',
  month: '',
  dueDate: '',
};

export default function PaymentsPage() {
  const user = getUser() || {};
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [bulkForm, setBulkForm] = useState(initialBulkForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    const data = await apiFetch('/api/payments');
    if (data?.success) {
      setPayments(data.payments || []);
      setError('');
    } else {
      setError(data?.message || 'Could not load payments.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const visiblePayments = useMemo(() => {
    if (filter === 'all') return payments;
    return payments.filter((payment) => payment.status === filter);
  }, [payments, filter]);

  const overdue = (payment) => payment.status === 'unpaid' && new Date(payment.dueDate) < new Date();

  const submitPayment = async (event) => {
    event.preventDefault();
    const data = await apiFetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify({
        ...paymentForm,
        amount: Number(paymentForm.amount),
      }),
    });

    if (data?.success) {
      setCreateOpen(false);
      setPaymentForm(initialPaymentForm);
      await loadPayments();
    } else {
      setError(data?.message || 'Could not create payment.');
    }
  };

  const submitBulk = async (event) => {
    event.preventDefault();
    const data = await apiFetch('/api/payments/bulk', {
      method: 'POST',
      body: JSON.stringify({
        ...bulkForm,
        amount: Number(bulkForm.amount),
      }),
    });

    if (data?.success) {
      setBulkOpen(false);
      setBulkForm(initialBulkForm);
      await loadPayments();
    } else {
      setError(data?.message || 'Could not create bulk payments.');
    }
  };

  const markPayment = async (paymentId, action) => {
    const data = await apiFetch(`/api/payments/${paymentId}/${action}`, { method: 'PUT' });
    if (data?.success) {
      await loadPayments();
    }
  };

  const deletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment record?')) return;
    const data = await apiFetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
    if (data?.success) {
      await loadPayments();
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Payments</h1>
          <p className="section-subtitle">Track maintenance dues, payment status, and overdue balances.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary-button small-button" onClick={loadPayments}>
            <RefreshCw size={15} /> Refresh
          </button>
          {user.role === 'admin' ? (
            <>
              <button type="button" className="primary-button small-button" onClick={() => setCreateOpen(true)}>
                <Plus size={15} /> Add Due
              </button>
              <button type="button" className="secondary-button small-button" onClick={() => setBulkOpen(true)}>
                <Zap size={15} /> Bulk Add
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <div className="notice notice-danger">{error}</div> : null}

      <div className="tabs">
        {['all', 'unpaid', 'paid'].map((status) => (
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
                <th>Title</th>
                <th>Month</th>
                <th>Flat</th>
                <th>Amount</th>
                <th>Due date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7"><div className="empty-state"><div className="icon">⏳</div><p>Loading payments...</p></div></td></tr> : null}
              {!loading && visiblePayments.length === 0 ? <tr><td colSpan="7"><div className="empty-state"><div className="icon">💳</div><p>No payment records found.</p></div></td></tr> : null}
              {!loading && visiblePayments.map((payment) => (
                <tr key={payment._id}>
                  <td className="table-name">{payment.title}</td>
                  <td className="mono table-secondary">{payment.month}</td>
                  <td><Badge tone="neutral">{payment.flatNumber}</Badge></td>
                  <td className="mono">{formatCurrency(payment.amount)}</td>
                  <td className={`table-secondary mono ${overdue(payment) ? 'danger-text' : ''}`}>{formatDateTime(payment.dueDate)}</td>
                  <td><Badge tone={statusTone(payment.status)}>{payment.status}</Badge></td>
                  <td>
                    <div className="action-row">
                      {user.role === 'admin' ? (
                        <>
                          {payment.status === 'unpaid' ? (
                            <button type="button" className="success-button small-button" onClick={() => markPayment(payment._id, 'pay')}>Mark paid</button>
                          ) : (
                            <button type="button" className="secondary-button small-button" onClick={() => markPayment(payment._id, 'unpay')}>Mark unpaid</button>
                          )}
                          <button type="button" className="danger-button small-button" onClick={() => deletePayment(payment._id)}>Delete</button>
                        </>
                      ) : <span className="table-secondary">—</span>}
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
        title="Add payment due"
        subtitle="Create a single payment record for one flat."
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" form="payment-create-form" className="primary-button">Create due</button>
          </>
        )}
      >
        <form id="payment-create-form" onSubmit={submitPayment} className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Title</label>
            <input value={paymentForm.title} onChange={(event) => setPaymentForm((current) => ({ ...current, title: event.target.value }))} placeholder="March 2026 Maintenance" />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} />
          </div>
          <div className="form-group">
            <label>Month</label>
            <input type="month" value={paymentForm.month} onChange={(event) => setPaymentForm((current) => ({ ...current, month: event.target.value }))} />
          </div>
          <div className="form-group">
            <label>Flat number</label>
            <input value={paymentForm.flatNumber} onChange={(event) => setPaymentForm((current) => ({ ...current, flatNumber: event.target.value }))} placeholder="A-101" />
          </div>
          <div className="form-group">
            <label>Due date</label>
            <input type="date" value={paymentForm.dueDate} onChange={(event) => setPaymentForm((current) => ({ ...current, dueDate: event.target.value }))} />
          </div>
        </form>
      </Modal>

      <Modal
        open={bulkOpen}
        title="Bulk payment dues"
        subtitle="Create dues for all residents at once."
        onClose={() => setBulkOpen(false)}
        footer={(
          <>
            <button type="button" className="secondary-button" onClick={() => setBulkOpen(false)}>Cancel</button>
            <button type="submit" form="payment-bulk-form" className="primary-button">Create bulk dues</button>
          </>
        )}
      >
        <form id="payment-bulk-form" onSubmit={submitBulk} className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Title</label>
            <input value={bulkForm.title} onChange={(event) => setBulkForm((current) => ({ ...current, title: event.target.value }))} placeholder="April 2026 Maintenance" />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" value={bulkForm.amount} onChange={(event) => setBulkForm((current) => ({ ...current, amount: event.target.value }))} />
          </div>
          <div className="form-group">
            <label>Month</label>
            <input type="month" value={bulkForm.month} onChange={(event) => setBulkForm((current) => ({ ...current, month: event.target.value }))} />
          </div>
          <div className="form-group">
            <label>Due date</label>
            <input type="date" value={bulkForm.dueDate} onChange={(event) => setBulkForm((current) => ({ ...current, dueDate: event.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
