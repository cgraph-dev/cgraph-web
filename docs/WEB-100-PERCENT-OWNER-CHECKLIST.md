# Web 100 Percent Owner Checklist

Status date: 2026-05-27

Current checklist state: 50 / 50 owner-level implementation rows are closed for this execution
contract, but this is not the same as full Level 2 release-readiness or a complete web-workstream
sign-off. The final sign-off questions at the bottom of this file remain open, and
`docs/WEB-ULTIMATE-STRICT-PASS.md` plus `docs/WEB-PRODUCT-MATURITY-SCORECARD.md` still own the
stricter release/product-maturity gaps. Treat this document as "owner implementation checklist
closed, final sign-off pending", not as a 100% production maturity claim.

The Space route, verify-email resend, onboarding skip/recovery, cancel-deletion, phone
native-attestation guard, verify-email-before-onboarding route gate, routed DM read-receipt
rendering, routed DM guarded-scroll, routed DM typing-proof, routed DM call-entry, call-history
callback, incoming-call accept/end-state, routed identity/cosmetic live-update, routed
conversation-list/Space menu implementations, routed DM GIF/sticker send, routed group
GIF/sticker/voice sends, and the seven static profile themes shared across full profile,
profile-card, mini/hover-card, and customization preview surfaces are source-backed and
browser-verified or narrowly test-verified where this checklist requires it. Broader
product-maturity risks remain tracked honestly in the strict pass and scorecard documents.

2026-05-21 production-web proof: `cgraph-web` commit `867b562c7ffaa09afdb5db4525cc1a8edc4ac0de`
removes the web Effects route/tab and old particle engine, adds one shared avatar upload/cropper
used by onboarding, settings, and profile edit, keeps the sidebar avatar/border in sync with the
auth identity while opening the mini profile card on hover, and preserves authenticated state when
auth re-check fails for non-401/403 reasons. `cgraph-packages` commit
`4f6927f18e6eb4ff8ba644df0d58188d1fb6c974` owns the matching shared `httpClient` logout behavior,
and web/mobile package mirrors now point at that canonical package commit.

2026-05-21 production-web follow-up proof: `cgraph-web` commit
`8e7e202e7349a850e96593b57d62758115663347` adds a stable browser device ID for socket and push
registration, gates device-revocation logout to explicit current-device revocations, routes
identity-customization equips through backend inventory targets with optimistic own-profile sync,
normalizes Lottie cosmetic asset paths with runtime fallbacks, animates badges/titles across
customization and profile-card surfaces, and replaces the broken Groups no-selection rectangle with
a full messaging-style empty state. `cgraph-packages` commit
`3358129f8dd658e6c7c97845181d856c44e3be7e` makes the shared badge/title registries default to Lottie
motion metadata, and production web commit `452bc9d7f25da7f4965339ceec1e05c9e0c5d576` syncs that
mirror. This strengthens the checklist rows below, but it does not close the final owner sign-off
questions.

2026-05-21 app-shell/theme proof: `cgraph-backend` commit `133152be845465d4ca3a66ce8cfe2ecbc15c5cfb`
changes the persisted app-theme default to Aurora and migrates non-explicit legacy app-theme rows to
Aurora, while preserving users who explicitly chose a different app theme. `cgraph-web` commit
`d664846f953d54eae1727069cda6ae999da0955ba` removes the old legacy local theme key from first paint,
ignores non-explicit server app-shell modes during theme sync, and persists explicit app-theme
selections back to the backend. `cgraph-web` commit `9ca329a25689483c5fb51ad6183efb583bc440e9` then
centralizes reduced-motion preference reads through one motion preference owner used by Lottie,
nameplates, auth effects, liquid-glass helpers, transition helpers, adaptive motion, and the
settings motion helper. This improves theme and motion ownership, but it still does not close the
final live routed sign-off questions below.

2026-05-22 preference-sync proof: `cgraph-web` commit `416de9fe7023777d3b8a13301c009f230a5e66ad`
fixes server-applied app-shell theme sync, gives the privacy selects accessible route-proof labels,
and adds `apps/web/e2e/settings-preference-sync.spec.ts` to verify server-hydrated privacy values,
reload persistence, routed settings live sync, customization profile-card live sync, and app-shell
theme live sync. This closes the earlier routed reload/live-sync proof gap for the checklist layer,
while the stricter docs still keep real multi-tab/device socket validation and broad final browser
validation open.

