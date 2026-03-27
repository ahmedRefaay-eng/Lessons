const { body } = require('express-validator');
const courseService = require('../services/courseService');
const { validate } = require('../middleware/validate');

async function getAll(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const courses = await courseService.getAll(isAdmin);
    res.json({ courses });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const course = await courseService.getById(parseInt(req.params.id, 10));
    res.json({ course });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, subject, sort_order } = req.body;
    const course = await courseService.create({
      title,
      description,
      subject,
      sortOrder: sort_order ? parseInt(sort_order, 10) : 0,
      createdBy: req.user.id,
    });
    res.status(201).json({ message: 'Course created', course });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const course = await courseService.update(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Course updated', course });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await courseService.delete(parseInt(req.params.id, 10));
    res.json({ message: 'Course deleted' });
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
  create: [createValidation, validate, create],
  update,
  remove,
};
