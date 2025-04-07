import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const winstonConfig = {
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('App', {
          prettyPrint: true,
        }),
      ),
    }),

    // Error logs with rotation
    new DailyRotateFile({
      filename: 'logs/%DATE%-error.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      //maxFiles: '14d', // Keep logs for 14 days
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // Combined logs with rotation
    new DailyRotateFile({
      filename: 'logs/%DATE%-combined.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      //maxFiles: '14d', // Keep logs for 14 days
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
