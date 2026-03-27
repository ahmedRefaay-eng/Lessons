const path = require('path');
const winston = require('winston');

const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');

// JSON format for file transports
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
      })
    ),
  }),
];

// Write to log files in production or when LOG_TO_FILE=true (never in test)
const writeToFiles =
  process.env.NODE_ENV !== 'test' &&
  (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true');

if (writeToFiles) {
  const fs = require('fs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // combined.log – all levels
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 7,
      tailable: true,
    })
  );

  // errors.log – error level only
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'errors.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 14,
      tailable: true,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  transports,
});

module.exports = logger;
