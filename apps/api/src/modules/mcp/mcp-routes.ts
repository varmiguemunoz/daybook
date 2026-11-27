import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ClerkClient } from '@clerk/backend';
import { createMcpHandler, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/server';
import { overLimit, type HitCounter } from '../../http/rate-limit';
import { log } from '../../shared/log';
import { authorizationServerMetadata, clerkBearerAuth, clerkIssuer, protectedResourceMetadata } from './mcp-auth';
import { createMcpServer } from './mcp-server';
import type { McpDeps } from './session';

export interface McpRouteOptions {
  deps: McpDeps;
  clerk: ClerkClient;
  publishableKey: string;
  // Public URL of the MCP endpoint, such as https://api.sprintos.run/mcp; tokens must be issued for it.
  resourceUrl: string;
  countHit: HitCounter;
}

const MAX_BODY_BYTES = 1024 * 1024;

function userIdOf(authInfo: { extra?: Record<string, unknown> } | undefined): string {
  const userId = authInfo?.extra?.userId;
  if (typeof userId !== 'string') throw new Error('MCP request reached the server without a verified user');
  return userId;
}

export function mcpRoutes({ deps, clerk, publishableKey, resourceUrl, countHit }: McpRouteOptions): Hono {
  const issuer = clerkIssuer(publishableKey);
  const metadataUrl = getOAuthProtectedResourceMetadataUrl(new URL(resourceUrl));
  const metadata = protectedResourceMetadata(resourceUrl, issuer);
  const serverMetadata = authorizationServerMetadata(issuer);
  const authenticate = clerkBearerAuth(clerk, resourceUrl, metadataUrl);
  const handler = createMcpHandler(({ authInfo }) => createMcpServer(deps, userIdOf(authInfo)), {
    maxRequestBodySize: MAX_BODY_BYTES,
    onerror: error => log('error', 'mcp transport error', { error: error.message }),
  });

  const routes = new Hono();
  // Bearer tokens, not cookies, so any origin may call (the MCP Inspector runs in a browser).
  routes.use(
    '*',
    cors({
      origin: '*',
      allowHeaders: ['authorization', 'content-type', 'mcp-protocol-version', 'mcp-session-id', 'last-event-id'],
      exposeHeaders: ['WWW-Authenticate', 'Mcp-Session-Id', 'Mcp-Protocol-Version'],
    }),
  );
  routes.get('/.well-known/oauth-protected-resource/mcp', context => context.json(metadata));
  routes.get('/.well-known/oauth-protected-resource', context => context.json(metadata));
  routes.get('/.well-known/oauth-authorization-server', async context => context.json(await serverMetadata()));
  routes.all('/mcp', async context => {
    const auth = await authenticate(context.req.raw);
    if (auth instanceof Response) return auth;
    if (await overLimit(countHit, userIdOf(auth))) return context.json({ error: { message: 'Too many requests' } }, 429);
    return handler.fetch(context.req.raw, { authInfo: auth });
  });
  return routes;
}
