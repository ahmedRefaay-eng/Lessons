const pool = require('../config/database');

class SessionProgressRepository {
  /**
   * Mark a session as completed for a user (upsert – idempotent).
   */
  async markCompleted(userId, sessionId) {
    const { rows } = await pool.query(
      `INSERT INTO session_progress (user_id, session_id, completed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, session_id) DO UPDATE SET completed_at = NOW()
       RETURNING *`,
      [userId, sessionId]
    );
    return rows[0];
  }

  /**
   * Get all session progress records for a user.
   */
  async findByUser(userId) {
    const { rows } = await pool.query(
      `SELECT sp.*, s.title AS session_title, s.course_id, c.title AS course_title
       FROM session_progress sp
       JOIN sessions s ON sp.session_id = s.id
       JOIN courses c ON s.course_id = c.id
       WHERE sp.user_id = $1
       ORDER BY sp.completed_at DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * Get progress summary per course for a user.
   * Returns: course_id, course_title, total_sessions, completed_sessions, progress_pct
   */
  async getSummaryByUser(userId) {
    const { rows } = await pool.query(
      `SELECT
         c.id AS course_id,
         c.title AS course_title,
         COUNT(DISTINCT s.id)  AS total_sessions,
         COUNT(DISTINCT sp.session_id) AS completed_sessions,
         CASE WHEN COUNT(DISTINCT s.id) = 0 THEN 0
              ELSE ROUND((COUNT(DISTINCT sp.session_id)::NUMERIC / COUNT(DISTINCT s.id)) * 100, 1)
         END AS progress_pct
       FROM courses c
       JOIN sessions s ON s.course_id = c.id AND s.is_published = TRUE
       LEFT JOIN session_progress sp ON sp.session_id = s.id AND sp.user_id = $1
       GROUP BY c.id, c.title
       ORDER BY c.sort_order ASC`,
      [userId]
    );
    return rows;
  }

  /**
   * Check whether a specific session has been completed by a user.
   */
  async isCompleted(userId, sessionId) {
    const { rows } = await pool.query(
      'SELECT 1 FROM session_progress WHERE user_id = $1 AND session_id = $2',
      [userId, sessionId]
    );
    return rows.length > 0;
  }
}

module.exports = new SessionProgressRepository();
