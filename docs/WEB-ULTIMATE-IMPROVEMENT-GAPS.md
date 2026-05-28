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
and patches `/api/v1/spaces/:id` include/exclude lists with rollback on failure. The combined
conversation-list menu is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts` for mark
unread/read, pin/unpin, mute/unmute, archive/recover, and Space add/remove. The backend Space
controller is mounted under `/api/v1/spaces` through the messaging route owner and delegates through
`CGraph.Messaging`, with controller tests covering create/list/update/delete.

2026-05-16 update: logged-out verify-email resend is no longer listed as a route-owned gap.
Expired-link recovery now lets the user enter an email, posts it to
`/api/v1/auth/resend-verification`, and the backend accepts that public strict-auth request without
revealing whether the address exists. Remaining auth risk is real mail-provider delivery and final
production-style browser verification, not static route wiring.

2026-05-18 update: onboarding skip, save-failure recovery, and full completion are no longer listed
as missing route semantics. The routed onboarding Skip action posts `/api/v1/onboarding/skip` before
navigating, both skip/save failures render a route-owned recovery error instead of only logging, and
`apps/web/e2e/user-flow.spec.ts` browser-verifies both skip and full completion into `/messages`.

2026-05-16 update: post-auth gate order is now route-owned. `post-auth-redirect.ts` enforces
verify-email before onboarding before the app route, `ProtectedRoute` and `PublicRoute` both use
that owner, `/verify-email` can render a no-token pending/resend state, and backend auth JSON now
returns `onboarding_completed` so register/login responses can be gated immediately.
`apps/web/e2e/auth-account-routes.spec.ts` now browser-verifies login with 2FA, registration,
forgot-password, reset-password, verify-email, QR login, existing-user phone OTP completion,
new-user phone registration through profile and permissions, OTP resend, voice-call fallback,
registration-lock PIN completion, and native-device-required recovery. Remaining auth risk is real
provider delivery, paired QR approval, and final broad browser validation.

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
canonical surface convergence, deeper peer media negotiation, and final broad release validation.

2026-05-17 update: routed DM GIF/sticker send is no longer listed as missing. The live routed
composer now sends structured `gif` and `sticker` message payloads through the conversation message
endpoint, renders the sent media in the routed bubble, and is browser-verified by
`apps/web/e2e/dm-media-composer.spec.ts`.

2026-05-18 update: routed group GIF/sticker/voice send is no longer listed as missing. The live
group composer now sends structured `gif` and `sticker` channel messages, uploads channel voice
notes through `/api/v1/voice-messages`, renders the returned media, and is browser-verified by
`apps/web/e2e/web-owner-uat.spec.ts`.

2026-05-16 update: routed DM call entry is no longer listed as needing browser proof. The live DM
header opens both `/call/:recipientId/audio` and `/call/:recipientId/video`, and the call screens
mount real controls in `apps/web/e2e/dm-media-composer.spec.ts`.

2026-05-16 update: call-history callback is no longer listed as needing browser proof.
`apps/web/e2e/web-owner-uat.spec.ts` verifies a real history row launching the mounted video call
screen.

2026-05-16 update: incoming-call accept/end-state browser proof is no longer listed as missing.
`IncomingCallHandler` now accepts into `/call/:recipientId/:callType?incoming=true&roomId=...`, and
`apps/web/e2e/web-owner-uat.spec.ts` verifies the root modal, visible video controls, and End Call
returning to the DM route. Remaining calls risk is deeper peer media negotiation.

2026-05-16 update: account deletion grace-period recovery is no longer listed as missing UI. The
settings delete-account panel still uses password-confirmed `POST /api/v1/me/delete-account` and now
also exposes `DELETE /api/v1/me/delete-account` for pending-deletion cancellation, with focused
component coverage for both endpoints. Production web commit `93febe9` now adds routed browser
verification for cancellation, password-confirmed deletion scheduling, and the follow-up auth logout
side effect.

2026-05-16 update: phone auth no longer routes web users into the native-only device-attestation
placeholder. `registration-store.ts` now keeps OTP and PIN-lock continuations on the current web
step with a native-device-required error when the backend returns `next_step = device_attestation`,
and focused store tests cover both paths. Login/register entry links are now browser-verified in
`apps/web/e2e/user-flow.spec.ts`, and existing-user phone login OTP completion is browser-verified
in `apps/web/e2e/auth-account-routes.spec.ts`. The 2026-05-23 phone-flow proof extends that same
spec to cover OTP retry, call fallback, registration lock, profile, permissions, new-user
completion, and native-device-required recovery. Remaining phone-auth risk is real provider delivery
rather than a missing routed web branch.

2026-05-15 update: the web privacy model decision is closed as the fuller selective model.
`packages/shared-types/src/privacy.ts`, backend `selective_privacy`, API-client schemas, web
mappers, and the privacy panel now preserve `everyone` / `contacts` / `nobody` plus always-allow and
never-allow exception lists in focused tests. Production web commit
`416de9fe7023777d3b8a13301c009f230a5e66ad` adds routed Chromium proof that those privacy values
hydrate from server state, survive reload, and apply a live settings-sync patch.

2026-05-15 update: identity customization inventory is no longer locally owned. The routed identity
customization hook now hydrates ownership and equipped state from `/api/v1/cosmetics/inventory`, the
backend inventory response exposes catalog keys, and customization saves reject unowned border,
title, badge, and nameplate values. Remaining cosmetic risk is broader settings/theme/customization
multi-tab/device validation plus badge/nameplate proof beyond the routed DM owner UAT.

2026-05-15 update: `UserProfileCard` no longer renders the default placeholder user when callers
only pass `userId`. The card fetches `/api/v1/users/:id`, maps the response through canonical
identity fields, and focused component tests cover both backend hydration and provided-user paths.

2026-05-22 update: the remaining current-user avatar consumer gap is now browser-proven for the
sidebar/profile route. Onboarding, profile edit, and settings share one crop-and-preview avatar
upload adapter, and production web commit `8e2374fb63f1e368632960575a8f3a0ffeb3b1aa` proves the
sidebar top avatar reads the current auth avatar URL, avatar border, profile theme, nameplate, and
display-name effect, opens the mini profile card on hover, and routes clicks to the user's public
profile without rejecting handle-style profile IDs.

2026-05-15 update: settings, theme, and customization now have one explicit bootstrap owner.
`preferenceOrchestrator` hydrates settings, customization, and theme from auth startup and the
settings route, while `useSettingsFacade` reports aggregate loading/saving state. The settings route
now gates section panels with `isPreferenceBootstrapReady(...)` so panels do not render against
stale defaults while bootstrap is in flight. Production web commit
`416de9fe7023777d3b8a13301c009f230a5e66ad` adds `apps/web/e2e/settings-preference-sync.spec.ts` to
prove privacy reload and settings-sync behavior on the routed settings page.

2026-05-16 update: Calls and Stickers settings are no longer documented or reset as local-only.
Their panels now describe the server-synced settings-store path, and the Advanced reset action saves
Calls/Stickers defaults through `/api/v1/settings` with rollback coverage in
`settingsStore.test.ts`.

2026-05-16 update: customization and theme saves now have a code-level live-sync bridge. Backend
customization/theme updates broadcast `customization_synced` and `theme_synced` on the user channel,
and web applies those server-owned patches into the customization/theme stores without triggering a
new autosave. Production web commit `416de9fe7023777d3b8a13301c009f230a5e66ad` fixes server-applied
theme sync so `theme_synced` changes update the visible app-shell class, and the focused routed
browser proof now covers customization profile-card sync and app-shell theme sync. Remaining risk is
real multi-tab/device socket delivery beyond the E2E-equivalent event path.

2026-05-16 update: `settingsHooks.test.ts` is no longer listed as a quality gap.
`apps/web/src/modules/settings/hooks/__tests__/settingsHooks.test.ts` now mocks the username-change
HTTP client directly, avoids leaking real `/api/v1/users/check-username` requests, and passes
quietly in the focused Vitest run.

2026-05-16 update: routed conversation-list participant controls are now real for the core inbox
actions. The backend mounts current-user routes for mark-unread, archive, unarchive, pin/unpin, and
mute/unmute; the web sidebar exposes those actions plus archived-list recovery, and focused
controller/store tests cover the path. Per-chat Space move controls now use the same routed sidebar
menu and patch the server-owned Spaces contract. `apps/web/e2e/dm-media-composer.spec.ts`
browser-verifies the combined live menu path.

2026-05-15 update: the runtime-neutral user settings contract is no longer web-local.
`packages/shared-types/src/settings.ts` owns user setting types and defaults, and the web
`settingsStore.types.ts` re-exports that package contract for compatibility.

2026-05-16 update: friend cosmetic live updates now flow through
`apps/web/src/lib/identity/otherIdentitySync.ts`. `presenceManager` maps
`friend_customization_changed` through the canonical identity projection and updates friend rows,
incoming/outgoing request users, conversation participants, sidebar previews, and routed message
senders through one selective patch owner. Own-profile `profile_updated`, `item_equipped`, and
`item_unequipped` socket events route through `apps/web/src/lib/identity/ownIdentitySync.ts`, which
patches auth and customization from one server-sync owner without autosaving the inbound server
event. `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies a live friend avatar-border/title patch
on the routed DM surface.

