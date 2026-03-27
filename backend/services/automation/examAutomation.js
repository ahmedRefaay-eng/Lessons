/**
 * Exam Automation
 *
 * Triggered when a student submits exam answers.
 * Responsibilities:
 *  - Auto-calculate grade from answers vs correct_answer in exam_questions
 *  - Upsert result in the grades table
 *  - Ensure attendance is recorded as "present"
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

  const score = Math.round((correct / gradeableQuestions.length) * 100 * 100) / 100; // 2 dp
  return { score, correct, total: gradeableQuestions.length };
}

/**
 * Process a student's exam submission end-to-end:
 *  1. Load gradeable questions for the exam
 *  2. Compute score
 *  3. Persist the grade
 *  4. Confirm attendance = present
 *  5. Trigger post-submission absence check (non-blocking)
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.examId
 * @param {Array<{questionId: number, answer: string}>} params.answers
 * @returns {{ score: number|null, correct: number, total: number, grade: object }}
 */
async function onExamSubmitted({ userId, examId, answers }) {
  logger.info('[Automation][Exam] Processing submission', { userId, examId });

  // 1. Load gradeable questions
  const gradeableQuestions = await examRepository.findGradeableQuestions(examId);

  // 2. Calculate score
  const { score, correct, total } = calculateScore(answers, gradeableQuestions);

  // 3. Persist grade (upsert – student can only submit once, but re-submit is safe)
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

  // 4. Ensure attendance is marked present
  await attendanceRepository.upsert({ userId, examId, status: 'present' });
  logger.info('[Automation][Exam] Attendance marked present', { userId, examId });

  // 5. Non-blocking absence check (in case this exam was the student's Nth absence
  //    before submitting – edge case protection)
  notificationAutomation.checkAndAlertAbsences(userId).catch((err) =>
    logger.error('[Automation][Exam] Absence check failed post-submission', {
      userId,
      error: err.message,
    })
  );

  return { score, correct, total, grade };
}

module.exports = { onExamSubmitted, calculateScore };
