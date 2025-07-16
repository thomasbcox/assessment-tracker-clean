import { sessionManager, Session } from './session';
import { AuthUser } from './auth';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Session Management', () => {
  const testUser: AuthUser = {
    id: 'testuser-session',
    email: 'testuser-session@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  };

  const testToken = 'test-token-12345';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear any existing session
    sessionManager.clearSession();
  });

  afterEach(() => {
    // Clean up after each test
    sessionManager.clearSession();
  });

  describe('createSession', () => {
    it('should create a new session and store it in localStorage', () => {
      sessionManager.createSession(testUser, testToken);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'assessment-tracker-session',
        expect.any(String)
      );

      // Verify the stored session data
      const storedData = mockLocalStorage.setItem.mock.calls[0][1];
      const session: Session = JSON.parse(storedData);

      expect(session.user).toEqual(testUser);
      expect(session.token).toBe(testToken);
      expect(session.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should handle server-side rendering gracefully', () => {
      // Mock window as undefined to simulate SSR
      const originalWindow = global.window;
      delete (global as any).window;

      // Should not throw an error
      expect(() => {
        sessionManager.createSession(testUser, testToken);
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('getSession', () => {
    it('should retrieve a valid session from localStorage', () => {
      // Create a session first
      sessionManager.createSession(testUser, testToken);

      // Mock localStorage.getItem to return the session data
      const sessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      });
      mockLocalStorage.getItem.mockReturnValue(sessionData);

      const session = sessionManager.getSession();

      expect(session).toBeDefined();
      expect(session?.user).toEqual(testUser);
      expect(session?.token).toBe(testToken);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('assessment-tracker-session');
    });

    it('should return null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const session = sessionManager.getSession();

      expect(session).toBeNull();
    });

    it('should return null for expired session', () => {
      const expiredSessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      });
      mockLocalStorage.getItem.mockReturnValue(expiredSessionData);

      const session = sessionManager.getSession();

      expect(session).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('assessment-tracker-session');
    });

    it('should handle malformed session data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const session = sessionManager.getSession();

      expect(session).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('assessment-tracker-session');
    });

    it('should handle server-side rendering gracefully', () => {
      // Mock window as undefined to simulate SSR
      const originalWindow = global.window;
      delete (global as any).window;

      const session = sessionManager.getSession();

      expect(session).toBeNull();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('getUser', () => {
    it('should return user from valid session', () => {
      // Create a session first
      sessionManager.createSession(testUser, testToken);

      // Mock localStorage.getItem to return the session data
      const sessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      mockLocalStorage.getItem.mockReturnValue(sessionData);

      const user = sessionManager.getUser();

      expect(user).toEqual(testUser);
    });

    it('should return null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const user = sessionManager.getUser();

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid session', () => {
      // Create a session first
      sessionManager.createSession(testUser, testToken);

      // Mock localStorage.getItem to return the session data
      const sessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      mockLocalStorage.getItem.mockReturnValue(sessionData);

      const isAuthenticated = sessionManager.isAuthenticated();

      expect(isAuthenticated).toBe(true);
    });

    it('should return false when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const isAuthenticated = sessionManager.isAuthenticated();

      expect(isAuthenticated).toBe(false);
    });

    it('should return false for expired session', () => {
      const expiredSessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() - 1000,
      });
      mockLocalStorage.getItem.mockReturnValue(expiredSessionData);

      const isAuthenticated = sessionManager.isAuthenticated();

      expect(isAuthenticated).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      sessionManager.clearSession();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('assessment-tracker-session');
    });

    it('should handle server-side rendering gracefully', () => {
      // Mock window as undefined to simulate SSR
      const originalWindow = global.window;
      delete (global as any).window;

      // Should not throw an error
      expect(() => {
        sessionManager.clearSession();
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('refreshSession', () => {
    it('should extend session duration', () => {
      // Create initial session
      sessionManager.createSession(testUser, testToken);

      // Mock localStorage.getItem to return the session data
      const originalExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      const sessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: originalExpiresAt,
      });
      mockLocalStorage.getItem.mockReturnValue(sessionData);

      // Refresh the session
      sessionManager.refreshSession();

      // Verify that setItem was called again (session was refreshed)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2); // Once for create, once for refresh
    });

    it('should do nothing when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      sessionManager.refreshSession();

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('isSessionExpiringSoon', () => {
    it('should return true when session expires within 1 hour', () => {
      const expiringSoonSessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
      });
      mockLocalStorage.getItem.mockReturnValue(expiringSoonSessionData);

      const isExpiringSoon = sessionManager.isSessionExpiringSoon();

      expect(isExpiringSoon).toBe(true);
    });

    it('should return false when session expires in more than 1 hour', () => {
      const notExpiringSoonSessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
      });
      mockLocalStorage.getItem.mockReturnValue(notExpiringSoonSessionData);

      const isExpiringSoon = sessionManager.isSessionExpiringSoon();

      expect(isExpiringSoon).toBe(false);
    });

    it('should return false when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const isExpiringSoon = sessionManager.isSessionExpiringSoon();

      expect(isExpiringSoon).toBe(false);
    });
  });

  describe('Session Lifecycle', () => {
    it('should handle complete session lifecycle', () => {
      // 1. Create session
      sessionManager.createSession(testUser, testToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // 2. Get session
      const sessionData = JSON.stringify({
        user: testUser,
        token: testToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      mockLocalStorage.getItem.mockReturnValue(sessionData);

      const session = sessionManager.getSession();
      expect(session).toBeDefined();
      expect(session?.user).toEqual(testUser);

      // 3. Check authentication
      const isAuthenticated = sessionManager.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // 4. Get user
      const user = sessionManager.getUser();
      expect(user).toEqual(testUser);

      // 5. Clear session
      sessionManager.clearSession();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('assessment-tracker-session');
    });
  });
});