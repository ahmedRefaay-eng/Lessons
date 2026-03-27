const pool = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, student_id, role, first_name, last_name, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findByStudentId(studentId) {
    const { rows } = await pool.query(
      'SELECT id, email, student_id, role, first_name, last_name, is_active FROM users WHERE student_id = $1',
      [studentId]
    );
    return rows[0] || null;
  }

  async create({ email, password, studentId, role, firstName, lastName }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password, student_id, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, student_id, role, first_name, last_name, created_at`,
      [email, password, studentId, role || 'student', firstName || null, lastName || null]
    );
    return rows[0];
  }

  async findAll({ role } = {}) {
    let query =
      'SELECT id, email, student_id, role, first_name, last_name, is_active, created_at FROM users';
    const params = [];
    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async findAdminEmails() {
    const { rows } = await pool.query(
      "SELECT email FROM users WHERE role = 'admin' AND is_active = TRUE"
    );
    return rows.map((r) => r.email);
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => fields[k]);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $${keys.length + 1}
       RETURNING id, email, student_id, role, first_name, last_name, is_active`,
      values
    );
    return rows[0] || null;
  }

  async studentIdExists(studentId) {
    const { rows } = await pool.query(
      'SELECT 1 FROM users WHERE student_id = $1',
      [studentId]
    );
    return rows.length > 0;
  }
}

module.exports = new UserRepository();
