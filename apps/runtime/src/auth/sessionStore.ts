import { AuthSession, AuthProvider, AuthUser } from '@aster-code/shared';

/**
 * Auth Session Store — manages authenticated user sessions.
 *
 * MVP: In-memory only. No persistent storage.
 * All sessions lost on server restart (local-first safety).
 *
 * Token storage rules:
 * - Access tokens are NEVER stored in plaintext on disk.
 * - MVP: tokens live only in memory during the session.
 * - Future: encrypted at rest using OS keychain or secure enclave.
 */

interface SessionRecord {
  session: AuthSession;
  user: AuthUser;
  accessToken: string; // in-memory only
}

class AuthSessionStore {
  private sessions: Map<string, SessionRecord> = new Map();

  /**
   * Creates a new auth session after successful OAuth login.
   */
  create(session: AuthSession, user: AuthUser, accessToken: string): void {
    this.sessions.set(session.id, { session, user, accessToken });
    console.log(`[Auth] Session created: ${session.id} for ${user.username} (${session.provider})`);
  }

  /**
   * Retrieves an active session by ID.
   */
  get(sessionId: string): SessionRecord | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Removes a session (logout).
   */
  remove(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`[Auth] Session removed: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Returns true if there is at least one active authenticated session.
   */
  isAuthenticated(): boolean {
    return this.sessions.size > 0;
  }

  /**
   * Returns the most recently created active session, or null.
   */
  getActiveSession(): SessionRecord | null {
    if (this.sessions.size === 0) return null;
    // Return the most recent session
    const sessions = Array.from(this.sessions.values());
    sessions.sort((a, b) => new Date(b.session.createdAt).getTime() - new Date(a.session.createdAt).getTime());
    return sessions[0];
  }

  /**
   * Clears all sessions (global logout).
   */
  clearAll(): void {
    const count = this.sessions.size;
    this.sessions.clear();
    console.log(`[Auth] All sessions cleared (${count} removed)`);
  }
}

export const authSessionStore = new AuthSessionStore();
