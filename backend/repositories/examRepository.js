const pool = require('../config/database');

class ExamRepository {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT e.*, u.email AS created_by_email
       FROM exams e
       LEFT JOIN users u ON e.created_by = u.id
       ORDER BY e.date DESC`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM exams WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findActive() {
    const { rows } = await pool.query(
      'SELECT * FROM exams WHERE is_active = TRUE ORDER BY date ASC'
    );
    return rows;
  }

  async create({ title, description, date, duration, isActive, createdBy }) {
    const { rows } = await pool.query(
      `INSERT INTO exams (title, description, date, duration, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description || null, date, duration, isActive || false, createdBy]
    );
    return rows[0];
  }

  async update(id, fields) {
    const allowed = ['title', 'description', 'date', 'duration', 'is_active'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => fields[k]);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE exams SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM exams WHERE id = $1', [id]);
    return rowCount > 0;
  }

  // ExamAccess methods
  async getAccess(userId, examId) {
    const { rows } = await pool.query(
      'SELECT * FROM exam_access WHERE user_id = $1 AND exam_id = $2',
      [userId, examId]
    );
    return rows[0] || null;
  }

  async setAccess({ userId, examId, allowed }) {
    const { rows } = await pool.query(
      `INSERT INTO exam_access (user_id, exam_id, allowed)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, exam_id)
       DO UPDATE SET allowed = $3
       RETURNING *`,
      [userId, examId, allowed]
    );
    return rows[0];
  }

  async markStarted(userId, examId) {
    const { rows } = await pool.query(
      `UPDATE exam_access
       SET entered_with_id = TRUE, started_at = NOW()
       WHERE user_id = $1 AND exam_id = $2
       RETURNING *`,
      [userId, examId]
    );
    return rows[0] || null;
  }

  async getExamStudents(examId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.student_id, u.first_name, u.last_name,
              ea.allowed, ea.entered_with_id, ea.started_at
       FROM exam_access ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.exam_id = $1`,
      [examId]
    );
    return rows;
  }

  async bulkAssignStudents(examId, userIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const userId of userIds) {
        await client.query(
          `INSERT INTO exam_access (user_id, exam_id, allowed)
           VALUES ($1, $2, TRUE)
           ON CONFLICT (user_id, exam_id) DO UPDATE SET allowed = TRUE`,
          [userId, examId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new ExamRepository();
