const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { rows } = await pool.query(
      'SELECT id, email, student_id, role, first_name, last_name, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    logger.error('Authentication error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

/**
 * Require student role (or admin)
 */
function requireStudent(req, res, next) {
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireStudent };
