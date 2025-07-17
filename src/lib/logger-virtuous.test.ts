// Logger Test Policy:
// - Do NOT mock console or the logger in these tests.
// - Always capture and assert on real console output.
// - Verify environment-specific output (development, test, production).
// - This is enforced by the custom ESLint rule: no-logger-mocking-in-tests.

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { logger } from './logger';

// VIRTUOUS: Capture console output for testing (no mocking)
let consoleOutput: string[] = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('VIRTUOUS Logger Test (Follows Policy)', () => {
  beforeEach(() => {
    // Reset environment and capture console output
    (process.env as any).NODE_ENV = 'test';
    consoleOutput = [];
    
    // VIRTUOUS: Capture console output without mocking
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

    it('should log info messages in development environment', () => {
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

  describe('Specialized Error Methods', () => {
    it('should log API errors with endpoint context', () => {
      const error = new Error('Network timeout');
      logger.apiError('/api/users', error, { method: 'GET' });
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/ERROR: API Error at \/api\/users/);
      expect(consoleOutput[0]).toContain('Error: Network timeout');
    });

    it('should log database errors with operation context', () => {
      const error = new Error('Database connection failed');
      logger.dbError('fetching users', error);
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toMatch(/ERROR: Database Error: fetching users/);
      expect(consoleOutput[0]).toContain('Error: Database connection failed');
    });
  });
}); 