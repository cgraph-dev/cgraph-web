# Web 100 Percent Owner Checklist

Status date: 2026-05-29

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

2026-05-31 customization Lottie delivery proof: production web now ships the public delivery assets
for every shared-catalog Lottie path used by badges, titles, display-name effects, and nameplates.
`apps/web/scripts/check-customization-lottie-assets.mjs` verifies the 51 required `/lottie/...`
assets exist and parse as Lottie JSON, and `check:release-gates` runs that guard before the unit
suite. The nameplate preview now uses the same public `LottieAssetRenderer` path as profile/card
surfaces instead of an import map that kept all entries on `placeholder.json`. Local proof passed
package guards, typecheck, lint, release-gates with 402 files / 5,358 tests, and build budget.

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

2026-05-28 separate-profile settings proof: production web extends
`apps/web/e2e/settings-preference-sync.spec.ts` to open the Privacy route in two isolated browser
profiles and apply the same server-shaped settings sync payload to both mounted routes. This proves
the route/store contract can consume backend-shaped settings sync outside a same-context
BroadcastChannel tab pair, while a real physical second-device socket delivery lab remains a
strict-release proof item.

2026-05-29 authenticated socket delivery proof: production web moves authenticated socket bootstrap
to `AuthInitializer` so the user channel joins only after auth and token readiness, and the Vite HTML
contract injects explicit build-time socket/API origins into the CSP meta tag. The rebuilt app passed
`apps/web/e2e/settings-preference-sync.spec.ts` with `PLAYWRIGHT_SOCKET_SYNC_PROOF=true`: two
isolated browser profiles mounted `/me/settings/privacy`, both joined `user:e2e-user` through a
Phoenix-compatible local socket harness, and both updated from one `settings_synced` user-channel
broadcast. Physical second-device lab validation remains strict-release evidence, not an owner
implementation checkbox.

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
route and, as of 2026-05-28, verifies a successful checkout response hands the browser to the
allowlisted `https://checkout.stripe.com/c/pay/cs_test_nodes` destination instead of rendering a
fake local success state.

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
resend states, the default gated QR route state, and existing-user phone login OTP completion against
mocked backend contracts. This closes the strict broad auth route browser-proof item, while real
mail-provider delivery and the remaining phone registration-lock, call-fallback, and new-user
completion branches stayed open until the later phone-flow proof below.

2026-05-31 auth failure recovery proof: `apps/web/e2e/auth-account-routes.spec.ts` now also
browser-verifies invalid credential, invalid 2FA, and duplicate-registration backend responses. The
login route stays on `/login`, the 2FA step renders one scoped visible alert instead of duplicate
errors, registration stays on `/register`, and the shared auth error alert exposes `role="alert"` /
`aria-live="assertive"`. Focused Chromium proof passed 12 / 12, and the full local web release gate
passed afterward with 402 files / 5,358 tests. This improves local route-owned auth failure recovery
without closing real mail/SMS/voice provider delivery or future paired QR approval.

2026-06-01 routed DM video-note proof: production web mounts camera-backed video-note recording
beside the existing voice recorder, uploads the recorded clip through the shared message attachment
contract, and sends it as a routed Cloud Chat `video` message with `isVideoNote` metadata. Focused
Chromium proof passed the new routed video-note test in `apps/web/e2e/dm-media-composer.spec.ts`;
the full routed DM media/composer Chromium spec passed 17 / 17 serially; focused unit/controller
proof passed 19 / 19; typecheck, lint, release gates with 403 files / 5,368 tests, package guards,
and build budget passed. This closes local routed DM video-note send proof without claiming canonical
DM convergence, final live/provider regression breadth, or native mobile/desktop secret-chat work.

2026-06-01 routed DM inbox-owner convergence proof: production web now imports the live inbox
sidebar, loaded-list filtering, and Space membership helpers from
`apps/web/src/modules/chat/components/conversation-list/*`. The old
`apps/web/src/pages/messages/messages/conversation-sidebar.tsx`,
`conversation-item.tsx`, `conversation-spaces.ts`, `types.ts`, and `utils.ts` files are thin
compatibility re-exports, so the complete routed inbox action surface lives under the shared
conversation-list owner. Focused ownership/helper/component proof passed 24 / 24; focused Chromium
proof passed the routed conversation-list actions and Space membership test; the full routed DM
media/composer Chromium spec passed 17 / 17 serially; typecheck and lint passed. This closes the
local inbox owner/filter/start-new-DM convergence gap without claiming final live/provider
regression breadth.

2026-05-28 reset-token proof: production backend `auth_controller_test.exs` now proves valid
password reset, login with the new password, replay rejection, invalid token, expired token, and
missing-param validation. Production web `auth-account-routes.spec.ts` browser-verifies mounted
reset-password success plus invalid, expired, and reused-token recovery. This closes the strict
password-reset confirm contract while real mail-provider delivery remains tracked separately.

2026-05-28 QR-login proof, updated by the 2026-05-31 no-overclaim pass: production backend
`qr_auth_controller_test.exs` proves QR session creation, coded stale-session, missing-parameter, and
invalid-signature failures, valid approval broadcast, and one-time session consumption. Because native
mobile is not shipped yet, production web now gates `/qr-login` by default, renders a
mobile-app-required state, and does not create a backend QR session unless `VITE_ENABLE_QR_LOGIN=true`.
The enabled protocol path remains unit-covered, while paired approval from a real second client
remains future native-mobile proof, not a local route checkbox.

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
Nodes browser routes still agree with their mocked backend contracts; real provider delivery, future
paired QR/mobile approval after native mobile exists, physical cross-device sync, real Stripe hosted checkout completion, and
webhook settlement remain strict-release gaps.

2026-05-28 group/call replay proof: the rebuilt production web E2E bundle also passed 46 / 46
focused Chromium group/forum tests across `apps/web/e2e/group-settings-permissions.spec.ts`,
`apps/web/e2e/group-channel-scroll.spec.ts`, `apps/web/e2e/group-entry-routes.spec.ts`,
`apps/web/e2e/group-invite-landing.spec.ts`, and `apps/web/e2e/groups-forums.spec.ts`. The same
build passed `apps/web/e2e/web-owner-uat.spec.ts`, replaying the mounted owner route path for
incoming-call accept/end, manual call route controls, call-history callback, group media/actions,
voice room entry, and adjacent auth/social/settings/Nodes surfaces.

2026-05-29 combined route-validation proof: the production-built web app passed 78 / 78 Chromium
tests in one route pass across auth/account, DM media/composer, Social main-pane, settings
preference sync, Nodes wallet/shop, group settings permissions, group channel scroll, bare group
entry redirect, group invite landing, owner UAT, and sidebar/public-profile reload specs. This
closes the checklist layer's local broad route/contract browser pass, while real external provider
delivery, future paired QR/mobile approval after native mobile exists, physical cross-device sync, and hosted Stripe
settlement/webhooks remain strict-release sign-off work.

