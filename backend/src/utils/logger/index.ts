import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const logsDir = process.env.LOGGER_PATH || path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
);

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new transports.File({ filename: path.join(logsDir, 'full.log') }),
    new transports.Console()
  ]
});

export default logger;
