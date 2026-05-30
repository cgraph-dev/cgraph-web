# Release Hardening Checklist

This document tracks release blockers for the CGraph web repository. It must
only mark work complete when the current repository can prove it, or when it
links to proof from the owning repository by commit SHA, command, date, and
result.

## Current Release Status

- [x] Web-owned release-hardening gates in this repository are closed.
- [x] Cross-repo backend and package proof is recorded below with owning
      repository, commit, command, date, and result.
- [x] Full multi-repo release sign-off for the evidence in this document has
      current web, backend, and package proof. Rerun after any web, backend,
      package, or production-deploy change.
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
- [x] Backend Priority 0 and Priority 1 claims are tracked as external proof
      owned by `cgraph-backend`, not silently inferred from this web repository.
- [x] Package release claims are tracked as external proof owned by
      `cgraph-packages`; this repository enforces the pinned package snapshot.

## Priority 0: Full Web Test Health

The full web unit suite is now part of the release gate. A web release is not
eligible unless this command exits cleanly:

```sh
pnpm --filter @cgraph/web check:release-gates
```

Latest proof:

- Repository checked: `/home/trick/Projects/Repos/CGraphRepos (2)/cgraph-web`
- Verified commit:
  `b7f39b5271a19b56677387d22eac3266cef7d732`
- Date: `2026-05-30T17:20:49+03:00`
- Commands:
  - `pnpm --filter @cgraph/web check:release-gates`
  - `pnpm --filter @cgraph/web lint`
  - `pnpm --filter @cgraph/web typecheck`
  - `pnpm --filter @cgraph/web build:budget`
  - `pnpm check:packages`
  - `pnpm --filter @cgraph/web smoke:production`
- Result: the recovered machine refreshed the web release-hardening proof after
  the package mirror sync. `check:release-gates` passed safe HTML, storage
  policy, import cycles, state-store cap, background polling, auth-storage, and
  the serial unit suite with 400 Vitest files and 5,354 tests. Lint, typecheck,
  bundle budget, and package snapshot validation passed. Production smoke
  passed against `https://web.cgraph.org` and
  `https://cgraph-backend-prod-v2.fly.dev`, confirming login, phone login,
  registration, country lookup, OAuth provider discovery, and Turnstile presence
  with no bad responses, failed requests, or app console errors.
- Known non-blocking test output: deliberate error-boundary throw output still
  appears during the suite. It does not fail the release gate and remains test
  hygiene, not a release blocker.

Previous baseline proof:

- Repository checked: `/tmp/cgraph-web-repo`
- Verified working tree based on this repository commit, plus the checklist and
  focused-test changes included with this proof update:
  `573f34a9f036b069acb7d6aa8c7ca0b8a9ce690c`
- Date: `2026-05-11T03:06:13+03:00`
- Commands:
  - `pnpm --filter @cgraph/web check:release-gates`
  - `pnpm --filter @cgraph/web lint`
  - `pnpm --filter @cgraph/web typecheck`
  - `pnpm --filter @cgraph/web build:budget`
  - `pnpm check:packages`
  - `pnpm --filter @cgraph/web smoke:production`
- Result: `check:release-gates` passed safe HTML, storage policy, import cycles,
  state-store cap, background polling, auth-storage, and the serial unit suite
  with 383 Vitest files and 5,672 tests. Lint, typecheck, bundle budget,
  package snapshot validation, and production smoke all pass from
  `/tmp/cgraph-web-repo`. Production smoke confirmed login, phone-login,
  register, Turnstile, phone countries, and OAuth-provider endpoints with no
  failed requests or app console errors.
- Known non-blocking test output: React `act(...)` warnings, test-only motion
  prop warnings, MSW unhandled-request warnings, jsdom local connection-refused
  noise from tests that intentionally tolerate failed requests, and deliberate
  error-boundary throw output still appear during the suite. They do not fail
  the release gate and are tracked as routine test hygiene, not release
  blockers.
- The full unit suite is intentionally run through `check:unit-suite`, which
  pins Vitest to one worker until the upstream Node/Vitest child-process
  teardown crash seen with parallel forks is isolated or fixed.

## Priority 1: Backend Proof

Backend auth, session ownership, CORS, phone auth, Turnstile verification, and
session revocation belong to the backend repository. This web checklist may
reference backend status, but it must not claim backend completion without a
proof artifact from `cgraph-backend`.

- [x] In `cgraph-backend`, record the current commit SHA.
- [x] Run `mix compile --warnings-as-errors`.
- [x] Run the full backend suite with the production-equivalent test env.
- [x] Run focused auth/session/phone/Turnstile/CORS tests.
- [x] Record command output summary, date, and commit SHA.
- [x] Confirm the verified backend repo is deployed to Fly.io and smoke the
      production API.

Required proof fields:

- Repository: `/tmp/cgraph-backend-publish`
- Owner repository: `cgraph-dev/cgraph-backend`
- Verified commit and current repository head:
  `6dab8daff2bf95357e903aa72944fb5e9ee00836`
- Production Fly image:
  `cgraph-backend-prod-v2:deployment-01KR76ZSJTA76FQXQ0CX1NFYTK`
