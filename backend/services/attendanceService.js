const attendanceRepository = require('../repositories/attendanceRepository');
const userRepository = require('../repositories/userRepository');
const { checkAndAlertAbsences } = require('./automation/notificationAutomation');
const logger = require('../utils/logger');

class AttendanceService {
  async getByUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return attendanceRepository.findByUser(userId);
  }

  async getByExam(examId) {
    return attendanceRepository.findByExam(examId);
  }

  async getAll() {
    return attendanceRepository.findAll();
  }

  /**
   * Mark attendance manually (admin use)
   */
  async markAttendance({ userId, examId, status }) {
    const record = await attendanceRepository.upsert({ userId, examId, status });

    // Non-blocking: check absence threshold via notification automation
    if (status === 'absent') {
      checkAndAlertAbsences(userId).catch((err) =>
        logger.error('[AttendanceService] Absence alert check failed', {
          userId,
          error: err.message,
        })
      );
    }

    return record;
  }
}

module.exports = new AttendanceService();
