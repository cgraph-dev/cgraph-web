# Web 100 Percent Owner Checklist

Status date: 2026-05-17

Current execution count after the routed DM GIF/sticker browser-proof slice: 50 / 50 owner-level
checklist items closed, 100.0% closed and 0.0% left for this owner execution contract. The Space
route, verify-email resend, onboarding skip/recovery, cancel-deletion, phone native-attestation
guard, verify-email-before-onboarding route gate, routed DM read-receipt rendering, routed DM
guarded-scroll, routed DM typing-proof, routed DM call-entry, call-history callback, incoming-call
accept/end-state, routed identity/cosmetic live-update, and routed conversation-list/Space menu
implementations, plus routed DM GIF/sticker send, are now source-backed and browser-verified where
this checklist requires it. Broader product-maturity risks that remain outside this owner checklist
are still tracked honestly in the strict pass and scorecard documents.

Purpose: turn the current web audit set into an execution contract for an owner who wants the web
workstream finished to an honest 100% industry-standard bar, with no fake completion and no silent
scope drift.

This checklist is not a replacement for the audit documents. It defines how to use them, what
decisions must be made, what "100%" means, and what another agent must complete before the web
workstream can be called done.

## Scope

This checklist covers:

- `apps/web`
- the backend contract surfaces required to make routed web behavior truthful
- the root shared packages and schemas required to keep web, backend, and future native clients on
  one contract

This checklist does not mean all platform UI becomes shared. The target is:

- shared types, schemas, contracts, utilities, and design tokens in `packages/*`
- platform-specific route owners, adapters, and runtime behavior in each app

## Source Of Truth Order

Another agent must read and obey the web documents in this exact order:

1. `docs/WEB-ULTIMATE-STRICT-PASS.md`
2. `docs/WEB-MESSAGING-HUBS-BROADCASTS-AUDIT.md`
3. `docs/WEB-IMPLEMENTATION-INVENTORY.md`
4. `docs/WEB-ULTIMATE-IMPROVEMENT-GAPS.md`
5. `docs/WEB-ULTIMATE-IMPROVEMENT-PLAN.md`
6. `docs/WEB-SUPPORT-MATRIX.md`

If two documents disagree, the earlier document in this list wins unless the later document is
updated with direct source proof and the earlier document is then corrected in the same slice.

## Non-Negotiable Closure Rules

- Do not close an implementation task from source inspection alone.
- Verify live routed web behavior before marking a feature complete.
- If direct browser verification is unavailable, run the narrowest equivalent executable check.
- After each implementation slice, update the web docs in the source-of-truth order above.
- No dead buttons, fake success, placeholder-only panes, or semantically wrong destinations remain
  on shipped routed surfaces.

## What 100 Percent Means

The web workstream is only 100% complete when all of these are true:

- `docs/WEB-ULTIMATE-STRICT-PASS.md` has no in-scope route-owned surface left in `Partial` or
  `Missing` status.
- `docs/WEB-ULTIMATE-IMPROVEMENT-GAPS.md` is empty except for items explicitly moved out of scope by
  owner decision.
- `docs/WEB-IMPLEMENTATION-INVENTORY.md` no longer lists fake routed controls, broken destinations,
  or critical unmounted routed features.
- `docs/WEB-SUPPORT-MATRIX.md` reflects the final user-facing truth and no longer overclaims or
  understates what the routed web app can do.
- The routed browser behavior has been verified for the final implementation state.

## Owner Decisions Required Up Front

These decisions must be written down before agents continue, otherwise they will keep reopening the
same findings.

### Recommended Full-In Default Stance

If the owner wants a true 100% pass with no convenience deferrals, the recommended default stance
is:

- Broadcasts are in scope.
- Spaces are in scope.
- Vault is in scope.
- Dedicated voice and video room routes are in scope.
- Dedicated announcement and forum or topic-first hub surfaces are in scope where the product
  semantics differ from generic text channels.
- Bare group routes resolve to a canonical default channel.
- Notification links preserve enough metadata to open the final routed destination directly.
- The shared cross-platform target includes contracts, schemas, types, utilities, design tokens, and
  runtime-neutral business rules in `packages/*`, while routed UI and runtime adapters stay
  app-specific.

