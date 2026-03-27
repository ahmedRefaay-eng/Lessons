// Mock dependencies before requiring the module
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/mailer', () => ({
  sendStudentIdEmail: jest.fn().mockResolvedValue(true),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authService = require('../services/authService');

process.env.JWT_SECRET = 'test_secret_key_32_characters_long_ok';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw 409 if email already exists', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com' }] }); // findByEmail
      await expect(
        authService.register({ email: 'a@b.com', password: 'Password1', firstName: 'Test' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('should create user and return token when email is unique', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })           // findByEmail -> not found
        .mockResolvedValueOnce({ rows: [] })           // studentIdExists -> false
        .mockResolvedValueOnce({                       // create user
          rows: [{
            id: 1, email: 'new@test.com', student_id: 'STU-ABCD1234',
            role: 'student', first_name: 'John', last_name: 'Doe', created_at: new Date(),
          }],
        });

      const result = await authService.register({
        email: 'new@test.com',
        password: 'Password1',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('new@test.com');
    });
  });

  describe('login', () => {
    it('should throw 401 for invalid email', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // findByEmail -> not found
      await expect(
        authService.login({ email: 'notfound@test.com', password: 'pass' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 401 for wrong password', async () => {
      const hashed = await bcrypt.hash('CorrectPass1', 12);
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'u@test.com', password: hashed, is_active: true, role: 'student', student_id: 'STU-1234ABCD' }],
      });
      await expect(
        authService.login({ email: 'u@test.com', password: 'WrongPass1' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return token for valid credentials', async () => {
      const hashed = await bcrypt.hash('CorrectPass1', 12);
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'u@test.com', password: hashed, is_active: true, role: 'student', student_id: 'STU-1234ABCD' }],
      });
      const result = await authService.login({ email: 'u@test.com', password: 'CorrectPass1' });
      expect(result).toHaveProperty('token');
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(1);
    });
  });
});
