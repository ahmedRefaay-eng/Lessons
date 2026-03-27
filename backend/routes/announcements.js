const express = require('express');
const announcementController = require('../controllers/announcementController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /announcements — list all published announcements (students see published only)
router.get('/', announcementController.getAll);

// GET /announcements/:id — single announcement
router.get('/:id', announcementController.getById);

// POST /announcements — create announcement (admin)
router.post('/', requireAdmin, announcementController.create);

// PUT /announcements/:id — update announcement (admin)
router.put('/:id', requireAdmin, announcementController.update);

// DELETE /announcements/:id — delete announcement (admin)
router.delete('/:id', requireAdmin, announcementController.remove);

module.exports = router;