Use that as the recommended direction when the goal is "full in, industry-standard, no easy way". It
is still not an automatic decision. The owner can override any item below.

### Implementation-Time Question Protocol

If any owner-decision item below is unresolved when an agent reaches the related implementation
slice, the agent must stop and ask the owner that exact question before proceeding.

Rules:

- Do not guess.
- Do not silently defer.
- Do not pre-implement both branches unless the owner explicitly asks for that.
- Ask the smallest possible question at the moment the decision becomes blocking.
- Record the answer in this checklist before continuing.

Required implementation-time questions:

1. "For this 100% pass, are Broadcasts in scope right now or intentionally deferred?"
2. "For this 100% pass, are Spaces in scope right now or intentionally deferred?"
3. "For this 100% pass, is Vault in scope right now or intentionally deferred?"
4. "Do you want dedicated voice-channel room routes now, or should voice channels stay out of the
   100% target?"
5. "Do you want dedicated video-channel room routes now, or should video channels stay out of the
   100% target?"
6. "Do you want a dedicated announcement-channel surface now, or can announcement channels remain on
   the generic shell?"
7. "Do you want a dedicated forum or topic-first hub surface now, or can forum-like channels remain
   on the generic shell?"
8. "When a user opens a bare group route, should we always redirect to the canonical default
   channel, or do you want a real hub overview page instead?"
9. "For Social group discovery, should group results directly join, or only open the routed
   destination?"
10. "For web privacy, what is the final product model we are implementing: keep the current simpler
    model or expand to the fuller selective model?"
11. "Should customization inventory be fully server-owned now, or is mixed server ownership plus
    local presentation metadata still allowed?"
12. "At this step, does this logic belong in `packages/*` as shared runtime-neutral contract logic,
    or stay app-specific in `apps/web`?"

### Product Scope Decisions

- [x] Broadcasts are in scope for this 100% pass. Owner direction on 2026-05-13: treat this
      checklist as execution commands.
- [x] Spaces are in scope for this 100% pass. Owner direction on 2026-05-13: treat this checklist as
      execution commands.
- [x] Vault is in scope for this 100% pass. Owner direction on 2026-05-13: treat this checklist as
      execution commands.
- [x] Dedicated voice-channel room routes are in scope for this 100% pass.
- [x] Dedicated video-channel room routes are in scope for this 100% pass.
- [x] Dedicated announcement-channel surfaces are in scope for this 100% pass.
- [x] Dedicated forum or topic-first hub surfaces are in scope for this 100% pass.

### Behavior Decisions

- [x] Bare group routes should resolve by redirecting to a canonical default channel, unless the
      owner explicitly chooses a real hub overview page instead.
- [x] Social group discovery should directly join when appropriate.
- [x] Social group discovery should remain route-open only when appropriate.
- [x] Notification links must preserve enough metadata to open the final routed destination
      directly.
- [x] The final web privacy model is chosen and documented. Owner direction on 2026-05-15: implement
      the fuller selective model with `everyone` / `contacts` / `nobody` rules plus always-allow and
      never-allow exception lists.
- [x] Customization inventory ownership is chosen. Owner direction on 2026-05-15: inventory and
      equipped-state truth must be fully server-owned; local cosmetic definitions are allowed only
      as presentation/catalog metadata.

### Native Follow-On Boundary Decisions

- [x] Shared logic target is documented: types, schemas, API contracts, utilities, design tokens,
      and runtime-neutral business rules belong in `packages/*`. Ask at implementation time when a
      new shared-boundary decision is blocking.
- [x] Web-only route owners, browser storage, browser notifications, browser upload adapters, and
      browser call/media behavior stay in `apps/web`.
- [ ] Mobile and desktop restart only after the convergence items below are complete and validated.

## Execution Checklist

### A. Stop Route Lies And Fake Behavior

- [x] Remove remaining producers of bare `/groups/:groupId` links when the caller already has enough
      routing context.
- [x] Fix discover and notification group links so they open canonical mounted destinations.
- [x] Ensure all routed social destinations open real, non-placeholder targets.
- [x] Ensure no shipped routed control implies behavior that is still missing.

### B. Make Routed DM And Group Surfaces Complete

