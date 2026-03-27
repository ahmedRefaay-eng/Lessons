const { body, param } = require('express-validator');
const examService = require('../services/examService');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (minutes)'),
];

const startValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid exam ID required'),
  body('student_id').trim().notEmpty().withMessage('Student ID is required'),
];

async function getAll(req, res, next) {
  try {
    const exams = await examService.getAll();
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, date, duration, is_active } = req.body;
    const exam = await examService.create({
      title,
      description,
      date,
      duration: parseInt(duration, 10),
      isActive: is_active === 'true' || is_active === true,
      createdBy: req.user.id,
      file: req.file || null,
    });
    res.status(201).json({ message: 'Exam created', exam });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const exam = await examService.update(req.params.id, req.body, req.file || null);
    res.json({ message: 'Exam updated', exam });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await examService.delete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function startExam(req, res, next) {
  try {
    const result = await examService.startExam(
      req.user.id,
      parseInt(req.params.id, 10),
      req.body.student_id
    );
    res.json(result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function assignStudents(req, res, next) {
  try {
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(422).json({ message: 'user_ids must be a non-empty array' });
    }
    const result = await examService.assignStudents(parseInt(req.params.id, 10), user_ids);
    res.json({ message: 'Students assigned', ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function getExamStudents(req, res, next) {
  try {
    const students = await examService.getExamStudents(parseInt(req.params.id, 10));
    res.json({ students });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

// Questions
async function getQuestions(req, res, next) {
  try {
    const questions = await examService.getQuestions(parseInt(req.params.id, 10));
    res.json({ questions });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function createQuestion(req, res, next) {
  try {
    const { question_text, question_type, options, correct_answer, sort_order } = req.body;
    const question = await examService.createQuestion({
      examId: parseInt(req.params.id, 10),
      questionText: question_text,
      questionType: question_type || 'text',
      options: options || null,
      correctAnswer: correct_answer || null,
      sortOrder: sort_order ? parseInt(sort_order, 10) : 0,
    });
    res.status(201).json({ message: 'Question created', question });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const question = await examService.updateQuestion(parseInt(req.params.questionId, 10), req.body);
    res.json({ message: 'Question updated', question });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    await examService.deleteQuestion(parseInt(req.params.questionId, 10));
    res.json({ message: 'Question deleted' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

const createQuestionValidation = [
  body('question_text').trim().notEmpty().withMessage('Question text is required'),
  body('question_type').optional().isIn(['text', 'mcq', 'true_false']).withMessage('Invalid question type'),
];

// Submit exam answers (student – auto-graded)
async function submitExam(req, res, next) {
  try {
    const examId = parseInt(req.params.id, 10);
    const { answers } = req.body; // array of { questionId, answer }

    if (!Array.isArray(answers)) {
      return res.status(422).json({ message: 'answers must be an array of { questionId, answer }' });
    }

    const { onExamSubmitted } = require('../services/automation/examAutomation');
    const result = await onExamSubmitted({ userId: req.user.id, examId, answers });

    res.json({
      message: 'Exam submitted successfully',
      score: result.score,
      correct: result.correct,
      total: result.total,
      grade: result.grade,
      autoGraded: result.score !== null,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

module.exports = {
  getAll,
  create: [upload.single('file'), createValidation, validate, create],
  update: [upload.single('file'), update],
  remove,
  startExam: [startValidation, validate, startExam],
  assignStudents,
  getExamStudents,
  getQuestions,
  createQuestion: [createQuestionValidation, validate, createQuestion],
  updateQuestion,
  deleteQuestion,
  submitExam,
};
