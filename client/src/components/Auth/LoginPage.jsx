import { useState, useEffect } from 'react';

const STORAGE_KEY = 'convergix_user';

// Curated palette — same as server's USER_COLORS
const COLORS = [
  '#f87171', '#fb923c', '#a78bfa',
  '#34d399', '#60a5fa', '#f472b6',
];

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.name?.trim()) return parsed;
  } catch { /* corrupt data */ }
  return null;
}

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function LoginPage({ onLogin }) {
  const [isLoginState, setIsLoginState] = useState(true);
  
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [color, setColor]     = useState(COLORS[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Auto-login if we already have stored identity and token
  useEffect(() => {
    const token = sessionStorage.getItem('collab_token');
    const stored = getStored();
    if (stored && token) {
      // Fast path: if token exists, we just trust it for now.
      // If it's expired, the backend WS will reject it and trigger onAuthError.
      onLogin({ ...stored, token });
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (!isLoginState && !name.trim()) return;

    setLoading(true);
    setError(null);

    const API = import.meta.env.VITE_API_URL || '/api';
    const endpoint = isLoginState ? '/auth/login' : '/auth/register';
    
    const body = isLoginState 
      ? { email, password }
      : { name: name.trim(), email, password, color };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error ${res.status}`);
      }

      const { token, user } = await res.json();
      sessionStorage.setItem('collab_token', token);
      const identity = { id: user.sub, name: user.name, color: user.color };
      persist(identity);

      onLogin({ ...identity, token });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#lg)" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="url(#lg)" strokeWidth="2" fill="none" opacity="0.5"/>
            <path d="M2 12l10 5 10-5" stroke="url(#lg)" strokeWidth="2" fill="none" opacity="0.7"/>
            <defs>
              <linearGradient id="lg" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
          <h1 className="login-title">Convergix</h1>
          <p className="login-subtitle">Real-time collaborative editing</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLoginState && (
            <div className="form-field">
              <label htmlFor="username" className="form-label">Full Name</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={50}
                required={!isLoginState}
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isLoginState && (
            <div className="form-field">
              <label className="form-label">Cursor Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${color === c ? ' color-swatch--active' : ''}`}
                    style={{ '--swatch-color': c }}
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="form-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary login-submit"
            disabled={(!email.trim() || !password) || (!isLoginState && !name.trim()) || loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner loading-spinner--sm loading-spinner--white" />
                {isLoginState ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLoginState ? 'Sign in' : 'Create Account'
            )}
          </button>
        </form>

        <p className="login-footer">
          {isLoginState ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            className="text-link"
            onClick={() => {
              setIsLoginState(!isLoginState);
              setError(null);
            }}
            style={{ color: 'var(--accent)', fontWeight: 600 }}
          >
            {isLoginState ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
