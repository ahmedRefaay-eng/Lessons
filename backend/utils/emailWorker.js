/**
 * Email Worker – BullMQ + Redis
 *
 * Processes jobs from the 'emails' queue.
 * Must be started explicitly – called from server.js when Redis is available.
 *
 * Each job payload: { to, subject, html, text? }
 */

const logger = require('./logger');

let worker = null;

/**
 * Start the email worker.
 * No-op if Redis is not configured.
 */
function startEmailWorker() {
  const REDIS_HOST = process.env.REDIS_HOST;
  if (!REDIS_HOST) {
    logger.info('[EmailWorker] Redis not configured – email worker not started (direct send active)');
    return;
  }

  try {
    const { Worker } = require('bullmq');
    const { sendEmail } = require('./mailer');

    const connection = {
      host: REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    worker = new Worker(
      'emails',
      async (job) => {
        const { to, subject, html, text } = job.data;
        logger.info('[EmailWorker] Processing email job', {
          jobId: job.id,
          jobName: job.name,
          to,
        });
        await sendEmail({ to, subject, html, text });
        logger.info('[EmailWorker] Email sent', { jobId: job.id, to });
      },
      {
        connection,
        concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '3', 10),
      }
    );

    worker.on('failed', (job, err) => {
      logger.error('[EmailWorker] Job failed', {
        jobId: job?.id,
        attempt: job?.attemptsMade,
        error: err.message,
      });
    });

    worker.on('error', (err) => {
      logger.error('[EmailWorker] Worker error', { error: err.message });
    });

    logger.info('[EmailWorker] Email worker started', { host: REDIS_HOST });
  } catch (err) {
    logger.error('[EmailWorker] Failed to start worker', { error: err.message });
  }
}

/**
 * Stop the email worker gracefully.
 */
async function stopEmailWorker() {
  if (worker) {
    try {
      await worker.close();
      logger.info('[EmailWorker] Email worker stopped');
    } catch (err) {
      logger.error('[EmailWorker] Error stopping worker', { error: err.message });
    }
    worker = null;
  }
}

module.exports = { startEmailWorker, stopEmailWorker };
