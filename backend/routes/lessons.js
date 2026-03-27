const express = require('express');
const lessonController = require('../controllers/lessonController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /lessons — list all published lessons
router.get('/', lessonController.getAll);

// GET /lessons/:id — single lesson
router.get('/:id', lessonController.getById);

// POST /lessons — create lesson (admin, with optional file upload)
router.post('/', requireAdmin, lessonController.create);

// PUT /lessons/:id — update lesson (admin)
router.put('/:id', requireAdmin, lessonController.update);

// DELETE /lessons/:id — delete lesson (admin)
router.delete('/:id', requireAdmin, lessonController.remove);

module.exports = router;