## Confirmed high-priority gaps

### Focused recovery plan

1. **Finish social selected-entity content and destination correctness** — Closed for routed core.
   `apps/web/src/pages/social/social/social.tsx` renders a real main pane, routes discover results
   to mounted destinations, joins unjoined group results through the real group store action, marks
   notifications read through the notification store, and accepts incoming friend requests through
   the friend store. Production web commit `81811a09e35dc3817b7ca73dd312ac68ac3b69dd` adds
   `apps/web/e2e/social-main-pane.spec.ts`, which browser-verifies notification deep-link navigation
   to a mounted group channel with message anchor, discover search plus unjoined group join/open,
   and main-pane friend-request accept. Broader friend-action parity remains tracked in the strict
   pass instead of blocking this selected entity route/destination gap.

2. **Normalize all group entry points to valid routes** — Closed for route validity. Social
   discovery and notification links route to canonical group channel destinations when backend
   `default_channel_id` or notification channel metadata exists. Global Explore group cards receive
   `default_channel_id` from `/api/v1/explore` and route through `community-routing.ts`. The routed
   channel list splits text, voice, video, announcement, and forum controls onto mounted
   type-specific routes. `/groups/:groupId/settings` mounts the group admin/settings stack from the
   live shell, the routed channel header has real loaded-message search plus backend-backed group
   mute/unmute, and channel message menus wire edit, delete, report, pin, and copy-link actions.
   Production web commit `e6bc90eda7e794e1173cd223ad836e9d36ee0619` adds focused Chromium Playwright
   proof that a metadata-less `/groups/:groupId` entry resolves to the mounted default channel route
   after group data loads. Production web commit `5351b03` adds group settings permission gating and
   routed proof that owners keep management access while ordinary members only see personal
   Notifications/Danger actions and do not issue admin group PATCH requests. Older-message search,
   endpoint-level permission-denied copy, and channel-granular notification semantics remain
   separate group-behavior owner decisions, not route-validity blockers.

