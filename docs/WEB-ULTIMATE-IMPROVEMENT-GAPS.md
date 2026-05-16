# Web Ultimate Improvement Gaps (April 2026 verification)

This file is a review companion to `docs/WEB-ULTIMATE-IMPROVEMENT-PLAN.md`. It lists the items that
are still missing, partial, or not proven working enough to claim the plan is "100% implemented and
working". Implemented items are intentionally omitted even where the original plan text is now
stale.

For the owner-level execution contract that defines what 100% means and how another agent must run
this workstream, see `docs/WEB-100-PERCENT-OWNER-CHECKLIST.md`.

2026-05-15 update: first-class Vault/Saved Messages is no longer listed as a gap. `/vault` now opens
the backend Note-to-Self conversation and is browser-verified by `apps/web/e2e/vault.spec.ts`.
First-class Spaces routing is also no longer missing: `/spaces` and `/spaces/:spaceId` now use
`/api/v1/spaces` and are browser-verified by `apps/web/e2e/spaces.spec.ts`.

2026-05-16 update: per-chat Space move controls are no longer listed as a missing conversation-list
feature. The routed conversation action menu now loads server-owned Spaces, shows membership state,
and patches `/api/v1/spaces/:id` include/exclude lists with rollback on failure. Remaining risk is
final routed browser verification of the combined conversation-list menu. The backend Space
controller is now mounted under `/api/v1/spaces` through the messaging route owner and delegates
through `CGraph.Messaging`, with controller tests covering create/list/update/delete.

2026-05-16 update: logged-out verify-email resend is no longer listed as a route-owned gap.
Expired-link recovery now lets the user enter an email, posts it to
`/api/v1/auth/resend-verification`, and the backend accepts that public strict-auth request without
revealing whether the address exists. Remaining auth risk is full browser/mail-provider verification
across the broader auth route set.

2026-05-16 update: onboarding skip and save-failure recovery are no longer listed as missing route
semantics. The routed onboarding Skip action now posts `/api/v1/onboarding/skip` before navigating,
and both skip/save failures render a route-owned recovery error instead of only logging. Remaining
onboarding risk is browser verification.

2026-05-16 update: post-auth gate order is now route-owned. `post-auth-redirect.ts` enforces
verify-email before onboarding before the app route, `ProtectedRoute` and `PublicRoute` both use
that owner, `/verify-email` can render a no-token pending/resend state, and backend auth JSON now
returns `onboarding_completed` so register/login responses can be gated immediately. Remaining auth
risk is broad browser verification of login, registration, recovery, QR, phone, and onboarding
paths.

2026-05-16 update: routed DM read-receipt UI is no longer listed as missing. Backend message JSON
now preloads `read_receipts`, exposes them as `metadata.readBy`, and the routed enhanced DM bubble
renders the Seen/read-receipt state. Focused backend proof lives in
`apps/backend/test/cgraph_web/controllers/api/v1/message_controller_test.exs`, and the routed
browser proof is in `apps/web/e2e/dm-media-composer.spec.ts`.

2026-05-16 update: routed DM guarded scroll is no longer listed as missing. The enhanced
conversation route preserves explicit `scrollTo` anchors, avoids dragging readers to the bottom when
they are reviewing older messages, and exposes a latest/new-messages jump. Browser proof lives in
`apps/web/e2e/dm-media-composer.spec.ts`.

2026-05-16 update: routed DM typing emit is no longer listed as needing browser proof. The live
routed input emits `typing=true`, and send emits `typing=false`; the path is verified by
`apps/web/e2e/dm-media-composer.spec.ts` with the E2E-only typing observer. Remaining DM risk is
GIF/sticker send, call-flow verification, and final conversation-list browser proof.

2026-05-16 update: account deletion grace-period recovery is no longer listed as missing UI. The
settings delete-account panel still uses password-confirmed `POST /api/v1/me/delete-account` and now
also exposes `DELETE /api/v1/me/delete-account` for pending-deletion cancellation, with focused
component coverage for both endpoints. Remaining risk is full browser verification of the
grace-period lifecycle.

