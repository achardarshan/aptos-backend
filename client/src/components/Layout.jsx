import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, CreditCard, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, ClipboardList, UserCog } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getUser, initials, roleLabel } from '../lib/auth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'resident', 'security'] },
  { to: '/visitors', label: 'Visitor Log', icon: Users, roles: ['admin', 'resident', 'security'] },
  { to: '/complaints', label: 'Complaints', icon: ClipboardList, roles: ['admin', 'resident'] },
  { to: '/staff', label: 'Staff', icon: ShieldCheck, roles: ['admin', 'resident'] },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'resident'] },
  { to: '/users', label: 'All Users', icon: UserCog, roles: ['admin'] },
];

const SHELL_TITLE = 'Management console';
const SHELL_SUBTITLE = 'Smart community operations';

export default function AppLayout() {
  const user = getUser() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(user.role)),
    [user.role],
  );

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">🏠</div>
          <div>
            <div className="brand-name">Aptos</div>
            <div className="brand-subtitle">Society Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Overview</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card" style={{ margin: '0 0 0.8rem 0' }}>
            <div className="profile-avatar">{initials(user.name)}</div>
            <div style={{ overflow: 'hidden' }}>
              <div className="profile-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Guest'}</div>
              <div className="profile-meta">
                {roleLabel(user.role) || 'Member'}
                {user.flatNumber ? ` · Flat ${user.flatNumber}` : ''}
              </div>
            </div>
          </div>
          <button type="button" className="danger-button full-width" onClick={handleLogout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="icon-button mobile-toggle" onClick={() => setSidebarOpen((value) => !value)}>
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
            <div>
                <div className="topbar-title">{SHELL_TITLE}</div>
                <div className="topbar-subtitle">{SHELL_SUBTITLE}</div>
            </div>
          </div>

          <div className="topbar-right">
            <div style={{ position: 'relative' }}>
              <button 
                type="button" 
                className="icon-button" 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={18} />
                <span className="notification-dot" aria-hidden="true" />
              </button>
              
              {notificationsOpen ? (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <span className="badge badge-primary">2 New</span>
                  </div>
                  <div className="notifications-list">
                    <div className="notification-item unread">
                      <div className="notification-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                        <Users size={14} />
                      </div>
                      <div className="notification-content">
                        <p><strong>Visitor approved</strong></p>
                        <span>Your guest was allowed entry</span>
                      </div>
                    </div>
                    <div className="notification-item unread">
                      <div className="notification-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)' }}>
                        <CreditCard size={14} />
                      </div>
                      <div className="notification-content">
                        <p><strong>Payment reminder</strong></p>
                        <span>Maintenance due in 3 days</span>
                      </div>
                    </div>
                  </div>
                  <div className="notifications-footer">
                    <button type="button" className="ghost-button full-width small-button">Read more</button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="role-pill">{roleLabel(user.role) || 'Member'}</div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {sidebarOpen ? <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" /> : null}
    </div>
  );
}
