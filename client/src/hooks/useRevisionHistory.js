import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { base64ToUint8 } from '../utils/base64';

const API        = import.meta.env.VITE_API_URL || '/api';
const CACHE_STEP = 10; // max ops replayed per scrub = 10, regardless of history length

function buildCheckpointCache(snapshotB64, ops) {
  const cache = new Map();
  const doc   = new Y.Doc();

  if (snapshotB64) {
    Y.applyUpdate(doc, base64ToUint8(snapshotB64));
  }
  cache.set(0, Y.encodeStateAsUpdate(doc)); // frame 0 = base state

  for (let i = 0; i < ops.length; i++) {
    Y.applyUpdate(doc, base64ToUint8(ops[i].op));
    const frame = i + 1;
    if (frame % CACHE_STEP === 0 || frame === ops.length) {
      cache.set(frame, Y.encodeStateAsUpdate(doc));
    }
  }

  doc.destroy();
  return cache;
}

function replayToFrame(cache, ops, targetFrame) {
  // Find largest cached frame ≤ target
  let nearestFrame = 0;
  for (const [f] of cache) {
    if (f <= targetFrame && f > nearestFrame) nearestFrame = f;
  }

  const doc = new Y.Doc();
  Y.applyUpdate(doc, cache.get(nearestFrame));

  // Apply only the delta — O(CACHE_STEP) regardless of total history
  for (let i = nearestFrame; i < targetFrame; i++) {
    Y.applyUpdate(doc, base64ToUint8(ops[i].op));
  }

  const text = doc.getXmlFragment('default').toString();
  doc.destroy();
  return text;
}

export function useRevisionHistory(docId) {
  const [ops,     setOps]     = useState([]);
  const [frame,   setFrame]   = useState(0);
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const cacheRef = useRef(null);

  const fetchHistory = useCallback((silent = false) => {
    if (!docId) return;
    if (!silent) setLoading(true);
    setError(null);

    const token = sessionStorage.getItem('collab_token');

    fetch(`${API}/documents/${docId}/revisions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ snapshot, ops: newOps }) => {
        cacheRef.current = buildCheckpointCache(snapshot, newOps);
        setOps(newOps);
        
        // If it's a silent background fetch, don't interrupt what they are currently viewing
        if (!silent) {
          const lastFrame = newOps.length;
          setFrame(lastFrame);
          setText(replayToFrame(cacheRef.current, newOps, lastFrame));
        } else {
          // If silent, just update text if they were pinned to the end previously. Keep their scrub state otherwise.
          setFrame(f => {
            if (f === ops.length || f === 0) {
               // They were looking at the latest point. Move them to the new latest point.
               const newLastFrame = newOps.length;
               setText(replayToFrame(cacheRef.current, newOps, newLastFrame));
               return newLastFrame;
            }
            return f;
          });
        }
      })
      .catch(err => {
        if (err.message.includes('Failed to fetch')) {
          setError('Cannot connect to revision history server (is backend running?)');
        } else {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [docId, ops.length]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(() => {
      fetchHistory(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const scrubToFrame = useCallback((f) => {
    if (!cacheRef.current) return;
    setFrame(f);
    setText(replayToFrame(cacheRef.current, ops, f));
  }, [ops]);

  return { ops, frame, text, loading, error, scrubToFrame, retry: fetchHistory };
}