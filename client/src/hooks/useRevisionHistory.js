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

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem('collab_token');

    fetch(`${API}/documents/${docId}/revisions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ snapshot, ops }) => {
        cacheRef.current = buildCheckpointCache(snapshot, ops);
        setOps(ops);
        const lastFrame = ops.length;
        setFrame(lastFrame);
        setText(replayToFrame(cacheRef.current, ops, lastFrame));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [docId]);

  const scrubToFrame = useCallback((f) => {
    if (!cacheRef.current) return;
    setFrame(f);
    setText(replayToFrame(cacheRef.current, ops, f));
  }, [ops]);

  return { ops, frame, text, loading, error, scrubToFrame };
}