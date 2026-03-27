const examRepository = require('../repositories/examRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const userRepository = require('../repositories/userRepository');
const { sendAbsenceAlertEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

class ExamService {
  async getAll() {
    return examRepository.findAll();
  }

  async create({ title, description, date, duration, isActive, createdBy, file }) {
    let fileUrl = null;
    let fileName = null;
    let mimeType = null;
    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      fileName = file.originalname;
      mimeType = file.mimetype;
    }
    return examRepository.create({ title, description, date, duration, isActive, createdBy, fileUrl, fileName, mimeType });
  }

  async update(id, fields, file) {
    const exam = await examRepository.findById(id);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }
    const updateFields = { ...fields };
    if (file) {
      updateFields.file_url = `/uploads/${file.filename}`;
      updateFields.file_name = file.originalname;
      updateFields.mime_type = file.mimetype;
    }
    return examRepository.update(id, updateFields);
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

  // Questions
  async getQuestions(examId) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }
    return examRepository.getQuestions(examId);
  }

  async createQuestion({ examId, questionText, questionType, options, correctAnswer, sortOrder }) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }
    return examRepository.createQuestion({ examId, questionText, questionType, options, correctAnswer, sortOrder });
  }

  async updateQuestion(questionId, fields) {
    const question = await examRepository.updateQuestion(questionId, fields);
    if (!question) {
      const err = new Error('Question not found');
      err.statusCode = 404;
      throw err;
    }
    return question;
  }

  async deleteQuestion(questionId) {
    const deleted = await examRepository.deleteQuestion(questionId);
    if (!deleted) {
      const err = new Error('Question not found');
      err.statusCode = 404;
      throw err;
    }
  }
}

module.exports = new ExamService();