3. **Create a canonical web identity model** — Partial, narrowed. The shared identity projection now
   covers auth, chat, friends, groups, profile-card hydration, customization inventory ownership,
   friend and own-profile cosmetic live-update patches, the current-user sidebar mini-card, and the
   public-profile route. Production web commit `8e2374fb63f1e368632960575a8f3a0ffeb3b1aa` adds
   `apps/web/e2e/sidebar-profile-card.spec.ts`, which browser-verifies current-user profile theme,
   avatar border, nameplate, display-name effect, sidebar hover rendering, and click-through to the
   public profile. Production web commit `dae3416c16b50ff4d8cfad4fc1e96bebbb0895c1` extends the same
   proof to the full public profile page by routing profile data through the canonical identity
   projection and rendering the same Lottie-backed nameplate/display-name-effect fields there. The
   remaining risk is live-update/browser proof across every other visual surface that consumes
   cosmetics.

4. **Stop dropping identity fields during normalization and socket sync** — Closed for the audited
   normalizer and socket-owner boundary. `packages/shared-types/src/identity.ts`,
   `apps/web/src/lib/identity/canonicalIdentity.ts`, and `UserProfileCard` now preserve avatar,
   border, title, badge, nameplate, theme, and display-name styling fields across
   auth/profile/friend/chat/group HTTP, socket paths, and userId-only profile cards.
   `friend_customization_changed` now reaches the other-user identity sync owner, own-profile
   cosmetic socket events now reach the own-identity sync owner, and owner UAT browser-verifies a
   live avatar-border/title update on the routed DM surface.

5. **Consolidate settings, theme, and customization ownership** — Partial, narrowed to real
   multi-device proof. `apps/web/src/modules/settings/store/preferenceOrchestrator.ts` now
   coordinates settings, customization, and theme hydration from auth startup and the settings
   route, and `packages/shared-types/src/settings.ts` owns the runtime-neutral user settings
   contract. `apps/web/src/pages/settings/settings.tsx` now gates section panels until the required
   bootstrap is fulfilled. Extended notification fields are covered by backend controller proof for
   save-response round-trip, Calls/Stickers preference reset now saves through the settings API, and
   customization/theme server patches now sync through the user channel.
   `apps/web/e2e/settings-preference-sync.spec.ts` now proves privacy reload, settings live sync,
   customization live sync, and app-shell theme live sync on mounted routes. The remaining settings
   gap is real multi-tab/device socket validation and broader final browser coverage.