2026-05-22 Nodes wallet/shop browser proof: `cgraph-web` commit
`69ee0b4b4b8a88f898805577af2716f73a5b7ae2` adds `apps/web/e2e/nodes-wallet-shop.spec.ts` to verify
routed wallet balance and transaction rendering, wallet failure without false zero-balance UI,
transaction-history failure while wallet state remains visible, shop bundle rendering, checkout
failure toast, bundle-load failure without empty-success UI, and the true empty-shop state. This
closes the strict wallet/shop browser recheck item. The later 2026-05-23 Nodes negative-path slice
narrows the tip/gift/unlock risk described below.

2026-05-27 Nodes checkout route-contract proof: production backend now creates checkout sessions
through an injectable Stripe session owner and returns canonical `/me/wallet` and `/me/wallet/shop`
success/cancel routes instead of relying on the legacy `/nodes` redirect. Focused backend proof
lives in `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` for success,
Stripe-rejection, and unknown-bundle contracts. The routed web proof remains
`apps/web/e2e/nodes-wallet-shop.spec.ts`, which verifies checkout failure copy on the mounted shop
route.

2026-05-27 Nodes wallet/shop retry proof: the backend controller test now also proves authenticated
wallet balance, filtered transaction history, and active shop bundle schema responses. The routed
web proof now holds wallet, transaction-history, and bundle APIs in real failure long enough to
render the mounted error states, resets the API circuit on user-triggered Retry, and verifies the
wallet/shop routes recover without showing false zero-balance or empty-shop success UI.

2026-05-27 Nodes profile tip/gift proof: production backend controller proof now covers
insufficient-balance and successful response contracts for `POST /api/v1/nodes/tip` and
`POST /api/v1/nodes/gift`. Production web also aligns the shared Nodes failure mapper with backend
tip/gift error codes and adds `apps/web/e2e/nodes-profile-actions.spec.ts`, which opens the mounted
`/user/:userId` profile route, submits tip and gift actions, verifies canonical insufficient-balance
copy stays visible after the first server rejection, retries, and only shows success after the
server accepts the second request. This closes tip/gift retry UX at the strict routed-browser layer;
forum content-unlock retry breadth is closed by the next proof note.

2026-05-27 Nodes content-unlock route-contract proof: production backend controller proof now covers
insufficient-balance, successful unlock, duplicate unlock, free-thread, and unknown-thread contracts
for `POST /api/v1/nodes/unlock`. Production web now preserves backend gated-thread fields through
forum post normalization, mounts `ContentUnlockOverlay` on the routed forum post page, disables
automatic HTTP and React Query retries for Nodes money mutations, preserves idempotency keys for
explicit mutating retries, and adds `apps/web/e2e/nodes-content-unlock.spec.ts`. That routed browser
proof verifies insufficient-balance navigation to `/me/wallet/shop`, not-gated/not-found retryable
errors, explicit server failure without false success, and gate removal only after the user's second
explicit unlock action succeeds. This closes the strict forum content-unlock retry breadth item.

2026-05-23 auth/account browser proof: `apps/web/e2e/auth-account-routes.spec.ts` now verifies
routed email login with 2FA, registration, forgot-password, reset-password, verify-email token and
resend states, QR login session creation, and existing-user phone login OTP completion against
mocked backend contracts. This closes the strict broad auth route browser-proof item, while real
mail-provider delivery and the remaining phone registration-lock, call-fallback, and new-user
completion branches stayed open until the later phone-flow proof below.

2026-05-28 reset-token proof: production backend `auth_controller_test.exs` now proves valid
password reset, login with the new password, replay rejection, invalid token, expired token, and
missing-param validation. Production web `auth-account-routes.spec.ts` browser-verifies mounted
reset-password success plus invalid, expired, and reused-token recovery. This closes the strict
password-reset confirm contract while real mail-provider delivery remains tracked separately.

2026-05-28 QR-login proof: production backend `qr_auth_controller_test.exs` now proves QR session
creation, coded stale-session, missing-parameter, and invalid-signature failures, valid approval
broadcast, and one-time session consumption. Production web `auth-account-routes.spec.ts`
browser-verifies mounted `/qr-login` session creation, stale-code expiry, and explicit Generate New
Code retry. This closes the stale QR cleanup route/contract gap; paired approval from a real second
client remains an external/mobile-lab proof item, not a local route checkbox.

