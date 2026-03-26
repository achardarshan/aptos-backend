// app.js — Aptos Frontend Logic
// Handles all API calls, DOM manipulation, and user interactions

const API = 'https://aptos-backend-vofg.onrender.com/api';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('aptos_token');
}

function getUser() {
  const u = localStorage.getItem('aptos_user');
  return u ? JSON.parse(u) : null;
}

// Auth headers for every fetch request
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!getToken() || !getUser()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('aptos_token');
  localStorage.removeItem('aptos_user');
  window.location.href = 'login.html';
}

// ─── API request wrapper ──────────────────────────────────────────────────────

async function apiRequest(method, path, body = null) {
  try {
    const opts = { method, headers: authHeaders() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    const data = await res.json();
    if (res.status === 401) {
      logout(); // Token expired
      return null;
    }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Network error. Is the server running?' };
  }
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function badge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

function showMsg(containerId, type, text) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}"><span>${type === 'error' ? '⚠' : '✓'}</span> ${text}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// Today's date in YYYY-MM-DD format
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Navigation & Sections ────────────────────────────────────────────────────

let currentSection = 'dashboard';

function showSection(name) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  // Deactivate all nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target section
  const section = document.getElementById(`section-${name}`);
  if (section) section.classList.add('active');

  // Activate nav item
  const navItem = document.getElementById(`nav-${name}`);
  if (navItem) navItem.classList.add('active');

  // Update topbar title
  const titles = {
    dashboard: 'Dashboard',
    visitors: 'Visitor Management',
    complaints: 'Complaints',
    staff: 'Staff Management',
    payments: 'Payments',
    users: 'All Users',
  };
  document.getElementById('topbarTitle').textContent = titles[name] || name;

  currentSection = name;

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }

  // Load data for the section
  loadSectionData(name);
}

