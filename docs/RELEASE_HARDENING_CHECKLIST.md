# Release Hardening Checklist

This document tracks the CGraph web/backend/package hardening work required before
public release. Keep it current as fixes land; do not rely on chat history for
release-critical architecture decisions.

## Priority 0: Backend Test Health

- [ ] Make full `mix test` pass on `cgraph-backend`.
- [x] Fix notification profile setup so `user_settings.user_id` is never null.
- [x] Provide a deterministic 32-byte test `CLOUD_KMS_MASTER_KEY`.
- [x] Reconcile message sequence/idempotency tests with the current snowflake
      sequence contract.
- [x] Fix upload safety errors so rejected executable content returns
      `UNSAFE_UPLOAD`.
- [x] Remove stale assertions for sender customization payloads or restore the
      serialized fields intentionally.
- [x] Align marketplace test schema drift for bounties, commissions, and bounty
      entries.
- [x] Restore voice transcription route coverage under the test feature flag.
- [x] Verify the current hardening set with focused backend tests.

Current backend verification:

- `mix compile --warnings-as-errors`
- 266 focused controller/domain tests covering auth, phone auth, sessions,
  BBCode safety, upload safety, messages, transcription, bounties, commissions,
  notifications, user sessions, and device attestation.

## Priority 1: Auth And Session Ownership

- [x] Consolidate login-session creation, listing, and revocation behind one
      backend service contract.
- [x] Treat `accounts.ex`, `session_management.ex`, and `sessions.ex` as callers
      or thin compatibility modules, not separate owners.
- [x] Ensure DB session revocation flows through the canonical session service
      and revokes associated token-manager entries.
- [ ] Finish logout-all consolidation for access tokens, refresh
      tokens, device sessions, and logout-all flows.
- [x] Add focused tests for create/list/revoke behavior.
- [ ] Add logout-all tests once that controller path is moved to the canonical
      service.

## Priority 2: HTML Safety

- [x] Stop returning raw trusted preview HTML from the BBCode preview endpoint.
- [x] Render BBCode previews through one sanitizer and one React component.
- [x] Centralize all `dangerouslySetInnerHTML` usage behind an audited safe HTML
      component.
- [x] Cover known sinks: forum content, announcements, threaded comments, search
      results, and admin BBCode previews.
- [x] Add a CI gate that fails on new raw HTML sinks outside the approved wrapper.

## Priority 3: Browser Persistence

- [x] Replace broad query-cache persistence with an allowlist for safe offline
      data only.
- [x] Namespace browser storage touched by auth, sockets, search, forums,
      notifications, route reloads, OAuth, push prompts, and query persistence.
- [ ] Namespace every remaining low-risk feature cache with a CGraph prefix and schema
      version.
- [x] Replace production full-storage clear calls with namespace-aware removal.
- [x] Add storage regression tests that prove unrelated origin data is retained.
- [ ] Add auth-hydration regression tests that prove account data
      cannot bleed between sessions.

## Priority 4: Import Graph And Bundle Gates

- [x] Remove the current socket/settings dynamic-import workaround.
- [x] Add import-cycle detection to CI.
- [x] Fail CI on unsafe HTML sinks.
- [x] Fail CI on broad storage clear regressions.
- [x] Keep bundle-size checks tied to route-level lazy loading.
- [x] Split production chunks so the largest `index-*` chunk stays below budget.
- [ ] Fail CI on auth hydration/logout storage regressions.

## Priority 5: State And Scheduler Architecture

- [ ] Collapse Zustand stores into a smaller set of stable domain stores.
- [ ] Move background polling to one adaptive scheduler.
- [ ] Prefer socket push for realtime updates where the backend already emits
      events.
- [ ] Keep UI-only countdown timers separate from network polling policy.

## Priority 6: Package Boundaries

- [x] Keep `cgraph-packages` canonical for shared contracts, crypto boundaries,
      tokens, and utilities.
- [ ] Narrow broad package entrypoints after the web app is stable.
- [ ] Publish versioned packages or sync app snapshots only from package commits.
- [x] Document package ownership, release flow, platform support, and emergency
      snapshot rules in `cgraph-packages/docs/SHARED_PACKAGES.md`.

Current package verification:

- `pnpm check:platform`
- `pnpm typecheck`
- `pnpm test`

## Operating Rules

- Fix backend correctness and security issues before broad UI refactors.
- Refactors must preserve behavior and have tests or CI gates.
- Do not add new app-specific code to shared packages.
- Commit as `cgraph-dev <contact@cgraph.org>` with no AI attribution trailers.
