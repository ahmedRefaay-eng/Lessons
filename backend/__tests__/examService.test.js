// Mock DB before requiring modules
jest.mock('../config/database', () => ({ query: jest.fn() }));

const db = require('../config/database');
const examService = require('../services/examService');

describe('ExamService.startExam', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should throw 404 if exam not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // findById
    await expect(examService.startExam(1, 999, 'STU-XXXXXXXX'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 403 if exam is not active', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, is_active: false }] }); // findById exam
    await expect(examService.startExam(1, 1, 'STU-XXXXXXXX'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('should throw 403 if student_id does not match', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, is_active: true }] })  // findById exam
      .mockResolvedValueOnce({ rows: [{ id: 1, student_id: 'STU-REALIDXX', is_active: true }] }); // findById user
    await expect(examService.startExam(1, 1, 'STU-WRONGXXX'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('should throw 403 if user not allowed', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, is_active: true }] })  // exam
      .mockResolvedValueOnce({ rows: [{ id: 1, student_id: 'STU-CORRECT1', is_active: true }] }) // user
      .mockResolvedValueOnce({ rows: [] }); // getAccess -> no access record
    await expect(examService.startExam(1, 1, 'STU-CORRECT1'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('should succeed when all checks pass', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, is_active: true, title: 'Math' }] })   // exam
      .mockResolvedValueOnce({ rows: [{ id: 1, student_id: 'STU-CORRECT1', is_active: true }] }) // user
      .mockResolvedValueOnce({ rows: [{ user_id: 1, exam_id: 1, allowed: true }] })   // access
      .mockResolvedValueOnce({ rows: [{ user_id: 1, exam_id: 1, entered_with_id: true }] }) // markStarted
      .mockResolvedValueOnce({ rows: [{ user_id: 1, exam_id: 1, status: 'present' }] }); // attendance
    const result = await examService.startExam(1, 1, 'STU-CORRECT1');
    expect(result).toHaveProperty('message', 'Exam access granted');
  });
});