2026-05-28 initial final-validation proof: production web commit `01f55bf` passed a rebuilt
`web-owner-uat.spec.ts` browser pass covering auth entry, routed DM send, incoming-call accept/end,
group send/media/GIF/sticker/voice/search/mute/actions/settings, Social discovery, Settings privacy,
Nodes wallet, call history callback, and voice-room entry. Vercel deployed the commit and
`pnpm --filter @cgraph/web smoke:production` passed against `web.cgraph.org`. This moves final
validation out of zero, but it is not the full strict per-suite release signoff.

2026-05-28 targeted final-validation proof: production web now keeps `VITE_E2E_AUTH_BYPASS` scoped
to route guards, Turnstile, and test bootstrap instead of hard-failing the explicit login action.
After rebuilding the app with the same E2E env, the focused Chromium Playwright slice passed 40 / 40
tests across `apps/web/e2e/auth-account-routes.spec.ts`, `apps/web/e2e/dm-media-composer.spec.ts`,
`apps/web/e2e/social-main-pane.spec.ts`, `apps/web/e2e/settings-preference-sync.spec.ts`, and
`apps/web/e2e/nodes-wallet-shop.spec.ts`. This proves the local auth, DM, social, settings, and
Nodes browser routes still agree with their mocked backend contracts; external-provider checks,
paired QR/mobile approval, physical cross-device sync, Stripe handoff success, and deeper two-client
media negotiation remain strict-release gaps.

2026-05-28 group/call replay proof: the rebuilt production web E2E bundle also passed 46 / 46
focused Chromium group/forum tests across `apps/web/e2e/group-settings-permissions.spec.ts`,
`apps/web/e2e/group-channel-scroll.spec.ts`, `apps/web/e2e/group-entry-routes.spec.ts`,
`apps/web/e2e/group-invite-landing.spec.ts`, and `apps/web/e2e/groups-forums.spec.ts`. The same
build passed `apps/web/e2e/web-owner-uat.spec.ts`, replaying the mounted owner route path for
incoming-call accept/end, manual call route controls, call-history callback, group media/actions,
voice room entry, and adjacent auth/social/settings/Nodes surfaces.

2026-05-28 call-history contract proof: production backend now serializes server-owned
`end_reason` / `missed_seen` fields on call history and scopes call detail lookup to the
authenticated user's visible records. Production packages preserve that backend envelope in
`@cgraph/api-client`, and production web uses the same missed-call truth in the route normalizer.
Focused backend, package, and web tests are green; deeper WebRTC media negotiation remains in the
strict release-readiness document.

2026-05-23 phone-flow browser proof: production web commit `5f86bb9` extends
`apps/web/e2e/auth-account-routes.spec.ts` to verify new-user phone registration through profile and
permissions, OTP resend, voice-call fallback, registration-lock PIN completion, and
native-device-required recovery. `AuthFormInput` now associates visible labels with inputs so the
phone profile step is accessible by label. The stricter release-readiness documents still keep real
provider delivery, paired QR approval, destructive account lifecycle proof, and final broad browser
validation open at this point in the sequence.

2026-05-23 account-deletion lifecycle proof: production web commit `93febe9` extends
`apps/web/e2e/settings-preference-sync.spec.ts` to browser-verify the mounted
`/me/settings/delete-account` route. The proof cancels a pending deletion through
`DELETE /api/v1/me/delete-account`, schedules deletion through password-confirmed
`POST /api/v1/me/delete-account`, asserts the password payload, and verifies the follow-up auth
logout side effect. The stricter release-readiness documents still keep real provider delivery,
paired QR approval, group edge proof, package-version consumption, and final broad browser
validation open at this point in the sequence.

2026-05-23 group-settings permission proof: production web commit `5351b03` gates group settings
management tabs by owner/admin/member permissions and adds
`apps/web/e2e/group-settings-permissions.spec.ts`. The routed proof verifies owners still see
Overview/Roles/Members/Invites/Channels/Audit Log/AutoMod and can save overview changes, while
ordinary members only see personal Notifications/Danger actions and do not issue admin
`PATCH /api/v1/groups/:groupId` requests. The stricter release-readiness documents still keep
endpoint-level permission-denied copy, paired QR approval, provider delivery, package-version
consumption, and final broad browser validation open.

