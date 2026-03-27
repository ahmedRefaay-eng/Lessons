const { body } = require('express-validator');
const adminService = require('../services/adminService');
const { validate } = require('../middleware/validate');

async function getUsers(req, res, next) {
  try {
    const { role } = req.query;
    const validRoles = ['student', 'admin'];
    const safeRole = role && validRoles.includes(role) ? role : undefined;
    const users = await adminService.getUsers(safeRole ? { role: safeRole } : undefined);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function getReports(req, res, next) {
  try {
    const data = await adminService.getReports();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const user = await adminService.toggleUserStatus(parseInt(req.params.id, 10));
    res.json({ message: 'User status updated', user });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function createAdmin(req, res, next) {
  try {
    const { email, password, first_name, last_name } = req.body;
    const user = await adminService.createAdmin({
      email,
      password,
      firstName: first_name,
      lastName: last_name,
    });
    res.status(201).json({ message: 'Admin account created', user });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function changeUserRole(req, res, next) {
  try {
    const user = await adminService.changeUserRole(parseInt(req.params.id, 10), req.body.role);
    res.json({ message: 'User role updated', user });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

const createAdminValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const changeRoleValidation = [
  body('role').isIn(['student', 'admin']).withMessage('Role must be "student" or "admin"'),
];

module.exports = {
  getUsers,
  getReports,
  toggleUserStatus,
  createAdmin: [createAdminValidation, validate, createAdmin],
  changeUserRole: [changeRoleValidation, validate, changeUserRole],
};
