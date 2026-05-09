# Release Hardening Checklist

This document tracks release blockers for the CGraph web repository. It must
only mark work complete when the current repository can prove it, or when it
links to proof from the owning repository by commit SHA, command, date, and
result.

## Current Release Status

- [x] All release-hardening checklist items in this document are closed.
- [x] Production smoke path passes for `https://web.cgraph.org`.
- [x] Web release gates pass for safe HTML, storage policy, import cycles,
      state-store caps, background polling, and auth-storage regressions.
- [x] Web build and bundle budget pass.
- [x] Package snapshot provenance is enforced by `pnpm check:packages`.
- [x] Full web Vitest suite is green and exits cleanly.
- [x] Full web Vitest suite runs with one worker in release gates to avoid the
      Node/Vitest child-process teardown crash seen with parallel forks.
- [x] Social OAuth buttons are gated by the backend configured-provider
      endpoint, so production does not advertise unavailable providers.
- [x] WalletConnect is only registered and shown when `VITE_WC_PROJECT_ID` is a
      real project ID, not the local placeholder.
- [x] CI actions use current hosted-action majors and the web build runs on
      Node 22.
- [x] Backend Priority 0 and Priority 1 claims are verified from
      `cgraph-backend`, not from this web repository.
- [x] Package release claims are verified from `cgraph-packages`, with the web
      snapshot pinned to a reviewed package commit.

## Priority 0: Full Web Test Health

The full web unit suite is now part of the release gate. A web release is not
eligible unless this command exits cleanly:

```sh
pnpm --filter @cgraph/web check:release-gates
```

Latest proof:

- Repository: `cgraph-web`
- Verified working tree based on commit:
  `de084c29682619e54d0b91d5564583e8d56a94d0`
- Date: `2026-05-10T00:15:02+03:00`
- Commands:
  - `pnpm --filter @cgraph/web check:release-gates`
  - `pnpm --filter @cgraph/web lint`
  - `pnpm --filter @cgraph/web typecheck`
  - `pnpm --filter @cgraph/web build:budget`
  - `pnpm --filter @cgraph/web smoke:production`
- Result: 381 Vitest files and 5,667 tests passed; the release gate exits
  cleanly with the full unit suite included; lint, typecheck, bundle budget,
  and the production smoke path pass.
- Known non-blocking test output: React `act(...)` warnings, test-only motion
  prop warnings, and a few MSW unhandled-request warnings still appear during
  the suite. They do not fail the release gate and are tracked as routine test
  hygiene, not release blockers.
- The full unit suite is intentionally run through `check:unit-suite`, which
  pins Vitest to one worker until the upstream Node/Vitest child-process
  teardown crash seen with parallel forks is isolated or fixed.

## Priority 1: Backend Proof

Backend auth, session ownership, CORS, phone auth, Turnstile verification, and
session revocation belong to the backend repository. This web checklist may
reference backend status, but it must not claim backend completion without a
proof artifact.

- [x] In `cgraph-backend`, record the current commit SHA.
- [x] Run `mix compile --warnings-as-errors`.
- [x] Run the full backend suite with the production-equivalent test env.
- [x] Run focused auth/session/phone/Turnstile/CORS tests.
- [x] Record command output summary, date, and commit SHA.
- [x] Deploy the verified backend repo to Fly.io and smoke the production API.

Required proof fields:

- Repository: `cgraph-backend`
- Runtime commit: `6dab8daff2bf95357e903aa72944fb5e9ee00836`
- Current repository head: `6dab8daff2bf95357e903aa72944fb5e9ee00836`
- Date: `2026-05-10T00:16:17+03:00`
- Commands:
  - `MIX_ENV=test mix compile --warnings-as-errors`
  - `MIX_ENV=test mix test`
  - `MIX_ENV=test mix test test/cgraph_web/controllers/api/v1/auth_controller_test.exs test/cgraph_web/controllers/api/v1/phone_auth_controller_test.exs test/cgraph/accounts/sessions_test.exs test/cgraph/auth/session_token_bridge_test.exs test/cgraph/auth/token_refresh_test.exs test/cgraph_web/plugs/cookie_auth_test.exs`
  - `fly deploy --app cgraph-backend-prod-v2 --strategy rolling --remote-only`
  - `gh run watch 25609202838 --repo cgraph-dev/cgraph-backend --exit-status`
  - `curl https://cgraph-backend-prod-v2.fly.dev/health`
  - `curl https://cgraph-backend-prod-v2.fly.dev/ready`
  - `curl https://cgraph-backend-prod-v2.fly.dev/api/v1/auth/phone/countries`
  - `curl https://cgraph-backend-prod-v2.fly.dev/api/v1/auth/oauth/providers`
  - CORS preflight from `https://web.cgraph.org` to `/api/v1/auth/login`
