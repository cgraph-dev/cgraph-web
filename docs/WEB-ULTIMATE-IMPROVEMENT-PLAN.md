# Web Ultimate Improvement Plan

> **Scope:** `apps/web/` (web.cgraph.org) + the backend/infra surface it depends on. **Input:** Five
> parallel audits (architecture, messaging, features, settings+themes, backend+infra),
> cross-referenced against Signal-Desktop / Signal-Android / Signal-Server / Telegram-iOS sources in
> `reference/`. **Goal:** Industry-grade (Signal + Telegram parity) web app. Every item below cites
> the exact file and has an effort estimate.

---

## Executive summary

The web client is in far better shape than the Feb-2026 scaling audit implied:

- **Zero production violations** of the CLAUDE.md banned-pattern list (no `React.FC`, `forwardRef`,
  `useContext`, `: any`, `as any`, or production `console.log`).
- **TypeScript strict mode** everywhere with a single justified `@ts-expect-error` in a test.
- **Bundle chunking** is already thought through (manual chunks for react, router, tanstack, radix,
  motion, gsap, icons, charts, web3, sentry, livekit, etc.).
- **Pagination is mostly cursor-based** — the "34 offset occurrences" figure in the old audit is now
  **12**, and most of those are hybrid `OffsetCursor` encoders or admin-only endpoints. One
  pure-offset regression remains (`reputation_controller.ex:84`).
- **Presence is Redis-backed (ZREVRANGE)** — the "all users in memory" concern is stale.
- **Cache stampede protection is on by default** — the "opt-in" concern is stale.

What **is** broken is a mix of user-visible UX gaps and latent correctness/safety risks:

- The **app-theme picker** (aurora / dark / light / bubble) is not surfaced anywhere in UI — the
  component exists but is orphaned. This is the user's "I don't see where the themes are picked"
  complaint.
- **Two web-DM leaks** could briefly leak Secret-Chat content or bypass the mobile-only guard.
- **Conversation list is not virtualized** — stalls past ~500 conversations.
- **Drafts don't exist on web** — closing a tab loses typed messages.
- **Message search is a stub** with mock results, even though MeiliSearch is live on the backend.
- **Antivirus scanning is disabled** on uploads, and **per-account daily message envelope limits**
  don't exist.
- **Broadcasts** now have first-class routed directory/detail/create/subscribe/publish surfaces.
- **Vault / Saved Messages** now has a first-class `/vault` route backed by the backend Note-to-Self
  conversation.
- **Spaces** now have first-class `/spaces` and `/spaces/:spaceId` routes backed by the backend
  Spaces contract, and the routed inbox can add/remove conversations through the server-owned
  include/exclude lists with browser proof in `apps/web/e2e/dm-media-composer.spec.ts`.
- Paid DM, Pulse score, and Follow (vs friend) remain stubbed or incomplete.
- **`reduceMotion` / `prefers-reduced-motion`** is not wired — WCAG 2.1 motion fail.
- **`FederationRoutes` module is still imported** in the router despite CLAUDE.md Rule 8a saying all
  federation is deleted.

Everything below is organized to ship in waves — each wave produces a working, testable slice.

---

## Focused recovery plan (April 2026 live audit)

This section narrows the broad web backlog into the concrete failures verified from direct code-path
inspection on `feat/cloud-chat-tier`.

**Explicitly out of scope for this recovery plan because they are already working well enough:**

- Cloud Chat creation and open flow on web
- Secret Chat fail-closed routing to `MobileOnlyFeature`
- Group channel fetch/send after the user lands on a valid channel route

**Primary problems this plan addresses:**

- Social Hub renders fetched data but still lands in a placeholder main pane
- Group and forum discovery contain dead-end or incomplete entry points
- Avatar, border, title, and badge identity are split across multiple client models
- Settings, theme, and customization state are owned by separate persisted stores that drift
- Customization save flows are richer than the read/render flows that consume those values

### Requirements and constraints

- Preserve current Cloud Chat and Secret Chat behavior.
- Remove placeholder-only destinations and dead buttons from social, groups, and settings.
- Establish one canonical web identity model for avatar, border, title, badges, and nameplate.
- Keep each step deployable; no half-built replacement shells.
- Follow the upstream product pattern from Signal Desktop and Telegram iOS: centralized list/state
  ownership and centralized preference ownership.

### Recovery checklist

1. **Finish social selected-entity content and destination correctness**
   - **What:** Keep the real Social Hub main pane, then finish the selected friend, pending request,
     notification target, and discover-result destination behavior so the route acts like a real
     workspace instead of a partial shell.
   - **Where:** `apps/web/src/pages/social/social/social.tsx`,
     `apps/web/src/pages/social/social/placeholders.tsx`,
     `apps/web/src/pages/social/social/discover-tab.tsx`, related social subcomponents.
   - **How:** Tighten selection state in the Social Hub, keep the real detail pane, and wire every
     CTA to a backend action or valid route. The old haptic-only non-user Join interaction has been
     replaced; group discover results now consume backend `default_channel_id` for mounted channel
     routes, and unjoined group results call the real public-group join action.
   - **Test:** Add a friend from Discover, accept a request, open a friend profile, and navigate to
     a real conversation or community target without landing on a wrong or partial destination.
   - **Complexity:** medium

2. **Normalize all group entry points to valid routes**
   - **What:** Ensure every group navigation path resolves to either a valid channel route or a
     deliberate, server-backed group landing route.
   - **Where:** `apps/web/src/routes/app-routes.tsx`,
     `apps/web/src/pages/explore/community-card.tsx`,
     `apps/web/src/pages/groups/components/server-icon.tsx`,
     `apps/web/src/pages/groups/groups-page.tsx`.
   - **How:** Keep the canonical `/groups/:groupId` redirect now landed in the routed groups owner,
     and stop generating bare group links where richer context already exists. Social discovery,
     global Explore cards, and notifications now use channel metadata; channel-list controls now use
     typed mounted destinations for text, voice, video, announcement, and forum channels. Keep
     sidebar icons and invite joins on `getGroupRoute(...)` where they already have full group
     state.
   - **Test:** Enter groups from Explore, sidebar, and invite join. Each path must end on a working
     channel or a real landing state with actionable channel selection.
   - **Complexity:** small

3. **Create a canonical web identity model**
   - **What:** Define one shared identity shape for the authenticated user and remote users that
     includes avatar URL, avatar border id, equipped title id, badges, and nameplate.
   - **Where:** `apps/web/src/modules/auth/store/*`,
     `apps/web/src/modules/settings/store/customization/*`, `apps/web/src/modules/chat/store/*`,
     `apps/web/src/modules/social/store/*`, `apps/web/src/modules/groups/store/*`.
   - **How:** Stop treating auth user data, customization state, chat sender state, and friend state
     as separate identity sources. Introduce a shared mapper/resolver used by sidebar, profile,
     friend list, conversation list, message bubble, and group member surfaces.
   - **Test:** Change avatar border/title once, reload, and verify sidebar, own profile, friend
     rows, conversation rows, and message bubbles all render the same identity state.
   - **Complexity:** large
   - **Status:** Canonical identity types, the web identity normalizer, backend-hydrated
     `UserProfileCard`, server-owned customization inventory, and friend cosmetic socket patching
     now exist with focused tests. Own-profile cosmetic socket events now route through one identity
     sync owner, other-profile cosmetic socket events route through one selective friend/chat sync
     owner, and owner UAT browser-verifies a live friend avatar-border/title update on the routed DM
     surface. Remaining work is broader badge/nameplate and multi-tab/device proof beyond this owner
     route.

