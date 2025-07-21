import { AuthUser } from './auth';

export interface Session {
  user: AuthUser;
  expiresAt: number;
  token: string;
}

class SessionManager {
  private readonly SESSION_KEY = 'assessment-tracker-session';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  }

  createSession(user: AuthUser, token: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    const session: Session = {
      user,
      expiresAt: Date.now() + this.SESSION_DURATION,
      token,
    };

    storage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  getSession(): Session | null {
    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const sessionData = storage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: Session = JSON.parse(sessionData);
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error parsing session:', error);
      this.clearSession();
      return null;
    }
  }

  getUser(): AuthUser | null {
    const session = this.getSession();
    return session?.user || null;
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  clearSession(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.SESSION_KEY);
    }
  }

  refreshSession(): void {
    const session = this.getSession();
    if (session) {
      // Extend session by creating a new one
      this.createSession(session.user, session.token);
    }
  }

  updateUser(updatedUser: AuthUser): void {
    const session = this.getSession();
    if (session) {
      // Update the user in the session and save it back
      const updatedSession: Session = {
        ...session,
        user: updatedUser,
      };
      
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
      }
    }
  }

  // Check if session is about to expire (within 1 hour)
  isSessionExpiringSoon(): boolean {
    const session = this.getSession();
    if (!session) return false;
    
    const oneHour = 60 * 60 * 1000;
    return (session.expiresAt - Date.now()) < oneHour;
  }
}

export const sessionManager = new SessionManager(); 