6. **Make customization inventory server-owned end-to-end** — Closed for the routed identity
   customization surface. Static `ALL_BORDERS`, `ALL_TITLES`, and `ALL_BADGES` remain presentation
   metadata only; unlock/equipped truth now comes from backend inventory and the backend rejects
   unowned saves. Broader settings/theme/customization orchestration remains separate.

7. **Lock in behavior with focused web UAT and regression tests** — Partial. A focused owner UAT
   browser smoke now covers auth, DMs, group text send, Social discover, settings, Nodes wallet,
   manual direct call route mounting, routed DM call-entry launch, call-history callback, and group
   voice-room mounting in `apps/web/e2e/web-owner-uat.spec.ts`. Focused Nodes page tests now cover
   wallet load failure, transaction-history failure, shop bundle-load failure, true empty shop
   state, and canonical insufficient-balance unlock routing. Production web commit
   `69ee0b4b4b8a88f898805577af2716f73a5b7ae2` adds `apps/web/e2e/nodes-wallet-shop.spec.ts` for
   routed Chromium proof of wallet/shop rendering, wallet failure, transaction failure, bundle
   failure, true empty-shop state, and checkout failure toast. Production web commit `436d4ff` adds
   routed Chromium proof for paid-file insufficient-balance, already-unlocked, and rate-limit states
   in `apps/web/e2e/dm-media-composer.spec.ts`, plus focused component proof for tip, gift, and
   content-unlock negative copy. The same auth/account route spec now also covers new-user phone
   registration through profile and permissions, OTP resend, voice-call fallback, registration-lock
   PIN completion, and native-device-required recovery. The sidebar current-user identity proof now
   lives in `apps/web/e2e/sidebar-profile-card.spec.ts`. The broader historical suite still needs
   cleanup, and the backend helper dependency issues (`CGraph.Uploads.S3ClientBehaviour`, missing
   `:hammer` app) remain outside this web UAT proof.

## Remaining numbered plan items

### Structural and feature gaps

- **#6 Enable antivirus on uploads** — Closed for backend-controlled upload semantics. Production
  backend commit `a442547959d7da6bb236672284af603a7ed20c12` adds runtime `ANTIVIRUS_BACKEND=clamav`
  / `CLAMAV_*` configuration, returns a clear `503` when a required scanner is unavailable, and
  makes server-ingested uploads fail closed instead of silently fail-opening. The default deployed
  mode can remain `metadata_only` until a ClamAV service is provisioned, so this closes the
  code/runtime gate without pretending direct object-storage bytes are scanned before a scanner
  exists.

- **#7 Wire `prefers-reduced-motion` through the theme store** — Closed for web motion helper
  ownership. `cgraph-web` commit `9ca329a25689483c5fb51ad6183efb583bc440e9` adds one
  `lib/motion/reduced-motion.ts` owner that combines app/theme preference and the OS media query,
  then routes `useReducedMotion`, `useAdaptiveMotion`, Lottie asset/border hooks, nameplates, auth
  effects, liquid-glass helpers, transition helpers, and the settings motion helper through that
  owner. Remaining direct media-query reads are limited to the theme providers/engine that listen to
  the OS setting itself and the generic `useMediaQuery` utility.

- **Old Effects customization route** — Closed by removal. The Effects route/tab and particle engine
  were intentionally deleted from production web on 2026-05-21 instead of being promoted as a
  cross-platform customization feature.

- **#10 Implement draft autosave** — Closed for the shared conversation-list preview path. Drafts
  persist in IndexedDB, draft save/clear now emits a browser-scoped draft-change event, and
  `apps/web/src/modules/chat/components/conversation-list/conversation-list.tsx` reloads stored
  drafts so `ConversationItem` renders `Draft: ...` ahead of the last-message preview while keeping
  live typing indicators highest priority. Covered by
  `apps/web/src/modules/chat/components/__tests__/conversation-item.test.tsx` and the full web
  Vitest suite on 2026-05-22.

- **#19 Consolidate `forumStore` slice monolith** — Partial. `useForumListStore`,
  `useForumDetailStore`, and `useForumModerationStore` exist, but they are still thin selector hooks
  over the same canonical `useForumStore`; the underlying store split has not happened.

