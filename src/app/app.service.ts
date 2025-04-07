import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
//import { Redis } from 'ioredis';

@Injectable()
export class AppService {
  private logsDir = path.join(__dirname, '..', '..', 'logs');
  //private readonly redis: Redis = new Redis(process.env.REDIS_URL || '');
  //private readonly contextExpirationTime = 3600; // Expiration Time In Seconds (1 hour)

  constructor(private readonly configService: ConfigService) {}

  runapp(): string {
    // Read the server name from environment variables
    const serverName = this.configService.get<string>('PLATFORM_NAME');
    return serverName + ' server is online';
  }

  // Get both .log and .json log files
  async getLogFiles(): Promise<string[]> {
    const files = await fs.readdir(this.logsDir);
    return files.filter(
      (file) => file.endsWith('.log') || file.endsWith('.json'),
    );
  }

  // Read the content of a log or json file
  async getLogFileContent(filename: string): Promise<object[]> {
    const filePath = path.join(this.logsDir, filename);
    const content = await fs.readFile(filePath, 'utf8');

    // Check if the file is a JSON log
    if (filename.endsWith('.json')) {
      // Split and parse the file by lines in case it's line-by-line JSON logging
      return content
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => {
          const log = JSON.parse(line);
          log.timestamp = dayjs(log.timestamp).format(
            'ddd DD, MMMM YYYY - hh:mm:ssa',
          );
          return log;
        });
    }

    // Handle the .log file (assumed to be human-readable logs)
    if (filename.endsWith('.log')) {
      return content
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => {
          const [timestamp, level, ...messageParts] = line.split(' '); // Assuming format: "timestamp [LEVEL]: message"
          const message = messageParts.join(' ').split('\n')[0]; // Rest is the message
          return {
            timestamp: dayjs(timestamp).format('ddd DD, MMMM YYYY - hh:mm:ssa'),
            level: level.replace(/[[\]]/g, ''),
            message: message,
          };
        });
    }

    return [];
  }

  // Delete a specific log file
  async deleteLogFile(filename: string): Promise<void> {
    const filePath = path.join(this.logsDir, filename);
    await fs.unlink(filePath);
  }

  // Delete all log files
  async deleteAllLogFiles(): Promise<void> {
    const files = await this.getLogFiles();
    for (const file of files) {
      await this.deleteLogFile(file);
    }
  }
}