2026-06-05 combined Level 2 route-stability proof: production web commit
`97e66a5426e1e472ca8d3b57d7cfd4e6c4aa749c` passed the rebuilt Chromium route
proof at 85 / 86 with 1 socket-harness-gated skip across the same broad route
surface plus the newer sidebar profile and settings sync coverage. This keeps
the checklist layer current after the Phase 5 avatar/customization adapter
cleanup and route-proof stabilization, while real external provider delivery,
future paired QR/mobile approval after native mobile exists, physical
cross-device sync, hosted Stripe settlement/webhooks, and Level 3 hardening
remain strict-release sign-off work.

2026-05-30 release-hardening refresh after recovery: production web commit
`b7f39b5271a19b56677387d22eac3266cef7d732` passed the full local release gate
(`pnpm --filter @cgraph/web check:release-gates`) with 400 Vitest files and
5,354 tests, plus lint, typecheck, build/bundle budget, package snapshot
validation, and production smoke against `web.cgraph.org` /
`cgraph-backend-prod-v2.fly.dev`. This refreshes the local release-hardening
proof after the reinstall/package-sync recovery. It does not close real
provider delivery, future paired QR/mobile approval after native mobile exists, physical cross-device sync, or
hosted Stripe settlement/webhooks.

2026-05-31 package consumption proof: production web commit
`cd81332c14ecd5139b018399b8a170eaa4a8a90f` moves web from app-local
`packages/*` mirrors to exact published npm dependencies
under the reviewed `@cgraph-dev/*` scope, removes the mirror workspace and
tsconfig path aliases, and replaces the mirror provenance gates with a
published-package dependency guard. The 2026-05-31 follow-up web commit
`3bb8aa624b34c06dfe0f55d321f77d92ac20ce36` consumes
`@cgraph-dev/shared-types@1.0.4` so the static profile-theme catalog rows come
from the shared package instead of web-local data. The 2026-05-31 chat UI
follow-up consumes `@cgraph-dev/shared-types@1.0.5` so
`apps/web/src/modules/chat/components/message-bubble/preferences.ts` becomes a
compatibility adapter over package-owned chat presentation defaults. The
2026-05-31 entrance-animation follow-up consumes
`@cgraph-dev/shared-types@1.0.6` so the full `none`, `slide`, `fade`, `scale`,
`bounce`, and `flip` message entrance animation set is shared by the settings
chat panel, routed bubble customization page, chat UI settings panel, and legacy
theme type boundary. Verified with
`pnpm check:packages`, `pnpm check:package-owner`,
`pnpm --filter @cgraph/web typecheck`, `pnpm --filter @cgraph/web lint`,
`pnpm --filter @cgraph/web check:release-gates` (400 Vitest files, 5,354
tests), `pnpm --filter @cgraph/web build:budget`, the 1.0.4 profile-theme
follow-up Vitest suite with 401 files / 5,357 tests, and the 1.0.5 chat UI
preference follow-up Vitest suite with 401 files / 5,357 tests, plus the 1.0.6
entrance-animation follow-up Vitest suite with 402 files / 5,358 tests. This
closes the web side of the package phase-4 consumption move, the web-local
static profile-theme catalog gap, the web-local chat UI preference default gap,
and the web-local entrance-animation value-set gap; it does not close real
provider delivery, future paired QR/mobile approval after native mobile exists,
physical cross-device sync, or hosted Stripe settlement/webhooks.

2026-06-01 profile-card layout package proof: production web consumes
`@cgraph-dev/shared-types@1.1.0` so `PROFILE_CARD_LAYOUT_IDS`,
`PROFILE_CARD_LAYOUTS`, `DEFAULT_PROFILE_CARD_LAYOUT_ID`, and
`isProfileCardLayoutId(...)` own the runtime-neutral profile-card layout set
used by the settings customization store, the older theme-store facade, the
settings profile panel, and the social profile-card renderer. Stale web-only
layout IDs such as `detailed`, `gaming`, `social`, `creator`, and `custom` are
no longer accepted by the store boundary; server patches fall back to the
shared default layout. Verified with `pnpm check:packages`,
`pnpm check:package-owner`, `pnpm --filter @cgraph/web typecheck`,
`pnpm --filter @cgraph/web lint`, focused Vitest coverage across four files
and 115 tests, `pnpm --filter @cgraph/web check:release-gates` with 406 files
and 5,376 tests, and `pnpm --filter @cgraph/web build:budget`. This closes the
web-local profile-card layout value-set gap; it does not close real provider
delivery, future paired QR/mobile approval after native mobile exists, physical
cross-device sync, or hosted Stripe settlement/webhooks.

2026-06-01 profile-card layout adapter cleanup proof: production web removes the
last dead `GamingLayout`, `SocialLayout`, and `CreatorLayout` exports from the
legacy profile-card module, changes legacy theme preset `cardLayout` metadata to
the shared `ProfileCardLayoutId` type, maps old preset-only `gaming` /
`detailed` layout labels to shared `premium` / `full`, and makes
`applyPreset(...)` update the advertised shared profile-card layout instead of
only changing the preset id. The cosmetics settings theme picker now calls that
same preset action, so the UI no longer displays or applies stale web-only
profile-card layout names. Verified with focused profile-card/theme-store tests
covering 2 files / 76 tests, package guards, package-owner guard, typecheck,
lint, `pnpm --filter @cgraph/web check:release-gates` with 406 files / 5,376
tests, and `pnpm --filter @cgraph/web build:budget`. This narrows the Phase 5
web-adapter cleanup work without claiming final provider, future native QR, or
physical cross-device closure.

2026-06-01 profile-theme store-boundary proof: production web now types
customization `selectedProfileThemeId` / `profileTheme` as the shared
`ProfileThemeId | null` contract and normalizes profile-theme ids through the
customization setter, generic legacy update path, server patch mapper, persisted
state merge, and own-identity socket sync. Valid shared ids such as
`aurora-glass` are accepted, while stale web-only ids such as `classic-purple`
clear to `null` before they can become customization store state or persisted
aliases. Verified with focused settings/customization/identity tests covering
128 tests across 5 files, package guards, typecheck, lint, release gates with
406 files / 5,380 tests, and build budget. This narrows the Phase 5 web-adapter
cleanup work without claiming final provider, future native QR, or physical
cross-device closure.