- Result: compile passed; full suite passed with 4,123 tests, 0 failures, and
  98 skipped; focused auth/session/phone tests passed with 98 tests and 0
  failures; GitHub Actions run `25609202838` passed `Backend Release Gates` on
  the current repository head; Fly app `cgraph-backend-prod-v2` runs image
  `deployment-01KR76ZSJTA76FQXQ0CX1NFYTK` from the verified runtime commit;
  `/health`, `/ready`, phone countries, and web-origin CORS checks pass.
  Dependency audit passes with no vulnerable or retired packages after updating
  Phoenix to `1.8.7`, Bandit to `1.11.0`, and removing unused Cowboy/Plug
  Cowboy lock entries. The production OAuth provider endpoint currently returns
  an empty provider list until Google, Apple, Facebook, or TikTok credentials
  are configured.

## Priority 2: Package Proof

Shared package contracts belong to `cgraph-packages`. The web repository should
consume a reviewed package snapshot and reject unproven snapshots.

- [x] `packages/CGRAPH_PACKAGES_SNAPSHOT.json` records package provenance.
- [x] `pnpm check:packages` rejects snapshots without canonical provenance.
- [x] In `cgraph-packages`, record the current commit SHA.
- [x] Run package platform, entrypoint, typecheck, and test gates.
- [x] Confirm package entrypoints stay usable for web, mobile, and desktop.
- [x] Record command output summary, date, and commit SHA.
- [x] Confirm the web snapshot is pinned to the reviewed package commit.

Required proof fields:

