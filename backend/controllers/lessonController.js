const { body } = require('express-validator');
const lessonService = require('../services/lessonService');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');
const path = require('path');

async function getAll(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const lessons = await lessonService.getAll(isAdmin);
    res.json({ lessons });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const lesson = await lessonService.getById(parseInt(req.params.id, 10));
    res.json({ lesson });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, content } = req.body;
    const lesson = await lessonService.create({
      title,
      content,
      file: req.file || null,
      createdBy: req.user.id,
    });
    res.status(201).json({ message: 'Lesson created', lesson });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const lesson = await lessonService.update(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Lesson updated', lesson });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await lessonService.delete(parseInt(req.params.id, 10));
    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
];

module.exports = {
  getAll,
  getById,
  create: [upload.single('file'), createValidation, validate, create],
  update,
  remove,
};
