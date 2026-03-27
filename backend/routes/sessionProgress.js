const express = require('express');
const { authenticate } = require('../middleware/auth');
const sessionProgressController = require('../controllers/sessionProgressController');

const router = express.Router();

router.use(authenticate);

// POST /api/session-progress/:sessionId/complete  – mark session done
router.post('/:sessionId/complete', sessionProgressController.markCompleted);

// GET  /api/session-progress/me  – get my progress + per-course summary
router.get('/me', sessionProgressController.getProgress);

module.exports = router;