2026-05-25 group-settings permission-edge proof: production web now surfaces route-specific 403 copy
for denied overview saves, role create/update/reorder/delete, invite list/create/delete, member role
assignment, and kick/ban/mute actions on `/groups/:groupId/settings`. The same routed Playwright
spec verifies each backend request and visible denial message. Remaining strict group work is richer
admin edge-state breadth beyond the focused 403 contract.

2026-05-26 group-settings admin-edge proof: production web now gives the routed Danger Zone its own
visible error owner for failed leave/delete actions and maps node-gated access save failures to
route-specific copy. `apps/web/e2e/group-settings-permissions.spec.ts` browser-verifies the
node-gated access PATCH payload, node-gated 403 copy, leave 403 copy, and delete 403 copy on
`/groups/:groupId/settings`.

2026-05-26 group-settings media proof: the same routed settings spec now verifies group icon and
banner uploads against `POST /api/v1/groups/:groupId/avatar` and
`POST /api/v1/groups/:groupId/banner`, then verifies the resulting backend-owned media URLs are
saved through the group `PATCH` contract.

2026-05-26 role-management validation and hierarchy proof: production backend now trims role names,
rejects blank role names, validates role colors as hex, rejects unknown permission bits, marks the
seeded Member role as the default role, blocks default-role mutation, and enforces that non-owner
role managers can update/delete only roles below their highest role. Production web now keeps blank
role names local without calling create, preserves specific backend default-role, highest-role, and
payload-validation error copy, and browser-verifies those routed states in
`apps/web/e2e/group-settings-permissions.spec.ts`, including routed reorder hierarchy copy and
invalid color/permission detail rendering.

2026-05-26 member-management moderation proof: production backend now mounts the member unmute route,
returns explicit `is_muted` truth in member JSON, and proves kick removal, ban creation plus
membership removal, and mute/unmute state transitions in
`test/cgraph_web/controllers/api/v1/group_member_controller_test.exs`. Production web now derives
member muted state from the backend contract and browser-verifies successful mute, unmute, kick, and
ban reconciliation on `/groups/:groupId/settings` in
`apps/web/e2e/group-settings-permissions.spec.ts`.

2026-05-25 group scroll proof: production web now constrains the routed groups shell height, lets
the group message list own scroll state, and replaces naive group-channel autoscroll with guarded
anchor/latest behavior. `apps/web/e2e/group-channel-scroll.spec.ts` browser-verifies that
`/groups/:groupId/channels/:channelId?scrollTo=...` lands on the target message, an incoming message
stays below the reader instead of yanking the viewport, and jump-to-latest reaches the new message.

2026-05-25 Cloud Chat composer convergence proof: production web now routes the live DM composer
through the shared `modules/chat` `MessageInput` adapter while keeping the routed Cloud Chat owner
responsible for upload, paid-file, GIF, sticker, voice-note, reply, and typing contracts. Focused
component tests prove the adapter boundary, and the full routed
`apps/web/e2e/dm-media-composer.spec.ts` Chromium proof revalidates the browser route. The broader
strict-pass DM surface convergence row remains open until list/action/bubble/media ownership
converges too.

2026-05-26 group invite lifecycle proof: production web now normalizes generated and loaded group
invites from backend-owned lifecycle fields, including explicit server `null` values for unlimited
or no-expiry invites. `apps/web/e2e/group-settings-permissions.spec.ts` browser-verifies selected
expiry/max-use create payloads, unlimited invite payload omission, generated-link rendering, and the
managed invite row copy for finite and unlimited invites on `/groups/:groupId/settings`. Focused
hook tests verify the local invite manager respects the server response over optimistic fallback
values.

2026-05-27 group invite management closure proof: production backend now treats explicit
`expires_in` as the server-owned source for `expires_at`, keeps omitted expiry as a permanent
invite, and deletes invites through the mounted
`DELETE /api/v1/groups/:group_id/invites/:id` route. Focused backend proof lives in
`apps/backend/test/cgraph/groups/invites_test.exs` and
`apps/backend/test/cgraph_web/controllers/api/v1/invite_controller_test.exs`. Production web now
browser-verifies successful routed invite-delete reconciliation on the manage-invites tab in
`apps/web/e2e/group-settings-permissions.spec.ts`.

