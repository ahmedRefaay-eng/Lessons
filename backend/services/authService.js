const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { generateStudentId } = require('../utils/studentId');
const { onUserRegistered } = require('./automation/registrationAutomation');
const logger = require('../utils/logger');

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

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

    // Fire-and-forget: registration automation (welcome email + dashboard URL)
    onUserRegistered({ email, studentId, firstName }).catch((err) =>
      logger.error('[AuthService] Registration automation failed', { email, error: err.message })
    );

    const token = this._generateAccessToken(user);
    const refreshToken = this._generateRefreshToken(user);
    return { user, token, refreshToken };
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
    const token = this._generateAccessToken(user);
    const refreshToken = this._generateRefreshToken(user);
    return { user, token, refreshToken };
  }

  /**
   * Issue a new access token from a valid refresh token.
   * The refresh token is stateless – no DB lookup required.
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      const err = new Error('Refresh token required');
      err.statusCode = 401;
      throw err;
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, this._refreshSecret());
    } catch (e) {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }

    if (decoded.type !== 'refresh') {
      const err = new Error('Invalid token type');
      err.statusCode = 401;
      throw err;
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.is_active) {
      const err = new Error('User not found or deactivated');
      err.statusCode = 401;
      throw err;
    }

    const token = this._generateAccessToken(user);
    return { token };
  }

  _generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, studentId: user.student_id },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  _generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      this._refreshSecret(),
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  }

  _refreshSecret() {
    return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
  }
}

module.exports = new AuthService();
