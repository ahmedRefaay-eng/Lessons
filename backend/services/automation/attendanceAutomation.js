/**
 * Attendance Automation
 *
 * Responsible for marking students as "absent" after an exam closes
 * when they were assigned but never entered.
 *
 * This is called by the scheduler and can also be triggered manually.
 */

const examRepository = require('../../repositories/examRepository');
const attendanceRepository = require('../../repositories/attendanceRepository');
const notificationAutomation = require('./notificationAutomation');
const logger = require('../../utils/logger');

/**
 * Check all expired exams for students who were assigned but never entered.
 * For each such student:
 *   - Mark attendance as "absent" (upsert – respects already-present records)
 *   - Trigger absence alert check
 *
 * Safe to run repeatedly (idempotent due to upsert + entered_with_id guard).
 *
 * @returns {{ processed: number, markedAbsent: number }}
 */
async function checkAndMarkAbsentees() {
  logger.info('[Automation][Attendance] Running checkAndMarkAbsentees');

  let pending;
  try {
    pending = await examRepository.findExpiredWithPendingAbsentees();
  } catch (err) {
    logger.error('[Automation][Attendance] Failed to fetch pending absentees', {
      error: err.message,
    });
    return { processed: 0, markedAbsent: 0 };
  }

  logger.info(`[Automation][Attendance] Found ${pending.length} pending absentee record(s)`);

  let markedAbsent = 0;

  for (const { user_id, exam_id, exam_title } of pending) {
    try {
      // Only mark absent if not already present (upsert keeps present if already set)
      const current = await attendanceRepository.findOne(user_id, exam_id);
      if (current && current.status === 'present') {
        // Student somehow already got a present record – skip
        continue;
      }

      await attendanceRepository.upsert({ userId: user_id, examId: exam_id, status: 'absent' });
      markedAbsent++;

      logger.info('[Automation][Attendance] Marked absent', {
        userId: user_id,
        examId: exam_id,
        examTitle: exam_title,
      });

      // Non-blocking alert
      notificationAutomation.checkAndAlertAbsences(user_id).catch((err) =>
        logger.error('[Automation][Attendance] Absence alert failed', {
          userId: user_id,
          error: err.message,
        })
      );
    } catch (err) {
      logger.error('[Automation][Attendance] Failed to mark absent for user', {
        userId: user_id,
        examId: exam_id,
        error: err.message,
      });
    }
  }

  logger.info(`[Automation][Attendance] Done – marked ${markedAbsent} absent out of ${pending.length}`);
  return { processed: pending.length, markedAbsent };
}

module.exports = { checkAndMarkAbsentees };