function loadSectionData(name) {
  switch (name) {
    case 'dashboard': loadDashboard(); break;
    case 'visitors':  loadVisitors();  break;
    case 'complaints': loadComplaints(); break;
    case 'staff':     loadStaff();     break;
    case 'payments':  loadPayments();  break;
    case 'users':     loadUsers();     break;
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── Modal helpers ────────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────

let notifOpen = false;

function toggleNotifications() {
  const panel = document.getElementById('notifPanel');
  notifOpen = !notifOpen;
  panel.classList.toggle('hidden', !notifOpen);
  if (notifOpen) loadNotifications();
}

async function loadNotifications() {
  const data = await apiRequest('GET', '/auth/notifications');
  if (!data || !data.success) return;

  const list = document.getElementById('notifList');
  const dot = document.getElementById('notifDot');

  const unread = data.notifications.filter(n => !n.read);
  dot.classList.toggle('hidden', unread.length === 0);

  if (data.notifications.length === 0) {
    list.innerHTML = '<div class="notif-empty">🔔 No notifications yet</div>';
    return;
  }

  list.innerHTML = data.notifications.slice(0, 15).map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div>${n.message}</div>
      <div class="notif-time">${formatTime(n.createdAt)}</div>
    </div>
  `).join('');
}

async function markAllRead() {
  await apiRequest('PUT', '/auth/notifications/read');
  document.getElementById('notifDot').classList.add('hidden');
  loadNotifications();
}

// Update notification badge count
async function refreshNotifBadge() {
  const data = await apiRequest('GET', '/auth/notifications');
  if (!data || !data.success) return;
  const unread = data.notifications.filter(n => !n.read).length;
  const dot = document.getElementById('notifDot');
  dot.classList.toggle('hidden', unread === 0);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function loadDashboard() {
  const user = getUser();

  // Set welcome message
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('welcomeMsg').textContent = `${greeting}, ${user.name}! 👋`;
  document.getElementById('welcomeSub').textContent =
    `Logged in as ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}${user.flatNumber ? ' · Flat ' + user.flatNumber : ''}`;

  // Admin stats
  if (user.role === 'admin') {
    document.getElementById('adminStats').classList.remove('hidden');
    loadAdminStats();
  }

  // Quick actions
  renderQuickActions(user.role);

  // Load recent visitors
  const data = await apiRequest('GET', '/visitors');
  if (data && data.success) {
    const recent = data.visitors.slice(0, 5);
    renderRecentVisitors(recent);
  }
}

async function loadAdminStats() {
  // Visitor stats
  const vs = await apiRequest('GET', '/visitors/stats');
  if (vs && vs.success) {
    document.getElementById('statPendingVisitors').textContent = vs.stats.pending;
  }

  // Users
  const us = await apiRequest('GET', '/auth/users');
  if (us && us.success) {
    const residents = us.users.filter(u => u.role === 'resident').length;
    document.getElementById('statResidents').textContent = residents;
  }

  // Complaints
  const cs = await apiRequest('GET', '/complaints');
  if (cs && cs.success) {
    const open = cs.complaints.filter(c => c.status !== 'resolved').length;
    document.getElementById('statComplaints').textContent = open;
  }

  // Payments
  const ps = await apiRequest('GET', '/payments');
  if (ps && ps.success) {
    const unpaid = ps.payments.filter(p => p.status === 'unpaid').length;
    document.getElementById('statUnpaid').textContent = unpaid;
  }
}

function renderQuickActions(role) {
  const container = document.getElementById('quickActions');
  const actions = {
    admin: [
      { icon: '🚶', label: 'Visitor Log',    section: 'visitors' },
      { icon: '📋', label: 'Complaints',      section: 'complaints' },
      { icon: '💰', label: 'Payments',        section: 'payments' },
      { icon: '👥', label: 'All Users',       section: 'users' },
      { icon: '👷', label: 'Staff',           section: 'staff' },
    ],
    resident: [
      { icon: '🚶', label: 'My Visitors',     section: 'visitors' },
      { icon: '📋', label: 'My Complaints',   section: 'complaints' },
      { icon: '💰', label: 'My Payments',     section: 'payments' },
      { icon: '👷', label: 'My Staff',        section: 'staff' },
    ],
    security: [
      { icon: '🚶', label: 'Add Visitor',     action: () => { showSection('visitors'); openModal('addVisitorModal'); } },
      { icon: '📊', label: 'Visitor Log',     section: 'visitors' },
    ],
  };

  const roleActions = actions[role] || [];
  container.innerHTML = roleActions.map(a => `
    <div class="quick-action-tile" onclick="${a.section ? `showSection('${a.section}')` : '(' + a.action.toString() + ')()'}">
      <span class="tile-icon">${a.icon}</span>
      ${a.label}
    </div>
  `).join('');
}

function renderRecentVisitors(visitors) {
  const tbody = document.getElementById('recentVisitorsTable');
  if (!visitors.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🚶</div><p>No recent visitors</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = visitors.map(v => `
    <tr>
      <td><strong>${v.name}</strong></td>
      <td><span class="tag">${v.flatNumber}</span></td>
      <td>${v.purpose}</td>
      <td>${badge(v.status)}</td>
      <td class="mono" style="font-size:0.78rem;">${formatTime(v.entryTime)}</td>
    </tr>
  `).join('');
}

// Live clock
function startClock() {
  function tick() {
    const now = new Date();
    document.getElementById('liveTime').textContent =
      now.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

// ─── VISITORS ─────────────────────────────────────────────────────────────────

let allVisitors = [];
let visitorFilter = 'all';

async function loadVisitors() {
  const data = await apiRequest('GET', '/visitors');
  if (!data || !data.success) return;
  allVisitors = data.visitors;
  renderVisitors(allVisitors);

  // Update pending badge on nav
  const pending = allVisitors.filter(v => v.status === 'pending').length;
  const badge_el = document.getElementById('pendingVisitorsBadge');
  if (pending > 0) {
    badge_el.textContent = pending;
    badge_el.classList.remove('hidden');
  } else {
    badge_el.classList.add('hidden');
  }
}

function filterVisitors(status, btn) {
  visitorFilter = status;
  document.querySelectorAll('#section-visitors .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = status === 'all' ? allVisitors : allVisitors.filter(v => v.status === status);
  renderVisitors(filtered);
}

function renderVisitors(visitors) {
  const user = getUser();
  const tbody = document.getElementById('visitorsTable');

  if (!visitors.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🚶</div><p>No visitors found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = visitors.map(v => {
    let actions = '';

    // Resident or admin can approve/reject pending visitors
    if ((user.role === 'resident' || user.role === 'admin') && v.status === 'pending') {
      actions += `<button class="btn btn-sm btn-success" onclick="openStatusModal('${v._id}','${v.name}','${v.flatNumber}')">Review</button> `;
    }

    // Security or admin can mark exit
    if ((user.role === 'security' || user.role === 'admin') && v.status === 'approved' && !v.exitTime) {
      actions += `<button class="btn btn-sm btn-secondary" onclick="markVisitorExit('${v._id}')">Mark Exit</button> `;
    }

    // Admin can delete
    if (user.role === 'admin') {
      actions += `<button class="btn btn-sm btn-danger" onclick="deleteVisitor('${v._id}')">Delete</button>`;
    }

    return `
      <tr>
        <td><strong>${v.name}</strong></td>
        <td class="mono">${v.phone}</td>
        <td><span class="tag">${v.flatNumber}</span></td>
        <td>${v.purpose}</td>
        <td>${badge(v.status)}</td>
        <td style="font-size:0.8rem;">${formatTime(v.entryTime)}</td>
        <td style="font-size:0.8rem;">${formatTime(v.exitTime)}</td>
        <td><div class="action-row">${actions || '<span class="text-muted">—</span>'}</div></td>
      </tr>
    `;
  }).join('');
}

async function submitAddVisitor() {
  const btn = document.getElementById('addVisitorBtn');
  const name    = document.getElementById('vName').value.trim();
  const phone   = document.getElementById('vPhone').value.trim();
  const flat    = document.getElementById('vFlat').value.trim();
  const purpose = document.getElementById('vPurpose').value.trim();

  if (!name || !phone || !flat || !purpose) {
    showMsg('visitorFormMsg', 'error', 'Please fill in all fields.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Registering...';

  const data = await apiRequest('POST', '/visitors', { name, phone, flatNumber: flat, purpose });
  if (data && data.success) {
    closeModal('addVisitorModal');
    // Clear form
    ['vName','vPhone','vFlat','vPurpose'].forEach(id => document.getElementById(id).value = '');
    loadVisitors();
  } else {
    showMsg('visitorFormMsg', 'error', data?.message || 'Failed to add visitor.');
  }
  btn.disabled = false;
  btn.textContent = 'Register';
}

function openStatusModal(id, name, flat) {
  document.getElementById('statusVisitorId').value = id;
  document.getElementById('visitorStatusMsg').textContent =
    `Visitor "${name}" is at the gate for Flat ${flat}. Do you want to allow entry?`;
  openModal('visitorStatusModal');
}

async function submitVisitorStatus(status) {
  const id = document.getElementById('statusVisitorId').value;
  const data = await apiRequest('PUT', `/visitors/${id}/status`, { status });
  if (data && data.success) {
    closeModal('visitorStatusModal');
    loadVisitors();
  }
}

async function markVisitorExit(id) {
  const data = await apiRequest('PUT', `/visitors/${id}/exit`);
  if (data && data.success) loadVisitors();
}

async function deleteVisitor(id) {
  if (!confirm('Delete this visitor record?')) return;
  const data = await apiRequest('DELETE', `/visitors/${id}`);
  if (data && data.success) loadVisitors();
}

// ─── COMPLAINTS ───────────────────────────────────────────────────────────────

let allComplaints = [];

async function loadComplaints() {
  const data = await apiRequest('GET', '/complaints');
  if (!data || !data.success) return;
  allComplaints = data.complaints;
  renderComplaints(allComplaints);
}

function filterComplaints(status, btn) {
  document.querySelectorAll('#section-complaints .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = status === 'all' ? allComplaints : allComplaints.filter(c => c.status === status);
  renderComplaints(filtered);
}

function renderComplaints(complaints) {
  const user = getUser();
  const tbody = document.getElementById('complaintsTable');

  if (!complaints.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><p>No complaints found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const priorityColor = c.priority === 'high' ? 'red' : c.priority === 'medium' ? 'accent' : 'text-muted';
    let actions = '';

    // Admin can update status
    if (user.role === 'admin') {
      actions += `<button class="btn btn-sm btn-secondary" onclick="openUpdateComplaint('${c._id}','${c.status}')">Update</button> `;
      actions += `<button class="btn btn-sm btn-danger" onclick="deleteComplaint('${c._id}')">Delete</button>`;
    }

    // All can view details
    actions += ` <button class="btn btn-sm btn-secondary" onclick="viewComplaintDetail('${c._id}')">View</button>`;

    return `
      <tr>
        <td><strong>${c.title}</strong></td>
        <td><span class="tag">${c.category}</span></td>
        <td><span class="text-${priorityColor}">${c.priority}</span></td>
        <td><span class="tag">${c.flatNumber}</span></td>
        <td>${badge(c.status)}</td>
        <td style="font-size:0.8rem;">${formatDate(c.createdAt)}</td>
        <td><div class="action-row">${actions}</div></td>
      </tr>
    `;
  }).join('');
}

async function submitAddComplaint() {
  const title    = document.getElementById('cTitle').value.trim();
  const category = document.getElementById('cCategory').value;
  const priority = document.getElementById('cPriority').value;
  const description = document.getElementById('cDesc').value.trim();

  if (!title || !description) {
    showMsg('complaintFormMsg', 'error', 'Please fill in all required fields.');
    return;
  }

  const data = await apiRequest('POST', '/complaints', { title, category, priority, description });
  if (data && data.success) {
    closeModal('addComplaintModal');
    ['cTitle','cDesc'].forEach(id => document.getElementById(id).value = '');
    loadComplaints();
  } else {
    showMsg('complaintFormMsg', 'error', data?.message || 'Failed to submit complaint.');
  }
}

function openUpdateComplaint(id, currentStatus) {
  document.getElementById('updateComplaintId').value = id;
  document.getElementById('updateComplaintStatus').value = currentStatus;
  document.getElementById('updateComplaintNote').value = '';
  openModal('updateComplaintModal');
}

async function submitUpdateComplaint() {
  const id     = document.getElementById('updateComplaintId').value;
  const status = document.getElementById('updateComplaintStatus').value;
  const adminNote = document.getElementById('updateComplaintNote').value.trim();

  const data = await apiRequest('PUT', `/complaints/${id}`, { status, adminNote });
  if (data && data.success) {
    closeModal('updateComplaintModal');
    loadComplaints();
  }
}

async function deleteComplaint(id) {
  if (!confirm('Delete this complaint?')) return;
  const data = await apiRequest('DELETE', `/complaints/${id}`);
  if (data && data.success) loadComplaints();
}

function viewComplaintDetail(id) {
  const complaint = allComplaints.find(c => c._id === id);
  if (!complaint) return;

  document.getElementById('complaintDetailContent').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <div class="stat-label">Title</div>
        <div style="font-weight:600;margin-top:4px;">${complaint.title}</div>
      </div>
      <div class="form-row">
        <div>
          <div class="stat-label">Status</div>
          <div style="margin-top:4px;">${badge(complaint.status)}</div>
        </div>
        <div>
          <div class="stat-label">Priority</div>
          <div style="margin-top:4px;">${badge(complaint.priority)}</div>
        </div>
      </div>
      <div>
        <div class="stat-label">Description</div>
        <div style="margin-top:4px;color:var(--text-muted);line-height:1.6;">${complaint.description}</div>
      </div>
      ${complaint.adminNote ? `
      <div>
        <div class="stat-label">Admin Note</div>
        <div style="margin-top:4px;color:var(--blue);">${complaint.adminNote}</div>
      </div>` : ''}
      <div class="form-row">
        <div>
          <div class="stat-label">Raised By</div>
          <div style="margin-top:4px;">${complaint.raisedBy?.name || '—'} · Flat ${complaint.flatNumber}</div>
        </div>
        <div>
          <div class="stat-label">Date</div>
          <div style="margin-top:4px;">${formatDate(complaint.createdAt)}</div>
        </div>
      </div>
    </div>
  `;
  openModal('complaintDetailModal');
}

// ─── STAFF ────────────────────────────────────────────────────────────────────

let allStaff = [];

async function loadStaff() {
  const data = await apiRequest('GET', '/staff');
  if (!data || !data.success) return;
  allStaff = data.staff;
  renderStaff(allStaff);
}

function renderStaff(staff) {
  const user = getUser();
  const tbody = document.getElementById('staffTable');
  const today = todayStr();

  if (!staff.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👷</div><p>No staff found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = staff.map(s => {
    // Find today's attendance
    const todayAtt = s.attendance.find(a => a.date === today);
    const attStatus = todayAtt ? todayAtt.status : null;

    let attCell = '';
    if (attStatus) {
      attCell = badge(attStatus);
    } else {
      // Mark attendance buttons
      if (user.role === 'resident' || user.role === 'admin') {
        attCell = `
          <button class="btn btn-sm btn-success" onclick="markAttendance('${s._id}','present')">✓ Present</button>
          <button class="btn btn-sm btn-danger" onclick="markAttendance('${s._id}','absent')">✕ Absent</button>
        `;
      } else {
        attCell = `<span class="text-muted">Not marked</span>`;
      }
    }

    let actions = '';
    if (user.role === 'admin') {
      actions = `<button class="btn btn-sm btn-danger" onclick="deleteStaff('${s._id}')">Remove</button>`;
    }

    return `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td><span class="tag">${s.type}</span></td>
        <td class="mono">${s.phone}</td>
        <td><span class="tag">${s.flatNumber}</span></td>
        <td><div class="action-row">${attCell}</div></td>
        <td><div class="action-row">${actions || '—'}</div></td>
      </tr>
    `;
  }).join('');
}

async function markAttendance(staffId, status) {
  const today = todayStr();
  const data = await apiRequest('POST', `/staff/${staffId}/attendance`, { date: today, status });
  if (data && data.success) loadStaff();
}

async function submitAddStaff() {
  const name  = document.getElementById('sName').value.trim();
  const phone = document.getElementById('sPhone').value.trim();
  const type  = document.getElementById('sType').value;
  const flat  = document.getElementById('sFlat').value.trim();

  if (!name || !phone || !flat) {
    showMsg('staffFormMsg', 'error', 'Please fill in all required fields.');
    return;
  }

  const data = await apiRequest('POST', '/staff', { name, phone, type, flatNumber: flat });
  if (data && data.success) {
    closeModal('addStaffModal');
    ['sName','sPhone','sFlat'].forEach(id => document.getElementById(id).value = '');
    loadStaff();
  } else {
    showMsg('staffFormMsg', 'error', data?.message || 'Failed to add staff.');
  }
}

async function deleteStaff(id) {
  if (!confirm('Remove this staff member?')) return;
  const data = await apiRequest('DELETE', `/staff/${id}`);
  if (data && data.success) loadStaff();
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

let allPayments = [];

async function loadPayments() {
  const data = await apiRequest('GET', '/payments');
  if (!data || !data.success) return;
  allPayments = data.payments;
  renderPayments(allPayments);
}

function filterPayments(status, btn) {
  document.querySelectorAll('#section-payments .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = status === 'all' ? allPayments : allPayments.filter(p => p.status === status);
  renderPayments(filtered);
}

function renderPayments(payments) {
  const user = getUser();
  const tbody = document.getElementById('paymentsTable');

  if (!payments.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">💰</div><p>No payment records found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = payments.map(p => {
    let actions = '';
    if (user.role === 'admin') {
      if (p.status === 'unpaid') {
        actions += `<button class="btn btn-sm btn-success" onclick="markPayment('${p._id}','pay')">Mark Paid</button> `;
      } else {
        actions += `<button class="btn btn-sm btn-secondary" onclick="markPayment('${p._id}','unpay')">Mark Unpaid</button> `;
      }
      actions += `<button class="btn btn-sm btn-danger" onclick="deletePayment('${p._id}')">Delete</button>`;
    }

    const isOverdue = p.status === 'unpaid' && new Date(p.dueDate) < new Date();

    return `
      <tr>
        <td><strong>${p.title}</strong></td>
        <td class="mono">${p.month}</td>
        <td><span class="tag">${p.flatNumber}</span></td>
        <td class="mono">₹${p.amount.toLocaleString('en-IN')}</td>
        <td style="font-size:0.8rem;${isOverdue ? 'color:var(--red);' : ''}">${formatDate(p.dueDate)}${isOverdue ? ' ⚠' : ''}</td>
        <td>${badge(p.status)}</td>
        <td><div class="action-row">${actions || '—'}</div></td>
      </tr>
    `;
  }).join('');
}

async function submitAddPayment() {
  const title   = document.getElementById('pTitle').value.trim();
  const amount  = document.getElementById('pAmount').value;
  const month   = document.getElementById('pMonth').value;
  const flat    = document.getElementById('pFlat').value.trim();
  const dueDate = document.getElementById('pDueDate').value;

  if (!title || !amount || !month || !flat || !dueDate) {
    showMsg('paymentFormMsg', 'error', 'Please fill in all fields.');
    return;
  }

  const data = await apiRequest('POST', '/payments', {
    title, amount: Number(amount), month, flatNumber: flat, dueDate,
  });

  if (data && data.success) {
    closeModal('addPaymentModal');
    loadPayments();
  } else {
    showMsg('paymentFormMsg', 'error', data?.message || 'Failed to create payment.');
  }
}

async function submitBulkPayment() {
  const title   = document.getElementById('bpTitle').value.trim();
  const amount  = document.getElementById('bpAmount').value;
  const month   = document.getElementById('bpMonth').value;
  const dueDate = document.getElementById('bpDueDate').value;

  if (!title || !amount || !month || !dueDate) {
    showMsg('bulkPaymentFormMsg', 'error', 'Please fill in all fields.');
    return;
  }

  const data = await apiRequest('POST', '/payments/bulk', {
    title, amount: Number(amount), month, dueDate,
  });

  if (data && data.success) {
    closeModal('bulkPaymentModal');
    showMsg('paymentFormMsg', 'success', data.message || 'Bulk payments created!');
    loadPayments();
  } else {
    showMsg('bulkPaymentFormMsg', 'error', data?.message || 'Failed to create bulk payments.');
  }
}

async function markPayment(id, action) {
  const data = await apiRequest('PUT', `/payments/${id}/${action}`);
  if (data && data.success) loadPayments();
}

async function deletePayment(id) {
  if (!confirm('Delete this payment record?')) return;
  const data = await apiRequest('DELETE', `/payments/${id}`);
  if (data && data.success) loadPayments();
}

// ─── USERS (Admin) ────────────────────────────────────────────────────────────

async function loadUsers() {
  const data = await apiRequest('GET', '/auth/users');
  if (!data || !data.success) return;

  const tbody = document.getElementById('usersTable');
  if (!data.users.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><p>No users found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.users.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="user-avatar" style="width:30px;height:30px;font-size:0.75rem;">${u.name.charAt(0).toUpperCase()}</div>
          <strong>${u.name}</strong>
        </div>
      </td>
      <td class="mono" style="font-size:0.82rem;">${u.email}</td>
      <td>${badge(u.role)}</td>
      <td><span class="tag">${u.flatNumber || '—'}</span></td>
      <td class="mono">${u.phone || '—'}</td>
      <td style="font-size:0.8rem;">${formatDate(u.createdAt)}</td>
    </tr>
  `).join('');
}

// ─── Init: Setup UI Based on Role ────────────────────────────────────────────

function initApp() {
  if (!requireAuth()) return;

  const user = getUser();

  // Setup sidebar user info
  document.getElementById('sidebarAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarRole').textContent = user.role;
  document.getElementById('topbarRole').textContent = user.role;

  // Role-based nav visibility
  if (user.role === 'security') {
    // Security can only see dashboard and visitors
    document.getElementById('residentNav').classList.add('hidden');
  }

  if (user.role === 'admin') {
    document.getElementById('adminNav').classList.remove('hidden');
  }

  // Show/hide add visitor button based on role
  if (user.role === 'resident') {
    document.getElementById('addVisitorBtnWrap').classList.add('hidden');
  }

  // Show/hide add complaint (security cannot add)
  if (user.role === 'security') {
    document.getElementById('addComplaintBtn').classList.add('hidden');
  }

  // Show/hide add staff (security cannot add)
  if (user.role === 'security') {
    document.getElementById('addStaffBtn')?.classList.add('hidden');
  }

  // Show payment admin buttons
  if (user.role === 'admin') {
    document.getElementById('paymentAdminBtns').classList.remove('hidden');
  }

  // Pre-fill flat number for residents
  if (user.role === 'resident' && user.flatNumber) {
    const vFlat = document.getElementById('vFlat');
    if (vFlat) vFlat.value = user.flatNumber;
    const sFlat = document.getElementById('sFlat');
    if (sFlat) sFlat.value = user.flatNumber;
  }

  // Start live clock and load initial data
  startClock();
  loadDashboard();

  // Poll for notifications every 60 seconds
  refreshNotifBadge();
  setInterval(refreshNotifBadge, 60000);
}

// ─── Boot ──────────────────────────────────────────────────────────────────────

initApp();
