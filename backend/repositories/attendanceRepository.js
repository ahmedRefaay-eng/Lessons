const pool = require('../config/database');

class AttendanceRepository {
  async upsert({ userId, examId, status }) {
    const { rows } = await pool.query(
      `INSERT INTO attendance (user_id, exam_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, exam_id) DO UPDATE SET status = $3, marked_at = NOW()
       RETURNING *`,
      [userId, examId, status]
    );
    return rows[0];
  }

  async findByUser(userId) {
    const { rows } = await pool.query(
      `SELECT a.*, e.title AS exam_title, e.date AS exam_date
       FROM attendance a
       JOIN exams e ON a.exam_id = e.id
       WHERE a.user_id = $1
       ORDER BY e.date DESC`,
      [userId]
    );
    return rows;
  }

  async findByExam(examId) {
    const { rows } = await pool.query(
      `SELECT a.*, u.email, u.student_id, u.first_name, u.last_name
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.exam_id = $1`,
      [examId]
    );
    return rows;
  }

  async countAbsences(userId) {
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM attendance WHERE user_id = $1 AND status = 'absent'",
      [userId]
    );
    return parseInt(rows[0].count, 10);
  }

  async findOne(userId, examId) {
    const { rows } = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND exam_id = $2',
      [userId, examId]
    );
    return rows[0] || null;
  }

  async findAll() {
    const { rows } = await pool.query(
      `SELECT a.*, u.email, u.student_id, u.first_name, u.last_name, e.title AS exam_title
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       JOIN exams e ON a.exam_id = e.id
       ORDER BY a.marked_at DESC`
    );
    return rows;
  }
}

module.exports = new AttendanceRepository();
