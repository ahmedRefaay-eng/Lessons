const { body } = require('express-validator');
const announcementService = require('../services/announcementService');
const { validate } = require('../middleware/validate');

async function getAll(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const announcements = await announcementService.getAll(isAdmin);
    res.json({ announcements });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const announcement = await announcementService.getById(parseInt(req.params.id, 10));
    res.json({ announcement });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, body: bodyText } = req.body;
    const announcement = await announcementService.create({
      title,
      body: bodyText,
      createdBy: req.user.id,
    });
    res.status(201).json({ message: 'Announcement created', announcement });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const announcement = await announcementService.update(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Announcement updated', announcement });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await announcementService.delete(parseInt(req.params.id, 10));
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
];

module.exports = {
  getAll,
  getById,
  create: [createValidation, validate, create],
  update,
  remove,
};
