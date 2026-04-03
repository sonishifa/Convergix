const express            = require('express');
const cors               = require('cors');
const { authenticate }   = require('../middleware/authenticate');
const authRoute          = require('./auth');
const documentsRoute     = require('./documents');
const revisionsRoute     = require('./revisions');
const logger             = require('../utils/logger');

const app = express();
app.use(cors(), express.json());

// Health check — used by Docker/load balancers
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Public — no token required to get one
app.use('/auth', authRoute);

// Protected — all document and revision routes require a valid JWT
app.use('/documents', authenticate, documentsRoute);
app.use('/documents', authenticate, revisionsRoute);

// Centralised error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled API error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT) || 3000;
const server = app.listen(PORT, () =>
  logger.info('API listening', { port: PORT })
);

// Graceful shutdown — let in-flight requests finish
function shutdown(signal) {
  logger.info('Shutdown signal received', { signal });
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10s if connections hang
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));