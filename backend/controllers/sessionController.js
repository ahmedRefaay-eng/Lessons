const { body } = require('express-validator');
const sessionService = require('../services/sessionService');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

async function getByCourse(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const result = await sessionService.getByCourse(parseInt(req.params.courseId, 10), isAdmin);
    res.json(result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const session = await sessionService.getById(parseInt(req.params.id, 10));
    res.json({ session });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { course_id, title, video_url, notes, sort_order } = req.body;
    const session = await sessionService.create({
      courseId: parseInt(course_id, 10),
      title,
      videoUrl: video_url || null,
      notes: notes || null,
      file: req.file || null,
      sortOrder: sort_order ? parseInt(sort_order, 10) : 0,
      createdBy: req.user.id,
    });
    res.status(201).json({ message: 'Session created', session });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const session = await sessionService.update(parseInt(req.params.id, 10), req.body, req.file || null);
    res.json({ message: 'Session updated', session });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await sessionService.delete(parseInt(req.params.id, 10));
    res.json({ message: 'Session deleted' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('course_id').isInt({ min: 1 }).withMessage('Valid course_id is required'),
];

module.exports = {
  getByCourse,
  getById,
  create: [upload.single('file'), createValidation, validate, create],
  update: [upload.single('file'), update],
  remove,
};
