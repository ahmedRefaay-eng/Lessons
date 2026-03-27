const attendanceRepository = require('../repositories/attendanceRepository');
const userRepository = require('../repositories/userRepository');
const { sendAbsenceAlertEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

const ABSENCE_ALERT_THRESHOLD = 3;

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

    // Check absence threshold
    if (status === 'absent') {
      await this._checkAndAlertAbsences(userId);
    }

    return record;
  }

  async _checkAndAlertAbsences(userId) {
    const count = await attendanceRepository.countAbsences(userId);
    if (count > ABSENCE_ALERT_THRESHOLD) {
      const user = await userRepository.findById(userId);
      const adminEmails = await userRepository.findAdminEmails();
      if (adminEmails.length > 0 && user) {
        const studentName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
        sendAbsenceAlertEmail({
          adminEmails,
          studentName,
          studentId: user.student_id,
          absenceCount: count,
        }).catch((err) => logger.error('Failed to send absence alert email', err));
      }
    }
  }
}

module.exports = new AttendanceService();
