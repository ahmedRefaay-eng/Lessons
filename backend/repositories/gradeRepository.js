const pool = require('../config/database');

class GradeRepository {
  async upsert({ userId, examId, grade, feedback, gradedBy }) {
    const { rows } = await pool.query(
      `INSERT INTO grades (user_id, exam_id, grade, feedback, graded_by, graded_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, exam_id)
       DO UPDATE SET grade = $3, feedback = $4, graded_by = $5, graded_at = NOW()
       RETURNING *`,
      [userId, examId, grade, feedback || null, gradedBy || null]
    );
    return rows[0];
  }

  async findByUser(userId) {
    const { rows } = await pool.query(
      `SELECT g.*, e.title AS exam_title, e.date AS exam_date
       FROM grades g
       JOIN exams e ON g.exam_id = e.id
       WHERE g.user_id = $1
       ORDER BY e.date DESC`,
      [userId]
    );
    return rows;
  }

  async findByExam(examId) {
    const { rows } = await pool.query(
      `SELECT g.*, u.email, u.student_id, u.first_name, u.last_name
       FROM grades g
       JOIN users u ON g.user_id = u.id
       WHERE g.exam_id = $1
       ORDER BY g.grade DESC`,
      [examId]
    );
    return rows;
  }

  async findAll() {
    const { rows } = await pool.query(
      `SELECT g.*, u.email, u.student_id, u.first_name, u.last_name, e.title AS exam_title
       FROM grades g
       JOIN users u ON g.user_id = u.id
       JOIN exams e ON g.exam_id = e.id
       ORDER BY g.graded_at DESC`
    );
    return rows;
  }

  async getAverageByExam(examId) {
    const { rows } = await pool.query(
      'SELECT AVG(grade) AS average, COUNT(*) AS total FROM grades WHERE exam_id = $1',
      [examId]
    );
    return rows[0];
  }
}

module.exports = new GradeRepository();
