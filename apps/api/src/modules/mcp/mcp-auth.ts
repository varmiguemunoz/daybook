import type { ClerkClient } from '@clerk/backend';
import { OAuthError, bearerAuthChallengeResponse, type AuthInfo } from '@modelcontextprotocol/server';
import { log } from '../../shared/log';

const METADATA_TTL_MS = 60 * 60 * 1000;
const METADATA_TIMEOUT_MS = 5_000;

// The publishable key encodes the Clerk Frontend API host, which is the OAuth authorization server.
export function clerkIssuer(publishableKey: string): string {
  const encoded = publishableKey.replace(/^pk_(test|live)_/, '');
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  if (!decoded.endsWith('$')) throw new Error('CLERK_PUBLISHABLE_KEY is not a Clerk publishable key');
  return `https://${decoded.slice(0, -1)}`;
}

export function protectedResourceMetadata(resourceUrl: string, issuer: string) {
  return { resource: resourceUrl, authorization_servers: [issuer], bearer_methods_supported: ['header'], resource_name: 'Daybook' };
}

// Clients that look for the authorization server on this origin get Clerk's document, cached for an hour.
export function authorizationServerMetadata(issuer: string): () => Promise<unknown> {
  let cached: { value: unknown; until: number } | null = null;
  return async () => {
    if (cached && cached.until > Date.now()) return cached.value;
    const response = await fetch(`${issuer}/.well-known/oauth-authorization-server`, { signal: AbortSignal.timeout(METADATA_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Clerk authorization server metadata answered ${response.status}`);
    cached = { value: await response.json(), until: Date.now() + METADATA_TTL_MS };
    return cached.value;
  };
}

export type Authenticate = (request: Request) => Promise<AuthInfo | Response>;

// Accepts only Clerk OAuth access tokens issued for this MCP server (audience = its URL).
export function clerkBearerAuth(clerk: ClerkClient, resourceUrl: string, resourceMetadataUrl: string): Authenticate {
  const challenge = (message: string) => bearerAuthChallengeResponse(new OAuthError('invalid_token', message), { resourceMetadataUrl });
  return async request => {
    const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1];
    if (!token) return challenge('Sign in to Daybook to use this server');
    const state = await clerk.authenticateRequest(new Request(resourceUrl, { headers: { authorization: `Bearer ${token}` } }), {
      acceptsToken: 'oauth_token',
      audience: resourceUrl,
    });
    if (!state.isAuthenticated) {
      log('warn', 'mcp token rejected', { reason: state.reason, message: state.message });
      return challenge('The access token is invalid or expired');
    }
    const auth = state.toAuth();
    return { token, clientId: auth.clientId, scopes: auth.scopes, extra: { userId: auth.userId } };
  };
}
