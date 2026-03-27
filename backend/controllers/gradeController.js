const { body } = require('express-validator');
const gradeService = require('../services/gradeService');
const { validate } = require('../middleware/validate');

async function getByUser(req, res, next) {
  try {
    const userId = parseInt(req.params.user_id, 10);
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const grades = await gradeService.getByUser(userId);
    res.json({ grades });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function upsertGrade(req, res, next) {
  try {
    const { user_id, exam_id, grade, feedback } = req.body;
    const record = await gradeService.upsert({
      userId: user_id,
      examId: exam_id,
      grade,
      feedback,
      gradedBy: req.user.id,
    });
    res.json({ message: 'Grade saved', grade: record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const grades = await gradeService.getAll();
    res.json({ grades });
  } catch (err) {
    next(err);
  }
}

async function getExamStats(req, res, next) {
  try {
    const stats = await gradeService.getExamStats(parseInt(req.params.exam_id, 10));
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

const upsertValidation = [
  body('user_id').isInt({ min: 1 }).withMessage('Valid user_id required'),
  body('exam_id').isInt({ min: 1 }).withMessage('Valid exam_id required'),
  body('grade')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Grade must be between 0 and 100'),
];

module.exports = {
  getByUser,
  upsertGrade: [upsertValidation, validate, upsertGrade],
  getAll,
  getExamStats,
};