2026-05-16 update: phone auth no longer routes web users into the native-only device-attestation
placeholder. `registration-store.ts` now keeps OTP and PIN-lock continuations on the current web
step with a native-device-required error when the backend returns `next_step = device_attestation`,
and focused store tests cover both paths. Remaining phone-auth risk is browser verification of the
login/register entry paths, OTP retry, call fallback, registration lock, profile, and permissions.

2026-05-15 update: the web privacy model decision is closed as the fuller selective model.
`packages/shared-types/src/privacy.ts`, backend `selective_privacy`, API-client schemas, web
mappers, and the privacy panel now preserve `everyone` / `contacts` / `nobody` plus always-allow and
never-allow exception lists in focused tests. Routed browser reload and live-sync validation remain
under the settings/convergence gap.

2026-05-15 update: identity customization inventory is no longer locally owned. The routed identity
customization hook now hydrates ownership and equipped state from `/api/v1/cosmetics/inventory`, the
backend inventory response exposes catalog keys, and customization saves reject unowned border,
title, badge, and nameplate values. Remaining cosmetic risk is broader settings/theme/customization
orchestration plus live-update/browser proof across every visual surface.

2026-05-15 update: `UserProfileCard` no longer renders the default placeholder user when callers
only pass `userId`. The card fetches `/api/v1/users/:id`, maps the response through canonical
identity fields, and focused component tests cover both backend hydration and provided-user paths.

2026-05-15 update: settings, theme, and customization now have one explicit bootstrap owner.
`preferenceOrchestrator` hydrates settings, customization, and theme from auth startup and the
settings route, while `useSettingsFacade` reports aggregate loading/saving state. The settings route
now gates section panels with `isPreferenceBootstrapReady(...)` so panels do not render against
stale defaults while bootstrap is in flight. Remaining settings risk is reload/live-sync proof, not
a missing orchestration owner or first-paint gate.

2026-05-16 update: Calls and Stickers settings are no longer documented or reset as local-only.
Their panels now describe the server-synced settings-store path, and the Advanced reset action saves
Calls/Stickers defaults through `/api/v1/settings` with rollback coverage in
`settingsStore.test.ts`.

2026-05-16 update: customization and theme saves now have a code-level live-sync bridge. Backend
customization/theme updates broadcast `customization_synced` and `theme_synced` on the user channel,
and web applies those server-owned patches into the customization/theme stores without triggering a
new autosave. Remaining settings risk is routed reload and real multi-tab/device browser proof.

2026-05-16 update: `settingsHooks.test.ts` is no longer listed as a quality gap.
`apps/web/src/modules/settings/hooks/__tests__/settingsHooks.test.ts` now mocks the username-change
HTTP client directly, avoids leaking real `/api/v1/users/check-username` requests, and passes
quietly in the focused Vitest run.

2026-05-16 update: routed conversation-list participant controls are now real for the core inbox
actions. The backend mounts current-user routes for mark-unread, archive, unarchive, pin/unpin, and
mute/unmute; the web sidebar exposes those actions plus archived-list recovery, and focused
controller/store tests cover the path. Per-chat Space move controls now use the same routed sidebar
menu and patch the server-owned Spaces contract.

2026-05-15 update: the runtime-neutral user settings contract is no longer web-local.
`packages/shared-types/src/settings.ts` owns user setting types and defaults, and the web
`settingsStore.types.ts` re-exports that package contract for compatibility.

2026-05-15 update: friend cosmetic live updates now flow through a store-owned identity patch
action. `presenceManager` maps `friend_customization_changed` through the canonical identity
projection and calls `useFriendStore.getState().applyIdentityPatch(...)`, which updates friends plus
incoming/outgoing request users through one friend-store owner. Own-profile `profile_updated`,
`item_equipped`, and `item_unequipped` socket events now route through
`apps/web/src/lib/identity/ownIdentitySync.ts`, which patches auth and customization from one
server-sync owner without autosaving the inbound server event. Remaining identity risk is final
routed browser proof across every visual surface.