2026-05-26 group invite-link route proof: production web now mounts `/invite/:code` for generated
group invite links instead of letting those URLs fall into the catch-all route. The new route loads
invite preview truth through `GET /api/v1/invites/:code`, redeems through
`POST /api/v1/invites/:code/join`, navigates to the joined group's canonical channel route, and
keeps expired invites on the invite page without redeeming them. Browser proof lives in
`apps/web/e2e/group-invite-landing.spec.ts`.

2026-05-26 backend invite-consumption proof: production backend now redeems group invites by locking
the invite row and performing lifecycle validation, member insert, and use-count increment inside
one transaction. Expired, revoked, maxed, and duplicate-member attempts no longer consume invite
uses. Focused proof lives in `apps/backend/test/cgraph/groups/invites_test.exs`, and route-level
error-envelope proof lives in `apps/backend/test/cgraph_web/controllers/api/v1/invite_controller_test.exs`.

2026-05-26 Cloud Chat bubble/action/media convergence proof: production web now makes
`EnhancedMessageBubble` a thin route adapter over shared `modules/chat` `MessageBubble`. The shared
bubble owns sticker rendering, pinned badges, read receipts, message media rendering, delete copy,
and the message action menu for the routed DM surface. Focused component tests cover the shared
pinned/sticker behavior, and the full routed `apps/web/e2e/dm-media-composer.spec.ts` Chromium proof
revalidates reply, edit, pin, forward, delete, read receipts, file unlock states, voice, GIF,
sticker, typing, calls, and message-request gates. The strict-pass row remains open until
route-owned message list/page orchestration also converges.

2026-05-26 Cloud Chat list convergence proof: production web now renders the routed DM conversation
through shared `modules/chat` `MessageList`, with the route shell passing backend action handlers,
typing state, edit state, and id-based search/pinned/latest scroll requests into the shared list
contract. The shared list owns virtualization, message-row rendering, active-menu stacking, and
guarded scroll-to-message behavior. Typecheck, lint, production build, and the full routed
`apps/web/e2e/dm-media-composer.spec.ts` Chromium proof pass against the rebuilt preview. This
closes the owner checklist's shared composer/list/action/media stack row, while final broad release
validation remains tracked by the strict-pass and maturity scorecard documents.

2026-05-23 connected-account provider proof: production web commit `f7142b6` moves OAuth provider
discovery into shared OAuth helpers, mounts Connected Accounts at `/me/settings/connected-accounts`,
and uses `/api/v1/auth/oauth/providers` to decide which account-linking actions render. The focused
unit proof covers configured-provider parsing and empty-provider behavior, while
`apps/web/e2e/settings-preference-sync.spec.ts` browser-verifies the routed settings page showing
Google/TikTok from backend discovery while hiding unavailable Apple/Facebook account-linking
actions. The stricter release-readiness documents still keep real provider delivery, paired QR
approval, package-version consumption, and final broad browser validation open.

2026-05-23 GIF storage schema proof: production web commit `dd6de12` moves the GIF picker favorites
and recent caches to schema-versioned keys, migrates the old `cgraph-gif-favorites` and
`cgraph-gif-recent` keys one time, removes the legacy keys after migration, and verifies the
behavior with focused hook tests plus the storage policy gate. This closes the low-risk
feature-cache schema-versioning hardening row without changing the broader product-maturity sign-off
status.

2026-05-23 Nodes negative-path proof: production web commit `436d4ff` centralizes Nodes failure
copy, keeps routed paid files locked on failed unlock, treats already-unlocked server responses as
accessible, exposes Add Nodes recovery for insufficient balance, and wires routed Cloud Chat through
the locked-file owner instead of bypassing it with the plain file renderer.
`apps/web/e2e/dm-media-composer.spec.ts` now browser-verifies routed paid-file insufficient-balance,
already-unlocked, and rate-limit states; focused component tests cover tip, gift, and content-unlock
negative copy. Later 2026-05-27 production proof closes profile tip/gift and forum content-unlock
retry UX, and 2026-05-28 production proof adds coded backend paid-file validation, not-found,
insufficient-balance, success, and duplicate-unlock contracts plus routed failed-then-explicit-retry
success. Stripe handoff success and final broad browser validation remain open in the stricter
release-readiness documents.

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
- [x] Mobile and desktop restart only after the convergence items below are complete and validated.
      Until then, mobile and desktop work is limited to truth cleanup, package resync, or explicit
      foundation-directed slices.

### Repo, Package, And Sync-Strategy Decisions