2026-06-01 routed profile-theme customization cleanup proof: production web
removes the unused customization `PROFILE_THEME_TO_COLOR` /
`THEME_ID_TO_PRESET` semantic mapping and deletes its stale-alias test because
profile-theme product truth now comes from the shared catalog plus the
customization store boundary. The routed `/customize/theme` hook now applies
unlocked profile themes through `setProfileTheme(...)` only instead of double
writing through the generic legacy `updateTheme('profileTheme', ...)` path, and
locked future premium theme previews no longer call the saving setter before the
user owns the item. The dev theme test page now uses the same typed
`setProfileTheme(...)` action. Verified with focused settings/customization
tests covering 129 tests across 5 files, package guards, typecheck, lint,
release gates with 406 files / 5,380 tests, and build budget. This narrows the
Phase 5 web-adapter cleanup work without claiming final provider, future native
QR, or physical cross-device closure.

2026-06-01 customization selector facade cleanup proof: production web removes
the unused deprecated whole-store selector facade from
`apps/web/src/modules/settings/store/customization/customizationStore.selectors.ts`
and stops re-exporting `useChatSettings` / `useThemeSettings` /
`useAvatarSettings` / `useProfileSettings` / `useSyncState` from the
customization barrel. It also removes the unused `getThemeColors(...)` /
`useAvatarThemeColors(...)` helper surface and deletes the self-referential
test that only exercised that dead helper. Source search found no consumers
outside that deleted test. Verified with focused settings/customization tests
covering 126 tests across 4 files, package guards, typecheck, lint, release
gates with 405 files / 5,377 tests, and build budget. This narrows the Phase 5
web-adapter cleanup work without claiming final provider, future native QR, or
physical cross-device closure.

2026-06-02 chat bubble adapter ownership proof: production web moves
`getMessageBubbleClass(...)` and `getMessageEffectClass(...)` out of the
settings customization application hook and into the chat-owned
`apps/web/src/modules/chat/components/message-bubble/preferences.ts` adapter.
`MessageBubble` and the dev theme preview now consume that chat adapter
directly, while `useCustomizationApplication` keeps only settings/theme DOM
application plus avatar/reaction helpers. Source search found no remaining
message bubble/effect helper imports from the settings hook. Verified with
focused chat/settings tests covering 90 tests across 5 files, package guards,
typecheck, lint, release gates with 405 files / 5,359 tests, and build budget.
This narrows the Phase 5 web-adapter cleanup work without claiming final
provider, future native QR, or physical cross-device closure.

2026-06-02 chat reaction adapter ownership proof: production web moves
`getReactionStyleClass(...)` out of the settings customization application hook
and into the chat-owned
`apps/web/src/modules/chat/components/animatedReactionBubble/preferences.ts`
adapter. `AnimatedReactionBubble` and the dev theme preview now consume that
chat adapter directly, while `useCustomizationApplication` keeps only
settings/theme DOM application plus avatar-border CSS mapping. Source search
found no remaining reaction-style helper imports from the settings hook.
Verified with focused chat/settings tests covering 52 tests across 3 files,
package guards, package-owner guard, typecheck, lint, release gates with 406
files / 5,351 tests, and build budget. This narrows the Phase 5 web-adapter
cleanup work without claiming final provider, future native QR, or physical
cross-device closure.

2026-06-02 avatar-border adapter ownership proof: production web moves
`getAvatarBorderStyle(...)` out of the settings customization application hook
and into the shared avatar UI adapter at
`apps/web/src/components/ui/avatar-border-style.ts`. `Avatar` and the dev theme
preview now consume that UI-owned adapter directly, while
`useCustomizationApplication` keeps only settings/theme DOM application. Source
search found no remaining avatar-border helper imports from the settings hook.
Verified with focused avatar/settings tests covering 34 tests across 3 files,
package guards, package-owner guard, typecheck, lint, release gates with 407
files / 5,335 tests, and build budget at 484.25 kB / 500 kB for the largest JS
chunk. This narrows the Phase 5 web-adapter cleanup work without claiming final
provider, future native QR, physical cross-device closure, or hosted Stripe
settlement/webhooks.

2026-06-04 avatar-border display semantics ownership proof: production web commit
`8656b37eecde107eb5cdf2ad416aa49c0e12fa29` makes web avatar-border compatibility types alias
`@cgraph-dev/animation-constants` `AvatarBorderType`, deletes the settings-store local
`AVATAR_BORDERS` metadata table, and moves identity customization equip/hydrate from a hand-written
legacy animation-to-border map to `apps/web/src/data/avatar-borders.ts` via
`getAvatarBorderDisplayTypeById(...)`. Routed identity customization now keeps the catalog border ID
as the selected/equipped truth and records `lottie` as the shared display family for current Lottie
borders instead of translating catalog borders through CSS-style names. Verified with focused
avatar/settings tests covering 45 tests across 2 files, package-owner guard, typecheck, lint, and
release gates with 408 files / 5,340 tests. This narrows the Phase 5 web-adapter cleanup work
without claiming final store migration, final provider, future native QR, physical cross-device
closure, or hosted Stripe settlement.

2026-06-04 avatar-border theme-store validation proof: production web commit
`3d1d5cca789a8f98e0e0ef36424f01a61325ef61` makes the legacy theme store `AvatarBorderType` alias the
shared `@cgraph-dev/animation-constants` type, removes its local avatar-border allowlist, and routes
server-theme avatar-border validation through `apps/web/src/data/avatar-borders.ts` via
`isAvatarBorderDisplayType(...)`. This keeps legacy CSS display values compatible while allowing the
shared `lottie` display family from the avatar-border catalog through both server hydration and
legacy setter paths. Verified with focused theme/customization/avatar tests covering 113 tests
across 3 files, package-owner guard, typecheck, lint, and release gates with 408 files / 5,342
tests. This narrows the Phase 5 web-adapter cleanup work without claiming final store migration,
final provider, future native QR, physical cross-device closure, or hosted Stripe settlement.

2026-06-04 avatar-border motion adapter proof: production web commit
`1877b4cda253c3a3239f64eadbe5ea5bdb0a6e11` moves the legacy avatar-border Motion animation switch
out of `apps/web/src/components/theme/themed-avatar.tsx` and into
`apps/web/src/components/theme/avatar-border-motion.ts`, adds focused adapter tests, and makes
`ThemedAvatar` resolve shared avatar-border catalog entries through
`apps/web/src/data/avatar-borders.ts` `getBorderById(...)` instead of local array searches. This
keeps browser-only legacy motion behavior isolated in a renderer adapter while the component
consumes the same catalog helper used by other profile/avatar surfaces. Verified with focused
theme/customization/avatar tests covering 113 tests across 3 files, package-owner guard, typecheck,
lint, and release gates with 409 files / 5,345 tests. This narrows the Phase 5 web-adapter cleanup
work without claiming final store migration, final provider, future native QR, physical cross-device
closure, or hosted Stripe settlement.

