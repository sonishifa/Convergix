import { useState, useEffect, useCallback } from 'react';
import CollabEditor                          from './components/Editor/CollabEditor';
import Timeline                              from './components/Revision/Timeline';
import { randomColor }                       from './constants/colors';

const API = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [user,        setUser]        = useState(null);
  const [authError,   setAuthError]   = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Theme: persist preference in localStorage
  const [theme, setTheme] = useState(
    () => localStorage.getItem('convergix_theme') || 'dark'
  );

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('convergix_theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Doc ID from URL: share ?doc=my-project with teammates
  const [docId] = useState(
    () => new URLSearchParams(window.location.search).get('doc') || 'default'
  );

  useEffect(() => {
    const name  = `User${Math.floor(Math.random() * 9000 + 1000)}`;
    const color = randomColor();

    fetch(`${API}/auth/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, color }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`Auth failed: ${r.status}`);
        return r.json();
      })
      .then(({ token, user }) => {
        sessionStorage.setItem('collab_token', token); // used by useRevisionHistory
        setUser({ ...user, token });
      })
      .catch(err => setAuthError(err.message));
  }, []);

  if (authError) {
    return <div className="fullscreen-state error">Could not connect: {authError}</div>;
  }
  if (!user) {
    return <div className="fullscreen-state">Authenticating…</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Convergix</h1>
        <div className="header-controls">
          <code className="doc-badge">doc: {docId}</code>
          <button
            className="btn-secondary"
            onClick={() => setShowHistory(v => !v)}
          >
            {showHistory ? 'Hide History' : 'Revision History'}
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <CollabEditor docId={docId} user={user} />
        {showHistory && <Timeline docId={docId} />}
      </main>
    </div>
  );
}