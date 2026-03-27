const express = require('express');
const examController = require('../controllers/examController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /exams — list all exams (authenticated)
router.get('/', examController.getAll);

// POST /exams — create exam (admin only)
router.post('/', requireAdmin, examController.create);

// PUT /exams/:id — update exam (admin only)
router.put('/:id', requireAdmin, examController.update);

// DELETE /exams/:id — delete exam (admin only)
router.delete('/:id', requireAdmin, examController.remove);

// POST /exams/:id/start — student starts exam with student_id
router.post('/:id/start', examController.startExam);

// POST /exams/:id/assign — assign students to exam (admin)
router.post('/:id/assign', requireAdmin, examController.assignStudents);

// GET /exams/:id/students — get students assigned to exam (admin)
router.get('/:id/students', requireAdmin, examController.getExamStudents);

module.exports = router;