- Date: `2026-05-11T03:36:33+03:00`
- Commands:
  - `MIX_ENV=test mix compile --warnings-as-errors`
  - `MIX_ENV=test mix test`
  - `MIX_ENV=test mix test test/cgraph_web/controllers/api/v1/auth_controller_test.exs test/cgraph_web/controllers/api/v1/phone_auth_controller_test.exs test/cgraph/accounts/sessions_test.exs test/cgraph/auth/session_token_bridge_test.exs test/cgraph/auth/token_refresh_test.exs test/cgraph_web/plugs/cookie_auth_test.exs`
  - `MIX_ENV=test mix deps.audit`
  - `gh run view 25609202838 --repo cgraph-dev/cgraph-backend --json databaseId,name,headSha,status,conclusion,createdAt,updatedAt,url`
  - `fly status --app cgraph-backend-prod-v2`
  - `fly releases --app cgraph-backend-prod-v2 --json`
  - `curl https://cgraph-backend-prod-v2.fly.dev/health`
  - `curl https://cgraph-backend-prod-v2.fly.dev/ready`
  - `curl https://cgraph-backend-prod-v2.fly.dev/api/v1/auth/phone/countries`
  - `curl https://cgraph-backend-prod-v2.fly.dev/api/v1/auth/oauth/providers`
  - CORS preflight from `https://web.cgraph.org` to `/api/v1/auth/login`
- Result: compile passed; full suite passed with 4,123 tests, 0 failures, and
  98 skipped; focused auth/session/phone tests passed with 98 tests and 0
  failures; dependency audit found no vulnerabilities; GitHub Actions run
  `25609202838` completed successfully as `Backend Release Gates` on the
  verified repository head. Fly app `cgraph-backend-prod-v2` is running machine
  version 33 in `fra` with 2 of 2 checks passing and image
  `deployment-01KR76ZSJTA76FQXQ0CX1NFYTK`. `/health`, `/ready`, phone
  countries, OAuth providers, and web-origin CORS checks pass. The production
  OAuth provider endpoint currently returns an empty provider list until Google,
  Apple, Facebook, or TikTok credentials are configured.
- Evidence class: refreshed external proof from `cgraph-backend`; not part of
  the web release gate.

## Priority 2: Package Proof

Shared package contracts belong to `cgraph-packages`. The web repository should
consume a reviewed package snapshot and reject unproven snapshots. The local
web gate enforces snapshot provenance; package build/type/test proof remains
owned by `cgraph-packages`.

- [x] `packages/CGRAPH_PACKAGES_SNAPSHOT.json` records package provenance.
- [x] `pnpm check:packages` rejects snapshots without canonical provenance.
- [x] In `cgraph-packages`, record the current commit SHA.
- [x] Run package platform, entrypoint, typecheck, and test gates.
- [x] Confirm package entrypoints stay usable for web, mobile, and desktop.
- [x] Record command output summary, date, and commit SHA.
- [x] Confirm the web snapshot is pinned to the reviewed package commit.

Required proof fields:

- Repository: `/tmp/cgraph-packages-publish`
- Owner repository: `cgraph-dev/cgraph-packages`
- Commit: `bb0108396ca35b785be87823efed5705e56109ef`
- Date: `2026-05-11T03:36:33+03:00`
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
- Evidence class: refreshed external package proof plus local web snapshot
  enforcement.

## Priority 3: HTML Safety

- [x] Stop returning raw trusted preview HTML from the BBCode preview endpoint.
- [x] Render BBCode previews through one sanitizer and one React component.
- [x] Centralize user/content HTML sinks behind the audited `SafeHtml`
      component; the only non-HTML exception is sanitized forum-theme CSS in
      the CI allowlist.
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
- [x] Namespace remaining low-risk feature caches, including GIF favorites and
      recents, with CGraph `cgraph:v1` schema-versioned keys.
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
pnpm --filter @cgraph/web exec vitest run src/modules/chat/components/gif-picker/__tests__/useGifStorage.test.tsx
```

Latest focused proof:

- Date: `2026-05-11T02:58:29+03:00`
- Result: GIF storage focused test passed with 1 file and 2 tests; it verifies
  favorites and recents load from and persist to `cgraph:v1` keys.

## Priority 5: Import Graph And Bundle Gates

- [x] Remove the socket/settings dynamic-import workaround.
- [x] Add import-cycle detection to CI.
- [x] Fail CI on unsafe HTML sinks.
- [x] Fail CI on broad storage clear regressions.
- [x] Enforce production chunk-size budgets after build; route-level lazy
      loading remains the implementation strategy, while CI proof comes from
      generated bundle output.
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

- Repository checked: `/tmp/cgraph-web-repo`
- Date: `2026-05-11T03:06:13+03:00`
- Result: the state-store architecture gate enforces 38 create sites and passes
  at `38/38`; the full local release gate, lint, typecheck, package snapshot
  validation, production smoke, and bundle budget pass with that cap.

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
      `{"data":{"providers":[]}}`, so social OAuth buttons and new
      account-linking actions are hidden until provider credentials are
      installed. Existing linked accounts remain visible for unlinking.
- [x] WalletConnect is disabled unless `VITE_WC_PROJECT_ID` is configured with a
      real project ID. Injected wallets and Coinbase Wallet remain available.
- [x] Live DOM probe on `https://web.cgraph.org/login` confirms zero social
      OAuth controls, zero WalletConnect controls, and visible injected-wallet
      plus Coinbase Wallet controls while the backend provider endpoint returns
      200.
- [x] Focused component tests prove connected-account link actions are driven by
      backend provider discovery, not a hardcoded provider list.

Focused verification:

```sh
pnpm --filter @cgraph/web exec vitest run src/pages/settings/__tests__/connected-accounts.test.tsx src/lib/__tests__/oauth.test.ts
```

Latest focused proof:

- Date: `2026-05-11T02:58:29+03:00`
- Result: OAuth provider discovery and connected-account focused tests passed
  with 2 files and 8 tests; the connected-account screen exposes new link
  actions only for providers returned by backend discovery.

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
