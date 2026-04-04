import { useRevisionHistory } from '../../hooks/useRevisionHistory';

export default function Timeline({ docId }) {
  const { ops, frame, text, loading, error, scrubToFrame, retry } = useRevisionHistory(docId);

  if (loading) {
    return (
      <div className="timeline">
        <div className="timeline-header">
          <span className="timeline-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM1 8a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Revision History
          </span>
        </div>
        <div className="timeline-state">
          <div className="loading-spinner loading-spinner--sm" />
          <span>Loading history…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeline">
        <div className="timeline-header">
          <span className="timeline-title">Revision History</span>
        </div>
        <div className="timeline-state timeline-state--error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginBottom: '8px' }}>
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ marginBottom: '12px', lineHeight: '1.4' }}>{error}</span>
          
          {error.includes('backend running') && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Run <code>docker compose up</code> in your terminal
            </div>
          )}
          
          <button className="btn-primary" onClick={retry} style={{ padding: '4px 12px', fontSize: '12px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ops.length) {
    return (
      <div className="timeline">
        <div className="timeline-header">
          <span className="timeline-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM1 8a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Revision History
          </span>
        </div>
        <div className="timeline-state">
          <span className="text-muted">No revisions yet — start typing!</span>
        </div>
      </div>
    );
  }

  const current = ops[frame - 1];

  return (
    <div className="timeline">
      <div className="timeline-header">
        <span className="timeline-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM1 8a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Revision History
        </span>
        <span className="timeline-meta">
          <span className="timeline-frame">{frame}</span>
          <span className="text-muted"> / {ops.length}</span>
          {current && (
            <>
              <span className="timeline-sep">·</span>
              <span className="timeline-user">{current.userName ?? 'unknown'}</span>
              <span className="timeline-sep">·</span>
              <span className="text-muted">{new Date(current.createdAt).toLocaleTimeString()}</span>
            </>
          )}
        </span>
      </div>

      <div className="scrubber-track">
        <input
          type="range"
          min={0}
          max={ops.length}
          value={frame}
          onChange={e => scrubToFrame(Number(e.target.value))}
          className="timeline-scrubber"
          aria-label="Scrub revision history"
        />
      </div>

      <div className="timeline-preview-wrap">
        <div className="timeline-preview-label">Document at revision {frame}</div>
        <pre className="timeline-preview">
          {text || <em>Document was empty at this point</em>}
        </pre>
      </div>
    </div>
  );
}