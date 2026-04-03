// server/src/db/snapshots.js
const { pool } = require('./pool');

async function saveSnapshot(docId, state) {
  await pool.query(
    'INSERT INTO snapshots (doc_id, state) VALUES ($1,$2)',
    [docId, state]
  );
}

async function loadSnapshot(docId) {
  const { rows } = await pool.query(
    'SELECT state FROM snapshots WHERE doc_id=$1 ORDER BY created_at DESC LIMIT 1',
    [docId]
  );
  return rows[0]?.state ?? null; // Buffer or null
}

module.exports = { saveSnapshot, loadSnapshot };