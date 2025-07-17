import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger } from './logger';

// BAD: Mocking console methods (violates our policy)
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// BAD: Mocking the logger (violates our policy)
jest.mock('./logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}));

describe('BAD Logger Test (Violates Policy)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log info messages (BAD: using mocks)', () => {
    // BAD: Testing with mocked behavior
    logger.info('Test message');
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringMatching(/INFO: Test message/)
    );
  });

  it('should log error messages (BAD: using mocks)', () => {
    // BAD: Testing with mocked behavior
    logger.error('Test error');
    
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringMatching(/ERROR: Test error/)
    );
  });

  it('should not log debug in production (BAD: using mocks)', () => {
    // BAD: Testing with mocked behavior
    process.env.NODE_ENV = 'production';
    logger.debug('Debug message');
    
    expect(mockConsoleLog).not.toHaveBeenCalled();
  });
}); 