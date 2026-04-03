const { Router }       = require('express');
const { getOps }       = require('../db/oplog');
const { loadSnapshot } = require('../db/snapshots');

const router = Router();
const wrap   = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/:id/revisions', wrap(async (req, res) => {
  const docId = req.params.id;

  const [snapshot, ops] = await Promise.all([
    loadSnapshot(docId),
    getOps(docId),
  ]);

  res.json({
    snapshot: snapshot ? snapshot.toString('base64') : null,
    ops,
  });
}));

module.exports = router;