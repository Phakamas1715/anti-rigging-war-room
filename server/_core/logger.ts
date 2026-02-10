/**
 * Structured logging utility
 * In production, consider using Pino or Winston
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = process.env.LOG_LEVEL as LogLevel || level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = error instanceof Error 
        ? { ...context, error: error.message, stack: error.stack }
        : { ...context, error };
      console.error(this.format('error', message, errorContext));
    }
  }
}

export const logger = new Logger();

/**
 * Request logging middleware for tRPC
 */
export function createLoggingMiddleware() {
  return async function loggingMiddleware(opts: { 
    path: string; 
    type: string; 
    next: () => Promise<unknown>; 
  }) {
    const start = Date.now();
    const { path, type } = opts;
    
    try {
      const result = await opts.next();
      const duration = Date.now() - start;
      
      logger.info('tRPC request completed', {
        path,
        type,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error('tRPC request failed', error, {
        path,
        type,
        duration,
      });
      
      throw error;
    }
  };
}
