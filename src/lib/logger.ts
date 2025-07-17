type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  // BLESSED PATTERN: Check environment dynamically, not at instantiation
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
    };
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry = this.formatMessage(level, message, data, error);
    
    // BLESSED PATTERN: Check environment dynamically in each log call
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      let logLine = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
      if (
        data !== undefined &&
        data !== null &&
        !(typeof data === 'object' && Object.keys(data).length === 0)
      ) {
        logLine += ` ${JSON.stringify(data)}`;
      }
      if (error) {
        logLine += ' ' + (error.stack || error.toString());
      }
      console[consoleMethod](logLine);
    } else {
      // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
      // For now, we'll just use console
      if (level === 'error' || level === 'warn') {
        let logLine = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
        if (
          data !== undefined &&
          data !== null &&
          !(typeof data === 'object' && Object.keys(data).length === 0)
        ) {
          logLine += ` ${JSON.stringify(data)}`;
        }
        if (error) {
          logLine += ' ' + (error.stack || error.toString());
        }
        console[level](logLine);
      }
    }
  }

  debug(message: string, data?: any) {
    // BLESSED PATTERN: Check environment dynamically
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  error(message: string, dataOrError?: any, error?: Error) {
    if (dataOrError instanceof Error && !error) {
      this.log('error', message, undefined, dataOrError);
    } else {
      this.log('error', message, dataOrError, error);
    }
  }

  warn(message: string, dataOrError?: any, error?: Error) {
    if (dataOrError instanceof Error && !error) {
      this.log('warn', message, undefined, dataOrError);
    } else {
      this.log('warn', message, dataOrError, error);
    }
  }

  // Convenience method for API errors
  apiError(endpoint: string, error: Error, requestData?: any) {
    this.error(`API Error at ${endpoint}`, requestData, error);
  }

  // Convenience method for authentication errors
  authError(action: string, error: Error, userData?: any) {
    this.error(`Authentication Error: ${action}`, userData, error);
  }

  // Convenience method for database errors
  dbError(operation: string, error: Error, queryData?: any) {
    this.error(`Database Error: ${operation}`, queryData, error);
  }
}

export const logger = new Logger(); 