## Confirmed high-priority gaps

### Focused recovery plan

1. **Finish social selected-entity content and destination correctness** — Partial.
   `apps/web/src/pages/social/social/social.tsx` now renders a real main pane, routes discover
   results to mounted destinations, and joins unjoined group results through the real group store
   action. Selected-entity depth and browser verification are still incomplete.

2. **Normalize all group entry points to valid routes** — Partial. Social discovery and notification
   links now route to canonical group channel destinations when backend `default_channel_id` or
   notification channel metadata exists. Global Explore group cards now receive `default_channel_id`
   from `/api/v1/explore` and route through `community-routing.ts`. The routed channel list now
   splits text, voice, video, announcement, and forum controls onto mounted type-specific routes.
   `/groups/:groupId/settings` now mounts the group admin/settings stack from the live shell, the
   routed channel header now has real loaded-message search plus backend-backed group mute/unmute,
   and channel message menus now wire edit, delete, report, pin, and copy-link actions. The routed
   groups owner still handles metadata-less bare group fallbacks once group data resolves, browser
   verification remains incomplete, and older-message/channel-granular search/notification scope
   still needs an owner decision.

3. **Create a canonical web identity model** — Partial. The shared identity projection now covers
   auth, chat, friends, groups, profile-card hydration, customization inventory ownership, and
   friend and own-profile cosmetic live-update patches. The remaining risk is live-update/browser
   proof across every visual surface that consumes cosmetics.

4. **Stop dropping identity fields during normalization and socket sync** — Closed for the audited
   normalizer and socket-owner boundary. `packages/shared-types/src/identity.ts`,
   `apps/web/src/lib/identity/canonicalIdentity.ts`, and `UserProfileCard` now preserve avatar,
   border, title, badge, nameplate, theme, and display-name styling fields across
   auth/profile/friend/chat/group HTTP, socket paths, and userId-only profile cards.
   `friend_customization_changed` now reaches the friend-store identity patch owner, and own-profile
   cosmetic socket events now reach the own-identity sync owner. Final live-update/browser proof
   remains open.

5. **Consolidate settings, theme, and customization ownership** — Closed for explicit bootstrap
   ownership and shared settings defaults.
   `apps/web/src/modules/settings/store/preferenceOrchestrator.ts` now coordinates settings,
   customization, and theme hydration from auth startup and the settings route, and
   `packages/shared-types/src/settings.ts` owns the runtime-neutral user settings contract.
   `apps/web/src/pages/settings/settings.tsx` now gates section panels until the required bootstrap
   is fulfilled. Extended notification fields are covered by backend controller proof for
   save-response round-trip, Calls/Stickers preference reset now saves through the settings API, and
   customization/theme server patches now sync through the user channel. The remaining settings gap
   is routed reload/live-sync browser proof.

6. **Make customization inventory server-owned end-to-end** — Closed for the routed identity
   customization surface. Static `ALL_BORDERS`, `ALL_TITLES`, and `ALL_BADGES` remain presentation
   metadata only; unlock/equipped truth now comes from backend inventory and the backend rejects
   unowned saves. Broader settings/theme/customization orchestration remains separate.

7. **Lock in behavior with focused web UAT and regression tests** — Partial. A focused owner UAT
   browser smoke now covers auth, DMs, group text send, Social discover, settings, Nodes wallet,
   direct call route mounting, and group voice-room mounting in
   `apps/web/e2e/web-owner-uat.spec.ts`. The broader historical suite still needs cleanup, and the
   backend helper dependency issues (`CGraph.Uploads.S3ClientBehaviour`, missing `:hammer` app)
   remain outside this web UAT proof.

## Remaining numbered plan items

### Structural and feature gaps

