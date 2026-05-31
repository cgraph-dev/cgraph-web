# CGraph Web

CGraph Web is the browser client workspace for the authenticated CGraph app.
It contains the Vite application in `apps/web` and consumes the published
`@cgraph-dev/*` package set required by that app.

## Layout

- `apps/web`: React 19, Vite, TypeScript, React Router, Zustand, TanStack Query,
  Phoenix socket client, and the web deployment configuration.
- `apps/web/package.json`: exact published `@cgraph-dev/*` package pins.
- `.github/dependabot.yml`: grouped `@cgraph-dev/*` package upgrade PRs.
- `scripts/validate-package-dependencies.mjs`: package-consumption guard.

## Shared Package Ownership

`cgraph-packages` is the canonical repository for every `@cgraph-dev/*` package.
This repository must consume exact published package versions; it must not carry
an app-local `packages/` mirror. Shared contract, token, or utility changes must
land in `cgraph-packages` first, then ship here through a package-version update.

`pnpm check:packages` and `pnpm check:package-owner` reject local package
protocols, old `@cgraph/*` dependencies, local mirror path aliases, and a
reintroduced `packages/` tree.

## Commands

```sh
pnpm install
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

Required production values:

- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_TURNSTILE_SITE_KEY`

Optional production values:

- `VITE_VAPID_PUBLIC_KEY` for browser push subscriptions.
- `VITE_SENTRY_DSN` and `VITE_ENABLE_SENTRY=true` for client error reporting.
- `VITE_ENABLE_ANALYTICS=true` when Vercel Web Analytics is enabled.

## License

CGraph Web is proprietary software. See `LICENSE`.
