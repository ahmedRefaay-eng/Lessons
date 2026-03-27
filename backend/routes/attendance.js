const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /attendance — all records (admin)
router.get('/', requireAdmin, attendanceController.getAll);

// GET /attendance/:user_id — by user
router.get('/:user_id', attendanceController.getByUser);

// POST /attendance — mark attendance (admin)
router.post('/', requireAdmin, attendanceController.markAttendance);

module.exports = router;