- **#6 Enable antivirus on uploads** — Partial. The plan text said `:disabled`; current code is
  better than that but still not complete: backend config is `:metadata_only`, not a real pre-upload
  scan with hard-failure semantics.

- **#7 Wire `prefers-reduced-motion` through the theme store** — Partial / diverged. Reduced-motion
  behavior exists in the settings/theme-engine path, but the specific planned single source of truth
  in the theme store and shared preset gating was not completed; motion helpers still read
  `matchMedia` directly.

- **#10 Implement draft autosave** — Partial. Draft persistence exists, but
  `apps/web/src/modules/chat/components/conversation-list/conversation-item.tsx` still renders only
  typing/last-message state and does not surface a `Draft: ...` preview.

- **#19 Consolidate `forumStore` slice monolith** — Partial. `useForumListStore`,
  `useForumDetailStore`, and `useForumModerationStore` exist, but they are still thin selector hooks
  over the same canonical `useForumStore`; the underlying store split has not happened.

- **#20 Broadcasts publisher + subscriber UI** — Partial. The original plan text is stale:
  `apps/web/src/modules/broadcast/store/broadcastStore.ts` now exists. The remaining gap is the
  routed surface: no web subscriber/publisher pages or route wiring were found for broadcast
  detail/publish flows.

- **#21 Paid DM (real implementation, not stub)** — Partial. The original plan text is stale:
  `PaidDmSettingsPage` and `PaidDmGate` exist with tests. The remaining gap is end-to-end wiring: no
  web route exposure for `PaidDmSettingsPage` was found, and no audited composer surface imports
  `PaidDmGate`.

- **#29 Upload chunking + progress** — Partial. The routed DM and group composers now share one
  upload-first attachment payload through `packages/shared-types/src/media.ts`, but
  `apps/web/src/modules/chat/hooks/use-media-upload.ts` still uploads a single `FormData` payload to
  `POST /api/v1/uploads` via one `XMLHttpRequest`; it does not use the multipart endpoints
  (`/api/v1/uploads/start`, `/api/v1/uploads/complete`), part retries, or parallel chunk uploads
  described in the plan.

### Quality and validation gaps

- **#33 ESLint ratchet to zero warnings** — Missing. `apps/web/package.json` still allows
  `--max-warnings 37`.

- **#37 Lighthouse CI baseline** — Partial. CI and config exist, but the checked-in thresholds are
  still looser than the plan target: LCP 4000 ms, CLS 0.25, TBT 600 ms instead of 2500 / 0.1 / 300.

- **#45 Load-test matrix (k6)** — Partial. The matrix exists, but
  `scripts/load-tests/broadcast-publish.js` is still an explicit no-op because broadcast publishing
  itself is not implemented end-to-end.

## Deferred / trigger-gated items still unstarted

These were explicitly planned as trigger-gated scale work. They are still not implemented.

- **#47 Search engine swap (MeiliSearch -> OpenSearch)** — Unstarted. No OpenSearch adapter /
  dual-write / dual-read implementation surface was found.

- **#48 Multi-region active-active** — Unstarted. No `libcluster`-based multi-region cluster
  implementation surface was found.

- **#49 PostgreSQL sharding (Citus)** — Unstarted. No Citus / sharding / distribution-column
  implementation surface was found.

## Items intentionally not listed here

The following plan areas now have substantive code and were not kept in the gap list after direct
verification: app-theme surface, secret-chat web guard rails, Stripe CSP, FederationRoutes cleanup,
message search, `MobileOnlyFeature` on secret conversations, follow vs friend, pulse surfaces,
reply/forward rendering, reputation cursor pagination, envelope limiter, Oban dead-letter sweep,
slow mode, ring dedup, service-worker background sync, CSP report-only logging, API contract CI,
cache invalidation after migrations, settings IA expansion, web push, Cloudflare R2/media CDN work,
k6 infrastructure, and ML moderation.

This report is conservative: it only lists gaps still supported by direct code evidence or failed
validation, not speculative concerns from earlier audits.
