type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

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
    
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data || '', error || '');
    } else {
      // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
      // For now, we'll just use console
      if (level === 'error' || level === 'warn') {
        console[level](`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data || '', error || '');
      }
    }
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any, error?: Error) {
    this.log('warn', message, data, error);
  }

  error(message: string, data?: any, error?: Error) {
    this.log('error', message, data, error);
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