# CGraph Web

CGraph Web is the browser client for cloud chats, forums, hubs, broadcasts, account settings,
cosmetics, subscriptions, and web-only onboarding. Mobile-only encrypted surfaces are represented in
the UI but do not run Signal participant state in the browser.

## Architecture

- Runtime: React 19, Vite, TypeScript, React Router, Zustand, TanStack Query, Phoenix sockets.
- Backend contract: HTTP calls go through `/api/*`; real-time traffic goes through `/socket`.
- Shared code: API types, animation constants, utilities, and design tokens are imported from
  `packages/`.
- Assets: bundled assets live in `src/assets`; URL-addressable public assets live in `public`.
- Deployment: Vercel builds `dist` from this app and proxies API/socket traffic to the Fly backend.

The app keeps feature logic under `src/modules/*`, shared primitives under `src/shared/*`, and
cross-feature infrastructure under `src/lib`, `src/hooks`, and `src/stores`.

## Environment

Copy `.env.example` to a local env file and set deployment-specific values outside git. Every
`VITE_*` variable is public once built; secrets belong on the backend.

Required production values:

- `VITE_TURNSTILE_SITE_KEY`

Leave `VITE_API_URL`, `VITE_WS_URL`, and `VITE_SOCKET_URL` blank for the standard Vercel deployment.
`vercel.json` routes `/api/*` and `/socket/*` to the Fly backend.

Optional integrations:

- `VITE_SENTRY_DSN`
- `VITE_OTEL_TRACE_ENDPOINT`
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_LIVEKIT_URL`
- `VITE_TURN_URL`
- `VITE_TURN_USERNAME`
- `VITE_TURN_CREDENTIAL`

Production toggles:

- `VITE_ENABLE_ANALYTICS=true`
- `VITE_ENABLE_SENTRY=true`
- `VITE_ENABLE_LOGGING=false`
- `VITE_ENABLE_QUERY_CACHE_PERSISTENCE=false`

## Commands

```sh
pnpm dev
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

Use `pnpm build:strict` before production changes that touch build config, routing, or shared
package imports.

## Deployment Notes

`vercel.json` owns redirects for marketing/legal pages, API/socket rewrites, cache headers, and CSP.
Marketing content remains on `cgraph.org`; the authenticated app should run on `web.cgraph.org`.

## License

CGraph Web is proprietary software. See `LICENSE`.