4. **Stop dropping identity fields during normalization and socket sync**
   - **What:** Preserve server identity/customization fields through web normalization instead of
     truncating them to avatar URL and status.
   - **Where:** `apps/web/src/modules/chat/store/chatStore.impl.ts`,
     `apps/web/src/modules/chat/store/chatStore.normalizers.ts`,
     `apps/web/src/modules/social/store/friend-normalizers.ts`,
     `apps/web/src/modules/groups/store/group-actions.ts`, `apps/web/src/lib/socket/userChannel.ts`.
   - **How:** Extend participant, sender, friend, and member normalization to keep border/title and
     related cosmetic metadata. Update socket sync so avatar and cosmetic changes land in the same
     identity owner, not parallel stores.
   - **Test:** Receive a profile update or item-equip event and confirm every open surface updates
     without refresh.
   - **Complexity:** medium
   - **Status:** Sender, participant, friend, profile, group member, group message, auth hydration,
     userId-only profile cards, and relevant socket paths now preserve the shared identity fields.
     `friend_customization_changed` now routes through `otherIdentitySync` instead of direct
     presence-store mutation, and own-profile `profile_updated`, `item_equipped`, and
     `item_unequipped` events now route through `ownIdentitySync`. Owner UAT verifies the routed
     live avatar-border/title update path.

5. **Consolidate settings, theme, and customization ownership**
   - **What:** Remove the current three-way split between settings store, customization store, and
     theme store for user-facing preference state.
   - **Where:** `apps/web/src/routes/auth-initializer.tsx`,
     `apps/web/src/hooks/facades/useSettingsFacade.ts`,
     `apps/web/src/modules/settings/store/settingsStore.impl.ts`,
     `apps/web/src/modules/settings/store/settings-actions.ts`,
     `apps/web/src/modules/settings/store/customization/customizationStore.ts`, theme bootstrap.
   - **How:** Define ownership boundaries explicitly. Either create one orchestration layer that
     fetches and saves all preference state, or move duplicated concerns out of one of the stores.
   - **Test:** Save appearance and notification changes, reload, open a second tab, and verify the
     same values render from startup through live sync.
   - **Complexity:** large
   - **Status:** The explicit bootstrap owner now exists in
     `apps/web/src/modules/settings/store/preferenceOrchestrator.ts`; auth startup, the settings
     route, and `useSettingsFacade` use it to hydrate settings, customization, and theme together.
     `packages/shared-types/src/settings.ts` now owns runtime-neutral user setting types and
     defaults. The settings route now gates section panels until bootstrap readiness is fulfilled,
     Calls/Stickers reset now saves through `/api/v1/settings` with rollback proof, and
     customization/theme server patches now sync through backend user-channel events. Remaining work
     is routed multi-tab/device browser proof.

6. **Make customization inventory server-owned end-to-end**
   - **What:** Keep static metadata only for presentation, while ownership and equipped state come
     from backend inventory and profile payloads.
   - **Where:** `apps/web/src/pages/customize/identity-customization/useIdentityCustomization.ts`,
     cosmetics/inventory pages, and backend customization/profile endpoints if fields are missing.
   - **How:** Separate catalog definition from ownership state. The customization page can use local
     definitions for names/animation metadata, but all unlocked/equipped state must derive from
     backend inventory and profile data that other surfaces also consume.
   - **Test:** Locked items never persist as equipped, owned items survive refresh, and the same
     equipped cosmetics appear in all rendering contexts.
   - **Complexity:** medium
   - **Status:** The routed identity-customization page now uses backend inventory for unlocked and
     equipped truth, keeps local cosmetic lists as presentation metadata only, and the backend
     rejects unowned border/title/badge/nameplate customization saves. Remaining cosmetic work is
     profile-card consumption and final cross-surface browser proof.

Owner direction recorded on 2026-05-15: customization inventory and equipped state must be fully
server-owned. Local cosmetic definitions may remain only as presentation/catalog metadata; owned,
locked, unlocked, and equipped truth must come from backend inventory/profile data.

7. **Lock in behavior with focused web UAT and regression tests**
   - **What:** Add verification for the exact regressions that make the app feel like a demo.
   - **Where:** `apps/web/src/pages/social/**`, `apps/web/src/pages/groups/**`,
     `apps/web/src/modules/settings/**`, `apps/web/src/pages/messages/**`.
   - **How:** Add tests that assert: no placeholder-only destination after selecting a friend/group,
     no fake Join buttons, valid group navigation from every entry point, and identity sync across
     sidebar/profile/friends/chat after store updates.
   - **Progress:** `apps/web/e2e/web-owner-uat.spec.ts` now covers the first focused browser UAT
     smoke across auth, DMs, group text send, Social discover, settings, Nodes wallet, direct calls,
     and group voice rooms.
   - **Test:** Keep that browser UAT green, then add targeted component and route tests for the
     remaining edge cases.
   - **Complexity:** medium

### Risk assessment

| Risk                                               | Why it matters                                                                  | Mitigation                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Identity refactor touches many surfaces            | Sidebar, profile, friends, groups, and chat each consume different shapes today | Introduce a shared identity adapter first, then migrate each surface one by one  |
| Route normalization can break deep links           | Explore and sidebar currently generate different group paths                    | Add redirects before removing old paths                                          |
| Settings consolidation can regress current saves   | Three persisted stores currently mask each other's gaps                         | Keep one compatibility layer during migration and add reload/cross-tab tests     |
| Backend payloads may lack fields needed for parity | Cosmetic state is not preserved consistently in all endpoints                   | Audit and extend profile/friend/conversation payload contracts before UI cleanup |

### Recommended execution order

This is the authoritative release sequence for Goal 2 parity. It is intentionally broader than a
"top 10 blockers" list. Thousands-of-users web readiness depends on clearing the route-owned
correctness work below before feature expansion or scale items.

1. Messaging contract convergence

- Choose one attachment/send contract for web DMs and groups.
- Remove the split between page-owned composers and shared message helpers.
- Make one cloud-DM surface canonical.

2. Group route and shell convergence

- Browser-verify the canonical group entry paths and preserve bare `/groups/:groupId` only as a
  metadata-less fallback.
- Pick one canonical groups shell.
- Wire real admin, invite, member, role, create-channel, and channel-type-specific surfaces into
  that shell.

3. Routed DM parity

- Browser-verified now: routed file/photo send, voice-note send, reply, search jump,
  reaction summary remove/re-add, edit/delete/forward, message-request accept/reject/block-report,
  pin, loaded pinned-message panel, routed Seen/read-receipt rendering, guarded
  search-anchor/latest-jump scroll behavior, and typing start/stop emit from the live input path,
  plus GIF/sticker send, voice/video call-entry launch from the live DM header, call-history
  callback launch from a real history row, and incoming-call accept/end-state route behavior.
- Still open: canonical DM surface convergence and deeper peer media-negotiation verification.

4. Routed group parity

- Browser-verified group file/photo attachment sends.
- Browser-verified loaded-channel header search and group-level mute/unmute behavior.
- Browser-verified message edit, delete, report, copy-link, pin entry, and pinned-panel unpin
  actions.
- Browser-verified direct reply, reaction toggle, and thread reply behavior.
- Browser-verified routed settings overview save, invite creation, member role assignment, role-tab
  render, and channel creation.
- Permission-edge, stronger scroll behavior, older-search, deeper role CRUD/reorder, and
  channel-level notification parity.
- Explore/join entry points that always land on a mounted channel.

5. Auth, onboarding, and account-lifecycle parity

- Browser-verify email auth, recovery, verify-email, the gated QR route, and phone flows.
- Keep the resolved `device_attestation` guard green so web users never enter a dead checkpoint.
- Keep verify-email before onboarding before app-route gate order deterministic.
- Keep delete-account on the password-confirmed backend contract and add cancel-deletion support.

