const { Server }   = require('@hocuspocus/server');
const { Redis }    = require('@hocuspocus/extension-redis');
const { Database } = require('@hocuspocus/extension-database');
const jwt          = require('jsonwebtoken');
const { handleChange, clearDocCounter } = require('./persistence');
const { loadSnapshot, saveSnapshot }    = require('../db/snapshots');
const logger                            = require('../utils/logger');

const server = new Server({
  port: parseInt(process.env.PORT) || 1234,

  extensions: [
    new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    }),
    new Database({
      fetch: async ({ documentName }) => {
        const snap = await loadSnapshot(documentName);
        logger.info('Bootstrap snapshot fetched', { documentName, found: !!snap });
        return snap;
      },
      store: async ({ documentName, state }) => {
        await saveSnapshot(documentName, Buffer.from(state));
        logger.info('Final snapshot stored on disconnect', { documentName });
      },
    }),
  ],

  onChange: handleChange,

  async onAuthenticate({ token }) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return { user: { id: payload.sub, name: payload.name, color: payload.color } };
    } catch {
      throw new Error('Invalid or expired token');
    }
  },

  onDisconnect({ documentName }) {
    clearDocCounter(documentName);
  },
});

server
  .listen()
  .then(() => logger.info('WS node started', { port: parseInt(process.env.PORT) || 1234 }))
  .catch(err => { logger.error('WS failed to start', { error: err.message }); process.exit(1); });