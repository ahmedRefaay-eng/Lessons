/**
 * Exam Automation
 *
 * Triggered when a student submits exam answers.
 * Responsibilities:
 *  - Validate submission window (exam must be active, not yet closed, not already submitted)
 *  - Auto-calculate grade from answers vs correct_answer in exam_questions
 *  - Upsert result in the Grades table
 *  - Mark attendance as "present"
 *  - Prevent re-submission (idempotent guard via submitted_at)
 *  - Trigger absence check after the submission
 */

const examRepository = require('../../repositories/examRepository');
const gradeRepository = require('../../repositories/gradeRepository');
const attendanceRepository = require('../../repositories/attendanceRepository');
const notificationAutomation = require('./notificationAutomation');
const logger = require('../../utils/logger');

/**
 * Calculate a percentage score by comparing student answers to correct answers.
 *
 * @param {Array<{questionId: number, answer: string}>} answers
 * @param {Array<{id: number, correct_answer: string, question_type: string}>} gradeableQuestions
 * @returns {{ score: number|null, correct: number, total: number }}
 */
function calculateScore(answers, gradeableQuestions) {
  if (!gradeableQuestions || gradeableQuestions.length === 0) {
    return { score: null, correct: 0, total: 0 };
  }

  const answerMap = {};
  (answers || []).forEach(({ questionId, answer }) => {
    answerMap[questionId] = (answer || '').trim().toLowerCase();
  });

  let correct = 0;
  for (const q of gradeableQuestions) {
    const given = answerMap[q.id];
    const expected = (q.correct_answer || '').trim().toLowerCase();
    if (given !== undefined && given === expected) {
      correct++;
    }
  }

  // Calculate percentage with 2 decimal places.
  // e.g. 3/4 correct → Math.round(75.00 * 100) / 100 = 75.00
  const percentage = (correct / gradeableQuestions.length) * 100;
  const score = Math.round(percentage * 100) / 100;
  return { score, correct, total: gradeableQuestions.length };
}

/**
 * Process a student's exam submission end-to-end:
 *  1. Validate: exam active, within time window, not already submitted
 *  2. Mark exam_access.submitted_at (prevents re-submission)
 *  3. Load gradeable questions and compute score
 *  4. Persist the grade
 *  5. Mark attendance = present
 *  6. Trigger post-submission absence check (non-blocking)
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.examId
 * @param {Array<{questionId: number, answer: string}>} params.answers
 * @returns {{ score: number|null, correct: number, total: number, grade: object }}
 */
async function onExamSubmitted({ userId, examId, answers }) {
  logger.info('[Automation][Exam] Processing submission', { userId, examId });

  // 1a. Fetch exam and validate it is still active
  const exam = await examRepository.findById(examId);
  if (!exam) {
    const err = new Error('Exam not found');
    err.statusCode = 404;
    throw err;
  }
  if (!exam.is_active) {
    const err = new Error('This exam is not currently active');
    err.statusCode = 403;
    throw err;
  }

  // 1b. Enforce end-time window: date + duration minutes
  const examEndTime = new Date(exam.date).getTime() + exam.duration * 60 * 1000;
  if (Date.now() > examEndTime) {
    const err = new Error('Exam submission window has closed');
    err.statusCode = 403;
    throw err;
  }

  // 1c. Verify the student has access to this exam
  const access = await examRepository.getAccess(userId, examId);
  if (!access || !access.allowed) {
    const err = new Error('You are not allowed to access this exam');
    err.statusCode = 403;
    throw err;
  }

  // 1d. Prevent re-submission
  if (access.submitted_at) {
    const err = new Error('You have already submitted this exam');
    err.statusCode = 409;
    throw err;
  }

  // 2. Atomically mark as submitted (the UPDATE WHERE submitted_at IS NULL guard
  //    handles any race condition between concurrent requests)
  const marked = await examRepository.markSubmitted(userId, examId);
  if (!marked) {
    // Another request won the race
    const err = new Error('You have already submitted this exam');
    err.statusCode = 409;
    throw err;
  }

  // 3. Load gradeable questions
  const gradeableQuestions = await examRepository.findGradeableQuestions(examId);

  // 4. Calculate score
  const { score, correct, total } = calculateScore(answers, gradeableQuestions);

  // 5. Persist grade
  let grade = null;
  if (score !== null) {
    const feedback = `Auto-graded: ${correct} / ${total} correct (${score}%)`;
    grade = await gradeRepository.upsert({
      userId,
      examId,
      grade: score,
      feedback,
      gradedBy: null, // system-graded
    });
    logger.info('[Automation][Exam] Grade saved', { userId, examId, score });
  } else {
    logger.info('[Automation][Exam] No gradeable questions – manual grading required', {
      userId,
      examId,
    });
  }

  // 6. Ensure attendance is marked present
  await attendanceRepository.upsert({ userId, examId, status: 'present' });
  logger.info('[Automation][Exam] Attendance marked present', { userId, examId });

  // 7. Non-blocking absence check
  notificationAutomation.checkAndAlertAbsences(userId).catch((err) =>
    logger.error('[Automation][Exam] Absence check failed post-submission', {
      userId,
      error: err.message,
    })
  );

  return { score, correct, total, grade };
}

module.exports = { onExamSubmitted, calculateScore };
