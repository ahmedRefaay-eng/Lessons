/**
 * Notification Automation
 *
 * Central module for all automated email notifications:
 *  1. Absence alert   – email all admins when a student exceeds the threshold
 *  2. Announcement    – broadcast an announcement email to all active students
 */

const userRepository = require('../../repositories/userRepository');
const announcementRepository = require('../../repositories/announcementRepository');
const attendanceRepository = require('../../repositories/attendanceRepository');
const {
  sendAbsenceAlertEmail,
  sendAnnouncementEmail,
} = require('../../utils/mailer');
const logger = require('../../utils/logger');

const ABSENCE_ALERT_THRESHOLD = parseInt(process.env.ABSENCE_THRESHOLD || '3', 10);

// ─────────────────────────────────────────────────────────────
// 1. ABSENCE ALERT
// ─────────────────────────────────────────────────────────────

/**
 * Check a student's absence count. If it exceeds the threshold,
 * fetch all admin emails and fire an alert email.
 *
 * Always safe to call – errors are caught and logged.
 *
 * @param {number} userId
 */
async function checkAndAlertAbsences(userId) {
  try {
    const count = await attendanceRepository.countAbsences(userId);

    if (count <= ABSENCE_ALERT_THRESHOLD) return;

    const [user, adminEmails] = await Promise.all([
      userRepository.findById(userId),
      userRepository.findAdminEmails(),
    ]);

    if (!user || adminEmails.length === 0) return;

    const studentName =
      [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;

    logger.warn('[Automation][Notification] Absence threshold exceeded – alerting admins', {
      userId,
      studentName,
      studentId: user.student_id,
      absenceCount: count,
      adminCount: adminEmails.length,
    });

    await sendAbsenceAlertEmail({
      adminEmails,
      studentName,
      studentId: user.student_id,
      absenceCount: count,
    });

    logger.info('[Automation][Notification] Absence alert email sent', {
      studentId: user.student_id,
      absenceCount: count,
    });
  } catch (err) {
    logger.error('[Automation][Notification] checkAndAlertAbsences failed', {
      userId,
      error: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 2. ANNOUNCEMENT BROADCAST
// ─────────────────────────────────────────────────────────────

/**
 * After an announcement is created/published, email all active students.
 * Each email is sent individually so one failure doesn't block others.
 *
 * @param {number} announcementId
 */
async function broadcastAnnouncement(announcementId) {
  logger.info('[Automation][Notification] Broadcasting announcement', { announcementId });

  let announcement;
  try {
    announcement = await announcementRepository.findById(announcementId);
  } catch (err) {
    logger.error('[Automation][Notification] Could not load announcement', {
      announcementId,
      error: err.message,
    });
    return;
  }

  if (!announcement || !announcement.is_published) {
    logger.info('[Automation][Notification] Announcement not published – skipping broadcast', {
      announcementId,
    });
    return;
  }

  let students;
  try {
    students = await userRepository.findAllStudentEmails();
  } catch (err) {
    logger.error('[Automation][Notification] Could not load student list for broadcast', {
      error: err.message,
    });
    return;
  }

  logger.info(`[Automation][Notification] Sending announcement to ${students.length} student(s)`, {
    announcementId,
    title: announcement.title,
  });

  let sent = 0;
  let failed = 0;

  for (const student of students) {
    try {
      await sendAnnouncementEmail({
        email: student.email,
        firstName: student.first_name,
        title: announcement.title,
        body: announcement.body,
      });
      sent++;
    } catch (err) {
      failed++;
      logger.error('[Automation][Notification] Failed to send announcement email', {
        email: student.email,
        announcementId,
        error: err.message,
      });
    }
  }

  logger.info('[Automation][Notification] Announcement broadcast complete', {
    announcementId,
    sent,
    failed,
  });
}

module.exports = { checkAndAlertAbsences, broadcastAnnouncement };