6. Social, discovery, and notification destination correctness

- Replace the placeholder Social Hub pane.
- Preserve destination metadata through notification mapping.
- Fix forum/group/profile deep links so every click lands on a real routed destination.

7. Canonical identity and profile hydration

- One shared web identity model for avatars, borders, titles, badges, and display names.
- Authoritative `UserProfileCard` hydration instead of placeholder fallback.
- Socket/profile updates flow through one owner.

8. Settings, privacy, and customization convergence

- Canonical settings fetch before render.
- One owner for settings, theme, and customization.
- Full settings round-trip coverage in `settings_json.ex`.
- Calls/Stickers preference save and reset behavior is server-synced.
- Customization/theme save events have user-channel sync owners.
- Browser-verify the implemented selective privacy model, including exceptions and live sync.

9. Nodes and calls honesty

- Throw on Nodes API/schema failure.
- Align shop/tip/gift/unlock payloads with shared contracts.
- Remove demo call-history fallback and local-only delete behavior.

10. Final release validation

- Browser UAT for auth, DMs, groups, social, settings, Nodes, and calls.
- Reload persistence, cross-tab sync, cross-device sync, and insufficient-balance/server-fail UX.
- No dead buttons, no placeholder panes, no false-success states.

### Concrete implementation board by area and owner

Owner here means the code surface that must drive the change, not a named person. This keeps the
plan truthful even when staffing changes.

#### Web routed messaging owner

Primary owner: `apps/web/src/pages/messages/**`,
`apps/web/src/pages/messages/enhanced-conversation/**`, `apps/web/src/modules/chat/**`

Supporting owners: backend messaging contract owner, shared schema owner

Checklist:

- [x] Converge the web attachment/send contract with the backend-owned messaging contract.
- [ ] Make one routed cloud-DM surface canonical.
- [x] Ship browser-verified routed DM reply, search jump, edit/delete/forward, message-request, pin,
      and loaded pinned-panel behavior on the live DM route.
