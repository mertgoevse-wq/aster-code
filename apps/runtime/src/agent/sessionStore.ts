import { AgentSessionInfo, AgentPlan, AgentEvent } from '@aster-code/shared';
import { Session } from './types.js';

/**
 * In-memory session store for MVP.
 * Loses all data on server restart — intentional for Phase 2.
 */
class SessionStore {
  private sessions: Map<string, Session> = new Map();

  /**
   * Creates a new agent session.
   */
  createSession(taskDescription: string): AgentSessionInfo {
    const id = `sesh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const info: AgentSessionInfo = {
      id,
      taskDescription,
      status: 'created',
      taskType: null,
      planId: null,
      createdAt: now,
      updatedAt: now
    };

    this.sessions.set(id, { info, plan: null, events: [] });

    console.log(`[SessionStore] Created session: ${id} — "${taskDescription}"`);
    return info;
  }

  /**
   * Retrieves a session by ID.
   */
  getSession(id: string): Session | null {
    return this.sessions.get(id) || null;
  }

  /**
   * Updates session info fields.
   */
  updateSession(id: string, updates: Partial<AgentSessionInfo>): AgentSessionInfo | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    session.info = {
      ...session.info,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return session.info;
  }

  /**
   * Sets the execution plan for a session.
   */
  setPlan(sessionId: string, plan: AgentPlan): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.plan = plan;
    session.info.planId = plan.id;
    session.info.status = 'awaiting-approval';
    session.info.taskType = plan.taskType;
    session.info.updatedAt = new Date().toISOString();

    console.log(`[SessionStore] Plan set for session ${sessionId}: ${plan.id} with ${plan.steps.length} steps`);
  }

  /**
   * Adds an event to the session's event log.
   */
  addEvent(sessionId: string, event: AgentEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.events.push(event);
  }

  /**
   * Retrieves events for a session, optionally after a specific timestamp.
   */
  getEvents(sessionId: string, since?: string): AgentEvent[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    if (!since) return [...session.events];

    return session.events.filter(e => e.timestamp > since);
  }

  /**
   * Cleans up sessions older than the given TTL (in milliseconds).
   * Not used in MVP; stub for future.
   */
  cleanupOldSessions(maxAgeMs: number): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, session] of this.sessions.entries()) {
      if (new Date(session.info.createdAt).getTime() < cutoff) {
        this.sessions.delete(id);
        console.log(`[SessionStore] Purged old session: ${id}`);
      }
    }
  }

  /**
   * Returns the total number of active sessions.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

export const sessionStore = new SessionStore();
