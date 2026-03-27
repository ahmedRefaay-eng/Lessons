const express = require('express');
const courseController = require('../controllers/courseController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /courses — list all courses
router.get('/', courseController.getAll);

// GET /courses/:id — single course
router.get('/:id', courseController.getById);

// POST /courses — create course (admin)
router.post('/', requireAdmin, courseController.create);

// PUT /courses/:id — update course (admin)
router.put('/:id', requireAdmin, courseController.update);

// DELETE /courses/:id — delete course (admin)
router.delete('/:id', requireAdmin, courseController.remove);

module.exports = router;
