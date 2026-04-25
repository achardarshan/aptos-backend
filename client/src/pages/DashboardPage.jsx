import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeAlert, ClipboardList, CreditCard, Home, RefreshCw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import MetricCard from '../components/MetricCard';
import { apiFetch, formatDateTime, formatCurrency, statusTone } from '../lib/api';
import { getUser, roleLabel } from '../lib/auth';

function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now.toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function EmptyRow({ message, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="empty-state">
          <div className="icon">⚪</div>
          <p>{message}</p>
        </div>
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getUser() || {};
  const [visitors, setVisitors] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [visitorData, complaintData, paymentData, userData] = await Promise.all([
        apiFetch('/api/visitors'),
        apiFetch('/api/complaints'),
        apiFetch('/api/payments'),
        user.role === 'admin' ? apiFetch('/api/auth/users') : Promise.resolve(null),
      ]);

      if (visitorData?.success) setVisitors(visitorData.visitors || []);
      if (complaintData?.success) setComplaints(complaintData.complaints || []);
      if (paymentData?.success) setPayments(paymentData.payments || []);
      if (userData?.success) setUsers(userData.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user.role]);

  const stats = useMemo(() => {
    const residentCount = users.filter((item) => item.role === 'resident').length;
    const pendingVisitors = visitors.filter((item) => item.status === 'pending').length;
    const openComplaints = complaints.filter((item) => item.status !== 'resolved').length;
    const unpaidPayments = payments.filter((item) => item.status === 'unpaid').length;
    const overduePayments = payments.filter((item) => item.status === 'unpaid' && new Date(item.dueDate) < new Date()).length;
    const activeVisitors = visitors.filter((item) => item.status === 'approved' && !item.exitTime).length;
    const totalPayments = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      residentCount,
      pendingVisitors,
      openComplaints,
      unpaidPayments,
      overduePayments,
      activeVisitors,
      totalPayments,
    };
  }, [users, visitors, complaints, payments]);

  const firstName = user.name ? user.name.trim().split(/\s+/)[0] : '';
  const heroTitle = firstName ? `Good afternoon, ${firstName}.` : 'Good afternoon.';
  const heroCopy = user.role === 'admin'
    ? `${stats.pendingVisitors} visitors are waiting, ${stats.openComplaints} complaints are open, and ${stats.overduePayments} dues are overdue.`
    : user.role === 'security'
      ? `${stats.pendingVisitors} visitors are waiting for review and ${stats.activeVisitors} approved visitors are still on site.`
      : `${stats.unpaidPayments} dues are pending and ${stats.openComplaints} complaints are still open on your account.`;

  const heroPrimaryAction = user.role === 'admin'
    ? { label: 'Review complaints', to: '/complaints' }
    : user.role === 'security'
      ? { label: 'Open visitors', to: '/visitors' }
      : { label: 'Open payments', to: '/payments' };

  const heroAttention = user.role === 'admin'
    ? `${stats.openComplaints + stats.pendingVisitors + stats.overduePayments} items need attention`
    : user.role === 'security'
      ? `${stats.pendingVisitors} visitors are waiting at the gate`
      : `${stats.unpaidPayments + stats.openComplaints} items need attention`;

  const recentVisitors = visitors.slice(0, 5);

  const focusItems = user.role === 'admin'
    ? [
      { label: 'Pending visitors', value: stats.pendingVisitors, detail: 'Awaiting approval', tone: 'warning' },
      { label: 'Open complaints', value: stats.openComplaints, detail: 'Need follow-up', tone: 'danger' },
      { label: 'Overdue dues', value: stats.overduePayments, detail: 'Past due date', tone: 'accent' },
    ]
    : user.role === 'security'
      ? [
        { label: 'Pending visitors', value: stats.pendingVisitors, detail: 'Waiting at the gate', tone: 'warning' },
        { label: 'Active visitors', value: stats.activeVisitors, detail: 'Approved but not exited', tone: 'primary' },
        { label: 'Recent entries', value: recentVisitors.length, detail: 'Latest visitor records', tone: 'success' },
      ]
      : [
        { label: 'Pending dues', value: stats.unpaidPayments, detail: 'Awaiting payment', tone: 'warning' },
        { label: 'Open complaints', value: stats.openComplaints, detail: 'Still unresolved', tone: 'accent' },
        { label: 'Recent activity', value: recentVisitors.length, detail: 'Latest visitor records', tone: 'success' },
      ];

  const summaryRows = [
    { label: 'Complaints', value: complaints.length },
    { label: 'Payments', value: formatCurrency(stats.totalPayments) },
    { label: 'Users', value: user.role === 'admin' ? users.length : 1 },
    { label: 'Status', value: roleLabel(user.role) },
  ];

  const quickActions = [
    { label: 'Visitors', icon: Users, to: '/visitors', tone: 'primary' },
    { label: 'Complaints', icon: ClipboardList, to: '/complaints', tone: 'accent' },
    { label: 'Payments', icon: CreditCard, to: '/payments', tone: 'warning' },
    { label: 'Staff', icon: ShieldCheck, to: '/staff', tone: 'success' },
  ].filter((item) => {
    if (user.role === 'security') return item.to === '/visitors';
    if (user.role === 'resident') return item.to !== '/users';
    return true;
  });

  return (
    <div className="page-section dashboard-page">
      <section className="hero-card dashboard-hero">
        <div className="dashboard-hero-grid">
          <div className="dashboard-hero-copy">
            <div className="dashboard-kicker">Community snapshot</div>
            <h1 className="hero-title">{heroTitle}</h1>
            <p className="hero-copy">{heroCopy}</p>
            <div className="hero-pill-row">
              <Badge tone="primary">{roleLabel(user.role) || 'Member'}</Badge>
              {user.flatNumber ? <Badge tone="neutral">Flat {user.flatNumber}</Badge> : null}
              <Badge tone="accent">Live updates</Badge>
            </div>
            <div className="dashboard-hero-actions">
              <button type="button" className="primary-button" onClick={() => navigate(heroPrimaryAction.to)}>
                {heroPrimaryAction.label}
                <ArrowRight size={15} />
              </button>
              <button type="button" className="secondary-button" onClick={loadDashboardData}>
                <RefreshCw size={15} /> Refresh data
              </button>
            </div>
          </div>

          <aside className="dashboard-hero-panel">
            <div className="dashboard-panel-top">
              <div>
                <div className="dashboard-panel-kicker">Need attention</div>
                <div className="dashboard-panel-value">{heroAttention}</div>
              </div>
              <div className="dashboard-panel-clock mono">{<Clock />}</div>
            </div>
            <p className="dashboard-panel-copy">
              {user.role === 'admin'
                ? 'Focus on approvals and overdue dues before the queue gets longer.'
                : user.role === 'security'
                  ? 'Keep the gate moving by clearing waiting visitors and tracking active entries.'
                  : 'Check dues first, then review anything still waiting on your account.'}
            </p>
            <div className="dashboard-mini-grid">
              {focusItems.map((item) => (
                <div key={item.label} className="dashboard-mini-stat">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="dashboard-overview-grid">
        <article className="card dashboard-focus-card">
          <div className="card-header">
            <div>
              <div className="card-title">Priority snapshot</div>
              <div className="card-subtitle">The shortest read on what needs attention.</div>
            </div>
            <Badge tone={user.role === 'admin' ? 'danger' : user.role === 'security' ? 'warning' : 'accent'}>{focusItems[0]?.detail || 'Focus'}</Badge>
          </div>

          <div className="dashboard-focus-summary">
            <div className="dashboard-focus-count">{heroAttention}</div>
            <p className="dashboard-focus-copy">This card gives you the one-line version before you jump into the detailed tables below.</p>
          </div>

          <div className="dashboard-focus-list">
            {focusItems.map((item) => (
              <div key={item.label} className="dashboard-focus-item">
                <div>
                  <span>{item.label}</span>
                  <strong>{item.detail}</strong>
                </div>
                <Badge tone={item.tone}>{item.value}</Badge>
              </div>
            ))}
          </div>
        </article>

        <section className="metric-grid dashboard-metric-grid">
          {user.role === 'admin' ? (
            <>
              <MetricCard label="Total residents" value={stats.residentCount} hint="Registered user accounts" icon={Home} tone="primary" />
              <MetricCard label="Pending visitors" value={stats.pendingVisitors} hint="Awaiting approval" icon={Users} tone="warning" />
              <MetricCard label="Open complaints" value={stats.openComplaints} hint="Not resolved yet" icon={BadgeAlert} tone="danger" />
              <MetricCard label="Unpaid dues" value={stats.unpaidPayments} hint={`${stats.overduePayments} overdue`} icon={CreditCard} tone="accent" />
            </>
          ) : (
            <>
              <MetricCard label="My visitors" value={visitors.length} hint="Visible to your role" icon={Users} tone="primary" />
              <MetricCard label="My complaints" value={complaints.length} hint="Raised from this account" icon={ClipboardList} tone="accent" />
              <MetricCard label="Pending dues" value={payments.filter((item) => item.status === 'unpaid').length} hint="Awaiting payment" icon={CreditCard} tone="warning" />
              <MetricCard label="Recent activity" value={recentVisitors.length} hint="Latest visitor records" icon={Sparkles} tone="success" />
            </>
          )}
        </section>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Quick actions</div>
            <div className="panel-subtitle">Jump straight to the most common tasks without hunting through the sidebar.</div>
          </div>
        </div>
        <div className="dashboard-action-grid">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.to} type="button" className="dashboard-action-card" onClick={() => navigate(item.to)}>
                <div className={`metric-icon metric-card-${item.tone}`}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="dashboard-action-copy">
                  <p>Open</p>
                  <h3>{item.label}</h3>
                  <span>View and manage records</span>
                </div>
                <ArrowRight size={16} className="dashboard-action-arrow" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent visitors</div>
              <div className="card-subtitle">Latest gate records across the society.</div>
            </div>
            <button type="button" className="secondary-button small-button" onClick={() => navigate('/visitors')}>
              View all <ArrowRight size={15} />
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Flat</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <EmptyRow message="Loading visitor data..." colSpan={5} /> : null}
                {!loading && recentVisitors.length === 0 ? <EmptyRow message="No recent visitors found." colSpan={5} /> : null}
                {!loading && recentVisitors.map((visitor) => (
                  <tr key={visitor._id}>
                    <td className="table-name">{visitor.name}</td>
                    <td><Badge tone="neutral">{visitor.flatNumber}</Badge></td>
                    <td>{visitor.purpose}</td>
                    <td><Badge tone={statusTone(visitor.status)}>{visitor.status}</Badge></td>
                    <td className="table-secondary mono">{formatDateTime(visitor.entryTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card dashboard-summary-card">
          <div className="card-header">
            <div>
              <div className="card-title">Summary</div>
              <div className="card-subtitle">A compact view of the current records.</div>
            </div>
          </div>
          <div className="dashboard-summary-list">
            {summaryRows.map((row) => (
              <div key={row.label} className="dashboard-summary-row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
