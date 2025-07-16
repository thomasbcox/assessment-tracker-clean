import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger } from './logger';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: Test info message/)
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Test error message/)
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/WARN: Test warning message/)
      );
    });

    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Test debug message');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG: Test debug message/)
      );
    });
  });

  describe('Log Formatting', () => {
    it('should include timestamp in logs', () => {
      const beforeLog = new Date();
      logger.info('Test message');
      const afterLog = new Date();

      const logCall = mockConsoleLog.mock.calls[0][0] as string;
      const timestampMatch = logCall.match(/\[([^\]]+)\]/);
      
      expect(timestampMatch).toBeTruthy();
      if (timestampMatch) {
        const timestamp = new Date(timestampMatch[1]);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
        expect(timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
      }
    });

    it('should format log levels correctly', () => {
      logger.info('Info message');
      logger.error('Error message');
      logger.warn('Warning message');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: Info message/)
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Error message/)
      );
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/WARN: Warning message/)
      );
    });
  });

  describe('Error Logging', () => {
    it('should log Error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Error occurred/),
        error
      );
    });

    it('should log string errors', () => {
      logger.error('String error message');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: String error message/)
      );
    });

    it('should handle errors with context', () => {
      const error = new Error('Database connection failed');
      logger.error('Database operation failed', error, { operation: 'fetch' });
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database operation failed/),
        error,
        { operation: 'fetch' }
      );
    });
  });

  describe('Database Error Logging', () => {
    it('should log database errors with context', () => {
      const error = new Error('Database connection failed');
      logger.dbError('fetching users', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database Error: fetching users/),
        error
      );
    });

    it('should handle database errors without context', () => {
      const error = new Error('Unknown database error');
      logger.dbError('', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database Error: /),
        error
      );
    });

    it('should handle non-Error objects in database errors', () => {
      const error = 'String error message';
      logger.dbError('test operation', error as any);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database Error: test operation/),
        error
      );
    });
  });

  describe('Environment-Based Logging', () => {
    it('should log all levels in development', () => {
      process.env.NODE_ENV = 'development';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(2); // debug + info
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });

    it('should log only errors and warnings in production', () => {
      process.env.NODE_ENV = 'production';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(0);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Logging', () => {
    it('should log with additional context', () => {
      const context = { userId: '123', operation: 'login' };
      logger.info('User logged in', context);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: User logged in/),
        context
      );
    });

    it('should handle multiple context objects', () => {
      const context1 = { userId: '123' };
      const context2 = { operation: 'login' };
      logger.info('User logged in', context1, context2);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: User logged in/),
        context1,
        context2
      );
    });
  });
}); 