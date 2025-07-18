import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { logger } from './logger';

describe('Logger', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }
  });

  const setNodeEnv = (env: string) => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: env,
      writable: true,
      configurable: true,
    });
  };

  describe('Development Environment', () => {
    beforeEach(() => {
      setNodeEnv('development');
    });

    it('should log debug messages in development', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.debug('Test debug message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Test debug message')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log info messages in development', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test info message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log warning messages in development', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      logger.warn('Test warning message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log error messages in development', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logger.error('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message')
      );
      
      consoleSpy.mockRestore();
    });

    it('should include data in log messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('User action', { userId: '123', action: 'login' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: User action')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"userId":"123","action":"login"}')
      );
      
      consoleSpy.mockRestore();
    });

    it('should include error stack traces', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');
      
      logger.error('Error occurred', undefined, testError);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error occurred')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Test error')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      setNodeEnv('production');
    });

    it('should not log debug messages in production', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.debug('Test debug message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should not log info messages in production', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test info message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should log warning messages in production', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      logger.warn('Test warning message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log error messages in production', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logger.error('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Specialized Logging Methods', () => {
    beforeEach(() => {
      setNodeEnv('development');
    });

    it('should log API errors with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('API Error');
      
      logger.apiError('/api/users', testError, { method: 'GET' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: API Error at /api/users')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"method":"GET"}')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log authentication errors with user context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Auth failed');
      
      logger.authError('token verification', testError, { userId: '123' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Authentication Error: token verification')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"userId":"123"}')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log database errors with query context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Database connection failed');
      
      logger.dbError('fetching users', testError, { table: 'users', query: 'SELECT * FROM users' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Database Error: fetching users')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"table":"users","query":"SELECT * FROM users"}')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Message Formatting', () => {
    beforeEach(() => {
      setNodeEnv('development');
    });

    it('should include timestamp in log messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const beforeTime = new Date().toISOString();
      
      logger.info('Test message');
      
      const afterTime = new Date().toISOString();
      const logCall = consoleSpy.mock.calls[0][0];
      
      // Extract timestamp from log message
      const timestampMatch = logCall.match(/\[(.*?)\]/);
      expect(timestampMatch).toBeTruthy();
      
      const logTime = timestampMatch![1];
      expect(logTime >= beforeTime && logTime <= afterTime).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should handle empty data gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test message', {});
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test message')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.not.stringContaining('{}')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle null data gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test message', null);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test message')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.not.stringContaining('null')
      );
      
      consoleSpy.mockRestore();
    });
  });
}); 