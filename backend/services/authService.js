const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { generateStudentId } = require('../utils/studentId');
const { sendStudentIdEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

class AuthService {
  async register({ email, password, firstName, lastName, role }) {
    // Check existing user
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    // Generate unique student_id
    let studentId;
    let attempts = 0;
    do {
      studentId = generateStudentId();
      attempts++;
      if (attempts > 10) throw new Error('Failed to generate unique student ID');
    } while (await userRepository.studentIdExists(studentId));

    // Hash password
    const hashed = await bcrypt.hash(password, 12);

    // Create user
    const user = await userRepository.create({
      email,
      password: hashed,
      studentId,
      role: role || 'student',
      firstName,
      lastName,
    });

    // Send welcome email (non-blocking)
    sendStudentIdEmail({ email, studentId, firstName }).catch((err) =>
      logger.error('Failed to send welcome email', err)
    );

    const token = this._generateToken(user);
    return { user, token };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.is_active) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Remove password before returning
    delete user.password;
    const token = this._generateToken(user);
    return { user, token };
  }

  _generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, studentId: user.student_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }
}

module.exports = new AuthService();
