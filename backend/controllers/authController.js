const { body } = require('express-validator');
const authService = require('../services/authService');
const { validate } = require('../middleware/validate');

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName } = req.body;
    const { user, token, refreshToken } = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: 'student', // Public registration always creates students
    });
    res.status(201).json({
      message: 'Registration successful. Your Student ID has been sent to your email.',
      user,
      token,
      refreshToken,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token, refreshToken } = await authService.login({ email, password });
    res.json({ message: 'Login successful', user, token, refreshToken });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const { token } = await authService.refreshAccessToken(refreshToken);
    res.json({ token });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  register: [registerValidation, validate, register],
  login: [loginValidation, validate, login],
  refresh,
  me,
};
