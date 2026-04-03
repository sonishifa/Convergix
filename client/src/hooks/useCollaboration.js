import { useEffect, useRef, useState } from 'react';
import { createYDoc }                  from '../lib/yjs-setup';
import { createIndexedDbPersistence }  from '../lib/indexeddb-persist';
import { createWsProvider }            from '../lib/ws-provider';

function waitForAwareness(provider, cb, isDestroyed) {
  if (isDestroyed()) return;

  if (provider.awareness?.doc) {
    if (!isDestroyed()) cb();
    return;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (isDestroyed()) {
      clearInterval(interval);
      return;
    }
    if (provider.awareness?.doc) {
      clearInterval(interval);
      cb();
    } else if (attempts >= 50) {
      clearInterval(interval);
      console.error('[WS] awareness.doc never became available after 1s');
    }
  }, 20);
}

export function useCollaboration(docId, user) {
  const [session, setSession] = useState({
    ydoc: null, provider: null, ready: false,
    conflict: null, wsStatus: 'connecting',
  });

  const idbRef      = useRef(null);
  const providerRef = useRef(null);
  const ydocRef     = useRef(null);
  const everSynced  = useRef(false);

  useEffect(() => {
    if (!docId || !user?.token) return;

    const doc = createYDoc();
    ydocRef.current = doc;
    setSession(prev => ({ ...prev, ydoc: doc }));

    const { idb, ready: idbReady } = createIndexedDbPersistence(docId, doc);
    idbRef.current = idb;

    let localSnapshot = null;
    let destroyed     = false;

    idbReady.then(() => {
      if (destroyed) return;
      localSnapshot = doc.getXmlFragment('default').toString();

      const wsProvider = createWsProvider({
        docId,
        ydoc: doc,
        token: user.token,

        onSynced() {
          // Defer ready signal until awareness.doc is confirmed live.
          // Guards against StrictMode double-invoke and Hocuspocus's
          // async awareness initialization sequence.
          waitForAwareness(wsProvider, () => {
            if (destroyed) return;
            const merged = doc.getXmlFragment('default').toString();
            if (!everSynced.current && localSnapshot && merged !== localSnapshot) {
              setSession(prev => ({ ...prev, conflict: { local: localSnapshot, merged } }));
              setTimeout(() => setSession(prev => ({ ...prev, conflict: null })), 4000);
            }
            everSynced.current = true;
            localSnapshot      = null;
            setSession(prev => ({ ...prev, provider: wsProvider, ready: true }));
          }, () => destroyed);
        },

        onStatus({ status }) {
          if (destroyed) return;
          setSession(prev => ({ ...prev, wsStatus: status }));
        },

        onAuthError(msg) {
          console.error('[Auth]', msg);
        },
      });

      providerRef.current = wsProvider;
    }).catch(err => {
      if (!destroyed) console.error('[IDB]', err.message);
    });

    return () => {
      destroyed = true;
      providerRef.current?.destroy();
      idbRef.current?.destroy();
      ydocRef.current?.destroy();
      providerRef.current = null;
      idbRef.current      = null;
      ydocRef.current     = null;
      everSynced.current  = false;
      setSession({ ydoc: null, provider: null, ready: false, conflict: null, wsStatus: 'connecting' });
    };
  }, [docId, user?.token]);

  return session;
}