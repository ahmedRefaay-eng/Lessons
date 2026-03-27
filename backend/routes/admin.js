const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

// GET /admin/users — list all users
router.get('/users', adminController.getUsers);

// GET /admin/reports — dashboard reports
router.get('/reports', adminController.getReports);

// PATCH /admin/users/:id/toggle — activate/deactivate user
router.patch('/users/:id/toggle', adminController.toggleUserStatus);

module.exports = router;
