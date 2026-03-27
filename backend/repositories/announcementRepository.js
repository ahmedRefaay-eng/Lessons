const pool = require('../config/database');

class AnnouncementRepository {
  async create({ title, body, createdBy }) {
    const { rows } = await pool.query(
      `INSERT INTO announcements (title, body, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, body, createdBy]
    );
    return rows[0];
  }

  async findAll(publishedOnly = false) {
    const where = publishedOnly ? 'WHERE a.is_published = TRUE' : '';
    const { rows } = await pool.query(
      `SELECT a.*, u.first_name AS created_by_name, u.email AS created_by_email
       FROM announcements a LEFT JOIN users u ON a.created_by = u.id
       ${where}
       ORDER BY a.created_at DESC`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT a.*, u.first_name AS created_by_name, u.email AS created_by_email
       FROM announcements a LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async update(id, fields) {
    const allowed = ['title', 'body', 'is_published'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => fields[k]);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE announcements SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = new AnnouncementRepository();
