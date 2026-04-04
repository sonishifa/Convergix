import { useState, useEffect, useCallback } from 'react';
import CollabEditor                          from './components/Editor/CollabEditor';
import LoginPage                             from './components/Auth/LoginPage';
import Dashboard                             from './components/Dashboard/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);

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

  // Doc ID from URL state
  const [docId, setDocId] = useState(
    () => new URLSearchParams(window.location.search).get('doc')
  );

  // Sync URL when docId changes
  useEffect(() => {
    const url = new URL(window.location);
    if (docId) {
      url.searchParams.set('doc', docId);
    } else {
      url.searchParams.delete('doc');
    }
    window.history.pushState({}, '', url);
  }, [docId]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('collab_token');
    setUser(null);
  }, []);

  // Show login page if no user
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div 
            className="app-logo" 
            style={{ cursor: 'pointer' }}
            onClick={() => setDocId(null)}
            title="Go to Dashboard"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#g1)" opacity="0.9"/>
              <path d="M2 17l10 5 10-5" stroke="url(#g1)" strokeWidth="2" fill="none" opacity="0.5"/>
              <path d="M2 12l10 5 10-5" stroke="url(#g1)" strokeWidth="2" fill="none" opacity="0.7"/>
              <defs>
                <linearGradient id="g1" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
            <h1 className="app-title">Convergix</h1>
          </div>
          {docId && (
            <div className="doc-badge">
              <span className="doc-badge__icon">📄</span>
              <span>{docId.split('-')[0]}</span>
            </div>
          )}
        </div>
        <div className="header-controls">
          <div className="user-identity">
            <span
              className="user-identity__dot"
              style={{ background: user.color }}
            />
            <span className="user-identity__name">{user.name}</span>
          </div>
          <button
            className="btn-ghost"
            onClick={handleLogout}
            title="Sign out"
          >
            Sign out
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
        {docId ? (
          <CollabEditor docId={docId} user={user} />
        ) : (
          <Dashboard user={user} onSelectDoc={setDocId} />
        )}
      </main>
    </div>
  );
}