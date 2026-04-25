import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { isLoggedIn, saveSession } from '../lib/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'resident',
    flatNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Fill the required fields first.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.role === 'resident' && !form.flatNumber) {
      setError('Residents need a flat number.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          flatNumber: form.role === 'resident' ? form.flatNumber : '',
          password: form.password,
        }),
      });

      if (data?.success) {
        saveSession(data.token, data.user);
        navigate('/dashboard', { replace: true });
        return;
      }

      setError(data?.message || 'Could not create the account.');
    } catch {
      setError('Cannot connect to the backend right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <div>
            <div className="auth-brand">
              <div className="auth-brand-mark">🏠</div>
              <div>
                <div className="auth-brand-name">Aptos</div>
                <div className="auth-brand-subtitle">Society Management</div>
              </div>
            </div>

            <div className="auth-hero-copy" style={{ marginTop: '2.2rem' }}>
              <h1>Create a cleaner community workflow.</h1>
              <p>
                Build a resident, security, or admin account and keep society operations flowing from a single portal.
              </p>
            </div>
          </div>

          <div className="auth-footnote">
            Pick the right role so the dashboard shows the correct menus and permissions.
          </div>
        </section>

        <section className="auth-card">
          <div className="logo-row">
            <div className="brand-mark">✨</div>
            <div>
              <div className="brand-name" style={{ color: 'var(--text)' }}>Create Account</div>
              <div className="brand-subtitle" style={{ color: 'var(--text-muted)' }}>Join the portal</div>
            </div>
          </div>

          <h2>Get started</h2>
          <p className="subtitle">Create your Aptos account in a few steps.</p>

          {error ? <div className="notice notice-danger" style={{ marginTop: '1rem' }}>{error}</div> : null}

          <form className="auth-form" onSubmit={submit}>
            <div className="form-group">
              <label>Full name</label>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="John Doe" />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+91 9999999999" />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
                  <option value="resident">Resident</option>
                  <option value="security">Security</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Flat number</label>
                <input
                  value={form.flatNumber}
                  onChange={(event) => updateField('flatNumber', event.target.value)}
                  placeholder="A-101"
                  disabled={form.role !== 'resident'}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm password</label>
                <input type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} placeholder="Repeat password" />
              </div>
            </div>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-help">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