2026-06-04 avatar-border catalog lookup proof: production web commit
`a8cd8290dfa8d3238679459be04f482c35b7d7f5` moves the remaining equipped-border profile/settings
single-item catalog lookups from direct `AVATAR_BORDERS.find(...)` calls to
`apps/web/src/data/avatar-borders.ts` `getBorderById(...)`. The settings avatar-border section still
uses `AVATAR_BORDERS` for the full filterable catalog list, but equipped preview and profile-card
avatar rendering now resolve catalog entries through the shared web adapter helper. Source search
found no remaining `AVATAR_BORDERS.find(...)` or `ALL_BORDERS.find(...)` calls under `apps/web/src`.
Verified with focused profile-card tests covering 2 tests across 1 file, package-owner guard,
typecheck, lint, and release gates with 409 files / 5,345 tests. This narrows the Phase 5
web-adapter cleanup work without claiming final store migration, final provider, future native QR,
physical cross-device closure, or hosted Stripe settlement.

2026-06-04 customization UI color-catalog proof: production web commit
`2e6346eb2551d85d38c15f48a6ce7e54509def81` routes customization-panel color display metadata through
`apps/web/src/stores/theme` `THEME_COLORS` instead of the customization store barrel. This covers
the live preview, theme/profile panels, chat bubble demo, color picker, sliders, tabs, size/speed
selectors, and option buttons while leaving selected `themePreset` orchestration in the
customization store. Source search found no remaining `THEME_COLORS as themeColors`
customization-panel imports from `modules/settings/store/customization`. Verified with focused
customization store tests covering 42 tests across 1 file, package-owner guard, typecheck, lint, and
release gates with 409 files / 5,345 tests. This narrows the Phase 5 web-adapter cleanup work
without claiming final store migration, final provider, future native QR, physical cross-device
closure, or hosted Stripe settlement.

2026-06-04 customization theme-color catalog proof: production web commit
`0ed5ce93bb43f8fb00146507cef1e057eda88bb1` removes the duplicated hard-coded customization-store
theme color values and derives the legacy `THEME_COLORS` export from
`apps/web/src/stores/theme/presets.ts` `COLORS`. The customization store now owns only the explicit
`CUSTOMIZATION_THEME_PRESETS` allowed state set for app/chat/avatar color selections, and
customization UI iteration consumes that same list instead of a second hard-coded array. Source
search found no remaining hard-coded emerald color values in the customization store path. Verified
with focused profile-card mock regression tests covering 12 tests across 1 file, focused
customization store tests covering 42 tests across 1 file, package-owner guard, typecheck, lint, and
release gates with 409 files / 5,345 tests. This narrows the Phase 5 web-adapter cleanup work
without claiming final store migration, final provider, future native QR, physical cross-device
closure, or hosted Stripe settlement.

2026-06-05 customization rarity export cleanup proof: production web commit
`0cb0df14fbc062380e20a80605f7478bdcd083cc` removes the unused `RARITY_COLORS` compatibility export
from `apps/web/src/modules/settings/store/customization/customizationStore.types.ts` and the
customization store barrels. Source search found no customization-store rarity color consumers;
remaining rarity color maps stay in renderer/data-specific adapters such as avatar-border, title,
nameplate, and cosmetics-settings surfaces. Verified with focused customization store tests covering
42 tests across 1 file, package-owner guard, typecheck, lint, and release gates with 409 files /
5,345 tests. This narrows the Phase 5 web-adapter cleanup work without claiming final store
migration, final provider, future native QR, physical cross-device closure, or hosted Stripe
settlement.

2026-06-05 identity-customization shared rarity proof: production web commit
`b155f93dac4294300c2f0533f2327afe31d0b587` makes the identity-customization `Rarity`
type alias the package-owned `@cgraph-dev/shared-types` `RarityTier`, derives the routed
customization rarity filter labels and color classes from `@cgraph-dev/shared-types/rarity`, and
makes the cosmetics API adapter validate backend rarity values against shared `RARITY_TIERS` instead
of a web-local list. Verified with package-owner guard, typecheck, lint, and focused cosmetics API
plus rarity-badge tests covering 18 tests across 2 files. This narrows the Phase 1 shared-contract
owner follow-up without closing the broader backend/package final-behavior, future-client runtime,
provider, physical cross-device, or hosted Stripe settlement proof.

2026-06-05 cosmetic item-type guard proof: production web commit
`d616de17a1eb7be56908bfb826de1ad96c582d6e` removes the entitlements service's web-local
`VALID_COSMETIC_TYPES` allowlist in favor of the package-owned `@cgraph-dev/api-client`
`CosmeticTypeSchema`, and makes the identity-customization inventory subtype derive from
`@cgraph-dev/shared-types` `InventoryItemType` instead of a raw string union. Equip targets now keep
the backend `border` alias only through typed shared inventory semantics. Verified with
package-owner guard, typecheck, lint, and focused cosmetics plus entitlements API tests covering 10
tests across 2 files. This narrows the Phase 1 package-contract cleanup without closing final
backend/package alignment, future-client runtime proof, provider delivery, physical cross-device
validation, or hosted Stripe settlement.

2026-06-05 Level 2 route-stability proof: production web commit
`97e66a5426e1e472ca8d3b57d7cfd4e6c4aa749c` revalidated the current local web
route/contract surface before any Level 3 work. The slice fixes the stale
valid-invite fixture, gives the E2E preference-sync listener an auth-bypass-only
readiness flag, carries live appearance nameplate/display-name semantics through
`NameplateBar`, and makes the member mute/unmute proof target the exact muted
badge. Focused settings sync passed 7 / 8 with 1 socket-harness-gated skip,
focused member mute/unmute passed 2 / 2, and the rebuilt Chromium route pass
across auth/account, DM media/composer, Social main pane, settings sync, Nodes
wallet/shop, group settings/scroll/entry/invites, owner UAT, and sidebar
profile specs passed 85 / 86 with 1 socket-harness-gated skip. Package-owner
guard, typecheck, lint, release gates with 409 files / 5,345 tests, and bundle
budget all passed. This is a Level 2 closure-filter refresh only; it does not
claim real provider delivery, future native QR/mobile approval, physical
cross-device lab validation, hosted Stripe settlement, or Level 3 hardening.

