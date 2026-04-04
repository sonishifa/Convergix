import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function Dashboard({ user, onSelectDoc }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [user.token]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/documents`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocuments(data);
      setError(null);
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server (is backend running?). Ensure docker compose up is running.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      setCreating(true);
      const res = await fetch(`${API}/documents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ title: 'Untitled Document' })
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newDoc = await res.json();
      onSelectDoc(newDoc.id); // Open the new document immediately
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h2>Your Documents</h2>
            <p className="text-muted">Create or join collaborative workspaces</p>
          </div>
          <button 
            className="btn-primary dashboard-create-btn"
            onClick={handleCreateDocument}
            disabled={creating}
          >
            {creating ? (
              <>
                <div className="loading-spinner loading-spinner--sm loading-spinner--white" />
                Creating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '6px' }}>
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                New Document
              </>
            )}
          </button>
        </header>

        {error && (
          <div className="status-banner status-banner--offline" style={{ marginBottom: '24px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 8a.75.75 0 01-1.5 0V4.5a.75.75 0 011.5 0V8z" fill="currentColor"/>
            </svg>
            <span>{error}</span>
            <button className="btn-ghost" onClick={fetchDocuments} style={{ marginLeft: 'auto', padding: '4px 8px' }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <p className="text-muted" style={{ marginTop: '16px' }}>Loading documents...</p>
          </div>
        ) : (
          <div className="document-grid">
            {documents.length === 0 && !error ? (
              <div className="document-empty-state">
                <div className="document-empty-icon">📄</div>
                <h3>No documents yet</h3>
                <p className="text-muted">Create a new document to get started collaborating.</p>
              </div>
            ) : (
              documents.map(doc => (
                <div 
                  key={doc.id} 
                  className="document-card"
                  onClick={() => onSelectDoc(doc.id)}
                >
                  <div className="document-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="document-card-info">
                    <h3 className="document-card-title">{doc.title}</h3>
                    <div className="document-card-meta">
                      <p>Last edited: {new Date(doc.updated_at).toLocaleDateString()}</p>
                      <p className="document-card-id font-mono">ID: {doc.id.split('-')[0]}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
