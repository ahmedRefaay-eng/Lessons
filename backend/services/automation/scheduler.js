/**
 * Automation Scheduler
 *
 * Uses node-cron to schedule recurring automation jobs.
 *
 * Jobs:
 *  1. Every 15 minutes – check for expired exams and mark absentees
 *  2. Daily at 02:00    – full absence-alert sweep for all students
 *
 * The scheduler is started once from server.js and tracks job state
 * so it can be safely stopped (e.g. in tests).
 */

const cron = require('node-cron');
const { checkAndMarkAbsentees } = require('./attendanceAutomation');
const { checkAndAlertAbsences } = require('./notificationAutomation');
const userRepository = require('../../repositories/userRepository');
const logger = require('../../utils/logger');

let jobs = [];

// Track last run times for the status endpoint
const lastRun = {
  absenteeCheck: null,
  dailyAbsenceAlerts: null,
};

// ─────────────────────────────────────────────────────────────
// JOB HANDLERS
// ─────────────────────────────────────────────────────────────

async function runAbsenteeCheck() {
  logger.info('[Scheduler] Running absentee check job');
  try {
    const result = await checkAndMarkAbsentees();
    lastRun.absenteeCheck = new Date().toISOString();
    logger.info('[Scheduler] Absentee check complete', result);
  } catch (err) {
    logger.error('[Scheduler] Absentee check job failed', { error: err.message });
  }
}

async function runDailyAbsenceAlerts() {
  logger.info('[Scheduler] Running daily absence alerts job');
  try {
    const students = await userRepository.findAll({ role: 'student' });
    let alertsFired = 0;
    for (const student of students) {
      // checkAndAlertAbsences handles its own error handling internally
      await checkAndAlertAbsences(student.id);
      alertsFired++;
    }
    lastRun.dailyAbsenceAlerts = new Date().toISOString();
    logger.info('[Scheduler] Daily absence alerts complete', { studentsChecked: alertsFired });
  } catch (err) {
    logger.error('[Scheduler] Daily absence alerts job failed', { error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// START / STOP
// ─────────────────────────────────────────────────────────────

/**
 * Start all cron jobs. Idempotent – calling twice is safe (stops old jobs first).
 */
function start() {
  if (jobs.length > 0) stop();

  // Job 1: Every 15 minutes – mark absentees for closed exams
  const absenteeJob = cron.schedule('*/15 * * * *', runAbsenteeCheck, {
    scheduled: true,
    name: 'absenteeCheck',
  });

  // Job 2: Daily at 02:00 – sweep all students for absence alerts
  const dailyAlertsJob = cron.schedule('0 2 * * *', runDailyAbsenceAlerts, {
    scheduled: true,
    name: 'dailyAbsenceAlerts',
  });

  jobs = [absenteeJob, dailyAlertsJob];
  logger.info('[Scheduler] Automation scheduler started', {
    jobs: ['absenteeCheck (*/15 * * * *)', 'dailyAbsenceAlerts (0 2 * * *)'],
  });
}

/**
 * Stop all running cron jobs (used in tests or graceful shutdown).
 */
function stop() {
  jobs.forEach((j) => j.stop());
  jobs = [];
  logger.info('[Scheduler] Automation scheduler stopped');
}

/**
 * Return current scheduler state (for the status API endpoint).
 */
function getStatus() {
  return {
    running: jobs.length > 0,
    jobCount: jobs.length,
    lastRun,
    jobs: [
      { name: 'absenteeCheck', schedule: '*/15 * * * *', description: 'Mark absentees for closed exams' },
      { name: 'dailyAbsenceAlerts', schedule: '0 2 * * *', description: 'Daily sweep – absence alert emails to admins' },
    ],
  };
}

module.exports = { start, stop, getStatus };