2026-06-02 badge/title display adapter ownership proof: production web moves
badge and title display-data resolution out of the settings customization store
mapping barrel and into the shared UI adapter at
`apps/web/src/shared/components/ui/cosmetic-display.ts`. `InlineTitle`,
`InlineBadges`, profile-card badge rendering, and the settings live-preview
profile content now consume that UI-owned adapter directly, while the
customization store no longer re-exports display mapping helpers. Source search
found no remaining imports from
`modules/settings/store/customization/mappings`, and the dead mapping file was
deleted. Verified with focused shared-UI/profile-card tests covering 12 tests
across 3 files, package guards, package-owner guard, typecheck, lint, release
gates with 408 files / 5,338 tests, and build budget at 484.19 kB / 500 kB for
the largest JS chunk. This narrows the Phase 5 web-adapter cleanup work without
claiming final provider, future native QR, physical cross-device closure, or
hosted Stripe settlement/webhooks.

2026-05-29 group route-fallback proof: production web adds `getKnownGroupRoute(...)` so
component-level flows with missing canonical group truth return to `/groups` instead of inventing a
bare `/groups/:groupId` destination. `ExploreGroups` uses it after node-gated joins, and
`GroupSettingsPage` uses it when closing before group truth has hydrated. Focused route-helper proof,
typecheck, lint, production build, and a 33 / 33 Chromium pass across group entry, invite landing,
and group settings permissions verify the route contract.

2026-05-29 AutoMod admin proof: production web now gives the routed AutoMod settings tab visible
route-owned failure copy for denied list/create/update/toggle/delete actions and accessible controls
for rule fields plus per-rule edit/delete/toggle actions. The rebuilt app passed
`apps/web/e2e/group-settings-permissions.spec.ts` with 32 / 32 Chromium tests, including AutoMod
create/update/toggle/delete contracts, 403 denial copy, and unchanged-row reconciliation after
denied updates.

2026-05-29 WebRTC browser negotiation proof: production web adds
`apps/web/e2e/webrtc-negotiation.spec.ts`, which creates two real Chromium `RTCPeerConnection`
peers, exchanges offer/answer/ICE locally, and verifies generated audio/video tracks arrive on both
sides. This narrowed the call-media gap; the later 2026-05-29 Cloudflare relay proof closes the
production TURN/network two-client media validation item.

2026-05-29 backend TURN readiness proof surface: production backend commit `eb7aeac` adds
`checks.webrtc_ice` to `GET /ready`, documents the exact TURN secret names, and passes focused
health plus call-controller tests. This original static-TURN readiness gap is superseded by the
Cloudflare TURN owner proof below.

2026-05-29 Cloudflare TURN owner proof: production backend commit `bdbe255` adds Cloudflare
Realtime TURN as the production ICE credential owner. The backend keeps the long-lived Cloudflare
TURN key server-side, generates short-lived ICE servers for authenticated clients, filters
browser-problematic `:53` ICE URLs, and keeps static `WEBRTC_TURN_*` as a fallback. Focused
Cloudflare TURN, signaling, `/ready`, and call-controller tests are green. Follow-up backend commit
`8a5539b` removes a release-eval-only Fuse dependency from Cloudflare TURN generation, and Fly
deploy `deployment-01KSSK3AEJG12M9E1PBCG4FJFR` is running with machine checks passing. The live route
now reports `webrtc_ice:"ok"`, and a redacted production-node RPC proves generated STUN plus
TURN/TURNS servers are returned with generated username and credential fields present.

2026-05-29 external provider readiness proof: production backend commit `8cde97f` adds non-secret
provider readiness to `/ready` for email, phone SMS, phone voice, Turnstile, and Stripe. Focused
health-controller tests are green, Fly deploy `deployment-01KSSMJQH0HWXFFDDZD6CR0V9Y` is running,
and the live route reports `email_provider:"ok"`, `phone_sms:"ok"`, `phone_voice:"ok"`,
`turnstile:"ok"`, and `stripe:"ok"` without exposing secret values. This closes provider
configuration proof; real delivery, paired-device, and Stripe settlement proof remain external
release-validation work.

2026-05-29 QR channel hygiene proof, updated by the 2026-05-31 no-overclaim pass: production web keeps
`apps/web/src/pages/auth/login/__tests__/qr-login.test.tsx` for the enabled protocol path, proving one
generated QR login session creates exactly one Phoenix socket/channel join for
`qr_auth:{sessionId}`. The default routed browser behavior stays gated until native mobile approval
exists, preventing the web product from advertising a mobile-assisted login path that users cannot
complete yet.

2026-05-31 QR no-overclaim proof: `/qr-login` now renders a mobile-app-required state by default,
offers normal browser login paths, and does not create `/api/v1/auth/qr-session` before native mobile
approval exists. The enabled protocol path remains unit-covered for exactly one `qr_auth:{sessionId}`
socket/channel join. Verified with `pnpm --filter @cgraph/web test --
src/pages/auth/login/__tests__/qr-login.test.tsx` (expanded to 400 Vitest files / 5,355 tests),
`pnpm --filter @cgraph/web typecheck`, `pnpm --filter @cgraph/web lint`,
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome pnpm --filter @cgraph/web exec playwright test
e2e/auth-account-routes.spec.ts --project=chromium --no-deps` (10 / 10 passed), and
`pnpm --filter @cgraph/web build:budget`.

2026-05-31 web native-runtime boundary guard proof: production web extends
`scripts/validate-package-dependencies.mjs` so `pnpm check:packages` and
`pnpm check:package-owner` now fail if the browser app adds native-trust-boundary dependencies or
source imports for `@cgraph-dev/crypto`, legacy `@cgraph/crypto`, or
`@signalapp/libsignal-client`. The stale root build allowlist entry for
`@signalapp/libsignal-client` was removed. This keeps web as a Cloud Chat/browser-safe client while
preserving the native libsignal-capable path for later mobile and desktop work. Verified with
`pnpm check:packages` and `pnpm check:package-owner`.

2026-05-28 upload failure UX proof: production web surfaces upload API failures through the
route-owned DM composer toast instead of only logging them. `apps/web/e2e/dm-media-composer.spec.ts`
now browser-verifies a scanner-unavailable `/api/v1/uploads` response, proves no fake attachment
message is sent, and keeps the full DM media/composer suite green. This proves local route/API
failure UX; the production ClamAV provisioning task is closed by the 2026-05-29 proof below.

2026-05-29 backend scanner-readiness proof: production backend commit `1781330` exposes antivirus
backend and failure-policy state through `CGraph.HealthCheck` and `/ready`, passed focused
health/upload controller tests, and was deployed to Fly as
`deployment-01KSRANV213HDJVJ5AZMRADFJ0`. The live production `/ready` route now reports
`antivirus:"metadata_only"`, so scanner visibility is real, while the strict ClamAV provisioning
task stays open until the follow-up production image below reports a reachable byte scanner.

2026-05-29 production ClamAV proof: production backend commit `ff91f16` installs ClamAV in the Fly
image, seeds daily/main/bytecode signatures during the remote build, starts `clamd` beside Phoenix
when `ANTIVIRUS_BACKEND=clamav`, switches Fly production to fail-closed ClamAV mode, and raises the
machine to 2 GB memory for scanner headroom. The deployed image
`deployment-01KSRB6TCYX4KZ7041RYN3YJ1K` reports `antivirus:"ok"` from
`https://cgraph-backend-prod-v2.fly.dev/ready`, with Fly machine checks passing.

