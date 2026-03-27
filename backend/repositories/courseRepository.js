const pool = require('../config/database');

class CourseRepository {
  async create({ title, description, subject, sortOrder, createdBy }) {
    const { rows } = await pool.query(
      `INSERT INTO courses (title, description, subject, sort_order, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || null, subject || null, sortOrder || 0, createdBy]
    );
    return rows[0];
  }

  async findAll(publishedOnly = false) {
    const where = publishedOnly ? 'WHERE c.is_published = TRUE' : '';
    const { rows } = await pool.query(
      `SELECT c.*, u.email AS created_by_email, u.first_name AS created_by_name,
              COUNT(s.id)::int AS session_count
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN sessions s ON s.course_id = c.id AND s.is_published = TRUE
       ${where}
       GROUP BY c.id, u.email, u.first_name
       ORDER BY c.sort_order ASC, c.created_at DESC`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT c.*, u.email AS created_by_email
       FROM courses c LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async update(id, fields) {
    const allowed = ['title', 'description', 'subject', 'sort_order', 'is_published'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => fields[k]);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE courses SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = new CourseRepository();
