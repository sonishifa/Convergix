// Structured JSON logger. Each line is a parseable JSON object —
// Docker, Datadog, CloudWatch all handle this correctly.
// Swap the console.log here for pino/winston when you need log levels + sampling.

function log(level, message, data = {}) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  }));
}

module.exports = {
  info:  (msg, data) => log('info',  msg, data),
  warn:  (msg, data) => log('warn',  msg, data),
  error: (msg, data) => log('error', msg, data),
};