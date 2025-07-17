// Logger Test Policy:
// - Do NOT mock console or the logger in these tests.
// - Always capture and assert on real console output.
// - Verify environment-specific output (development, test, production).
// - This is enforced by the custom ESLint rule: no-logger-mocking-in-tests.

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { logger } from './logger';

// Capture console output for testing
let consoleOutput: string[] = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('Logger Utility', () => {
  beforeEach(() => {
    // Reset environment and capture console output
    (process.env as any).NODE_ENV = 'test';
    consoleOutput = [];
    
    // Capture console output
    console.log = (...args: any[]) => {
      consoleOutput.push(args.join(' '));
      originalConsoleLog(...args);
    };
    console.error = (...args: any[]) => {
      consoleOutput.push(args.join(' '));
      originalConsoleError(...args);
    };
    console.warn = (...args: any[]) => {
      consoleOutput.push(args.join(' '));
      originalConsoleWarn(...args);
    };
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Basic Logging', () => {
    it('should log info messages with correct format in development', () => {
      (process.env as any).NODE_ENV = 'development';
      logger.info('Test info message');
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test info message/);
    });

    it('should not log info messages in test environment', () => {
      (process.env as any).NODE_ENV = 'test';
      logger.info('Test info message');
      
      expect(consoleOutput).toHaveLength(0);
    });

    it('should log error messages with correct format', () => {
      logger.error('Test error message');
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] ERROR: Test error message/);
    });

    it('should log warning messages with correct format', () => {
      logger.warn('Test warning message');
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] WARN: Test warning message/);
    });

    it('should log debug messages in development environment', () => {
      (process.env as any).NODE_ENV = 'development';
      logger.debug('Test debug message');
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] DEBUG: Test debug message/);
    });

    it('should not log debug messages in production environment', () => {
      (process.env as any).NODE_ENV = 'production';
      logger.debug('Test debug message');
      
      expect(consoleOutput).toHaveLength(0);
    });
  });

  describe('Log Formatting', () => {
    it('should include ISO timestamp in logs', () => {
      const beforeLog = new Date();
      logger.error('Test message');
      const afterLog = new Date();

      expect(consoleOutput).toHaveLength(1);
      const logLine = consoleOutput[0];
      const timestampMatch = logLine.match(/\[([^\]]+)\]/);
      
      expect(timestampMatch).toBeTruthy();
      if (timestampMatch) {
        const timestamp = new Date(timestampMatch[1]);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
        expect(timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
        expect(timestamp.toISOString()).toBe(timestampMatch[1]); // Verify ISO format
      }
    });

    it('should format log levels in uppercase', () => {
      logger.error('Error message');
      logger.warn('Warning message');

      expect(consoleOutput).toHaveLength(2);
      expect(consoleOutput[0]).toMatch(/ERROR: Error message/);
      expect(consoleOutput[1]).toMatch(/WARN: Warning message/);
    });
  });

  describe('Error Logging', () => {
    it('should log Error objects with context', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { context: 'test' }, error);
      
      expect(consoleOutput).toHaveLength(1);
      const logLine = consoleOutput[0];
      expect(logLine).toMatch(/ERROR: Error occurred/);
      expect(logLine).toContain('Error: Test error');
    });

    it('should log errors without additional context', () => {
      const error = new Error('Simple error');
      logger.error('Error occurred', error);
      
      expect(consoleOutput).toHaveLength(1);
      const logLine = consoleOutput[0];
      expect(logLine).toMatch(/ERROR: Error occurred/);
      expect(logLine).toContain('Error: Simple error');
    });
  });

  describe('Database Error Logging', () => {
    it('should log database errors with operation context', () => {
      const error = new Error('Database connection failed');
      logger.dbError('fetching users', error);
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/ERROR: Database Error: fetching users/);
      expect(consoleOutput[0]).toContain('Error: Database connection failed');
    });

    it('should handle database errors with query data', () => {
      const error = new Error('Query timeout');
      const queryData = { table: 'users', where: { id: 1 } };
      logger.dbError('fetching users', error, queryData);
      
      expect(consoleOutput).toHaveLength(1);
      const logLine = consoleOutput[0];
      expect(logLine).toMatch(/ERROR: Database Error: fetching users/);
      expect(logLine).toContain('Error: Query timeout');
    });
  });

  describe('Environment-Based Logging', () => {
    it('should log all levels in development environment', () => {
      (process.env as any).NODE_ENV = 'development';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleOutput).toHaveLength(4);
      expect(consoleOutput[0]).toMatch(/DEBUG: Debug message/);
      expect(consoleOutput[1]).toMatch(/INFO: Info message/);
      expect(consoleOutput[2]).toMatch(/WARN: Warning message/);
      expect(consoleOutput[3]).toMatch(/ERROR: Error message/);
    });

    it('should log only errors and warnings in production environment', () => {
      (process.env as any).NODE_ENV = 'production';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleOutput).toHaveLength(2);
      expect(consoleOutput[0]).toMatch(/WARN: Warning message/);
      expect(consoleOutput[1]).toMatch(/ERROR: Error message/);
    });

    it('should log only errors and warnings in test environment', () => {
      (process.env as any).NODE_ENV = 'test';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleOutput).toHaveLength(2);
      expect(consoleOutput[0]).toMatch(/WARN: Warning message/);
      expect(consoleOutput[1]).toMatch(/ERROR: Error message/);
    });
  });

  describe('Context Logging', () => {
    it('should log with additional context data in development', () => {
      (process.env as any).NODE_ENV = 'development';
      const context = { userId: '123', operation: 'login' };
      logger.info('User logged in', context);
      
      expect(consoleOutput).toHaveLength(1);
      const logLine = consoleOutput[0];
      expect(logLine).toMatch(/INFO: User logged in/);
      expect(logLine).toContain('userId');
      expect(logLine).toContain('operation');
    });

    it('should handle complex context objects in development', () => {
      (process.env as any).NODE_ENV = 'development';
      const context = { 
        user: { id: 1, email: 'test@example.com' },
        metadata: { timestamp: Date.now() }
      };
      logger.info('Complex operation', context);
      
      expect(consoleOutput).toHaveLength(1);
      const logLine = consoleOutput[0];
      expect(logLine).toMatch(/INFO: Complex operation/);
      expect(logLine).toContain('user');
      expect(logLine).toContain('metadata');
    });

    it('should not log info messages with context in test environment', () => {
      (process.env as any).NODE_ENV = 'test';
      const context = { userId: '123', operation: 'login' };
      logger.info('User logged in', context);
      
      expect(consoleOutput).toHaveLength(0);
    });
  });

  describe('Specialized Error Methods', () => {
    it('should log API errors with endpoint context', () => {
      const error = new Error('Network timeout');
      logger.apiError('/api/users', error, { method: 'GET' });
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/ERROR: API Error at \/api\/users/);
      expect(consoleOutput[0]).toContain('Error: Network timeout');
    });

    it('should log authentication errors with action context', () => {
      const error = new Error('Invalid token');
      logger.authError('token verification', error, { userId: '123' });
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/ERROR: Authentication Error: token verification/);
      expect(consoleOutput[0]).toContain('Error: Invalid token');
    });
  });
}); 