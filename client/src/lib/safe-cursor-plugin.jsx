/**
 * safe-cursor-plugin.js
 *
 * A patched version of y-prosemirror's yCursorPlugin that guards against
 * the ySyncPlugin state being undefined during EditorState.reconfigure().
 *
 * Root cause: when Tiptap builds the editor, all plugins run their `init`
 * in sequence. The cursor plugin's init calls `createDecorations`, which
 * reads `ySyncPluginKey.getState(state)`. If the sync plugin hasn't been
 * initialised yet at that point (plugin ordering race during reconfigure),
 * the result is `undefined` and `ystate.doc` throws:
 *   "Cannot read properties of undefined (reading 'doc')"
 *
 * Fix: return an empty DecorationSet when ystate is not yet available.
 */

import { DecorationSet } from 'prosemirror-view';
import { Plugin } from 'prosemirror-state';
import * as Y from 'yjs';
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  setMeta,
  ySyncPluginKey,
  yCursorPluginKey,
} from 'y-prosemirror';
import * as math from 'lib0/math';
import { Decoration } from 'prosemirror-view';

// ── Defaults (same as y-prosemirror) ────────────────────────────────
const rxValidColor = /^#[0-9a-fA-F]{6}$/;

const defaultAwarenessStateFilter = (currentClientId, userClientId) =>
  currentClientId !== userClientId;

const defaultCursorBuilder = (user) => {
  const cursor = document.createElement('span');
  cursor.classList.add('ProseMirror-yjs-cursor');
  cursor.setAttribute('style', `border-color: ${user.color}`);
  const userDiv = document.createElement('div');
  userDiv.setAttribute('style', `background-color: ${user.color}`);
  userDiv.insertBefore(document.createTextNode(user.name), null);
  cursor.insertBefore(document.createTextNode('\u2060'), null);
  cursor.insertBefore(userDiv, null);
  cursor.insertBefore(document.createTextNode('\u2060'), null);
  return cursor;
};

const defaultSelectionBuilder = (user) => ({
  style: `background-color: ${user.color}70`,
  class: 'ProseMirror-yjs-selection',
});

// ── Patched createDecorations ───────────────────────────────────────
const safeCreateDecorations = (
  state,
  awareness,
  awarenessFilter,
  createCursor,
  createSelection
) => {
  const ystate = ySyncPluginKey.getState(state);

  // bail when the sync plugin hasn't initialised its state yet
  if (!ystate || !ystate.doc || !ystate.type || !ystate.binding) {
    return DecorationSet.create(state.doc, []);
  }

  const y = ystate.doc;
  const decorations = [];

  if (
    ystate.snapshot != null ||
    ystate.prevSnapshot != null ||
    ystate.binding.mapping.size === 0
  ) {
    return DecorationSet.create(state.doc, []);
  }

  awareness.getStates().forEach((aw, clientId) => {
    if (!awarenessFilter(y.clientID, clientId, aw)) return;

    if (aw.cursor != null) {
      const user = aw.user || {};
      if (user.color == null) {
        user.color = '#ffa500';
      } else if (!rxValidColor.test(user.color)) {
        console.warn('A user uses an unsupported color format', user);
      }
      if (user.name == null) {
        user.name = `User: ${clientId}`;
      }

      let anchor = relativePositionToAbsolutePosition(
        y,
        ystate.type,
        Y.createRelativePositionFromJSON(aw.cursor.anchor),
        ystate.binding.mapping
      );
      let head = relativePositionToAbsolutePosition(
        y,
        ystate.type,
        Y.createRelativePositionFromJSON(aw.cursor.head),
        ystate.binding.mapping
      );

      if (anchor !== null && head !== null) {
        const maxsize = math.max(state.doc.content.size - 1, 0);
        anchor = math.min(anchor, maxsize);
        head = math.min(head, maxsize);
        decorations.push(
          Decoration.widget(head, () => createCursor(user, clientId), {
            key: clientId + '',
            side: 10,
          })
        );
        const from = math.min(anchor, head);
        const to = math.max(anchor, head);
        decorations.push(
          Decoration.inline(from, to, createSelection(user, clientId), {
            inclusiveEnd: true,
            inclusiveStart: false,
          })
        );
      }
    }
  });

  return DecorationSet.create(state.doc, decorations);
};

