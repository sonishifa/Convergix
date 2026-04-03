import { HocuspocusProvider } from '@hocuspocus/provider';
console.log('ws-provider loaded');
const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

export function createWsProvider({ docId, ydoc, token, onSynced, onStatus, onAuthError }) {
  const provider = new HocuspocusProvider({
    url:      WS_URL,
    name:     docId,
    document: ydoc,
    token,

    reconnectTimeoutBase: 1000,
    maxReconnectTimeout:  30_000,

    onSynced() {
      // awareness.doc is not guaranteed set yet — wait for it
      waitForAwareness(provider, onSynced);
      console.log('awareness.doc status:', provider.awareness?.doc);
    },

    onStatus,

    onAuthenticationFailed() {
      onAuthError?.('Token rejected — please refresh the page');
    },
  });

  return provider;
}

function waitForAwareness(provider, cb) {
  // Already ready — fast path (most reconnects hit this)
  if (provider.awareness?.doc) {
    cb();
    return;
  }

  // Poll up to 50 × 20ms = 1 second max
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (provider.awareness?.doc) {
      clearInterval(interval);
      cb();
    } else if (attempts >= 50) {
      clearInterval(interval);
      console.error('[WS] awareness.doc never became available — provider may be broken');
    }
  }, 20);
}