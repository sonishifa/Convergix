const Y      = require('yjs');
const { appendOp }     = require('../db/oplog');
const { saveSnapshot } = require('../db/snapshots');
const logger           = require('../utils/logger');

const SNAPSHOT_INTERVAL = 50;
const opCounters        = new Map(); // docId → op count since last snapshot

async function handleChange({ documentName, document, update, context }) {
  const user = context?.user ?? {};

  // Always write to op log — this is your revision history
  try {
    await appendOp(documentName, Buffer.from(update), user.id, user.name);
  } catch (err) {
    logger.error('appendOp failed', { documentName, error: err.message });
    // Non-fatal: real-time sync continues even if persistence fails
  }

  // Periodic full-state snapshot — used to bootstrap new clients fast
  const count = (opCounters.get(documentName) ?? 0) + 1;
  opCounters.set(documentName, count);

  if (count % SNAPSHOT_INTERVAL === 0) {
    try {
      const state = Y.encodeStateAsUpdate(document);
      await saveSnapshot(documentName, Buffer.from(state));
      logger.info('Periodic snapshot saved', { documentName, count });
    } catch (err) {
      logger.error('saveSnapshot failed', { documentName, error: err.message });
    }
  }
}

function clearDocCounter(documentName) {
  opCounters.delete(documentName);
}

module.exports = { handleChange, clearDocCounter };