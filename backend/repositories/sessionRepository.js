const pool = require('../config/database');

class SessionRepository {
  async create({ courseId, title, videoUrl, notes, fileUrl, fileName, mimeType, sortOrder, createdBy }) {
    const { rows } = await pool.query(
      `INSERT INTO sessions (course_id, title, video_url, notes, file_url, file_name, mime_type, sort_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [courseId, title, videoUrl || null, notes || null, fileUrl || null, fileName || null, mimeType || null, sortOrder || 0, createdBy]
    );
    return rows[0];
  }

  async findByCourse(courseId, publishedOnly = false) {
    const where = publishedOnly
      ? 'WHERE s.course_id = $1 AND s.is_published = TRUE'
      : 'WHERE s.course_id = $1';
    const { rows } = await pool.query(
      `SELECT s.*, u.email AS created_by_email
       FROM sessions s LEFT JOIN users u ON s.created_by = u.id
       ${where}
       ORDER BY s.sort_order ASC, s.created_at ASC`,
      [courseId]
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT s.*, u.email AS created_by_email, c.title AS course_title
       FROM sessions s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async update(id, fields) {
    const allowed = ['title', 'video_url', 'notes', 'file_url', 'file_name', 'mime_type', 'sort_order', 'is_published'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => fields[k]);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE sessions SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = new SessionRepository();
