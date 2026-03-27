const attendanceService = require('../services/attendanceService');

async function getByUser(req, res, next) {
  try {
    const userId = parseInt(req.params.user_id, 10);
    // Students can only view their own; admins can view any
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const records = await attendanceService.getByUser(userId);
    res.json({ attendance: records });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const records = await attendanceService.getAll();
    res.json({ attendance: records });
  } catch (err) {
    next(err);
  }
}

async function markAttendance(req, res, next) {
  try {
    const { user_id, exam_id, status } = req.body;
    if (!['present', 'absent'].includes(status)) {
      return res.status(422).json({ message: "Status must be 'present' or 'absent'" });
    }
    const record = await attendanceService.markAttendance({
      userId: user_id,
      examId: exam_id,
      status,
    });
    res.json({ message: 'Attendance marked', record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

module.exports = { getByUser, getAll, markAttendance };
