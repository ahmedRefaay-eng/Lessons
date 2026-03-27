const { body, param } = require('express-validator');
const examService = require('../services/examService');
const { validate } = require('../middleware/validate');

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
      isActive: is_active || false,
      createdBy: req.user.id,
    });
    res.status(201).json({ message: 'Exam created', exam });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const exam = await examService.update(req.params.id, req.body);
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

module.exports = {
  getAll,
  create: [createValidation, validate, create],
  update,
  remove,
  startExam: [startValidation, validate, startExam],
  assignStudents,
  getExamStudents,
};
