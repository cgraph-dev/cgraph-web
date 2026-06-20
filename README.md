# CGraph Web

CGraph Web is the browser client workspace for the authenticated CGraph app.
It contains the Vite application in `apps/web` and consumes the published
`@cgraph-dev/*` package set required by that app.

## Layout

- `apps/web`: React 19, Vite, TypeScript, React Router, Zustand, TanStack Query,
  Phoenix socket client, and the web deployment configuration.
- `apps/web/package.json`: exact published `@cgraph-dev/*` package pins.
- `.github/workflows/web-ci.yml`: package guards, typecheck, lint, release gates,
  and build-budget proof for pushed web changes.
- `scripts/validate-package-dependencies.mjs`: package-consumption guard.

## Shared Package Ownership

`cgraph-packages` is the canonical repository for every `@cgraph-dev/*` package.
This repository must consume exact published package versions; it must not carry
an app-local `packages/` mirror. Shared contract, token, or utility changes must
land in `cgraph-packages` first, then ship here through a package-version update.

`pnpm check:packages` and `pnpm check:package-owner` reject local package
protocols, old `@cgraph/*` dependencies, local mirror path aliases, and a
reintroduced `packages/` tree.

Package upgrades are currently applied by direct solo-owner version commits after
local package gates and Web Release Gates pass. Grouped Dependabot upgrade PRs
were intentionally disabled in `e9c8f24` and should stay disabled unless the
owner explicitly re-enables that CI-budget path.

## Commands

```sh
pnpm install
pnpm dev:production-backend
pnpm check:packages
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Vercel should use `apps/web` as the project root directory. The app builds to
`apps/web/dist`.

## Configuration

Copy `apps/web/.env.example` into the environment manager for the target
deployment. Do not commit `.env` files. All `VITE_*` values are public in the
built browser bundle; secrets belong on the backend.

For local development against the production Fly backend, first pull Vercel's
production env and then generate the ignored local Vite env:

```sh
vercel env pull .vercel/.env.production.local --environment=production
pnpm env:local:production
pnpm dev
```

`pnpm dev:production-backend` runs the env sync and then starts Vite. Local API
and socket requests stay same-origin (`/api`, `/socket`) and Vite proxies them
to `cgraph-backend-prod-v2.fly.dev`, which keeps the browser flow close to
production while still using localhost.

When Turnstile blocks local frontend work, use the local-only no-captcha dev
script instead:

```sh
pnpm dev:production-backend:no-captcha
```

That script does not disable auth or production security. It only skips the
frontend Turnstile widget in Vite dev on local hosts and lets the Vite proxy add
a private server-side bypass header to Fly. The matching Fly secret must be set
on the backend; the token is stored in ignored `apps/web/.env.local` and is
never exposed as a `VITE_*` browser variable.

Required production values:

- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_SOCKET_URL`
- `VITE_TURNSTILE_SITE_KEY`

Optional production values:

- `VITE_VAPID_PUBLIC_KEY` for browser push subscriptions.
- `VITE_SENTRY_DSN` and `VITE_ENABLE_SENTRY=true` for client error reporting.
- `VITE_ENABLE_ANALYTICS=true` when Vercel Web Analytics is enabled.

## License

CGraph Web is proprietary software. See `LICENSE`.
