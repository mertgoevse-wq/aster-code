import { OAuthConfig, AuthProvider } from './types.js';

/**
 * OAuth configuration for GitHub and Google.
 *
 * IMPORTANT: These values MUST be set via environment variables.
 * The placeholders below are intentionally non-functional.
 * No secrets are hardcoded here.
 *
 * Required env vars:
 *   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 */

function getEnv(key: string): string {
  return process.env[key] || '';
}

function isConfigured(provider: AuthProvider): boolean {
  const clientId = provider === 'github' ? getEnv('GITHUB_CLIENT_ID') : getEnv('GOOGLE_CLIENT_ID');
  const clientSecret = provider === 'github' ? getEnv('GITHUB_CLIENT_SECRET') : getEnv('GOOGLE_CLIENT_SECRET');
  return !!(clientId && clientSecret);
}

const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3001/auth/callback';

const GITHUB_OAUTH_CONFIG: OAuthConfig = {
  provider: 'github',
  clientId: getEnv('GITHUB_CLIENT_ID'),
  clientSecret: getEnv('GITHUB_CLIENT_SECRET'),
  redirectUri: REDIRECT_URI,
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userInfoUrl: 'https://api.github.com/user',
  scopes: ['read:user', 'repo'],
};

const GOOGLE_OAUTH_CONFIG: OAuthConfig = {
  provider: 'google',
  clientId: getEnv('GOOGLE_CLIENT_ID'),
  clientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
  redirectUri: REDIRECT_URI,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.file',
  ],
};

export function getOAuthConfig(provider: AuthProvider): OAuthConfig {
  return provider === 'github' ? GITHUB_OAUTH_CONFIG : GOOGLE_OAUTH_CONFIG;
}

export function isOAuthConfigured(provider: AuthProvider): boolean {
  return isConfigured(provider);
}

export function getOAuthAuthorizeUrl(provider: AuthProvider, state: string): string {
  const config = getOAuthConfig(provider);

  if (!isConfigured(provider)) {
    throw new Error(`OAuth not configured for ${provider}. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in .env.`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    response_type: 'code',
  });

  return `${config.authUrl}?${params.toString()}`;
}
