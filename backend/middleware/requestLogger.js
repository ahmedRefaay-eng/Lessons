/**
 * HTTP Request Logger Middleware
 *
 * Logs incoming requests and outgoing responses with:
 *  - method, url, status code, response time (ms)
 *  - IP address, user-agent
 *  - authenticated user ID if present
 *
 * Skips noisy /health endpoint.
 */

const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  if (req.path === '/health') return next();

  const startAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startAt) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : undefined,
    });
  });

  next();
}

module.exports = requestLogger;
