import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Home, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { isLoggedIn, saveSession } from '../lib/auth';

const DEMO_ACCOUNTS = [
  { label: 'Admin Login', email: 'admin@aptos.com', password: 'admin123' },
  { label: 'Resident Login', email: 'resident@aptos.com', password: 'resident123' },
  { label: 'Security Login', email: 'security@aptos.com', password: 'security123' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data?.success) {
        saveSession(data.token, data.user);
        const destination = location.state?.from?.pathname || '/dashboard';
        navigate(destination, { replace: true });
        return;
      }

      setError(data?.message || 'Unable to sign in. Check your details and try again.');
    } catch {
      setError('Cannot connect to the backend right now.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
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
              <h1>Modern community operations in one place.</h1>
              <p>
                Track visitors, complaints, staff, and payments with a clean dashboard built for residents,
                security, and administrators.
              </p>
            </div>

            <div className="auth-pill-row">
              <span className="auth-pill"><Home size={14} style={{ verticalAlign: 'text-bottom' }} /> Resident flow</span>
              <span className="auth-pill"><ShieldCheck size={14} style={{ verticalAlign: 'text-bottom' }} /> Security approvals</span>
              <span className="auth-pill"><Users size={14} style={{ verticalAlign: 'text-bottom' }} /> Society records</span>
            </div>
          </div>

          <div className="auth-footnote">
            <Sparkles size={15} style={{ marginRight: '0.45rem', verticalAlign: 'text-bottom' }} />
            Built for a cleaner, more product-like experience than the old static HTML screens.
          </div>
        </section>

        <section className="auth-card">
          <div className="logo-row">
            <div className="brand-mark">🏠</div>
            <div>
              <div className="brand-name" style={{ color: 'var(--text)' }}>Aptos</div>
              <div className="brand-subtitle" style={{ color: 'var(--text-muted)' }}>Welcome back</div>
            </div>
          </div>

          <h2>Sign in to your portal</h2>
          <p className="subtitle">Use your society account to continue.</p>

          {error ? <div className="notice notice-danger" style={{ marginTop: '1rem' }}>{error}</div> : null}

          <form className="auth-form" onSubmit={submit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-help">
            Don’t have an account? <Link to="/register">Register here</Link>
          </div>

          <div className="demo-grid">
            <div className="demo-title">Demo credentials</div>
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.email} type="button" className="secondary-button small-button" onClick={() => fillDemo(account)}>
                {account.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
