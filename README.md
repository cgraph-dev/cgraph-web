# CGraph Web

CGraph Web is the browser client workspace for the authenticated CGraph app.
It contains the Vite application in `apps/web` and the shared TypeScript
packages required by that app.

## Layout

- `apps/web`: React 19, Vite, TypeScript, React Router, Zustand, TanStack Query,
  Phoenix socket client, and the web deployment configuration.
- `packages/api-client`: typed HTTP contracts and API client surfaces.
- `packages/shared-types`: cross-platform DTOs, event shapes, and domain types.
- `packages/utils`: shared validation, formatting, resilience, and HTTP helpers.
- `packages/animation-constants` and `packages/design-tokens`: cross-platform UI
  constants used by web and native clients.

## Shared Package Ownership

`cgraph-packages` is the canonical repository for every `@cgraph/*` package.
The `packages/` directory in this repository is a deployment snapshot used while
the app still builds through a Vercel workspace. Shared contract, crypto, token,
or utility changes must land in `cgraph-packages` first, then be released or
mirrored into this repo by an explicit package-sync change.

Do not make product changes directly inside `packages/` unless the matching
`cgraph-packages` change is part of the same rollout.

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
