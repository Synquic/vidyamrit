import morgan, { StreamOptions } from 'morgan';
import fs from 'fs';
import path from 'path';
import { RequestHandler } from 'express';
import logger from './index';
import dotenv from 'dotenv';
dotenv.config();

const logsDir = process.env.LOGGER_PATH || path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const httpLogStream = fs.createWriteStream(path.join(logsDir, 'http.log'), { flags: 'a' });

// Logger to write only HTTP logs to http.log
const httpLogger: RequestHandler = morgan('combined', {
  stream: httpLogStream
});

// Logger to write HTTP logs to Winston (into full.log)
const fullLogger: RequestHandler = morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
});

// Logger to console
const consoleLogger: RequestHandler = morgan('combined');

export default [httpLogger, fullLogger, consoleLogger];
