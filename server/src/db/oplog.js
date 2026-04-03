// server/src/db/oplog.js
const { pool } = require('./pool');

async function appendOp(docId, op, userId, userName) {
  await pool.query(
    'INSERT INTO op_log (doc_id, user_id, user_name, op) VALUES ($1,$2,$3,$4)',
    [docId, userId ?? null, userName ?? null, op]
  );
}

async function getOps(docId) {
  const { rows } = await pool.query(
    'SELECT id, user_id, user_name, op, created_at FROM op_log WHERE doc_id=$1 ORDER BY id ASC',
    [docId]
  );
  return rows.map(r => ({
    id:        r.id,
    userId:    r.user_id,
    userName:  r.user_name,
    op:        r.op.toString('base64'),  // binary → base64 for JSON transport
    createdAt: r.created_at,
  }));
}

module.exports = { appendOp, getOps };