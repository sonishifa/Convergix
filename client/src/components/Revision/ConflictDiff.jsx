import { diffChars } from 'diff';

export default function ConflictDiff({ conflict }) {
  const { local, merged } = conflict;
  const parts = diffChars(local, merged);

  return (
    <div className="conflict-overlay">
      <div className="conflict-banner">
        ⚡ CRDT auto-resolved a conflict from your offline edits
      </div>
      <div className="conflict-panels">
        <div className="conflict-panel">
          <div className="panel-label">Your offline version</div>
          <pre className="panel-text">{local || <em>(empty)</em>}</pre>
        </div>
        <div className="conflict-panel">
          <div className="panel-label">Merged result</div>
          <pre className="panel-text">
            {parts.map((p, i) => (
              <span
                key={i}
                style={{
                  background:     p.added   ? '#bbf7d0'
                                : p.removed ? '#fecaca'
                                : 'transparent',
                  textDecoration: p.removed ? 'line-through' : 'none',
                  opacity:        p.removed ? 0.6 : 1,
                }}
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