const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const scheduler = require('../services/automation/scheduler');
const { checkAndMarkAbsentees } = require('../services/automation/attendanceAutomation');
const logger = require('../utils/logger');

const router = express.Router();

router.use(authenticate, requireAdmin);

/**
 * GET /api/automation/status
 * Returns scheduler state and last run times.
 */
router.get('/status', (req, res) => {
  res.json({ automation: scheduler.getStatus() });
});

/**
 * POST /api/automation/trigger/absentee-check
 * Manually trigger the absentee check (admin only).
 */
router.post('/trigger/absentee-check', async (req, res, next) => {
  try {
    logger.info('[Automation][Manual] Absentee check triggered by admin', { adminId: req.user.id });
    const result = await checkAndMarkAbsentees();
    res.json({ message: 'Absentee check complete', ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