- [x] Routed DM attachments are real and browser-verified. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-14.
- [x] Routed DM voice-note send is real and browser-verified. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-14.
- [x] Routed DM reply, edit, delete, forward, request, pin, search-jump, guarded scroll, and
      read-receipt rendering behavior are complete. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts`; the 2026-05-16 read-receipt slice also proves
      backend `metadata.readBy` serialization with
      `apps/backend/test/cgraph_web/controllers/api/v1/message_controller_test.exs`.
- [x] Routed DM typing start/stop emits from the live input path. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-16 with the E2E-only typing observer.
- [x] Routed DM voice/video call entry launches real call routes from the live header. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-16 for `/call/:recipientId/audio` and
      `/call/:recipientId/video` controls. Incoming-call accept/end-state proof is covered below;
      deeper peer media negotiation remains a final release-validation risk.
- [x] Call-history callback launches the mounted call screen from a real history row. Verified by
      `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16.
- [x] Incoming calls accept into the mounted call screen and return cleanly through the end-call
      control. Verified by `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16 through the
      root-mounted `IncomingCallHandler`, `/call/:recipientId/video?incoming=true&roomId=...`,
      visible video controls, and end-call navigation back to the DM route. Deeper peer media
      negotiation remains tracked as final release validation risk.
- [x] Routed group search and notification or mute behavior are real.
- [x] Routed group message context actions are real.
- [x] Routed group admin and settings surfaces are mounted and usable.

### C. Converge Identity, Settings, And Customization Ownership

- [x] One canonical web identity model exists for avatar, border, title, badges, and display name.
      Verified by `apps/web/src/lib/identity/__tests__/canonicalIdentity.test.ts` on 2026-05-15.
- [x] Normalizers and socket sync preserve the same identity fields everywhere. Verified by
      `apps/web/src/lib/api-utils/__tests__/normalizers.test.ts`, friend-store identity patch tests,
      and web typecheck on 2026-05-15. Friend cosmetic live updates now route through
      `apps/web/src/lib/identity/otherIdentitySync.ts`, which updates the friend store and routed
      chat store through one selective patch owner; own-profile cosmetic socket updates route
      through `apps/web/src/lib/identity/ownIdentitySync.ts`. Routed browser proof for a live friend
      avatar-border/title update is covered by `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16.
- [x] Settings, theme, and customization ownership converge on one explicit orchestration model. The
      2026-05-15 slice adds `apps/web/src/modules/settings/store/preferenceOrchestrator.ts`, routes
      auth bootstrap and the settings page through it, folds facade loading/saving state across
      settings/customization/theme, gates settings section panels until bootstrap readiness is
      fulfilled, proves extended notification fields round-trip through the backend settings
      response, routes Calls/Stickers reset through the server settings API with rollback proof, and
      adds backend/user-channel sync events for server-owned customization and theme patches.
      Validated with focused backend/web store tests plus web typecheck.
- [x] Customization inventory and equipped-state ownership are consistent end to end for the
      identity-customization route and backend save contract. The 2026-05-15 slice hydrates
      ownership/equipped state from `/api/v1/cosmetics/inventory`, keeps local cosmetic definitions
      as presentation metadata, rejects unowned customization saves in the backend, exposes
      inventory catalog keys from the backend, and validates the path with focused backend/web tests
      plus web typecheck.

### D. Finish Missing First-Class Routed Products

- [x] Broadcasts have first-class routed web surfaces if they remain in scope. Directory, create,
      detail/feed, subscribe, and owner publish are browser-verified by
      `apps/web/e2e/broadcasts.spec.ts` on 2026-05-14.
