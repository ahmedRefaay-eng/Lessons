const pool = require('../config/database');

class LessonRepository {
  async create({ title, content, fileUrl, fileName, mimeType, createdBy }) {
    const { rows } = await pool.query(
      `INSERT INTO lessons (title, content, file_url, file_name, mime_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, content || null, fileUrl || null, fileName || null, mimeType || null, createdBy]
    );
    return rows[0];
  }

  async findAll(publishedOnly = true) {
    const query = publishedOnly
      ? `SELECT l.*, u.email AS created_by_email, u.first_name AS created_by_name
         FROM lessons l LEFT JOIN users u ON l.created_by = u.id
         WHERE l.is_published = TRUE ORDER BY l.created_at DESC`
      : `SELECT l.*, u.email AS created_by_email, u.first_name AS created_by_name
         FROM lessons l LEFT JOIN users u ON l.created_by = u.id
         ORDER BY l.created_at DESC`;
    const { rows } = await pool.query(query);
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT l.*, u.email AS created_by_email FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async update(id, fields) {
    const allowed = ['title', 'content', 'file_url', 'file_name', 'mime_type', 'is_published'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => fields[k]);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE lessons SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = new LessonRepository();
