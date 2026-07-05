import { AuthProvider } from '@aster-code/shared';
import { isOAuthConfigured, getOAuthAuthorizeUrl } from './oauthConfig.js';
import { authSessionStore } from './sessionStore.js';

/**
 * GitHub OAuth handler — MVP placeholder.
 *
 * Full OAuth flow is NOT implemented yet. This module provides:
 * - Configuration validation
 * - Authorization URL generation
 * - Placeholder callback handler
 *
 * When implemented, this will:
 * 1. Redirect user to GitHub authorize URL
 * 2. Exchange auth code for access token
 * 3. Fetch user profile from GitHub API
 * 4. Create an auth session
 */

export function canStartGitHubOAuth(): { canStart: boolean; reason: string } {
  if (!isOAuthConfigured('github')) {
    return {
      canStart: false,
      reason: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.',
    };
  }
  return { canStart: true, reason: 'Ready.' };
}

export function getGitHubAuthUrl(state: string): string {
  return getOAuthAuthorizeUrl('github', state);
}

/**
 * Placeholder: would exchange the OAuth code for an access token.
 * MVP returns a descriptive "not implemented" result.
 */
export async function handleGitHubCallback(code: string, state: string): Promise<{
  success: boolean;
  message: string;
  user?: any;
}> {
  console.log(`[Auth/GitHub] Callback received — code=${code.slice(0, 8)}..., state=${state}`);

  // MVP: Not implemented yet.
  return {
    success: false,
    message: 'GitHub OAuth callback is not implemented yet. The authorization code was received but token exchange is a placeholder. See docs/AUTH_ARCHITECTURE.md for the implementation roadmap.',
  };
}

/**
 * Returns current GitHub auth status.
 */
export function getGitHubAuthStatus(): { configured: boolean; authenticated: boolean } {
  return {
    configured: isOAuthConfigured('github'),
    authenticated: authSessionStore.getActiveSession()?.session.provider === 'github',
  };
}
