import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit                   from '@tiptap/starter-kit';
import Collaboration                from '@tiptap/extension-collaboration';
import CollaborationCursor          from '@tiptap/extension-collaboration-cursor';
import { useCollaboration }         from '../../hooks/useCollaboration';
import { useAwareness }             from '../../hooks/useAwareness';
import { buildCursorRender }        from './CursorOverlay';
import Toolbar                      from './Toolbar';
import UserList                     from '../Presence/UserList';
import ConflictDiff                 from '../Revision/ConflictDiff';

export default function CollabEditor({ docId, user }) {
  const { ydoc, provider, ready, conflict, wsStatus } = useCollaboration(docId, user);
  const peers = useAwareness(provider, user);

  // ✅ Stricter guard: provider.awareness must exist and be initialized
  const canMount = ready && ydoc && provider?.awareness;

  return (
    <div className="editor-root">
      {conflict && <ConflictDiff conflict={conflict} />}

      {wsStatus === 'disconnected' && (
        <div className="status-bar status-bar--offline">
          ⚠ Offline — edits are saved locally and will sync on reconnect
        </div>
      )}

      {canMount
        ? (
          <TipTapEditor
            key={`${docId}-${provider.awareness.clientID}`}  // ✅ forces remount on reconnect
            ydoc={ydoc}
            provider={provider}
            user={user}
            peers={peers}
          />
        )
        : <div className="editor-loading">Connecting…</div>
      }
    </div>
  );
}

// TipTapEditor stays exactly the same as you had it
function TipTapEditor({ ydoc, provider, user, peers }) {
  // Defensive checks before extension configuration
  if (!ydoc || !provider || !provider.awareness) {
    console.error('TipTapEditor: Missing required Yjs or provider setup');
    return <div className="editor-error">Failed to initialize editor</div>;
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider: {awareness: provider.awareness},
        user:   { name: user.name, color: user.color },
        render: buildCursorRender(),
      }),
    ],
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
      <div className="editor-header">
        <Toolbar editor={editor} />
        <UserList me={user} peers={peers} />
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </>
  );
}