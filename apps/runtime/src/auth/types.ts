import {
  AuthStatus,
  AuthMode,
  AuthProvider,
  AuthUser,
  AuthFeatures,
  AuthSession,
} from '@aster-code/shared';

export type {
  AuthStatus,
  AuthMode,
  AuthProvider,
  AuthUser,
  AuthFeatures,
  AuthSession,
};

/** OAuth configuration for a provider */
export interface OAuthConfig {
  provider: AuthProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

/** OAuth authorization request */
export interface OAuthStartRequest {
  provider: AuthProvider;
  state: string;
  codeChallenge?: string;
}

/** OAuth callback result */
export interface OAuthCallbackResult {
  provider: AuthProvider;
  code: string;
  state: string;
}

/** Token exchange result */
export interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
  tokenType: string;
}

/** Stored user session (token storage rules applied) */
export interface StoredSession {
  id: string;
  userId: string;
  provider: AuthProvider;
  expiresAt: string;
  createdAt: string;
  scopes: string[];
  // Note: access tokens are NEVER stored in plaintext on disk.
  // MVP: in-memory only. Future: encrypted at rest.
}