- **#20 Broadcasts publisher + subscriber UI** — Closed. The previous remaining-gap note was stale:
  production web already mounts `/broadcasts` and `/broadcasts/:broadcastId` through
  `apps/web/src/routes/app-routes.tsx`, with directory, create, subscribe/unsubscribe, detail feed,
  and owner publish flows in `apps/web/src/pages/broadcasts/broadcasts-page.tsx`,
  `apps/web/src/pages/broadcasts/broadcast-detail.tsx`, and
  `apps/web/src/modules/broadcast/store/broadcastStore.ts`. Production backend exposes the matching
  authenticated REST surface in `lib/cgraph_web/router/broadcast_routes.ex` and
  `lib/cgraph_web/controllers/api/v1/broadcast_controller.ex`. Proof on 2026-05-22:
  `mix test test/cgraph_web/controllers/api/v1/broadcast_controller_test.exs test/cgraph/broadcasts_test.exs`
  passed 28 tests, and production web commit `932d13f2b345ca35eb505c3d7cb70af28c5025aa`
  hardened/reran the focused Chromium Playwright route proof for browsing, subscribing, publishing,
  and creating broadcasts.

- **#21 Paid DM (real implementation, not stub)** — Closed for the active per-file model. The
  original plan text was stale: backend intentionally removed global `paid_dm_settings` in favor of
  per-file Node pricing. Production web now exposes the price-lock control on routed Cloud Chat file
  attachments, creates the paid-file record through `/api/v1/paid-dm/send`, sends the message with
  `nodes_price`, `is_file_locked`, and `paid_dm_file_id` metadata, and unlocks through
  `/api/v1/paid-dm/:id/unlock` with the routed message id so reloads see the backend-owned unlocked
  state. Production backend now accepts and serializes the paid-file lock fields through message
  create/list responses, and `@cgraph/api-client` now accepts the backend's real `paid` status. The
  stale global `PaidDmSettingsPage` and recipient-level `PaidDmGate` code paths were removed rather
  than routed. Follow-up production web commit `436d4ff` fixes the routed Cloud Chat render path so
  locked paid files use the shared locked-file owner instead of the plain file renderer, then
  browser-verifies insufficient-balance recovery, already-unlocked reconciliation, and rate-limit
  failure states.

- **#29 Upload chunking + progress** — Closed for routed message attachments. The shared package
  contract now defines the multipart threshold, part shape, completed-part ETag shape, completion
  shape, and progress math in `packages/shared-types/src/media.ts`; `@cgraph/api-client` owns
  `startMultipartUpload`, `presignMultipartPart`, and `completeMultipartUpload`; and production web
  routes both DM and group file/photo attachments through
  `apps/web/src/lib/uploads/message-attachment-upload.ts`. Small attachments keep the authenticated
  multipart/form-data path; large attachments use `/api/v1/uploads/start`, parallel direct part
  PUTs, ETag collection, retry presigning, and `/api/v1/uploads/complete`. Focused proof lives in
  `apps/web/src/lib/uploads/__tests__/message-attachment-upload.test.ts` plus shared package media
  contract tests.

### Quality and validation gaps

- **#33 ESLint ratchet to zero warnings** — Closed. Production web commit
  `8e7ac80fa5b3a24dde768a16f7b3285789e9ee2f` fixes the remaining `react-hooks/exhaustive-deps`
  warnings and changes `apps/web/package.json` so both `lint` and `lint:fix` run with
  `--max-warnings 0`. Verified with `pnpm --filter @cgraph/web lint`,
  `pnpm --filter @cgraph/web typecheck`, and `pnpm --filter @cgraph/web build`.

- **#37 Lighthouse CI baseline** — Closed for the checked-in hard baseline. Production web commit
  `a5ed9b3513a92fc3ef58bfb14c701c96474d1ad2` tightens LHCI error thresholds to LCP 2500 ms, CLS 0.1,
  and TBT 300 ms. Verified with three local LHCI runs on the production build; the median values
  were below the hard limits while the remaining image/unused-code/accessibility findings stayed as
  warnings for separate polish work.

- **#45 Load-test matrix (k6)** — Closed for the current backend load-test matrix. Production
  backend commit `4110c7f75b0124bf62f2c60caae40d68600a62ee` replaces the stale broken/no-op matrix
  assumption with real `k6` scenarios for uploads, group channel operations, sustained search, and
  owner broadcast publish/list traffic, and wires them into `k6/load.js`. Verification on
  2026-05-28: every `k6/*.js` file passed `node --check`, every scenario passed `k6 inspect`, and
  the backend broadcast route contract passed
  `mix test test/cgraph_web/controllers/api/v1/broadcast_controller_test.exs` with 17 tests.

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
