const sessionProgressRepository = require('../repositories/sessionProgressRepository');
const sessionRepository = require('../repositories/sessionRepository');
const logger = require('../utils/logger');

class SessionProgressService {
  /**
   * Mark a session as completed for the authenticated student.
   * Validates that the session exists and is published before recording.
   */
  async markCompleted(userId, sessionId) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
    if (!session.is_published) {
      const err = new Error('Session is not available');
      err.statusCode = 403;
      throw err;
    }

    const record = await sessionProgressRepository.markCompleted(userId, sessionId);
    logger.info('[SessionProgress] Session completed', { userId, sessionId });
    return record;
  }

  /**
   * Get all completed sessions for a user.
   */
  async getProgress(userId) {
    return sessionProgressRepository.findByUser(userId);
  }

  /**
   * Get per-course progress summary for a user.
   */
  async getProgressSummary(userId) {
    return sessionProgressRepository.getSummaryByUser(userId);
  }
}

module.exports = new SessionProgressService();