2026-05-28 Stripe checkout handoff proof: production web extends
`apps/web/e2e/nodes-wallet-shop.spec.ts` to cover the successful checkout path. The browser route
posts to `/api/v1/nodes/checkout`, receives a backend-owned Stripe checkout URL, follows it through
`safeRedirect(...)`, and lands on the mocked `checkout.stripe.com` page. This closes the local
handoff-success proof while real hosted payment completion and webhook settlement remain external
Stripe/Fly/Vercel proof items.

2026-05-28 call-history contract proof: production backend now serializes server-owned
`end_reason` / `missed_seen` fields on call history and scopes call detail lookup to the
authenticated user's visible records. Production packages preserve that backend envelope in
`@cgraph/api-client`, and production web uses the same missed-call truth in the route normalizer.
Focused backend, package, and web tests are green; the strict release-readiness document now records
Cloudflare TURN relay media negotiation as a closed proof.

2026-05-28 linked WebRTC signaling proof: production web extends
`apps/web/src/lib/webrtc/__tests__/peerConnection.test.ts` with a linked two-peer Phoenix-channel
harness. The focused proof drives caller and callee through offer, answer, ICE candidate,
remote-stream, and connected-state handoff using the shared WebRTC signaling owner. This narrows the
call-media gap, while a real production-like two-browser media session across network conditions
remains a strict-release proof item.

2026-05-28 remote call-ended cleanup proof: production web also verifies that a remote
`call:ended` channel cleanup stops local tracks and resets call state without emitting the local
`user_ended` callback before the remote reason is handled. Focused proof lives in
`apps/web/src/lib/webrtc/__tests__/webrtcService.test.ts`, and the run completed through the full
397-file / 5,348-test web suite.

2026-05-28 shared chat preference contract proof: production web moves the chat UI preference
defaults out of the routed messages page and into
`apps/web/src/modules/chat/components/message-bubble/preferences.ts`, with the old route export kept
as a compatibility alias. The focused proof in
`apps/web/src/modules/chat/components/message-bubble/__tests__/preferences.test.ts` verifies the
route alias points at the shared chat contract and that decorative particle overlays are disabled by
default.

2026-05-31 chat entrance-animation package proof: production web consumes
`@cgraph-dev/shared-types@1.0.6` so `CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS` and
`isChatUiMessageEntranceAnimation(...)` own the message entrance animation value set used by the
settings chat panel, routed bubble customization page, chat UI settings panel, customization store
type boundary, and legacy theme type boundary. The focused constants proof in
`apps/web/src/modules/settings/components/customize/panels/__tests__/chat-panel.constants.test.ts`
verifies the customization panel follows the shared package array, and the UI settings panel test
now covers the full selectable set.

2026-06-01 profile-card layout package proof: production web consumes
`@cgraph-dev/shared-types@1.1.0` so profile-card layout semantics now come from
the shared `PROFILE_CARD_LAYOUTS` contract rather than web-only unions and
component-local constants. The settings customization store and theme-store
facade normalize stale layout IDs to the shared default, the profile panel
derives its selectable cards from the package catalog, and the social
profile-card renderer handles the shared default/card/full/premium shapes via
the detailed renderer while keeping minimal/compact as their own renderers.
Local proof passed package guards, typecheck, lint, focused 115-test coverage,
the full 406-file / 5,376-test release gate, and bundle budgets.

2026-05-23 phone-flow browser proof: production web commit `5f86bb9` extends
`apps/web/e2e/auth-account-routes.spec.ts` to verify new-user phone registration through profile and
permissions, OTP resend, voice-call fallback, registration-lock PIN completion, and
native-device-required recovery. `AuthFormInput` now associates visible labels with inputs so the
phone profile step is accessible by label. The stricter release-readiness documents still keep real
provider delivery, future paired QR approval after native mobile exists, and external/lab validation open.

2026-05-23 account-deletion lifecycle proof: production web commit `93febe9` extends
`apps/web/e2e/settings-preference-sync.spec.ts` to browser-verify the mounted
`/me/settings/delete-account` route. The proof cancels a pending deletion through
`DELETE /api/v1/me/delete-account`, schedules deletion through password-confirmed
`POST /api/v1/me/delete-account`, asserts the password payload, and verifies the follow-up auth
logout side effect. The stricter release-readiness documents still keep real provider delivery,
future paired QR approval after native mobile exists, and external/lab validation open.

2026-05-23 group-settings permission proof: production web commit `5351b03` gates group settings
management tabs by owner/admin/member permissions and adds
`apps/web/e2e/group-settings-permissions.spec.ts`. The routed proof verifies owners still see
Overview/Roles/Members/Invites/Channels/Audit Log/AutoMod and can save overview changes, while
ordinary members only see personal Notifications/Danger actions and do not issue admin
`PATCH /api/v1/groups/:groupId` requests. The stricter release-readiness documents still keep
future paired QR approval after native mobile exists, provider delivery, and external/lab validation open.

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
closes the owner checklist's shared composer/list/action/media stack row, while external/lab
validation remains tracked by the strict-pass and maturity scorecard documents.

2026-05-28 Cloud Chat surface-shell convergence proof: production web now routes the opened DM
conversation through shared `modules/chat/components/conversation-surface.tsx` for the stable
header, message-scroll region, composer, floating-control, request-banner, pinned-panel, and modal
slots. The Cloud Chat route still owns backend data/actions and slot composition, so this narrows
but does not fully close the strict page-shell convergence row. Focused proof lives in
`apps/web/src/modules/chat/components/__tests__/conversation-surface.test.tsx`, plus the existing
conversation route and composer adapter tests.

2026-06-01 Cloud Chat inbox-owner convergence proof: production web now routes the live
conversation-list sidebar, action menu, loaded-list filtering, and Space membership helpers through
`modules/chat/components/conversation-list`. The page-level messages files are compatibility
re-exports, so the remaining route shell fetches and passes data/actions while the shared chat module
owns the list UI contract. The strict-pass row remains open only for broader live/provider release
validation, not a second page-local inbox owner.