// ── Patched yCursorPlugin ───────────────────────────────────────────
export const safeCursorPlugin = (
  awareness,
  {
    awarenessStateFilter = defaultAwarenessStateFilter,
    cursorBuilder = defaultCursorBuilder,
    selectionBuilder = defaultSelectionBuilder,
    getSelection = (state) => state.selection,
  } = {},
  cursorStateField = 'cursor'
) =>
  new Plugin({
    key: yCursorPluginKey,
    state: {
      init(_, state) {
        return safeCreateDecorations(
          state,
          awareness,
          awarenessStateFilter,
          cursorBuilder,
          selectionBuilder
        );
      },
      apply(tr, prevState, _oldState, newState) {
        const ystate = ySyncPluginKey.getState(newState);
        const yCursorState = tr.getMeta(yCursorPluginKey);
        if (
          (ystate && ystate.isChangeOrigin) ||
          (yCursorState && yCursorState.awarenessUpdated)
        ) {
          return safeCreateDecorations(
            newState,
            awareness,
            awarenessStateFilter,
            cursorBuilder,
            selectionBuilder
          );
        }
        try {
          return prevState.map(tr.mapping, tr.doc);
        } catch {
          // If mapping fails (e.g. stale state), rebuild from scratch
          return safeCreateDecorations(
            newState,
            awareness,
            awarenessStateFilter,
            cursorBuilder,
            selectionBuilder
          );
        }
      },
    },
    props: {
      decorations: (state) => yCursorPluginKey.getState(state),
    },
    view: (view) => {
      const awarenessListener = () => {
        if (view.docView) {
          setMeta(view, yCursorPluginKey, { awarenessUpdated: true });
        }
      };
      const updateCursorInfo = () => {
        const ystate = ySyncPluginKey.getState(view.state);
        // ✅ Guard: don't try to update cursor info if sync plugin isn't ready
        if (!ystate || !ystate.type || !ystate.binding) return;

        const current = awareness.getLocalState() || {};
        if (view.hasFocus()) {
          const selection = getSelection(view.state);
          const anchor = absolutePositionToRelativePosition(
            selection.anchor,
            ystate.type,
            ystate.binding.mapping
          );
          const head = absolutePositionToRelativePosition(
            selection.head,
            ystate.type,
            ystate.binding.mapping
          );
          if (
            current.cursor == null ||
            !Y.compareRelativePositions(
              Y.createRelativePositionFromJSON(current.cursor.anchor),
              anchor
            ) ||
            !Y.compareRelativePositions(
              Y.createRelativePositionFromJSON(current.cursor.head),
              head
            )
          ) {
            awareness.setLocalStateField(cursorStateField, { anchor, head });
          }
        } else if (
          current.cursor != null &&
          relativePositionToAbsolutePosition(
            ystate.doc,
            ystate.type,
            Y.createRelativePositionFromJSON(current.cursor.anchor),
            ystate.binding.mapping
          ) !== null
        ) {
          awareness.setLocalStateField(cursorStateField, null);
        }
      };
      awareness.on('change', awarenessListener);
      view.dom.addEventListener('focusin', updateCursorInfo);
      view.dom.addEventListener('focusout', updateCursorInfo);
      return {
        update: updateCursorInfo,
        destroy: () => {
          view.dom.removeEventListener('focusin', updateCursorInfo);
          view.dom.removeEventListener('focusout', updateCursorInfo);
          awareness.off('change', awarenessListener);
          awareness.setLocalStateField(cursorStateField, null);
        },
      };
    },
  });
