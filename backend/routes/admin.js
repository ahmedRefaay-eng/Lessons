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

// POST /admin/users — create a new admin account
router.post('/users', adminController.createAdmin);

// PATCH /admin/users/:id/role — promote or demote user role
router.patch('/users/:id/role', adminController.changeUserRole);

module.exports = router;
