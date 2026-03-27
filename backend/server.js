require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

// Routes
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const attendanceRoutes = require('./routes/attendance');
const gradeRoutes = require('./routes/grades');
const lessonRoutes = require('./routes/lessons');
const adminRoutes = require('./routes/admin');
const courseRoutes = require('./routes/courses');
const sessionRoutes = require('./routes/sessions');
const announcementRoutes = require('./routes/announcements');
const automationRoutes = require('./routes/automation');
const sessionProgressRoutes = require('./routes/sessionProgress');
const scheduler = require('./services/automation/scheduler');
const { startEmailWorker, stopEmailWorker } = require('./utils/emailWorker');
const { close: closeEmailQueue } = require('./utils/emailQueue');

const app = express();

// ─────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ─────────────────────────────────────────
// Request Logging
// ─────────────────────────────────────────
app.use(requestLogger);

// ─────────────────────────────────────────
// Body Parsers
// ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────
// Static Files (uploaded lessons)
// ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/session-progress', sessionProgressRoutes);

// ─────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 10 MB.' });
  }

  res.status(err.statusCode || 500).json({
    message: err.statusCode ? err.message : 'Internal server error',
  });
});

// ─────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV });
    // Start automation scheduler
    scheduler.start();
    // Start BullMQ email worker (no-op if Redis not configured)
    startEmailWorker();
  });

  // ─────────────────────────────────────────
  // Graceful Shutdown
  // ─────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received – shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        scheduler.stop();
        await stopEmailWorker();
        await closeEmailQueue();
        const pool = require('./config/database');
        await pool.end();
        logger.info('Database pool closed');
      } catch (err) {
        logger.error('Error during shutdown', { error: err.message });
      }
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out – forcing exit');
      process.exit(1);
    }, 15000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
  });
}

module.exports = app;
