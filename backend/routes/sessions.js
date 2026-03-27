const express = require('express');
const sessionController = require('../controllers/sessionController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /sessions/course/:courseId — list sessions for a course (ordered)
router.get('/course/:courseId', sessionController.getByCourse);

// GET /sessions/:id — single session details
router.get('/:id', sessionController.getById);

// POST /sessions — create session (admin, optional file upload)
router.post('/', requireAdmin, sessionController.create);

// PUT /sessions/:id — update session (admin, optional file upload)
router.put('/:id', requireAdmin, sessionController.update);

// DELETE /sessions/:id — delete session (admin)
router.delete('/:id', requireAdmin, sessionController.remove);

module.exports = router;
