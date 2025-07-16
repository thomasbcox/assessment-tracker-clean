import { logger } from './logger';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('LogEntry Interface', () => {
    it('should create properly formatted log entries', () => {
      const testMessage = 'Test log message';
      const testData = { key: 'value' };
      const testError = new Error('Test error');

      // Spy on the private formatMessage method by testing the output
      logger.info(testMessage, testData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test log message/),
        testData,
        ''
      );
    });

    it('should include timestamp in ISO format', () => {
      const beforeLog = new Date();
      logger.info('Timestamp test');
      const afterLog = new Date();

      const logCall = mockConsoleLog.mock.calls[0][0] as string;
      const timestampMatch = logCall.match(/\[(.*?)\]/);
      
      expect(timestampMatch).toBeTruthy();
      const timestamp = new Date(timestampMatch![1]);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
    });
  });

  describe('Environment-Specific Behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should log debug messages only in development', () => {
      (process.env as any).NODE_ENV = 'development';
      logger.debug('Debug message in development');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG: Debug message in development/),
        undefined,
        ''
      );

      jest.clearAllMocks();
      (process.env as any).NODE_ENV = 'production';
      logger.debug('Debug message in production');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should log all levels in development', () => {
      (process.env as any).NODE_ENV = 'development';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(4);
    });

    it('should log only errors and warnings in production', () => {
      (process.env as any).NODE_ENV = 'production';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsoleLog).not.toHaveBeenCalled(); // info and debug not logged
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });
  });

  describe('dbError', () => {
    it('should log database errors with context', () => {
      const error = new Error('Database connection failed');
      const context = 'fetching users';

      logger.dbError(context, error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database Error: fetching users/),
        undefined,
        error
      );
    });

    it('should handle errors without context', () => {
      const error = new Error('Unknown database error');

      logger.dbError('', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database Error: /),
        undefined,
        error
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error message';
      const context = 'test operation';

      logger.dbError(context, error as any);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database Error: test operation/),
        undefined,
        error
      );
    });

    it('should include query data when provided', () => {
      const error = new Error('Query failed');
      const context = 'SELECT users';
      const queryData = { table: 'users', limit: 10 };

      logger.dbError(context, error, queryData);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Database Error: SELECT users/),
        queryData,
        error
      );
    });
  });

  describe('apiError', () => {
    it('should log API errors with context', () => {
      const error = new Error('API request failed');
      const context = 'POST /api/users';

      logger.apiError(context, error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: API Error at POST \/api\/users/),
        undefined,
        error
      );
    });

    it('should handle API errors without context', () => {
      const error = new Error('Unknown API error');

      logger.apiError('', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: API Error at /),
        undefined,
        error
      );
    });

    it('should include request data when provided', () => {
      const error = new Error('Validation failed');
      const context = 'POST /api/users';
      const requestData = { email: 'test@example.com', name: 'Test User' };

      logger.apiError(context, error, requestData);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: API Error at POST \/api\/users/),
        requestData,
        error
      );
    });
  });

  describe('authError', () => {
    it('should log authentication errors with context', () => {
      const error = new Error('Invalid token');
      const context = 'token verification';

      logger.authError(context, error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Authentication Error: token verification/),
        undefined,
        error
      );
    });

    it('should handle auth errors without context', () => {
      const error = new Error('Unknown auth error');

      logger.authError('', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Authentication Error: /),
        undefined,
        error
      );
    });

    it('should include user data when provided', () => {
      const error = new Error('Login failed');
      const context = 'user login';
      const userData = { email: 'test@example.com', ip: '192.168.1.1' };

      logger.authError(context, error, userData);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Authentication Error: user login/),
        userData,
        error
      );
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      const message = 'User logged in successfully';

      logger.info(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: User logged in successfully/),
        undefined,
        ''
      );
    });

    it('should handle empty info messages', () => {
      logger.info('');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: /),
        undefined,
        ''
      );
    });

    it('should include data when provided', () => {
      const message = 'User action completed';
      const data = { userId: '123', action: 'profile_update' };

      logger.info(message, data);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: User action completed/),
        data,
        ''
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const message = 'Deprecated API endpoint used';

      logger.warn(message);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/WARN: Deprecated API endpoint used/),
        undefined,
        undefined
      );
    });

    it('should handle empty warning messages', () => {
      logger.warn('');

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/WARN: /),
        undefined,
        undefined
      );
    });

    it('should include data and error when provided', () => {
      const message = 'Configuration warning';
      const data = { configKey: 'deprecated_setting' };
      const error = new Error('Deprecated configuration used');

      logger.warn(message, data, error);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/WARN: Configuration warning/),
        data,
        error
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      (process.env as any).NODE_ENV = 'development';
      const message = 'Processing request data';

      logger.debug(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG: Processing request data/),
        undefined,
        ''
      );
    });

    it('should handle empty debug messages', () => {
      (process.env as any).NODE_ENV = 'development';
      logger.debug('');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG: /),
        undefined,
        ''
      );
    });

    it('should include data when provided', () => {
      (process.env as any).NODE_ENV = 'development';
      const message = 'Request processed';
      const data = { method: 'GET', path: '/api/users' };

      logger.debug(message, data);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG: Request processed/),
        data,
        ''
      );
    });
  });

  describe('error', () => {
    it('should log general errors', () => {
      const error = new Error('General application error');

      logger.error('General application error', null, error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: General application error/),
        null,
        error
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';

      logger.error('String error', null, error as any);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: String error/),
        null,
        error
      );
    });

    it('should handle missing error parameter', () => {
      logger.error('Error without error object');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Error without error object/),
        undefined,
        ''
      );
    });

    it('should include data when provided', () => {
      const error = new Error('Processing error');
      const data = { input: 'test data', timestamp: Date.now() };

      logger.error('Processing failed', data, error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Processing failed/),
        data,
        error
      );
    });
  });

  describe('Logging Levels', () => {
    it('should use appropriate console methods for different levels', () => {
      const testError = new Error('Test error');
      const testMessage = 'Test message';

      logger.error(testMessage, null, testError);
      logger.warn(testMessage);
      logger.info(testMessage);
      logger.debug(testMessage);
      logger.dbError('test', testError);

      expect(mockConsoleError).toHaveBeenCalledTimes(2); // error + dbError
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledTimes(2); // info + debug
    });
  });

  describe('Error Object Handling', () => {
    it('should handle Error objects with stack traces', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error with stack\n    at test.js:1:1';

      logger.error('Test error with stack', null, error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Test error with stack/),
        null,
        error
      );
    });

    it('should handle custom error objects', () => {
      const customError = {
        name: 'CustomError',
        message: 'Custom error message',
        code: 'CUSTOM_001',
      };

      logger.error('Custom error message', null, customError as any);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Custom error message/),
        null,
        customError
      );
    });

    it('should handle null and undefined errors gracefully', () => {
      logger.error('Error with null', null, null as any);
      logger.error('Error with undefined', null, undefined);

      expect(mockConsoleError).toHaveBeenCalledTimes(2);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Error with null/),
        null,
        null
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR: Error with undefined/),
        null,
        undefined
      );
    });
  });

  describe('Data Parameter Handling', () => {
    it('should handle various data types', () => {
      const stringData = 'string data';
      const numberData = 42;
      const booleanData = true;
      const objectData = { key: 'value' };
      const arrayData = [1, 2, 3];
      const nullData = null;
      const undefinedData = undefined;

      logger.info('String data', stringData);
      logger.info('Number data', numberData);
      logger.info('Boolean data', booleanData);
      logger.info('Object data', objectData);
      logger.info('Array data', arrayData);
      logger.info('Null data', nullData);
      logger.info('Undefined data', undefinedData);

      expect(mockConsoleLog).toHaveBeenCalledTimes(7);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };

      logger.info('Complex data logged', complexData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: Complex data logged/),
        complexData,
        ''
      );
    });
  });

  describe('Message Formatting', () => {
    it('should handle messages with special characters', () => {
      const specialMessage = 'Message with: colons, commas, and "quotes"';
      
      logger.info(specialMessage);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: Message with: colons, commas, and "quotes"/),
        undefined,
        ''
      );
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      
      logger.info(longMessage);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`INFO: ${'A'.repeat(1000)}`)),
        undefined,
        ''
      );
    });

    it('should handle unicode characters', () => {
      const unicodeMessage = 'Message with émojis 🚀 and ñ characters';
      
      logger.info(unicodeMessage);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/INFO: Message with émojis 🚀 and ñ characters/),
        undefined,
        ''
      );
    });
  });
}); 