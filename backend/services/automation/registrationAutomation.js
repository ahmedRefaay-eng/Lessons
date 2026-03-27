/**
 * Registration Automation
 *
 * Triggered when a new user registers.
 * Responsibilities:
 *  - Build a personalised dashboard URL containing the student_id
 *  - Send a rich welcome email with the student ID + dashboard link
 *
 * This module does NOT duplicate user-creation logic; it only handles
 * the post-registration notification side-effect.
 */

const { sendStudentIdEmail } = require('../../utils/mailer');
const logger = require('../../utils/logger');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Build the personalised dashboard URL for a student.
 * @param {string} studentId
 * @returns {string}
 */
function buildDashboardUrl(studentId) {
  return `${APP_URL}/dashboard?student_id=${encodeURIComponent(studentId)}`;
}

/**
 * Run all post-registration automation steps for a newly created user.
 * Must be called NON-BLOCKING (fire-and-forget) by the caller.
 *
 * @param {{ email: string, studentId: string, firstName?: string }} params
 */
async function onUserRegistered({ email, studentId, firstName }) {
  const dashboardUrl = buildDashboardUrl(studentId);

  logger.info('[Automation][Registration] New user registered', {
    email,
    studentId,
    dashboardUrl,
  });

  try {
    await sendStudentIdEmail({ email, studentId, firstName, dashboardUrl });
    logger.info('[Automation][Registration] Welcome email sent', { email, studentId });
  } catch (err) {
    // Email failure must never break registration
    logger.error('[Automation][Registration] Failed to send welcome email', {
      email,
      studentId,
      error: err.message,
    });
  }
}

module.exports = { onUserRegistered, buildDashboardUrl };