- [x] `/CGraph` is the umbrella planning and integration workspace for cross-repo work and PR #22.
      It is not, by itself, proof that the split production repos have deployed.
- [x] `/home/looter-admin/CGraphRepos/cgraph-backend` is the Fly.io backend production repo.
- [x] `/home/looter-admin/CGraphRepos/cgraph-web` is the Vercel web production repo.
- [x] `/home/looter-admin/CGraphRepos/cgraph-packages` is the canonical source owner for `@cgraph/*`
      packages.
- [x] App-local `packages/` folders are mirrors during the transition, not editable shared-package
      owners.
- [x] Shared-package changes start in `cgraph-packages`, then move to app repos through the
      documented mirror or future versioned-package sync path.
- [x] Production deployment only happens after the owning production repo receives the relevant
      committed change and its deploy platform is able to build it.
- [x] Current package promotion order is the corrected order from
      `docs/SHARED-PACKAGES-AUDIT-AND-PROMOTION-PLAN.md`: phase 2, mobile re-sync from phase 5,
      phase 3, phase 4, remaining phase 5, then phase 6.

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
- [x] Routed group GIF, sticker, and voice-note sends are real. Verified by
      `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-18; backend channel media payload proof lives
      in `apps/backend/test/cgraph_web/controllers/api/v1/channel_message_controller_test.exs`.
- [x] Routed group admin and settings surfaces are mounted and usable. Verified by
      `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-17 for cold settings-route ownership, overview
      save, invite creation, member role assignment, role-tab render, and settings-channel creation.
      `apps/web/e2e/group-settings-permissions.spec.ts` now also verifies endpoint-level 403 copy
      for denied overview save, role create/update/reorder/delete, invite list/create/delete, member
      role assignment, and kick/ban/mute.
- [x] Routed group scroll behavior is real. Verified by `apps/web/e2e/group-channel-scroll.spec.ts`
      on 2026-05-25 for routed `scrollTo` anchors, incoming-message stability below the reader, and
      jump-to-latest behavior. Remaining group release-readiness work is richer admin edge-state
      breadth, tracked in `docs/WEB-ULTIMATE-STRICT-PASS.md`.

### C. Converge Identity, Settings, And Customization Ownership

- [x] One canonical web identity model exists for avatar, border, title, badges, and display name.
      Verified by `apps/web/src/lib/identity/__tests__/canonicalIdentity.test.ts` on 2026-05-15. The
      2026-05-21 production web slice also routes onboarding, settings avatar changes, and
      profile-edit avatar changes through one crop/upload adapter in
      `apps/web/src/components/avatar/avatar-upload-cropper.tsx` plus
      `apps/web/src/lib/avatar-upload.ts`.
