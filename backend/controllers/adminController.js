const adminService = require('../services/adminService');

async function getUsers(req, res, next) {
  try {
    const { role } = req.query;
    const users = await adminService.getUsers(role ? { role } : undefined);
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

module.exports = { getUsers, getReports, toggleUserStatus };
