import { diffChars } from 'diff';

export default function ConflictDiff({ conflict, onDismiss }) {
  const { local, merged } = conflict;
  const parts = diffChars(local, merged);

  return (
    <div className="conflict-overlay" role="alert">
      <div className="conflict-banner">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M9 1.5L1.5 15h15L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 6.75v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9" cy="12.75" r="0.75" fill="currentColor"/>
        </svg>
        <div className="conflict-text">
          <strong>Conflict Auto-Resolved</strong>
          <span>Your offline edits were merged with remote changes via CRDT</span>
        </div>
        
        {onDismiss && (
          <button 
            className="btn-icon conflict-dismiss" 
            onClick={onDismiss}
            aria-label="Dismiss"
            title="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <div className="conflict-panels">
        <div className="conflict-panel">
          <div className="panel-label">Your offline version</div>
          <pre className="panel-text">{local || <em className="text-muted">(empty)</em>}</pre>
        </div>
        <div className="conflict-panel">
          <div className="panel-label">Merged result</div>
          <pre className="panel-text">
            {parts.map((p, i) => (
              <span
                key={i}
                className={
                  p.added   ? 'diff-added'
                : p.removed ? 'diff-removed'
                : undefined
                }
              >
                {p.value}
              </span>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}