- [x] Normalizers and socket sync preserve the same identity fields everywhere. Verified by
      `apps/web/src/lib/api-utils/__tests__/normalizers.test.ts`, friend-store identity patch tests,
      and web typecheck on 2026-05-15. Friend cosmetic live updates now route through
      `apps/web/src/lib/identity/otherIdentitySync.ts`, which updates the friend store and routed
      chat store through one selective patch owner; own-profile cosmetic socket updates route
      through `apps/web/src/lib/identity/ownIdentitySync.ts`. Routed browser proof for a live friend
      avatar-border/title update is covered by `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16.
      The top sidebar avatar now consumes the same auth identity avatar URL and avatar-border owner,
      opens a mini `UserProfileCard` on hover, and clicks through to the public profile route. The
      2026-05-22 production web commit `8e2374fb63f1e368632960575a8f3a0ffeb3b1aa` adds focused
      browser proof for the sidebar mini-card profile theme, avatar border, nameplate, display-name
      effect, and public-profile click-through. Production web commit
      `dae3416c16b50ff4d8cfad4fc1e96bebbb0895c1` extends that proof to the full public profile
      header. The 2026-05-21 follow-up commit keeps title/badge/nameplate Lottie paths normalized
      through `apps/web/src/lib/lottie/lottie-asset-renderer.tsx` and renders those cosmetic layers
      in customization, full profile, mini/hover card, and preview-card surfaces. The later
      2026-05-21 package/web cleanup makes display-name effects and nameplates Lottie-backed catalog
      metadata too, while deleting the old CSS/canvas particle renderers from avatar borders,
      nameplates, and global background effects.
- [x] Settings, theme, and customization ownership converge on one explicit orchestration model. The
      2026-05-15 slice adds `apps/web/src/modules/settings/store/preferenceOrchestrator.ts`, routes
      auth bootstrap and the settings page through it, folds facade loading/saving state across
      settings/customization/theme, gates settings section panels until bootstrap readiness is
      fulfilled, proves extended notification fields round-trip through the backend settings
      response, routes Calls/Stickers reset through the server settings API with rollback proof, and
      adds backend/user-channel sync events for server-owned customization and theme patches. The
      2026-05-22 preference-sync proof verifies privacy reload plus settings/customization/theme
      live-sync behavior on mounted web routes. Validated with focused backend/web store tests,
      Chromium route proof, and web typecheck.
- [x] Customization inventory and equipped-state ownership are consistent end to end for the
      identity-customization route and backend save contract. The 2026-05-15 slice hydrates
      ownership/equipped state from `/api/v1/cosmetics/inventory`, keeps local cosmetic definitions
      as presentation metadata, rejects unowned customization saves in the backend, exposes
      inventory catalog keys from the backend, and validates the path with focused backend/web tests
      plus web typecheck. The 2026-05-21 follow-up maps backend inventory item IDs/slugs to the web
      catalog before equip/unequip, persists equips through `/api/v1/cosmetics/equip`, rolls back on
      failure, and immediately patches the own identity/profile preview owner so selections no
      longer appear dead.

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
      unowned customization saves in the backend. The 2026-05-20 profile-theme slice keeps the
      selectable profile-theme set capped at seven shared IDs in
      `packages/shared-types/src/cosmetics.ts`, validates saved IDs in the backend, and renders the
      same static theme semantics across full profile, profile-card, mini/hover-card, and
      customization preview surfaces.
- [x] Shared runtime-neutral types and schemas are defined in `packages/*`, not duplicated ad hoc in
      web. The 2026-05-15 slice moves the runtime-neutral user settings contract and defaults into
      `packages/shared-types/src/settings.ts`, keeps web re-exporting the contract from the old
      store path for compatibility, exposes the package subpath, and validates shared/web type
      checks plus focused settings tests. The 2026-05-20 follow-up moves the settings API mappers
      and realtime payload narrower into canonical `@cgraph/shared-types` commit
      `944e3fe8ddb9faa1f8bc496a786c9d9d10b12dbf`, leaving web's settings mapper file as a thin
      compatibility adapter.
- [x] Package boundaries remain free of web-only runtime imports and browser globals. Verified with
      `pnpm run check:packages` on 2026-05-14.

### F. Validation And Release Truth

- [x] Focused browser UAT is run for auth, DMs, groups, social, settings, Nodes, identity cosmetics,
      and calls. Verified by `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16, focused
      auth/account route proof in `apps/web/e2e/auth-account-routes.spec.ts` on 2026-05-23, and a
      2026-05-28 40-test Chromium slice covering auth/account, DM media/composer, social main pane,
      settings preference sync, and Nodes wallet/shop routes. A follow-up 2026-05-28 replay passed
      46 / 46 focused group/forum route tests plus the owner UAT route covering current call and
      voice-room flows.
- [x] Regression tests exist for the critical routed behaviors that were previously fake, partial,
      or misrouted. Current route-owned coverage includes `apps/web/e2e/dm-media-composer.spec.ts`,
      `apps/web/e2e/broadcasts.spec.ts`, `apps/web/e2e/spaces.spec.ts`,
      `apps/web/e2e/vault.spec.ts`, `apps/web/e2e/auth-account-routes.spec.ts`,
      `apps/web/e2e/nodes-wallet-shop.spec.ts`, and `apps/web/e2e/web-owner-uat.spec.ts`.
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

Current sign-off state: 0 / 6 final questions closed. Do not call the workstream complete until the
owner can answer "yes" to every question below, and do not check these boxes from source inspection
alone.

- [ ] Can a user navigate every in-scope routed messaging, hub, and social surface without landing
      on a blank, partial, or semantically wrong destination?
- [ ] Are all in-scope routed controls real?
- [ ] Does the web app use one truthful identity, settings, and customization model?
- [ ] Are the backend contracts and shared package contracts aligned with the final web behavior?
- [ ] Would a desktop or mobile team inherit a cleaner shared contract foundation after this work,
      rather than a web-specific mess?
- [ ] Has the final state been verified in live routed behavior, not just code reads?

If any answer is "no", the web workstream is not 100% complete.
