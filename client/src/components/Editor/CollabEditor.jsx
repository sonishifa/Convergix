import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit                   from '@tiptap/starter-kit';
import Underline                    from '@tiptap/extension-underline';
import Collaboration                from '@tiptap/extension-collaboration';
import { Extension }                from '@tiptap/core';
import { useState, useMemo, useCallback } from 'react';
import { useCollaboration }         from '../../hooks/useCollaboration';
import { useAwareness }             from '../../hooks/useAwareness';
import { buildCursorRender, buildSelectionRender } from './CursorOverlay';
import { safeCursorPlugin }         from '../../lib/safe-cursor-plugin';
import Toolbar                      from './Toolbar';
import UserList                     from '../Presence/UserList';
import ConflictDiff                 from '../Revision/ConflictDiff';
import Timeline                     from '../Revision/Timeline';

export default function CollabEditor({ docId, user }) {
  const { ydoc, provider, ready, conflict, dismissConflict, wsStatus } = useCollaboration(docId, user);
  const peers = useAwareness(provider, user);
  const [showHistory, setShowHistory] = useState(false);

  const canMount = ready && ydoc && provider?.awareness;

  const statusConfig = {
    connected:    { label: 'Connected',    dot: 'status-dot--live' },
    connecting:   { label: 'Connecting…',  dot: 'status-dot--connecting' },
    disconnected: { label: 'Offline',      dot: 'status-dot--offline' },
  };
  const status = statusConfig[wsStatus] || statusConfig.connecting;

  return (
    <div className="editor-root">
      {conflict && (
        <ConflictDiff conflict={conflict} onDismiss={dismissConflict} />
      )}

      {wsStatus === 'disconnected' && (
        <div className="status-banner status-banner--offline">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 8a.75.75 0 01-1.5 0V4.5a.75.75 0 011.5 0V8z" fill="currentColor"/>
          </svg>
          <span>You're offline — edits are saved locally and will sync on reconnect</span>
        </div>
      )}

      {canMount ? (
        <div className="editor-layout">
          <div className="editor-panel">
            <TipTapEditor
              key={`${docId}-${provider.awareness.clientID}`}
              ydoc={ydoc}
              provider={provider}
              user={user}
              peers={peers}
              status={status}
              showHistory={showHistory}
              onToggleHistory={() => setShowHistory(v => !v)}
            />
          </div>
          {showHistory && (
            <aside className="history-panel">
              <Timeline docId={docId} />
            </aside>
          )}
        </div>
      ) : (
        <div className="editor-loading">
          <div className="loading-spinner" />
          <span>Syncing document…</span>
        </div>
      )}
    </div>
  );
}

function TipTapEditor({ ydoc, provider, user, peers, status, showHistory, onToggleHistory }) {
  if (!ydoc || !provider || !provider.awareness) {
    return <div className="editor-error">Failed to initialize editor</div>;
  }

  // Memoize cursor + selection builders
  const cursorBuilder = useMemo(() => buildCursorRender(), []);
  const selectionBuilder = useMemo(() => buildSelectionRender(), []);

  const SafeCursorExtension = useMemo(() => {
    return Extension.create({
      name: 'safeCollaborationCursor',
      addProseMirrorPlugins() {
        provider.awareness.setLocalStateField('user', {
          id: user.id,
          name: user.name,
          color: user.color,
        });
        return [
          safeCursorPlugin(provider.awareness, {
            cursorBuilder,
            selectionBuilder,
          }),
        ];
      },
    });
  }, [provider.awareness, user.name, user.color, cursorBuilder, selectionBuilder]);

  const extensions = useMemo(() => [
    StarterKit.configure({ history: false }),
    Underline,
    Collaboration.configure({ document: ydoc }),
    SafeCursorExtension,
  ], [ydoc, SafeCursorExtension]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    editorProps: {
      attributes: {
        class: 'tiptap',
        'data-placeholder': 'Start typing to collaborate…',
      },
    },
  });

  if (!editor) return null;

  return (
    <>
      <div className="editor-chrome">
        <div className="chrome-left">
          <Toolbar editor={editor} />
          <div className="chrome-divider" />
          <div className="connection-status">
            <span className={`status-dot ${status.dot}`} />
            <span className="status-label">{status.label}</span>
          </div>
        </div>
        <div className="chrome-right">
          <UserList me={user} peers={peers} />
          <button
            className={`btn-icon${showHistory ? ' btn-icon--active' : ''}`}
            onClick={onToggleHistory}
            title={showHistory ? 'Hide revision history' : 'Show revision history'}
            aria-label="Toggle revision history"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 1.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM1.5 9a7.5 7.5 0 0115 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 5v4l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </>
  );
}