- [x] Spaces have first-class routed web surfaces if they remain in scope. `/spaces` and
      `/spaces/:spaceId` list, create, and filter backend-owned Spaces and are browser-verified by
      `apps/web/e2e/spaces.spec.ts` on 2026-05-15. Per-chat Space move controls now live in the
      routed conversation-list action menu, patch the server-owned Space include/exclude lists, and
      are browser-verified by `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-17.
- [x] Vault has a first-class routed web surface if it remains in scope. `/vault` creates or opens
      the backend Note-to-Self conversation and is browser-verified by `apps/web/e2e/vault.spec.ts`
      on 2026-05-15.
- [x] Voice and video room routes exist if they remain in scope.
- [x] Announcement and forum-specific routed surfaces exist if they remain in scope.

### E. Backend And Shared-Contract Convergence

- [x] Web and backend use one truthful attachment and media contract. Routed DM/group file uploads
      now share `packages/shared-types/src/media.ts`; `apps/web/e2e/dm-media-composer.spec.ts`
      passed on 2026-05-15 after the contract change.
- [x] Web and backend use one truthful settings and privacy contract. The 2026-05-15 slice adds
      `packages/shared-types/src/privacy.ts`, API-client schemas, backend `selective_privacy`
      storage/rendering, web mapper/UI wiring, and focused backend/web/shared tests for the
      selective privacy contract.
- [x] Web and backend use one truthful identity and customization contract for the audited identity
      and customization surfaces. The 2026-05-15 slices preserve canonical identity fields through
      shared/web normalizers, hydrate `UserProfileCard` from `/api/v1/users/:id` when only `userId`
      is supplied, derive customization ownership/equipped state from backend inventory, and reject
      unowned customization saves in the backend.
- [x] Shared runtime-neutral types and schemas are defined in `packages/*`, not duplicated ad hoc in
      web. The 2026-05-15 slice moves the runtime-neutral user settings contract and defaults into
      `packages/shared-types/src/settings.ts`, keeps web re-exporting the contract from the old
      store path for compatibility, exposes the package subpath, and validates shared/web type
      checks plus focused settings tests.
- [x] Package boundaries remain free of web-only runtime imports and browser globals. Verified with
      `pnpm run check:packages` on 2026-05-14.

### F. Validation And Release Truth

- [x] Focused browser UAT is run for auth, DMs, groups, social, settings, Nodes, identity cosmetics,
      and calls. Verified by `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16.
- [x] Regression tests exist for the critical routed behaviors that were previously fake, partial,
      or misrouted. Current route-owned coverage includes `apps/web/e2e/dm-media-composer.spec.ts`,
      `apps/web/e2e/broadcasts.spec.ts`, `apps/web/e2e/spaces.spec.ts`,
      `apps/web/e2e/vault.spec.ts`, and `apps/web/e2e/web-owner-uat.spec.ts`.
- [x] The support matrix matches the routed app after the final validation pass.
- [x] No document still claims a feature is working if browser verification has not happened.

## Shared Code Direction

To be industry-standard, the shared cross-platform foundation should converge toward:

### Shared In `packages/*`

- API schemas and client contracts
- domain types
- runtime-neutral normalization rules
- design tokens and animation constants
- reusable utilities
- package-safe state machines or business rules

### App-Specific In `apps/web`

- route owners
- routed page composition
- browser storage adapters
- browser notification and service-worker logic
- browser media, upload, and call adapters
- browser-only UI state and interaction flows

If an agent proposes moving route owners or browser runtime code into shared packages, reject it.

## Required Update Order After Each Slice

After every implementation slice, update docs in this exact order:

1. `docs/WEB-ULTIMATE-STRICT-PASS.md`
2. `docs/WEB-MESSAGING-HUBS-BROADCASTS-AUDIT.md`
3. `docs/WEB-IMPLEMENTATION-INVENTORY.md`
4. `docs/WEB-ULTIMATE-IMPROVEMENT-GAPS.md`
5. `docs/WEB-ULTIMATE-IMPROVEMENT-PLAN.md`
6. `docs/WEB-SUPPORT-MATRIX.md`

## Final Owner Sign-Off Questions

Do not call the workstream complete until the owner can answer "yes" to every question below.

- [ ] Can a user navigate every in-scope routed messaging, hub, and social surface without landing
      on a blank, partial, or semantically wrong destination?
- [ ] Are all in-scope routed controls real?
- [ ] Does the web app use one truthful identity, settings, and customization model?
- [ ] Are the backend contracts and shared package contracts aligned with the final web behavior?
- [ ] Would a desktop or mobile team inherit a cleaner shared contract foundation after this work,
      rather than a web-specific mess?
- [ ] Has the final state been verified in live routed behavior, not just code reads?

If any answer is "no", the web workstream is not 100% complete.
