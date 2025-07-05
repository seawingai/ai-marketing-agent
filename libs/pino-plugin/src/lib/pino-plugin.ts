export function pinoPlugin(): string {
  return 'pino-plugin';
}

import pino from 'pino';
import * as path from 'path';
import * as fs from 'fs';

export class PinoPlugin {
  private name: string;
  private logger: pino.Logger;

  constructor(name: string) {
    this.name = name;
    
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, `${name}.log`);

    // Create transport configuration with fallback
    const createConsoleTransport = () => {
      try {
        return pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            messageFormat: '{msg}',
          },
        });
      } catch (error) {
        // Fallback to basic console transport if pino-pretty is not available
        return pino.destination(1); // stdout
      }
    };

    this.logger = pino({
      level: process.env['SERVICE_LOG_LEVEL'] || 'info',
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
    }, pino.multistream([
      // Console transport with pretty printing
      {
        level: 'info',
        stream: createConsoleTransport(),
      },
      // File transport
      {
        level: 'info',
        stream: pino.destination({
          dest: logFile,
          sync: false,
          mkdir: true,
        }),
      },
    ]));

    this.logger.info(`Logger initialized: [${this.name}]`);
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    let secs = Math.round(seconds % 60);
    // Handle case where rounding seconds hits 60
    if (secs === 60) {
      secs = 0;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private log(message: string, type: string, icon: string, startTime?: number): number {
    let timeSpent = 0;
    
    if (startTime) {
      timeSpent = (Date.now() - startTime) / 1000;
      this.logger.info(`[${this.name}]: Duration:[${this.formatDuration(timeSpent)}]: ${message}`);
    } else {
      this.logger.info(`[${this.name}]: ${message}`);
    }

    return Number(timeSpent.toFixed(2));
  }

  started(message: string, startTime?: number): number {
    return this.log(message, 'STARTED', '>', startTime);
  }

  finished(message: string, startTime?: number): number {
    return this.log(message, 'FINISHED', '✓', startTime);
  }

  success(message: string, startTime?: number): number {
    return this.log(message, 'SUCCESS', '+', startTime);
  }

  failed(message: string, startTime?: number): number {
    return this.log(message, 'FAILED', 'x', startTime);
  }

  info(message: string, startTime?: number): number {
    return this.log(message, 'INFO', 'i', startTime);
  }
  
  warn(message: string, startTime?: number): number {
    return this.log(message, 'WARN', '', startTime);
  }
    
  debug(message: string, startTime?: number): number {
    return this.log(message, 'DEBUG', '', startTime);
  }

  error(message: string, err?: unknown, stack: boolean = true): void {
    if (err) {
      let error = err instanceof Error ? err : new Error(String(err))

      this.logger.error(
        `[${this.name}]: ${message}: ${error.message}`,
        stack ? { stack: error.stack } : undefined
      );
    } else {
      this.logger.error(`[${this.name}]: ${message}`);
    }
  }

  log2(message: string, rec: Record<string, any>): void {
    console.log(`${message} JSON.stringify(rec)`); 
  }

  info2(message: string, rec: Record<string, any>): void {
    this.log2(message, rec);
  }

  debug2(message: string, rec: Record<string, any>): void {
    this.log2(message, rec);
  }

  error2(message: string, rec: Record<string, any>): void {
    this.log2(message, rec);
  }
}

// Create a default logger instance
export const logger = new PinoPlugin('app');

// Export the Logger class for custom instances
export { PinoPlugin as Logger }; 