- Repository: `cgraph-packages`
- Commit: `bb0108396ca35b785be87823efed5705e56109ef`
- Date: `2026-05-09T02:40:18+03:00`
- Commands:
  - `pnpm check:platform`
  - `pnpm build`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm pack:dry`
  - `pnpm check:packages` in `cgraph-web`
- Result: platform boundary and public entrypoint gates pass; all packages build
  and typecheck; package tests pass with 46 total tests across crypto, utils,
  and api-client plus pass-with-no-tests packages; dry package packing succeeds
  for every public package; `packages/CGRAPH_PACKAGES_SNAPSHOT.json` in
  `cgraph-web` pins `cgraph-dev/cgraph-packages` at
  `bb0108396ca35b785be87823efed5705e56109ef`.

## Priority 3: HTML Safety

- [x] Stop returning raw trusted preview HTML from the BBCode preview endpoint.
- [x] Render BBCode previews through one sanitizer and one React component.
- [x] Centralize all `dangerouslySetInnerHTML` usage behind an audited safe HTML
      component.
- [x] Cover known sinks: forum content, announcements, threaded comments, search
      results, and admin BBCode previews.
- [x] Add a CI gate that fails on new raw HTML sinks outside the approved
      wrapper.

Verification:

```sh
pnpm --filter @cgraph/web check:safe-html
```

## Priority 4: Browser Persistence

- [x] Replace broad query-cache persistence with an allowlist for safe offline
      data only.
- [x] Namespace browser storage touched by auth, sockets, search, forums,
      notifications, route reloads, OAuth, push prompts, and query persistence.
- [x] Namespace every remaining low-risk feature cache with a CGraph prefix and
      schema version.
- [x] Replace production full-storage clear calls with namespace-aware removal.
- [x] Add storage regression tests that prove unrelated origin data is retained.
- [x] Add logout regression tests that prove account-scoped persisted stores
      cannot bleed into the next session.
- [x] Add browser-reload auth hydration tests that prove stale persisted auth
      cannot resurrect a previous account.

Verification:

```sh
pnpm --filter @cgraph/web check:storage-policy
pnpm --filter @cgraph/web check:auth-storage
```

## Priority 5: Import Graph And Bundle Gates

- [x] Remove the socket/settings dynamic-import workaround.
- [x] Add import-cycle detection to CI.
- [x] Fail CI on unsafe HTML sinks.
- [x] Fail CI on broad storage clear regressions.
- [x] Keep bundle-size checks tied to route-level lazy loading.
- [x] Split production chunks so the largest `index-*` chunk stays below budget.
- [x] Fail CI on logout storage regressions.
- [x] Fail CI on browser-reload auth hydration regressions.
- [x] Add the full web unit suite to the release gate after it is green.

Verification:

```sh
pnpm --filter @cgraph/web check:import-cycles
pnpm --filter @cgraph/web check:release-gates
pnpm --filter @cgraph/web build:budget
```

## Priority 6: State And Scheduler Architecture

- [x] Collapse Zustand stores into a smaller set of stable domain stores.
- [x] Move release-critical background polling to adaptive scheduling.
- [x] Prefer socket push for realtime updates where the backend already emits
      events.
- [x] Keep UI-only countdown timers separate from network polling policy.
- [x] Continue lowering the state-store creation cap after the full test suite
      is green.

Verification:

```sh
pnpm --filter @cgraph/web check:state-stores
pnpm --filter @cgraph/web check:background-polling
```

Latest proof:

- Repository: `cgraph-web`
- Date: `2026-05-09T04:00:00+03:00`
- Change: message-request state was merged into the existing chat domain store,
  removing one standalone Zustand store.
- Result: the state-store architecture gate now enforces 38 create sites instead
  of 39; the full local release gate, lint, typecheck, package snapshot
  validation, and bundle budget pass with the stricter cap.

## Priority 7: CI Runtime Maintenance

- [x] Update GitHub Actions to versions that run on the current hosted action
      runtime.
- [x] Keep the web application build on the same Node major used locally.
- [x] Remove the previous Node 20 action-runtime warning path.
- [x] Invoke `pnpm --filter @cgraph/web check:release-gates` from CI so the
      full unit suite and state-store cap are enforced by GitHub Actions, not
      only by local verification.
- [x] Keep `check:unit-suite` serial until the upstream Vitest/Node worker
      teardown crash is eliminated or the affected tests are isolated behind a
      separate stable shard.

Verification:

```sh
pnpm --filter @cgraph/web check:release-gates
```

## Production External Providers

- [x] Phone login and registration use Turnstile and pass the production smoke
      path against `https://web.cgraph.org`.
- [x] Social OAuth providers are discovered from
      `/api/v1/auth/oauth/providers`; production currently returns
      `{"data":{"providers":[]}}`, so social OAuth buttons and account-linking
      actions are hidden until provider credentials are installed.
- [x] WalletConnect is disabled unless `VITE_WC_PROJECT_ID` is configured with a
      real project ID. Injected wallets and Coinbase Wallet remain available.

## Current Web Verification

Commands that currently pass:

```sh
pnpm --filter @cgraph/web lint
pnpm --filter @cgraph/web typecheck
pnpm --filter @cgraph/web check:release-gates
pnpm --filter @cgraph/web build:budget
pnpm check:packages
pnpm --filter @cgraph/web smoke:production
```

The release gate covers safe HTML sinks, storage policy, import cycles,
state-store caps, background polling, auth-storage regressions, and the full
web unit suite. The broader verification set also covers bundle budget,
package snapshot provenance, and the production smoke path.

## Operating Rules

- Fix correctness and security issues before broad UI refactors.
- Keep repository-specific claims in the repository that owns the code.
- Cross-repo claims require proof artifacts, not chat history.
- Refactors must preserve behavior and have tests or CI gates.
- Do not add new app-specific code to shared packages.
- Commit as `cgraph-dev <contact@cgraph.org>` with no AI attribution trailers.
