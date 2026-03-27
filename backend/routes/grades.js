const express = require('express');
const gradeController = require('../controllers/gradeController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /grades — all grades (admin)
router.get('/', requireAdmin, gradeController.getAll);

// GET /grades/:user_id — grades for a user
router.get('/:user_id', gradeController.getByUser);

// POST /grades — create or update grade (admin)
router.post('/', requireAdmin, gradeController.upsertGrade);

// GET /grades/exam/:exam_id/stats — exam statistics (admin)
router.get('/exam/:exam_id/stats', requireAdmin, gradeController.getExamStats);

module.exports = router;
