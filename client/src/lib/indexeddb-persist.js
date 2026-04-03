import { IndexeddbPersistence } from 'y-indexeddb';

// Returns the IDB instance and a Promise that resolves once
// all offline content has been loaded into the Y.Doc.
//
// CRITICAL: the WebSocket must not connect until this Promise resolves.
// If WS connects first, the server state can overwrite offline edits
// before the CRDT has a chance to merge them.

export function createIndexedDbPersistence(docId, ydoc) {
  const idb = new IndexeddbPersistence(docId, ydoc);

  const ready = new Promise((resolve, reject) => {
    idb.on('synced',    resolve);
    // Guard against the case where the component unmounts
    // before IDB finishes loading
    idb.on('destroyed', () => reject(new Error('IDB destroyed before sync')));
  });

  return { idb, ready };
}