- [x] Browser-verify typing emit on the live DM route.
- [x] Ship browser-verified read-receipt UI on the live DM route. Backend message JSON now carries
      `metadata.readBy`, the routed enhanced DM bubble renders Seen/read-receipt state, and the path
      is covered by `apps/backend/test/cgraph_web/controllers/api/v1/message_controller_test.exs`
      plus `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-16.
- [x] Ship mute/archive/pin/mark-unread conversation-list actions and archived-list recovery on the
      routed sidebar.
- [x] Ship per-chat Space move controls on the routed sidebar.
- [x] Ship browser-verified file/photo and voice-note send on the routed DM surface.
- [x] Ship guarded autoscroll/latest-jump behavior on the routed DM surface.
- [x] Ship browser-verified call launch on the routed DM surface.
- [x] Ship GIF/sticker send on the routed DM surface.
- [ ] Ship deeper peer media-negotiation proof on the routed DM surface.

#### Web groups owner

Primary owner: `apps/web/src/pages/groups/**`, `apps/web/src/modules/groups/**`,
`apps/web/src/pages/explore/**`

Supporting owners: backend messaging contract owner, shared schema owner

Checklist:

- [x] Remove remaining direct `/groups/:groupId` producers where the caller already knows the
      canonical mounted destination.
- [x] Split channel-list navigation into typed mounted routes for text, voice, video, announcement,
      and forum channels.
- [ ] Pick one canonical groups shell and retire or merge the other one.
- [x] Bring real group settings, invites, roles, members, and create-channel surfaces into that
      canonical shell.
- [x] Make group-header search and notification behavior real.
- [x] Make routed group message edit, delete, report, copy-link, and pin-entry actions real.
- [x] Ship voice, stickers, GIFs, and browser-verified pin/action happy paths on the routed group
      surface.
- [ ] Ship group permission-edge proof, stronger group scroll behavior, older-search, deeper role
      CRUD/reorder, and channel-level notification semantics.

#### Web auth and onboarding owner

Primary owner: `apps/web/src/pages/auth/**`, `apps/web/src/modules/auth/**`,
`apps/web/src/modules/onboarding/**`

Supporting owners: backend auth/account owner, shared schema owner

Checklist:

- [ ] Browser-verify login, registration, forgot-password, reset-password, verify-email, the gated QR
      route, and phone entry routes.
- [x] Let expired verify-email links request a new verification email while logged out.
- [x] Resolve the `device_attestation` dead checkpoint before users can enter it on web.
- [x] Make onboarding completion, skip, and post-auth gate order deterministic.
- [x] Persist onboarding skip and surface save/skip recovery errors on the routed onboarding page.
- [x] Add cancel-deletion UI that matches the existing password-confirmed delete-account flow.

#### Web social, discovery, and notifications owner

Primary owner: `apps/web/src/pages/social/**`, `apps/web/src/modules/social/**`,
`apps/web/src/pages/explore/**`

Supporting owners: backend auth/account owner, shared schema owner

Checklist:

- [ ] Replace the placeholder Social Hub pane with real selected-entity content.
- [x] Preserve destination metadata through notification-store mapping.
- [x] Make notification clicks open the relevant routed message, forum, group, or profile target.
- [x] Fix discover result routing so forum and group destinations are canonical and mounted.
- [x] Make Social discover group joins call the real public-group join action.
- [ ] Re-verify friend-request and friendship actions after identity fixes land.

#### Web identity, settings, and customization owner

Primary owner: `apps/web/src/modules/settings/**`, `apps/web/src/modules/auth/store/**`,
`apps/web/src/modules/social/store/**`, `apps/web/src/modules/chat/store/**`,
`apps/web/src/stores/theme/**`

Supporting owners: backend settings/privacy owner, shared schema owner

Checklist:

- [x] Create one canonical web identity model for avatars, borders, titles, badges, and display
      names.
- [x] Fix `UserProfileCard` and related profile-card hydration to use authoritative user data.
- [x] Route friend profile and cosmetic socket updates through the selective other-user identity
      patch owner.
- [x] Route own-profile profile and cosmetic socket updates through the final canonical owner.
- [x] Fetch canonical settings before section panels render.
- [x] Collapse settings, theme, and customization ownership into one explicit orchestration model.
- [x] Implement the real privacy model and exception handling if the product keeps it.
- [x] Route Calls/Stickers reset through the server settings API instead of a local-only reset.
- [x] Route customization/theme server updates through user-channel sync owners.

#### Web nodes and calls owner

Primary owner: `apps/web/src/modules/nodes/**`, `apps/web/src/modules/calls/**`,
`apps/web/src/pages/messages/call-history/**`

Supporting owners: backend economy/calls owner, shared schema owner

Checklist:

- [ ] Make Nodes API/schema failure paths throw instead of returning false-success state.
- [ ] Align wallet, shop, tip, gift, and unlock UI with real success and failure payloads.
- [ ] Remove demo call-history fallback data.
- [ ] Remove local-only destructive behavior if the server does not persist it.

#### Backend messaging contract owner

Primary owner: `apps/backend/lib/cgraph_web/controllers/api/v1/**`,
`apps/backend/lib/cgraph/messaging/**`, `apps/backend/lib/cgraph/uploads/**`

Supporting owners: shared schema owner

Checklist:

- [x] Decide and enforce the one true DM/group attachment contract.
- [ ] Keep routed DM/group actions aligned with the web surface that becomes canonical.
- [ ] Expose any missing group-admin or message-request endpoints required by the routed UI.

#### Backend auth, account, settings, privacy, economy, and calls owner

Primary owner: `apps/backend/lib/cgraph/accounts/**`,
`apps/backend/lib/cgraph_web/controllers/api/v1/*auth*`,
`apps/backend/lib/cgraph_web/controllers/api/v1/settings_json.ex`,
`apps/backend/lib/cgraph_web/controllers/api/v1/me_controller.ex`, related economy/call endpoints

Supporting owners: shared schema owner

Checklist:

- [x] Align cancel-deletion behavior with the route-owned web UX.
- [x] Expand/prove `settings_json.ex` so persisted notification settings round-trip through reload.
- [x] Align privacy payloads with the chosen web model.
- [ ] Align Nodes, wallet, tip, gift, unlock, and call-history payloads with the shared schema.

#### Shared schema owner

Primary owner: `packages/api-client/**`, `packages/shared-types/**`

Supporting owners: all backend and web owners above

Checklist:

- [ ] Keep messaging, settings, auth/account, Nodes, and calls schemas aligned with live backend
      responses.
- [ ] Remove false-success tolerances that let broken payloads look successful on web.
- [ ] Revalidate schema consumers after each backend contract change.

### Backlog interpretation rule

The detailed P0-P5 sections below remain useful as issue inventory, but they are no longer the
authoritative ship order. If a bucket below conflicts with the sequence above, the sequence above
wins.

---

## Acute vs chronic

Split work by urgency so critical user-visible bugs ship first, architectural clean-ups follow, then
feature parity.

| Bucket                               | What goes here                                                                                                               | Timebox            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **P0 — public-release blockers**     | Route-owned messaging/groups, auth/account lifecycle, social destinations, identity hydration, settings/privacy, Nodes/calls | Waves 1–8          |
| **P1 — release-adjacent parity**     | Drafts, richer search, theme picker, secondary settings IA, broader media polish                                             | Wave 9             |
| **P2 — post-core feature expansion** | Broadcasts, Paid DM, follow, pulse, creator monetization, broader Telegram/Signal parity surfaces                            | After Wave 9       |
| **P3 — ongoing hardening**           | Observability, lint ratchet, test cleanup, API contract diff, deploy hygiene                                                 | Continuous         |
| **P4 — scale prerequisites**         | Web push, media CDN, load test, ML moderation — all free-tier or net-saving                                                  | Wave 10a           |
| **P5 — scale on demand**             | OpenSearch, multi-region, Postgres sharding — only when Grafana triggers fire                                                | Wave 10b / trigger |

---

## P0 — Critical bugs (Wave 1, ≤ 5 days)

### 1. Surface the app-theme picker in `/me/appearance/themes`

**File:** `apps/web/src/pages/customize/theme-customization/page.tsx` — only renders
`ProfileThemePicker`. **Orphan:** `apps/web/src/components/theme-picker/theme-picker.tsx` implements
the 4 core themes but is only reachable via `Ctrl+Shift+T`. **Fix:** Mount `<ThemePicker />` at the
top of the themes category page; add current-theme checkmark, live preview tile, and an explicit
"App theme" section header above "Profile theme". **Effort:** 2 h.

### 2. Close the Secret-Chat leak in the socket handler

**File:** `apps/web/src/lib/socket/conversationChannel.ts:414-433` — `channel.on('new_message', …)`
stores any message it receives. **Fix:** Drop the payload if
`message.is_encrypted === true && conversation.type === 'secret'`; don't add it to `useChatStore`
and don't render a lock placeholder for conversations that shouldn't exist on web at all. Log a
single telemetry event `web_received_encrypted_payload` for observability. **Effort:** 3 h.

### 3. Kill the `forceUnencrypted` escape hatch

**File:** `apps/web/src/modules/chat/store/chatStore.messaging.ts:99-111` — accepts
`options.forceUnencrypted` and bypasses the `WEB_DM_UNAVAILABLE` throw. **Fix:** Delete the flag
from the signature and the gate. If any caller passes it today, their call will TS-fail — which is
the point. Back-end must also reject plaintext to `conversation_type: :secret` (harden at
`MessageController.create/3`). **Effort:** 2 h + 1 h backend.

### 4. Fix the non-existent Stripe CSP entry

**File:** `apps/web/vercel.json` — `connect-src` lacks `https://api.stripe.com`, `script-src` lacks
`https://js.stripe.com`, `frame-src` lacks `https://hooks.stripe.com https://js.stripe.com`.
**Symptom:** Subscription checkout + billing portal silently fails under strict CSP. Most likely
what the user saw as "errors" on Settings pages that deep-link into billing. **Fix:** Add the three
Stripe sources above. Also add `https://*.stripe.com` to `img-src` for branded logos. **Effort:** 30
min.

### 5. Remove the lingering `FederationRoutes` import (Rule 8a)

**File:** `apps/backend/lib/cgraph_web/router.ex` — `FederationRoutes` + `NotificationProfileRoutes`
noted by the backend audit as "undocumented" modules still imported. **Fix:** If
`cgraph_web/router/federation_routes.ex` exists, delete it and the import. If it doesn't exist and
the import is stale, remove the `import`. Confirm `federation/*` modules are fully gone (they should
be per April-2026 scrap). **Effort:** 1 h.

### 6. Enable antivirus on uploads

**File:** `apps/backend/config/config.exs:75` — `:antivirus_backend` is `:disabled`. **Fix:** Wire
ClamAV (Fly.io sidecar) or an external scan API (Cloudmersive / VirusTotal). Scan on pre-signed-URL
issuance rather than after upload so malware never lands in the bucket. Hard-fail the upload if the
scan queue is down. **Effort:** 1 day.

### 7. Wire `prefers-reduced-motion` through the theme store

**File:** `apps/web/src/stores/theme/types.ts` — no `reduceMotion` field.
`apps/web/src/stores/theme/actions.ts` doesn't read
`matchMedia('(prefers-reduced-motion: reduce)')`. **Fix:** Add `reduceMotion: boolean` to
`ThemeState`, populate from `window.matchMedia` on init, expose a selector, and gate Framer-Motion
transitions on it in the shared `tweens`/`springs` presets
(`apps/web/src/lib/animation-presets.ts`). Matches Telegram-iOS `PresentationData.swift:92`.
**Effort:** 4 h.

### 8. Fix the `ErrorBoundary` to use the logger abstraction

**File:** `apps/web/src/components/error-boundary.tsx:42` — uses `console.error`. **Fix:** Replace
with `logger.error('ErrorBoundary caught', { error, errorInfo })`. This is a one-line fix and will
stop leaking stack traces through ad-blockers. **Effort:** 5 min.

---

## P1 — Architecture & UX (Waves 2–3, ≤ 2 weeks)

### 9. Virtualize the conversation list

**File:** `apps/web/src/modules/chat/components/conversation-list/conversation-list.tsx` — renders
every conversation under one `motion.div`. **Fix:** Swap to `@tanstack/react-virtual` (already a
dep, used for message list). Exact row heights like Signal-Desktop's `ConversationList.dom.tsx`
(normal 76 px, pinned 52 px, header 40 px). Add a separate pinned-section virtualizer + a single
archive row at the bottom. **Effort:** 6 h.

### 10. Implement draft autosave

**Files:** new `apps/web/src/modules/chat/hooks/useDraft.ts`, storage in
`apps/web/src/lib/offline/indexeddb-cache.ts`. **Fix:** 1-second debounced save on `useMessageInput`
text changes, keyed by conversation id. Restore on mount. Clear on successful send. Expose
`draftPreview` + `draftUpdatedAt` to the conversation list item so the list shows "Draft: …".
**Effort:** 1 day.

### 11. Wire message search to MeiliSearch

**File:** `apps/web/src/modules/chat/components/message-search/message-search.tsx:68-90` —
`generateMockResults()`. **Fix:** Call `GET /api/v1/search/messages?q=…&cursor=…`
(`cgraph/search/messages.ex`). Include filters `conversation_id`, `sender_id`, `from`, `to`,
`has_attachment`. Keep localStorage "recent searches" but wire them to the real query. Telegram
parity: grouped results by conversation with jump-to-message. **Effort:** 1 day.

### 12. MobileOnlyFeature guards on E2EE routes

**File:** `apps/web/src/routes/app-routes.tsx` and `routes/route-groups/*.tsx` — E2EE DM / Ghost
Chat / Secret Chat paths are routable on web. **Fix:** Wrap `/messages/:conversationId` in a loader
that fetches conversation metadata, and if `conversation_type === 'secret'` render
`<MobileOnlyFeature feature="Direct Messages" />`. Same for `/ghost-chat/*`. Keep Cloud Chat
(`conversation_type === 'cloud'`) routable on web (ADR-023). **Effort:** 6 h.

### 13. Cap unbounded store arrays

**Files:**

- `apps/web/src/modules/admin/store/adminStore.types.ts` — `moderationQueue`, `users`, `events`
  uncapped.
- `apps/web/src/modules/cosmetics/store/cosmetics-store.ts` — `catalogue`, `inventory` uncapped.
- `apps/web/src/modules/chat/store/chatStore.impl.ts:82` — `conversations: []` uncapped (only
  messages are capped at 500/conv). **Fix:** Add a `MAX_*` constant + LRU or sliding-window for
  each. For conversations specifically, keep an LRU of 1000 with a separate "recent list" so the UI
  never loses what the user is looking at. **Effort:** 1 day.

### 14. Stop unbounded socket maps

**File:** `apps/web/src/lib/socket/conversationChannel.ts:110` —
`gapRepairInFlight: Map<string, Promise<void>>`. **File:**
`apps/web/src/lib/socket/socket-manager.ts` — `lastJoinAttempts: Map<string, number>`. **Fix:**
Prune both on `leaveConversation()` / `channel.onClose`. Cap `lastJoinAttempts` at the last 200
entries with LRU eviction. **Effort:** 3 h.

### 15. Reconnect backoff must have a terminal cap

**File:** `apps/web/src/lib/socket/reconnect-backoff.ts` — unbounded attempts. **Fix:** Match
Signal's ceiling of 64 attempts, then enter "paused" state and surface a `<ReconnectBanner />` with
a manual retry button. Resume on `window.online` or visibility change. **Effort:** 3 h.

### 16. Surface chat-bubble customization

**File:** `apps/web/src/components/theme/theme-customizer/` (bubbles tab) exists but isn't linked
from anywhere. **Fix:** Add `/me/appearance/chat-bubbles` category entry; render the existing
`<BubblesTab />` inside a page wrapper. Also surface the 6 effect presets (glassmorphism / neon /
holographic / aurora / cyberpunk / minimal) in a new `/me/appearance/effects` category. **Effort:**
6 h.

### 17. Settings sidebar polish

**Files:**

- `apps/web/src/pages/settings/settings.tsx:110` — `<GlassSearchInput>` is a decorative stub; wire
  the filter.
- same file, lines 129–165 — buttons need `aria-current="page"` on active.
- `settingsSections` array — add a hidden-but-deep-linkable entry for `/me/settings/app-theme` that
  points at `AppThemeSettings`. **Effort:** 3 h.

### 18. Infinite-fetch bug on `/user/:userId`

**File:** `apps/web/src/pages/profile/user-profile/user-profile.tsx:82-149` — no `AbortController`,
stale setters possible if userId changes mid-fetch. **Fix:** Adopt TanStack Query for the profile
fetch (project already uses it elsewhere), or add an `AbortController` tied to `useEffect` cleanup.
Add a UUID regex guard on `useParams` so `/user/undefined` short-circuits to a 404 component instead
of retry-looping. **Effort:** 4 h.

### 19. Consolidate `forumStore` slice monolith

**Status:** closed for transition-store ownership on 2026-05-28. `useForumListStore`,
`useForumDetailStore`, and `useForumModerationStore` now read from dedicated synchronized Zustand
slice stores rather than direct `useForumStore(...)` selectors. The canonical full store remains as
the compatibility/action source for legacy forum consumers.

**Files:**
`apps/web/src/modules/forums/store/forumStore.{core,features,userGroups,moderation,admin,permissions,forumCrud,utils}.ts`
— 8 files, ~3,500 LOC, one store. **Fix:** Split into three independent stores —
`useForumListStore`, `useForumDetailStore`, `useForumModerationStore`. Moderation already has its
own module; that rejoin is cheap. Detail vs list separation breaks the tight coupling between
"threads" and "boards". **Effort:** 2–3 days. Keep behind a feature flag; roll out per page.

---

## P2 — Feature parity & correctness (Waves 4–5, ≤ 1 month)

### 20. Broadcasts (one-way channels) publisher + subscriber UI

**Status:** partially implemented and browser-verified. `modules/broadcast/store/broadcastStore.ts`
exists, `/broadcasts` lists and creates Broadcasts, and `/broadcasts/:broadcastId` reads posts,
subscribes, and publishes owner posts. Browser proof: `apps/web/e2e/broadcasts.spec.ts`. **Refs:**
Telegram-iOS `ChannelInfoUI`, Telegram-Android broadcast flow. **Still build:**

- post edit/delete/pin management
- invite/public link management
- admin-rights configuration
- linked comments/discussion behavior
- scheduled publish, media, polls, and analytics **Remaining effort:** 3–5 days depending on backend
  coverage.

### 21. Paid DM (real implementation, not stub)

**File:** `apps/web/src/modules/paid-dm/pages/paid-dm-settings-page.tsx` — placeholder text.
**Build:** Creator sets a node price per incoming DM. Sender sees the gate in `ChatComposer`; paying
routes the message through the normal Cloud Chat pipe. Refund on ignore. Tie into `nodes` wallet +
`pulse` for reputation weighting. **Effort:** 4 days.

### 22. Subscription proration + dunning + renewal reminders

**File:** `apps/web/src/modules/premium/types/index.ts` — no `prorationAmount`, no dunning modal.
**Build:**

- Downgrade preview via Stripe preview-invoice.
- `past_due` status → `<DunningModal />` with one-click retry linking to Stripe billing portal.
- Oban worker `RenewalReminderWorker` firing emails at -30d / -7d / -1d. **Effort:** 2 days web + 2
  days backend.

### 23. Follow vs Friend distinction

**File:** `apps/web/src/modules/social/store/friendStore.impl.ts` — only friend/block/remove.
**Build:** Add `follow`/`unfollow` as a non-reciprocal relation (uni-directional). Surface a
"Following" tab next to "Friends" in the Social hub. Backend needs a `follows` table with
`(follower_id, followee_id)` PK and index on followee_id for the counts. **Effort:** 3 days.

### 24. Pulse score / reputation surfaces

**Files:** `apps/web/src/modules/pulse/` has only `pulse-dots.tsx` and `pulse-reactions.tsx`.
**Build:**

- `modules/pulse/store/pulseStore.ts` — fetch score per user, history, leaderboard.
- `pages/pulse/pulse-leaderboard.tsx` — cursor-paginated global + scoped-to-forum.
- `<PulseBadge />` mounted on profile cards + message author rows.
- Backend: `/api/v1/pulse/*` (already wired per `reputation_controller.ex` — which is also #26
  below). **Effort:** 3 days.

### 25. Reply / quote rendering + forwarded-from badge

**File:** `apps/web/src/modules/chat/components/message-bubble/index.tsx` — `replyTo` is typed but
never hydrated; `forwardedFromUserName` field ignored. **Fix:** Add `<ReplyPreview />` above each
replying message showing 2 lines of the quoted content + a link that scrolls to the target. Add
`<ForwardedBadge />` above the body when `forwardedFromUserId` is set. Add reply via swipe gesture
on touch devices. **Effort:** 2 days.

### 26. Replace pure-offset pagination on reputation

**File:** `apps/backend/lib/cgraph_web/controllers/api/v1/reputation_controller.ex:84` —
`limit: limit, offset: offset`. **Fix:** Migrate to
`CGraph.Pagination.cursor_paginate(query, cursor_fields: [:inserted_at, :id])`. Web caller already
expects `meta.cursor`. **Effort:** 3 h.

### 27. Per-account daily message envelope limit (anti-spam)

**Files:** `apps/backend/lib/cgraph_web/controllers/api/v1/message_controller.ex` + new
`lib/cgraph/messaging/envelope_limiter.ex`. **Ref:** Signal-Server `limits/` uses leaky-bucket +
per-account envelope ceiling. **Build:** Counter in Redis keyed by
`msg_envelope:{user_id}:{YYYYMMDD}` incremented on every send. Default limits: free 2 000/day,
premium 20 000/day, enterprise unlimited. Reject with
`{ error: { code: "envelope_exceeded", message, details: { reset_at } } }`. **Effort:** 1 day.

### 28. Oban dead-letter queue

**File:** `apps/backend/config/config.exs` Oban section — no DLQ. **Fix:** Add a `:dead_letter`
queue + `Oban.Plugins.Lifeline`-style post-exhaustion hook that copies the job payload + failure
reason into a `dead_letter_jobs` table for manual review. Admin dashboard: `/admin/jobs` page.
**Effort:** 1 day.

### 29. Upload chunking + progress

**File:** `apps/web/src/modules/chat/hooks/useMessageInput.ts:98-109` — single `FormData` POST, no
progress. **Build:** Switch to S3 multipart upload via pre-signed part URLs. 5 MB parts, parallel
3-at-a-time, per-file progress bar. Retry individual part on network blip with exponential backoff.
Backend already issues pre-signed URLs; just add `POST /uploads/start` → parts →
`POST /uploads/complete`. **Effort:** 3 days.

### 30. Slow-mode enforcement

**File:** `apps/backend/lib/cgraph/groups/channels.ex` — `slow_mode_seconds` stored but not
enforced. **Fix:** Check last send timestamp in `MessageService.send_to_channel/2`; reject with
`{ error: { code: "slow_mode_active", details: { retry_at } } }`. Web shows a countdown pill in
`<ChatComposer />` ("Send in 27s"). **Effort:** 6 h.

### 31. Ring cancellation dedup + max-ring-size cap for group calls

**Files:** `apps/backend/lib/cgraph/calls/ring.ex` (new) +
`apps/web/src/lib/socket/incomingCallChannel.ts`. **Ref:** Signal-Android `IdleActionProcessor.java`
— `isRingCancelled(ringId)` + `RemoteConfig.maxGroupCallRingSize()`. **Fix:** Server tracks ring
state; duplicate deliveries are no-ops. Cap group ring fan-out at 50 members (configurable feature
flag), rest get a push notification only. **Effort:** 1 day.

### 32. Service Worker for background message sync

**Files:** new `apps/web/public/sw.ts` + registration in `main.tsx`. **Build:** Register SW with
Background Sync API. When the user sends a message offline it's queued in IndexedDB; the SW syncs
when the browser regains network even if the tab is closed. Include the existing `sync-service.ts`
logic inside the SW. **Effort:** 2 days.

---

## P3 — Continuous hardening

### 33. ESLint ratchet to zero warnings

**File:** `apps/web/package.json:12` — `--max-warnings 37`. **Fix:** Fix the 37, then cap at 0. Add
a CI step that fails if the count regresses. **Effort:** 2 days.

### 34. Pre-existing test failures in `settingsHooks.test.ts`

Five tests already failing on `main`, unrelated to recent work (confirmed by stash-and-test).
Route-context mocks stale after React-Router 7 upgrade. **Fix:** Add `MemoryRouter` wrapper to the
`renderHook` helper. **Effort:** 2 h.

**2026-05-16 status:** Closed by mocking the username-change `http` client directly in
`apps/web/src/modules/settings/hooks/__tests__/settingsHooks.test.ts`. The focused Vitest run now
passes 32/32 without leaking real username availability requests; no router wrapper was required for
the current hook surface.

### 35. Votes table index audit

**File:** `apps/backend/priv/repo/migrations/*` — no confirmed index on
`(votable_type, votable_id, user_id)` or `(votable_id, user_id)`. **Fix:** Add both indexes (unique
on the first, plain on the second) in a new migration. **Effort:** 2 h.

### 36. CSP violation logging

Add a CSP report-only header to Vercel config pointing at `/api/v1/csp/report` that logs to Sentry.
This catches regressions like the Stripe gap in P0-4 before users hit them. **Effort:** 3 h.

### 37. Lighthouse CI baseline

`apps/web/.lighthouserc.json` with LCP < 2.5 s, CLS < 0.1, TBT < 300 ms. Fail PRs that regress.
**Effort:** 4 h.

### 38. API contract validation in CI

Spot-checking found no type-diff gate between Ecto schemas (`apps/backend/lib/cgraph/*`) and Zod
schemas (`packages/api-client/`). Add a CI job that generates a JSON-schema from each side and diffs
them. **Effort:** 1 day.

### 39. `pg_stat_statements` for slow-query visibility

No migration currently enables the extension. Enable it, surface top slow queries in Grafana.
**Effort:** 2 h.

### 40. `App.test.tsx` hang audit

CLAUDE.md documents it as `describe.skip`; confirm it actually is. If not, skip with a comment
referencing the barrel-import hang. **Effort:** 5 min.

### 41. Cache invalidation on schema migrations

**File:** `apps/backend/lib/cgraph/release.ex` — after `Ecto.Migrator.run`, call
`Cachex.clear(:default)` + `Cache.Distributed.flush_namespace(:schemas)`. Prevents stale-shape bugs
post-deploy. **Effort:** 3 h.

### 42. Settings IA parity with Telegram

**Ref:** Telegram-iOS `SettingsUI/` — CGraph is missing _Data & Storage_ (cache clearing,
bandwidth), _Advanced_ (experimental flags exposed to the user, not just admin), _Stickers & Emoji_,
and _Calls_ (quality, echo cancellation). **Effort:** ~2 days per section, 8 days total. Sequence by
user demand.

---

## Settings "errors" root-cause

The user reported "none of this works they give errors when I try open this pages" on the Settings
sidebar. The audit confirmed:

- **Every panel renders in isolation** (41/41 settings-panel tests green).
- **Every deep-link resolves** to a real component (audit's URL table: no broken URLs).
- **Tests don't catch runtime data crashes.** The three live candidates for the prod-only error are:
  1. **Stripe CSP gap** (P0-4) — the billing-settings panel or account panel may try to load
     `js.stripe.com`, get blocked, throw inside a React render.
  2. **Stale Sentry sessions** against the old CSP — surfaces as "Report only" failures in console.
  3. **Network 500s** from an API endpoint that's supposed to hydrate panel data. Without the prod
     DevTools trace this is speculative, but #27 (envelope limiter) and #41 (cache post-migration)
     both suggest API-shape drift is a systemic risk.

Recommendation: ship P0-4 (Stripe CSP) immediately, add CSP report-only logging (P3-36), then ask
the user to capture one specific Network-tab screenshot the next time a Settings page throws.

---

## Build sequence

This build sequence supersedes the older numeric backlog order. Do not claim a full public release
until Wave 8 is green.

### Wave 1 — Messaging contract and route convergence (week 1)

Unify the attachment/send contract across DMs and groups, eliminate the remaining bare
`/groups/:groupId` producers, and decide the canonical routed cloud-DM and groups surfaces.

### Wave 2 — Routed DM parity (weeks 2–3)

Ship the remaining deeper peer media-negotiation proof on the live DM route. File/photo, voice-note,
GIF/sticker send, DM call-entry launch, call-history callback, incoming-call accept/end-state,
reply, search jump, guarded latest-jump scroll behavior, typing start/stop emit,
edit/delete/forward, request actions, pin, loaded pinned-panel behavior, read-receipt rendering,
core conversation-list participant actions, and per-chat Space move controls are already covered by
focused tests and browser proof.

### Wave 3 — Routed group parity and admin surfaces (weeks 3–4)

Bring remaining group admin permission edges, stronger group scroll behavior, deeper role
CRUD/reorder proof, older-history search, and channel-level notification semantics onto the
canonical groups shell. The routed settings overview, invite creation, member role assignment,
role-tab render, channel creation, group GIF/sticker/voice send, and group message action happy
paths are already browser-verified by the owner UAT.

### Wave 4 — Auth, onboarding, and account lifecycle (week 5)

Browser-verify login/register/forgot/reset/verify-email/gated-QR/phone, keep the resolved
`device_attestation` guard green on web, and lock down onboarding plus delete-account semantics.

### Wave 5 — Social destinations and identity convergence (weeks 6–7)

Replace the Social Hub placeholder, fix notification/discover deep links, and ship the canonical
identity adapter plus authoritative profile-card hydration.

### Wave 6 — Settings, privacy, and customization convergence (weeks 7–8)

Make settings first paint authoritative, collapse store ownership, expand round-trip coverage, and
implement the chosen privacy model.

### Wave 7 — Nodes/calls honesty and remaining route-owned correctness (week 9)

Throw on Nodes failures, align API schemas, remove demo call-history fallback, and re-verify the
secondary profile, friend, and route-owned actions affected by the earlier identity/settings work.

### Wave 8 — Release validation and stabilization (weeks 10–11)

Run strict browser UAT across all release-critical routes, verify reload/cross-tab/cross-device
persistence, keep lint/type/test gates green, and clear every dead button, placeholder pane, and
false-success path.

### Wave 9 — Post-release feature completion (after Wave 8)

Theme picker, draft persistence, broader routed search, feature-complete broadcasts, Paid DM
follow-through, pulse/follow/creator gaps, and expanded Telegram-style settings IA live here. They
matter for competitiveness, but they should not delay the release-critical work above.

### Wave 10a — Scale prerequisites (ship when Wave 8 is green)

Items 43–46. These are free-tier or net-saving infra changes that improve headroom without taking on
premature recurring cost.

### Wave 10b — Scale on demand (deferred, trigger-driven)

Items 47–49. Search engine swap, multi-region, and sharding stay trigger-gated. Work begins when the
metric trips, not on a calendar.

---

## P4 — Scale prerequisites (Wave 7a, ≤ 5 weeks)

Each item is **net-zero or net-negative on monthly cost** (free SDKs, free-tier APIs, or cheaper
egress). Ship in any order — they're independent.

### 43. Web push notifications

**New files:** `apps/web/public/sw.ts` (service worker), `apps/web/src/lib/push/subscription.ts`,
`apps/web/src/lib/push/permission.ts`. **Backend:** new adapter at
`apps/backend/lib/cgraph/notifications/web_push_dispatcher.ex` plus
`POST /api/v1/me/push-subscriptions` endpoint. **Storage:** new `web_push_subscriptions` table with
`(user_id, endpoint, p256dh, auth, user_agent, last_seen_at)`. **Build:**

- Generate VAPID keypair once (`web-push generate-vapid-keys`); public key in client config, private
  key in Fly secret.
- Service worker registers in `main.tsx`; on first message-receive permission prompt, call
  `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublic })`.
- POST the subscription to the new endpoint. Server stores it keyed by user.
- Reuse the existing `SendPushNotification` Oban worker — add a `:web` branch that sends through
  `web-push` Hex package alongside the existing `:apns` and `:fcm` branches.
- Update push preferences UI to expose a per-device "Web push" toggle.

**Cost:** $0 (Web Push uses your own server; no third-party fees). **Effort:** 1 week. **Triggers:**
any time after Wave 5.

### 44. Media CDN pipeline (Cloudflare R2 + image transform)

**Replaces:** current uploads through the Fly machine. **New files:**
`apps/backend/lib/cgraph/uploads/r2_storage.ex` (S3-compatible adapter via `ex_aws`), config shim in
`apps/backend/config/runtime.exs`, client-side change in
`apps/web/src/modules/chat/hooks/useMessageInput.ts` to consume pre-signed multipart URLs.
**Build:**

- Provision one R2 bucket (`cgraph-media-prod`) with public-read on uploads + signed-URL on
  attachments. Domain `media.cgraph.org` mapped to R2 via Cloudflare.
- Backend issues pre-signed multipart upload URLs through `r2_storage.ex`; client uploads chunks
  directly to R2 (no Fly bandwidth). Plan item P2-29 (chunked uploads) lands here naturally.
- Cloudflare Images for on-the-fly resize (`/cdn-cgi/image/width=400/...`) instead of the current
  in-process thumbnailer. The thumbnailer can be deleted once parity is confirmed.
- Antivirus scan from item P0-6 runs on the pre-signed-URL issuance step, before R2 sees the byte
  stream — keeps the bucket clean.

**Cost:** R2 has zero egress. Net **savings** vs current Fly-served bandwidth at any non-trivial
volume. **Effort:** 1–2 weeks. **Triggers:** any time after Wave 5; pair with item P2-29.

### 45. Load-test matrix (k6)

**New directory:** `scripts/load-tests/` with one k6 script per critical surface — auth,
conversation list fetch, message send (cloud), message search, group join, broadcast publish.
**CI:** new `.github/workflows/load-test.yml` (manual dispatch only) targeting staging. **Build:**

- Each script ramps to 10× expected peak (default 1 000 VU / 10 000 msg-min) and asserts
  `http_req_duration{p95} < 500ms` for reads, `< 1500ms` for writes.
- Failure criteria fail the workflow and post an annotated summary back to the PR.
- Baseline run after deploy of Wave 5 establishes the headroom; subsequent runs guard against
  regressions.

**Cost:** $0 — k6 has no licensing cost, and the workflow runs on GitHub-hosted runners. **Effort:** 1 week.
**Triggers:** before any growth campaign or beta expansion; quarterly otherwise.

### 46. ML moderation hook (free-tier)

**New file:** `apps/backend/lib/cgraph/moderation/toxicity_classifier.ex` with an interchangeable
adapter behaviour: `:perspective` (Google) and `:openai_moderation` (OpenAI). **Wired into:**
`MessageService.send/2` (Cloud DMs / groups), `PostService.create/2` (forums),
`BroadcastService.publish/2`. **Build:**

- Synchronous classification returning `{:ok, :allow}` / `{:ok, :review}` / `{:ok, :block}` based on
  score thresholds. `:review` items go to the existing moderation queue (ADR-022 keeps server
  read-access for Cloud + forums + broadcasts; the model never sees Secret Chat).
- Default thresholds match Discord's published Trust & Safety defaults: block > 0.85, review
  0.5–0.85.
- Caches per-message score in `messages.toxicity_score` so dashboards can chart it.

**Cost:** Perspective API free tier is 1 QPS by default (request a higher quota — they grant most
non-commercial uses up to 100 QPS for free). OpenAI moderation endpoint is also free. Zero spend
within free tiers. **Effort:** 1 week. **Triggers:** before opening forums or broadcasts to public
discovery.

---

## P5 — Scale on demand (Wave 7b, deferred — trigger-gated)

Each item below has a **measurable Grafana trigger** and a documented runbook. Until the trigger
fires, no work happens and no spend lands. The numbers below come from each item's natural breaking
point on the current single-region Fly stack.

### 47. Search engine swap (MeiliSearch → OpenSearch)

**Why deferred:** MeiliSearch on the current node is fine through ~10M indexed documents. Past that,
query latency degrades and reindex windows get unsafe. **Trigger:** any of:

- Total indexed messages cross 10M.
- MeiliSearch query p95 over Grafana cross 500ms for 24h consecutive.
- Reindex job duration crosses 30 minutes.

**Migration shape:** new `apps/backend/lib/cgraph/search/opensearch_adapter.ex` behind the existing
`SearchEngine` behaviour — both adapters run side-by-side under a feature flag, dual-writes for one
week, then flip read traffic. Reindex is incremental (Oban worker), not an offline batch. **Cost:**
OpenSearch managed via AWS or Elastic Cloud, ~$25–75/month at trigger volume. **Effort:** 2 weeks
once the trigger fires.

### 48. Multi-region active-active

**Why deferred:** the global p95 latency for a single Fly region is fine until you actually serve
users in other continents. **Trigger:** any of:

- Geographic Grafana shows p95 > 300ms for any region with > 5% of MAU.
- Stated HA SLA target requires region failover (not currently a stated SLA).

**Migration shape:**

- Add `libcluster` with the Fly-provided strategy so the existing Phoenix cluster auto-discovers
  peers across regions.
- Add a regional Postgres read replica per Fly region; writes still hit the primary (read-local /
  write-primary). This requires no schema change.
- Phoenix PubSub already handles cross-node fanout — confirm with k6 in staging before promotion.
- Conflict resolution: only "last-write-wins" needed since Cloud Chat's source of truth is the
  primary. Conversation tier lives on the primary too.

**Cost:** ~$40–80/month per additional region (duplicate app machines + read replica). Only the
regions you actually need. **Effort:** 3–4 weeks once the trigger fires.

### 49. PostgreSQL sharding (Citus)

**Why deferred:** the current Fly Postgres primary handles tens of millions of rows comfortably.
Sharding before the data warrants it locks in operational complexity (cross-shard joins, rebalance
storms, Citus version pinning) for no win. **Trigger:** any of:

- Postgres primary CPU > 70% for 7 consecutive days.
- Largest hot table (`messages`, `posts`, `votes`) crosses 50M rows.
- Write IOPS sustained > 80% of the disk limit.

**Migration shape:**

- Pick `tenant_id` (= group_id for groups, conversation_id for cloud DMs, forum_id for forums) as
  the distribution column on each hot table.
- Run Citus side-by-side with the current primary for the migration window — Oban workers back-fill
  into the distributed cluster, application reads dual-source until cutover.
- The non-sharded "global" tables (users, settings, sessions) stay on the coordinator.

**Cost:** during migration ~2–3× current DB cost (running both); after cutover the new cluster
replaces the old. Citus managed via Azure ~$500/month at trigger volume; self-hosted on Fly is
roughly the same compute cost as today. **Effort:** 3–4 weeks once the trigger fires.

---

## Decision triggers (cheat sheet)

A future operator should be able to read this table and know exactly when to start each Wave-7b item
without re-deriving the analysis. All thresholds are measured in Grafana / Sentry; none are based on
calendar dates.

| Item                    | Trigger metric              | Threshold                  | Cost when triggered   |
| ----------------------- | --------------------------- | -------------------------- | --------------------- |
| OpenSearch swap (#47)   | Indexed message count       | > 10M                      | ~$25–75/mo            |
| OpenSearch swap (#47)   | MeiliSearch query p95       | > 500ms for 24h            | ~$25–75/mo            |
| Multi-region (#48)      | Regional p95 latency        | > 300ms in region > 5% MAU | ~$40–80/mo per region |
| Postgres sharding (#49) | Primary CPU                 | > 70% for 7 days           | ~$500/mo (managed)    |
| Postgres sharding (#49) | Largest hot-table row count | > 50M                      | ~$500/mo (managed)    |
| Postgres sharding (#49) | Sustained write IOPS        | > 80% of disk limit        | ~$500/mo (managed)    |

---

## Success metrics

| Dimension                                                                                                     | Current          | Target (end of Wave 5)         |
| ------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------ |
| P0 bugs                                                                                                       | 8                | 0                              |
| ESLint warnings                                                                                               | 37               | 0                              |
| Web-DM leak paths                                                                                             | 2                | 0                              |
| Orphaned UI (theme picker, chat bubbles, effects, sessions deep-link)                                         | 4                | 0                              |
| Unbounded in-memory arrays in stores                                                                          | ≥ 5              | 0                              |
| Offset-pagination remaining in backend                                                                        | 1 pure + 4 admin | 0 pure                         |
| Missing features vs Signal+Telegram core (drafts, search, broadcasts, paid DM, follow, pulse, replies-render) | 7                | 0                              |
| Oban jobs discarded after 3 retries                                                                           | all              | 0 (all go to DLQ)              |
| WCAG 2.1 motion pass                                                                                          | fail             | pass                           |
| Antivirus on uploads                                                                                          | disabled         | enforced pre-upload            |
| CSP Stripe regression                                                                                         | present          | fixed + report-only monitoring |
| Lighthouse LCP                                                                                                | unmeasured       | < 2.5 s on prod                |

### Wave 7a targets (scale prerequisites)

| Dimension                             | Current  | Target (end of Wave 7a)                    |
| ------------------------------------- | -------- | ------------------------------------------ |
| Web push opt-in path                  | none     | functional, opt-in toggle in prefs         |
| Media served through Fly bandwidth    | 100%     | 0% (everything via R2 + CDN)               |
| k6 load-test coverage of hot paths    | none     | auth, send, search, list, broadcast        |
| ML moderation classification          | none     | applied to Cloud DMs / forums / broadcasts |
| Recurring monthly infra cost vs today | baseline | ≤ baseline (R2 saves more than push costs) |

### Wave 7b targets (scale on demand, trigger-gated)

| Dimension                                | Current trigger state | Target                                     |
| ---------------------------------------- | --------------------- | ------------------------------------------ |
| Documented runbook for OpenSearch swap   | none                  | one-page runbook merged                    |
| Documented runbook for multi-region      | none                  | one-page runbook merged                    |
| Documented runbook for Postgres sharding | none                  | one-page runbook merged                    |
| Grafana alerts wired for each trigger    | 0/6                   | 6/6 (no migration starts without an alert) |

---

## Reference sources consulted

- Signal-Desktop: `ConversationList.dom.tsx`, `conversation/Timeline.dom.tsx`,
  `state/ducks/conversations.preload.ts`
- Signal-Android: `conversationlist/ConversationListDataSource.java`,
  `service/webrtc/IdleActionProcessor.java`
- Signal-Server: `limits/` (rate-limit patterns — read path only, not exhaustively)
- Telegram-iOS: `SettingsUI/Sources/ThemePickerController.swift`,
  `TelegramPresentationData/Sources/PresentationData.swift`

Every numbered item above has a concrete file path, an effort estimate, and is scoped to produce a
working, testable slice.
