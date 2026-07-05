import { AuthProvider } from '@aster-code/shared';
import { isOAuthConfigured, getOAuthAuthorizeUrl } from './oauthConfig.js';
import { authSessionStore } from './sessionStore.js';

/**
 * Google OAuth handler — MVP placeholder.
 *
 * Full OAuth flow is NOT implemented yet. This module provides:
 * - Configuration validation
 * - Authorization URL generation
 * - Placeholder callback handler
 *
 * When implemented, this will:
 * 1. Redirect user to Google OAuth consent screen
 * 2. Exchange auth code for access + refresh tokens
 * 3. Fetch user profile from Google API
 * 4. Create an auth session with Google Drive scope
 */

export function canStartGoogleOAuth(): { canStart: boolean; reason: string } {
  if (!isOAuthConfigured('google')) {
    return {
      canStart: false,
      reason: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.',
    };
  }
  return { canStart: true, reason: 'Ready.' };
}

export function getGoogleAuthUrl(state: string): string {
  return getOAuthAuthorizeUrl('google', state);
}

/**
 * Placeholder: would exchange the OAuth code for tokens.
 * MVP returns a descriptive "not implemented" result.
 */
export async function handleGoogleCallback(code: string, state: string): Promise<{
  success: boolean;
  message: string;
  user?: any;
}> {
  console.log(`[Auth/Google] Callback received — code=${code.slice(0, 8)}..., state=${state}`);

  // MVP: Not implemented yet.
  return {
    success: false,
    message: 'Google OAuth callback is not implemented yet. The authorization code was received but token exchange is a placeholder. See docs/AUTH_ARCHITECTURE.md for the implementation roadmap.',
  };
}

/**
 * Returns current Google auth status.
 */
export function getGoogleAuthStatus(): { configured: boolean; authenticated: boolean } {
  return {
    configured: isOAuthConfigured('google'),
    authenticated: authSessionStore.getActiveSession()?.session.provider === 'google',
  };
}
