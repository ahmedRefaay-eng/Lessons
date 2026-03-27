const examRepository = require('../repositories/examRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const userRepository = require('../repositories/userRepository');
const { sendAbsenceAlertEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

class ExamService {
  async getAll() {
    return examRepository.findAll();
  }

  async create({ title, description, date, duration, isActive, createdBy }) {
    return examRepository.create({ title, description, date, duration, isActive, createdBy });
  }

  async update(id, fields) {
    const exam = await examRepository.findById(id);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }
    return examRepository.update(id, fields);
  }

  async delete(id) {
    const deleted = await examRepository.delete(id);
    if (!deleted) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }
  }

  async assignStudents(examId, userIds) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }
    await examRepository.bulkAssignStudents(examId, userIds);

    // Pre-mark all assigned students as absent (will be updated when they enter)
    for (const userId of userIds) {
      await attendanceRepository.upsert({ userId, examId, status: 'absent' });
    }
    return { assigned: userIds.length };
  }

  /**
   * Core logic: Student starts exam - MUST provide their student_id
   */
  async startExam(userId, examId, providedStudentId) {
    // 1. Fetch exam
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Check exam is active
    if (!exam.is_active) {
      const err = new Error('This exam is not currently active');
      err.statusCode = 403;
      throw err;
    }

    // 3. Verify student_id matches the logged-in user
    const user = await userRepository.findById(userId);
    if (!user || user.student_id !== providedStudentId) {
      const err = new Error('Invalid student ID. Access denied.');
      err.statusCode = 403;
      throw err;
    }

    // 4. Check exam access
    const access = await examRepository.getAccess(userId, examId);
    if (!access || !access.allowed) {
      const err = new Error('You are not allowed to access this exam');
      err.statusCode = 403;
      throw err;
    }

    // 5. Mark as started
    await examRepository.markStarted(userId, examId);

    // 6. Mark attendance as present
    await attendanceRepository.upsert({ userId, examId, status: 'present' });

    return { message: 'Exam access granted', examId, startedAt: new Date() };
  }

  async getExamStudents(examId) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }
    return examRepository.getExamStudents(examId);
  }
}

module.exports = new ExamService();