2026-06-01 Cloud Chat surface-owner convergence proof: production web now routes the opened Cloud
Chat conversation surface through `apps/web/src/modules/chat/components/cloud-conversation/*`. The
`/messages/:conversationId` route and Vault route both render `CloudConversation` from the shared
chat module, while the old `apps/web/src/pages/messages/enhanced-conversation/*` files are thin
compatibility re-exports. Focused owner/composer proof passed 10 / 10; typecheck, lint, package
guards, release gates with 403 files / 5,369 tests, and build budget passed; and the full routed DM
media/composer Chromium spec passed 17 / 17 serially after the move. This closes the local
page-owned opened-DM surface gap without claiming final live/provider regression breadth.

2026-06-01 routed DM WebRTC route proof: production web now waits for the socket-backed WebRTC
manager before starting or answering the mounted call route. The focused routed-DM browser harness in
`apps/web/e2e/routed-dm-webrtc.spec.ts` starts a local Phoenix-compatible socket, launches the video
call from `/messages/:conversationId`, and verifies media acquisition, backend-shaped ICE servers,
`webrtc:lobby` room creation, `call:{roomId}` join, outbound offer, ICE candidate push, remote
answer handling, remote audio/video tracks, and connected state. Focused WebRTC unit proof passed 21
/ 21, typecheck and lint passed, the routed WebRTC Chromium proof passed, and the full routed DM
media/composer Chromium spec passed 18 / 18. This closes the local routed-DM peer negotiation proof
gap without claiming broad live/provider regression or physical cross-device validation.

2026-05-23 connected-account provider proof: production web commit `f7142b6` moves OAuth provider
discovery into shared OAuth helpers, mounts Connected Accounts at `/me/settings/connected-accounts`,
and uses `/api/v1/auth/oauth/providers` to decide which account-linking actions render. The focused
unit proof covers configured-provider parsing and empty-provider behavior, while
`apps/web/e2e/settings-preference-sync.spec.ts` browser-verifies the routed settings page showing
Google/TikTok from backend discovery while hiding unavailable Apple/Facebook account-linking
actions. The stricter release-readiness documents still keep real provider delivery, paired QR
approval, and external/lab validation open.

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
success. Later 2026-05-28 production proof closes local Stripe checkout handoff success on the
mounted shop route; real hosted payment completion/webhook settlement and external/lab validation
remain open in the stricter release-readiness documents.

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

## Web, Mobile, And Desktop Boundary

The owner decision for current and future work is web first, ecosystem-aware always.

- Web owns the first complete browser product: Cloud Chat, server-readable routed products, settings,
  identity, discovery, cosmetics, Nodes, moderation, browser media, and honest native-only fallbacks.
- Web Cloud Chat is the universal DM tier over TLS with backend-owned storage/encryption-at-rest
  behavior. It is not Secret Chat and must not be sold or labeled as Signal-style E2EE.
- Web must not become a Signal-participant device. It must not own libsignal identity keys, prekeys,
  sessions, or post-quantum ratchet state.
- Backend and `packages/*` work done now must prepare native mobile and desktop by defining shared
  contracts, schemas, semantic models, design tokens, and runtime-neutral rules instead of web-local
  product truth.
- Secret Chat, Ghost Chat, group E2EE, file E2EE, and post-quantum voice/video belong to capable
  native mobile and desktop clients after the web and Level 3 web hardening work is complete, using
  the shared contracts created now plus native libsignal-capable implementations.

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
- Web truthfully presents Cloud Chat as browser-safe server-readable messaging and keeps Secret Chat,
  Ghost Chat, group/file E2EE, post-quantum voice/video, and key verification as native
  mobile/desktop follow-on surfaces.
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
- [x] Web remains a Cloud Chat/browser-safe client and does not own libsignal identity, prekey,
      session, or post-quantum ratchet state.
- [x] Mobile and desktop restart only after the convergence items below are complete and validated.
      Until then, mobile and desktop work is limited to truth cleanup, package resync, or explicit
      foundation-directed slices.
- [x] Native mobile and desktop own the later Signal-family post-quantum tier: Secret Chat, Ghost
      Chat, group E2EE, file E2EE, and post-quantum voice/video through native libsignal-capable
      implementations that consume the shared contracts defined now.

### Repo, Package, And Sync-Strategy Decisions

- [x] `/CGraph` is the umbrella planning and integration workspace for cross-repo work and PR #22.
      It is not, by itself, proof that the split production repos have deployed.
- [x] `/home/looter-admin/CGraphRepos/cgraph-backend` is the Fly.io backend production repo.
- [x] `/home/looter-admin/CGraphRepos/cgraph-web` is the Vercel web production repo.
- [x] `/home/trick/Projects/Repos/CGraphRepos (2)/cgraph-packages` is the canonical source owner
      for published `@cgraph-dev/*` packages.
- [x] `cgraph-web` consumes exact published package versions; app-local
      `packages/` folders are no longer allowed in the web production repo.
- [x] Shared-package changes start in `cgraph-packages`, publish through the
      package workflow, then move to app repos through the documented
      versioned-package sync path.
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
- [x] Routed DM voice-note and video-note send are real and browser-verified. Voice-note send is
      verified by `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-14; the 2026-06-01 follow-up
      mounts camera-backed video-note recording and verifies upload plus `video` message send in the
      same routed browser spec.
- [x] Routed DM reply, edit, delete, forward, request, pin, search-jump, guarded scroll, and
      read-receipt rendering behavior are complete. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts`; the 2026-05-16 read-receipt slice also proves
      backend `metadata.readBy` serialization with
      `apps/backend/test/cgraph_web/controllers/api/v1/message_controller_test.exs`.
- [x] Routed DM reaction remove/re-add parity is browser-verified from the mounted Cloud Chat route.
      The 2026-05-31 follow-up preserves backend reaction-summary `count` / `users` payloads,
      decrements same-length reaction summaries without stale memoized bubble rendering, and proves
      DELETE plus POST against `/api/v1/messages/:id/reactions` in
      `apps/web/e2e/dm-media-composer.spec.ts`.
- [x] Routed DM multi-select copy/forward/delete is browser-verified from the mounted Cloud Chat
      route. The 2026-06-01 follow-up mounts batch forward on the selected-message action bar,
      previews the selected messages in the existing forward modal, posts each selected message to
      `/api/v1/messages/:id/forward`, keeps copy in conversation order, and deletes both selected
      messages through the conversation message endpoint in
      `apps/web/e2e/dm-media-composer.spec.ts`.
