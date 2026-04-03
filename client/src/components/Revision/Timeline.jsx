import { useRevisionHistory } from '../../hooks/useRevisionHistory';

// userColor is not stored in the op log — we fall back to text-muted styling
// and show the name. To add color, add a user_color column to op_log later.

export default function Timeline({ docId }) {
  const { ops, frame, text, loading, error, scrubToFrame } = useRevisionHistory(docId);

  if (loading) return <div className="timeline-state">Loading history…</div>;
  if (error)   return <div className="timeline-state timeline-state--error">Error: {error}</div>;
  if (!ops.length) return <div className="timeline-state">No revision history yet.</div>;

  const current = ops[frame - 1];

  return (
    <div className="timeline">
      <div className="timeline-header">
        <span className="timeline-title">Revision History</span>
        <span className="timeline-meta">
          {frame} / {ops.length}
          {current && (
            <>
              {' · '}
              <span>{current.userName ?? 'unknown'}</span>
              {' · '}
              {new Date(current.createdAt).toLocaleTimeString()}
            </>
          )}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={ops.length}
        value={frame}
        onChange={e => scrubToFrame(Number(e.target.value))}
        className="timeline-scrubber"
        aria-label="Scrub revision history"
      />

      <pre className="timeline-preview">
        {text || <em>Document was empty at this point</em>}
      </pre>
    </div>
  );
}