# syntax=docker/dockerfile:1
# Build from the repository root: docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=... --build-arg VITE_CLERK_PUBLISHABLE_KEY=... .

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
RUN --mount=type=cache,target=/root/.npm npm ci -w @daybook/web -w @daybook/domain --include-workspace-root

COPY tsconfig.base.json ./
COPY packages/domain packages/domain
COPY apps/web apps/web

# Vite writes these into the bundle, so they are needed at build time and changing them needs a rebuild.
ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
RUN test -n "$VITE_API_URL" && test -n "$VITE_CLERK_PUBLISHABLE_KEY" || (echo "Set the VITE_API_URL and VITE_CLERK_PUBLISHABLE_KEY build arguments" && exit 1)
RUN npm run build -w @daybook/web

FROM caddy:2-alpine AS runtime
COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
EXPOSE 8080