- [x] Routed DM typing start/stop emits from the live input path. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-16 with the E2E-only typing observer.
- [x] Routed DM voice/video call entry launches real call routes from the live header. Verified by
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-16 for `/call/:recipientId/audio` and
      `/call/:recipientId/video` controls. Incoming-call accept/end-state proof is covered below;
      production relay media proof is covered by the 2026-05-29 Cloudflare TURN validation.
- [x] Call-history callback launches the mounted call screen from a real history row. Verified by
      `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16.
- [x] Incoming calls accept into the mounted call screen and return cleanly through the end-call
      control. Verified by `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-16 through the
      root-mounted `IncomingCallHandler`, `/call/:recipientId/video?incoming=true&roomId=...`,
      visible video controls, and end-call navigation back to the DM route. Routed DM peer
      negotiation is covered by `apps/web/e2e/routed-dm-webrtc.spec.ts`; broad live/provider
      regression remains tracked as final release validation risk.
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
      role assignment, AutoMod create/update/toggle/delete, and kick/ban/mute.
- [x] Routed group scroll behavior is real. Verified by `apps/web/e2e/group-channel-scroll.spec.ts`
      on 2026-05-25 for routed `scrollTo` anchors, incoming-message stability below the reader, and
      jump-to-latest behavior. Remaining group release-readiness work is broader external/live
      regression validation, tracked in `docs/WEB-ULTIMATE-STRICT-PASS.md`.

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
      header. The later 2026-05-28 production web proof reloads the public profile route and
      verifies the same profile theme, nameplate, and display-name effect survive route reload. The
      2026-05-21 follow-up commit keeps title/badge/nameplate Lottie paths normalized
      through `apps/web/src/lib/lottie/lottie-asset-renderer.tsx` and renders those cosmetic layers
      in customization, full profile, mini/hover card, and preview-card surfaces. The later
      2026-05-21 package/web cleanup makes display-name effects and nameplates Lottie-backed catalog
      metadata too, while deleting the old CSS/canvas particle renderers from avatar borders,
      nameplates, and global background effects. The 2026-05-28 production web sender-card proof
      extends the same live routed path to backend-shaped `equipped_badges` and
      `equipped_nameplate` friend patches: `otherIdentitySync`, `presenceManager`, and `chatStore`
      preserve the fields, then `apps/web/e2e/web-owner-uat.spec.ts` opens the routed DM sender
      profile card and verifies the live `plate_aurora` nameplate plus `badge-founder` badge. The
      2026-05-31 Lottie delivery follow-up ships the missing public badge/title/name-effect/nameplate
      JSON files and adds a release-gate asset guard so catalog paths cannot silently regress to 404s.
      The 2026-06-01 profile-card theme-adapter follow-up removes the parallel hardcoded
      profile-card accent theme table, derives the card accent/banner/surface tokens from the shared
      static profile-theme catalog, and proves the profile-card keys stay aligned with shared
      `PROFILE_THEME_IDS`. The 2026-06-01 settings theme-application follow-up removes legacy
      web-only profile-theme CSS aliases from the settings application hook and live preview,
      derives the remaining profile-theme color/preset mapping from shared `ALL_PROFILE_THEMES`, and
      proves stale `classic-purple` / `profile-default` ids no longer define product semantics. The
      2026-06-01 profile-theme store-boundary follow-up types customization profile-theme state as
      shared `ProfileThemeId | null` and rejects stale profile-theme ids in setters, server patches,
      persisted state, legacy identity updates, and own-identity socket sync. The later 2026-06-01
      routed profile-theme cleanup removes the now-unused local profile-theme-to-app-color semantic
      map and routes `/customize/theme` plus the dev test page through the typed `setProfileTheme`
      action, with locked premium previews kept out of the saving path. The 2026-06-02
      avatar-border adapter cleanup moves legacy avatar-border CSS mapping out of the settings hook
      and into the shared avatar UI adapter consumed by `Avatar`. The later 2026-06-02 badge/title
      display adapter cleanup moves badge/title display-data helpers out of the customization store
      barrel and into the shared UI adapter consumed by inline/profile-card/preview renderers.
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
      customization preview surfaces. The 2026-06-01 profile-card layout slice moves the
      runtime-neutral layout ID set into `@cgraph-dev/shared-types@1.1.0`, makes web derive the
      settings panel and profile-card renderer from that contract, and normalizes stale layout IDs
      such as `gaming` to the shared default. The later 2026-06-01 adapter cleanup removes the dead
      legacy `GamingLayout` / `SocialLayout` / `CreatorLayout` exports and makes legacy theme preset
      `cardLayout` metadata use shared layout ids only. The 2026-06-01 profile-theme store-boundary
      cleanup makes customization profile-theme state use shared `ProfileThemeId | null` and clears
      stale web-only ids before they persist or flow through server/socket patch aliases. The later
      2026-06-01 routed profile-theme cleanup removes the unused local profile-theme color mapping
      and makes routed profile-theme selection use the typed profile-theme action only. The
      2026-05-31 Lottie delivery guard proves the
      catalog-referenced badge, title, display-name effect, and nameplate animation paths have
      corresponding public web delivery assets rather than relying on missing files plus fallback
      placeholders.
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
      voice-room flows. A later 2026-05-28 sender-card replay passed `web-owner-uat.spec.ts` after
      proving live routed avatar-border, title, nameplate, and badge convergence from the same
      backend-shaped friend customization patch.
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

Current sign-off state: 3 / 6 final questions closed. Do not call the workstream complete until the
owner can answer "yes" to every question below, and do not check these boxes from source inspection
alone.

- [x] Can a user navigate every in-scope routed messaging, hub, and social surface without landing
      on a blank, partial, or semantically wrong destination? Closed for the current web scope by
      the 2026-06-05 rebuilt Chromium Level 2 route proof, previous broadcasts/spaces/vault browser
      proofs, route-inventory guard, and support-matrix no-overclaim pass. Mobile/desktop-only
      surfaces remain explicitly out of current web scope.
- [x] Are all in-scope routed controls real? Closed for current web-routed controls by focused
      browser proof for the previously fake/partial DM, group, social, settings, Nodes, calls,
      broadcasts, spaces, and vault controls. External provider actions stay hidden or gated until
      their backend/provider owners are ready.
- [x] Does the web app use one truthful identity, settings, and customization model? Closed for the
      audited web surfaces by the shared identity/settings/customization owner work, backend-shaped
      socket/store proofs, sidebar/public-profile proof, and the 2026-06-05 live appearance
      preference-sync proof.
- [ ] Are the backend contracts and shared package contracts aligned with the final web behavior?
- [ ] Would a desktop or mobile team inherit a cleaner shared contract foundation after this work,
      rather than a web-specific mess?
- [ ] Has the final state been verified in live routed behavior, not just code reads?

If any answer is "no", the web workstream is not 100% complete.
