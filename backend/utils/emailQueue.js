/**
 * Email Queue – BullMQ + Redis
 *
 * Queues outgoing emails for async, retryable processing.
 * Gracefully falls back to direct (in-process) sending when Redis
 * is not configured or unavailable.
 *
 * Usage:
 *   const emailQueue = require('./emailQueue');
 *   await emailQueue.add('student-id', { to, subject, html });
 */

const logger = require('./logger');

// Try to connect to Redis only when configured
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let queue = null;
let redisAvailable = false;

// Lazy-initialise so tests that don't set REDIS_HOST skip this entirely.
function getQueue() {
  if (queue !== null) return queue;
  if (!REDIS_HOST) {
    queue = false; // mark as "no queue"
    return false;
  }

  try {
    const { Queue } = require('bullmq');
    const connection = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    };

    queue = new Queue('emails', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    redisAvailable = true;
    logger.info('[EmailQueue] BullMQ email queue initialised', { host: REDIS_HOST, port: REDIS_PORT });
    return queue;
  } catch (err) {
    logger.warn('[EmailQueue] Failed to initialise BullMQ – falling back to direct send', {
      error: err.message,
    });
    queue = false;
    return false;
  }
}

/**
 * Enqueue an email job.
 * Falls back to direct send if queue is unavailable.
 *
 * @param {string} jobName  – descriptive name (e.g. 'welcome-email')
 * @param {object} payload  – { to, subject, html, text? }
 */
async function enqueue(jobName, payload) {
  const q = getQueue();

  if (q) {
    try {
      const job = await q.add(jobName, payload);
      logger.info('[EmailQueue] Email enqueued', { jobName, jobId: job.id, to: payload.to });
      return { queued: true, jobId: job.id };
    } catch (err) {
      logger.warn('[EmailQueue] Failed to enqueue – sending directly', {
        jobName,
        error: err.message,
      });
    }
  }

  // Direct fallback
  const { sendEmail } = require('./mailer');
  await sendEmail(payload);
  return { queued: false };
}

/**
 * Close the queue connection (used during graceful shutdown).
 */
async function close() {
  if (queue) {
    try {
      await queue.close();
    } catch (_) { /* ignore */ }
    queue = null;
    redisAvailable = false;
  }
}

module.exports = { enqueue, close, get isQueueActive() { return redisAvailable; } };
