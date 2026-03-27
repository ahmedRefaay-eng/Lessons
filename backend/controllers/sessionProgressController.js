const sessionProgressService = require('../services/sessionProgressService');

async function markCompleted(req, res, next) {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    const record = await sessionProgressService.markCompleted(req.user.id, sessionId);
    res.json({ message: 'Session marked as completed', record });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
}

async function getProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const [progress, summary] = await Promise.all([
      sessionProgressService.getProgress(userId),
      sessionProgressService.getProgressSummary(userId),
    ]);
    res.json({ progress, summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { markCompleted, getProgress };
