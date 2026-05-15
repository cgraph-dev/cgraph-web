# Web Ultimate Strict Pass (April 2026)

This file consolidates the earlier duplicated strict-pass notes into one route-owned audit for the
live web app.

Rules used for this pass:

- Shared component existence does not count by itself.
- A backend route existing does not count by itself.
- A surface is only "Ready" when the live routed web page can load it, mutate it, render it, survive
  reload, and avoid false-success UI.
- "Connected" means a live route, hook, or controller exists. It does not mean the experience is
  trustworthy yet.
- No implementation task closes on source inspection alone. Before closing work, verify the live
  behavior on the mounted routed web surface, or run the narrowest equivalent executable check when
  direct browser verification is unavailable.

## Verdict

The web app is still not start-ready for the requested scope.

It is not fully disconnected. Several important systems are real and wired:

- the live settings API is real under `/api/v1/settings`
- `settings_synced` socket events are real
- the Nodes backend is real under `/api/v1/nodes`
- wallet and shop routes are real through `/me/wallet` and `/me/wallet/shop`
- tip, gift, and unlock entry points exist in the live web app

The problem is that route-owned web behavior still drifts from the actual contracts:

- cloud DMs still use a thin page-local chat surface
- profile-card identity is now backend-hydrated for `userId` callers, but final profile/cosmetic
  live-update browser proof is still open
- settings hydration is incomplete and some preference surfaces still need final round-trip proof
- broader settings reload and live-sync trust still need final route validation
- Nodes false-success handling is now materially fixed in targeted tests, but still needs a browser
  negative-path pass across wallet/shop/tip/gift/unlock/checkout

## What "connected" means right now

Confirmed connected and real:

- `apps/backend/lib/cgraph_web/router/user_routes.ex` mounts the live `/api/v1/settings*` routes
- `apps/backend/lib/cgraph_web/controllers/api/v1/settings_controller.ex` accepts notification,
  privacy, selective privacy, appearance, locale, keyboard, media, stickers, and calls fields and
  broadcasts `settings_synced`
- `apps/web/src/lib/socket/userChannel.ts` listens for `settings_synced`
- `apps/web/src/modules/settings/store/settings-actions.ts` merges synced settings into
  `settingsStore`
- `apps/backend/lib/cgraph_web/router/nodes_routes.ex` mounts wallet, transactions, bundles,
  checkout, tip, gift, and unlock endpoints
- `apps/backend/lib/cgraph_web/controllers/nodes_controller.ex` implements those endpoints
- `apps/web/src/routes/route-groups/me-routes.tsx` mounts the wallet and shop pages
- `apps/web/src/modules/nodes/components/tip-button.tsx`, `tip-modal.tsx`, `gift-modal.tsx`, and
  `content-unlock-overlay.tsx` are wired into live surfaces

Connected but not trustworthy yet:

- settings bootstrap now goes through one preference orchestrator, and section panels are gated
  until the required preference bootstrap settles
- notification settings now round-trip the extended backend fields in controller tests
- selective privacy now has a shared backend/web contract and focused tests, but routed browser
  reload/sync validation remains open
- DND schedule save is wired, but broader routed reload/live-sync trust is still incomplete
- Nodes shop, tip, gift, unlock, and checkout now throw on failed API/schema results in targeted
  tests, but the live browser negative paths still need release validation

## Source-backed structural comparison

This pass re-checked the live web route owners against:

- Signal Desktop conversation ownership in `ts/state/smart/Inbox.preload.tsx`,
  `ts/state/smart/ConversationView.preload.tsx`, and `ts/state/ducks/composer.preload.ts`
- Signal Android registration ownership in
  `app/src/main/java/org/thoughtcrime/securesms/registration/ui/RegistrationActivity.kt` and
  `app/src/main/java/org/thoughtcrime/securesms/registration/ui/RegistrationViewModel.kt`
- Telegram iOS settings and privacy ownership in `SettingsController.swift`,
  `SelectivePrivacySettingsController.swift`, and `PrivacySettings.swift`
- Telegram iOS chat-list action ownership in `ChatContextMenus.swift`
- Telegram Android auth interaction ownership in `LoginActivity.java`
- Discord public message and gateway contracts for attachment upload, message create, and
  event-driven state sync

Those references all converge on the same structural rules:

- one canonical conversation/composer owner for the live surface
- one host-owned registration container with a shared checkpoint state owner
- one canonical settings/privacy owner for the live surface
- one event stream that mutates canonical stores instead of side caches
- one chat-list action surface for pin, mute, unread, archive, and folder moves
- one explicit attachment contract: upload first and send metadata, or send multipart in the exact
  message-endpoint shape the server expects

The live web app still diverges from that in six concrete ways:

1. DMs and groups do not share one authoritative composer and send path. The routed DM page is still
   page-local, while the stronger shared chat surface sits in `apps/web/src/modules/chat/*`.

2. Attachment flow now has one upload-first payload contract for routed DM and group happy paths,
   but composer ownership is still split. Both live routed composers upload to `/api/v1/uploads` and
   build metadata through `packages/shared-types/src/media.ts`, while
   `apps/web/src/modules/chat/hooks/use-media-upload.ts` remains a separate upload/processing owner
   and the app still lacks one canonical composer surface across DMs and groups.

3. Identity field preservation now has a canonical contract, and `UserProfileCard` no longer falls
   back to fake placeholder data for `userId` callers. `packages/shared-types/src/identity.ts`
   defines the runtime-neutral identity projection, and
   `apps/web/src/lib/identity/canonicalIdentity.ts` is now used by auth, profile, friend, chat,
   group, HTTP, socket normalizers, and backend-hydrated profile cards.
   `friend_customization_changed` now updates the friend-store identity patch owner instead of
   staying in a presence-only cache or mutating the store ad hoc. Own-profile `profile_updated`,
   `item_equipped`, and `item_unequipped` socket events now flow through
   `applyOwnProfileUpdate(...)` / `applyOwnItem...(...)` instead of inline auth/customization
   mutations. Routed identity customization now reads ownership/equipped state from backend
   inventory instead of static local unlock flags. Final profile/cosmetic live-update browser proof
   remains open.

4. Settings and privacy ownership is closer to the Telegram model after the 2026-05-15 selective
   privacy slice. `packages/shared-types/src/privacy.ts`,
   `apps/backend/lib/cgraph/accounts/user_settings.ex`, and the web privacy panel now share
   `everyone` / `contacts` / `nobody` rules with always-allow and never-allow user-id exceptions.
   Auth boot and the settings route now share one preference orchestrator for settings, theme, and
   customization bootstrap, and the settings route now gates section panels until that bootstrap is
   ready. The remaining settings risk is broader reload/sync validation.

5. Phone auth still does not complete as one trustworthy route-owned checkpoint flow. Signal keeps
   registration under a host activity plus a shared registration view model, and Telegram keeps
   login and verification checkpoints under one route owner with explicit retry and fallback
   handling. CGraph's `phone-register.tsx` does use one shared store, but when the backend returns
   `next_step = device_attestation`, the live web route renders
   `apps/web/src/modules/auth/components/device-verification.tsx`, which is only a
   `MobileOnlyFeature` placeholder. That means the route can advance into a checkpoint the web app
   cannot actually complete.

6. Conversation-list parity is weaker than both Signal and Telegram. Signal Desktop keeps inbox tab
   ownership inside one canonical inbox owner, and Telegram's chat-list context menu owns pin, mute,
   mark read, archive, and folder actions from the live list itself. CGraph's routed conversation
   list now exposes mark-read and archive actions, but mute, pin, mark-unread, and folder-style
   organization remain missing.

## Database and schema verdict

Most of the requested web failures are not caused by missing tables.

Already present at the persistence layer:

- messages can store file metadata, pins, replies, voice/audio/image/file content types, and Nodes
  price fields
- user settings can store the main notification, privacy, and DND-related values already exposed by
  the web UI
- Nodes wallet, transaction, checkout, tip, gift, and unlock flows already have backend routes and
  persistence

What is actually missing or too weak at the data-model or API-contract layer:

- no new message/settings/nodes tables are required to fix DM media, group uploads, settings
  hydration, or Nodes false-success handling; those are route/controller/normalizer/store issues
- selective privacy now has a shared package/API/backend/web contract, but the routed settings page
  still needs browser reload and live-sync validation before it can be marked release-ready
- the web app now has a canonical identity projection for the audited profile/customization fields;
  final profile/cosmetic browser proof remains open across all visual surfaces

## Requested-scope status matrix

Status meanings:

- `Ready`: route-owned code is connected and trustworthy enough to count
- `Partial`: real code exists, but the routed behavior is incomplete, split, or unsafe
- `Missing`: the routed surface does not provide the feature yet

| Surface                                             | Status  | Strict-pass finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud DM creation/opening                           | Partial | `apps/web/src/pages/messages/messages/messages.tsx` handles `?userId=` and can create/select a cloud conversation, but the opened route still lands in a thin page-local conversation surface.                                                                                                                                                                                                                                                                                                                                                |
| Cloud DM text send                                  | Partial | `apps/web/src/pages/messages/enhanced-conversation/useEnhancedConversation.ts` sends trimmed text through `sendMessage(...)`, but the route still bypasses the richer shared composer/list stack.                                                                                                                                                                                                                                                                                                                                             |
| Cloud DM replies                                    | Ready   | The routed DM page now renders reply preview/cancel state in the composer, sends `reply_to_id` through the message endpoint, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                             |
| Cloud DM stickers                                   | Missing | The routed DM page has no sticker picker or sticker send path. Shared chat code mentions stickers, but no route-owned live sticker flow was verified.                                                                                                                                                                                                                                                                                                                                                                                         |
| Cloud DM pinned messages                            | Ready   | The routed DM page now exposes pin from the message action menu, updates the local message state, shows a pinned badge, and opens a header pinned-message panel with jump-back behavior. Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                        |
| Cloud DM file / photo send                          | Ready   | The routed DM composer now opens a file picker, uploads through `/api/v1/uploads`, sends the shared upload-first metadata contract from `packages/shared-types/src/media.ts` through `sendMessage(...)`, renders file/photo metadata before and after server normalization, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                              |
| Cloud DM voice record / send                        | Partial | The routed DM composer now mounts `VoiceMessageRecorder`, uploads recordings through `/api/v1/voice-messages` with `conversation_id`, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`. The remaining gap is broader media/composer ownership convergence.                                                                                                                                                                                                                                                                 |
| Cloud DM scroll behavior                            | Partial | The route always scrolls to bottom on message-count change. No unread anchor, jump-to-present, or guarded autoscroll behavior was verified.                                                                                                                                                                                                                                                                                                                                                                                                   |
| Cloud DM typing send / indicator                    | Partial | The routed DM page now emits typing from input changes and clears typing on timeout or send, but the full browser path still needs end-to-end verification.                                                                                                                                                                                                                                                                                                                                                                                   |
| Cloud DM search jump-to-message                     | Ready   | `messages.tsx` opens message search and the routed conversation consumes `/messages/:conversationId?scrollTo=:messageId`; the routed jump-to-message path is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`. Guarded autoscroll and unread jump remain tracked under the separate scroll-behavior row.                                                                                                                                                                                                                          |
| Cloud DM read receipts / mark-as-read               | Partial | The routed conversation now calls `markAsRead(conversationId)` after history fetch, but read-receipt rendering and richer read-state controls are still not route-owned.                                                                                                                                                                                                                                                                                                                                                                      |
| Cloud DM edit / delete / forward actions            | Ready   | `EnhancedConversation` now mounts `useMessageActions(...)` through the routed message action menu, with edit, delete, and forward browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                               |
| Cloud DM message requests / block / report          | Ready   | The routed DM page now loads pending request state, mounts `MessageRequestBanner`, and browser-verifies accept, reject/delete, and block-and-report actions in `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                      |
| Conversation list management                        | Partial | `conversation-sidebar.tsx` and `conversation-item.tsx` now expose a routed action menu for mark-read and archive, and `/api/v1/conversations/:conversation_id/archive` is mounted. Mute, pin conversation, mark-unread, archived-list recovery, and per-chat Space move controls are still missing.                                                                                                                                                                                                                                           |
| Vault / Saved Messages                              | Ready   | `/vault` now creates or fetches the authenticated user's backend Note-to-Self conversation through `/api/v1/conversations/note-to-self`, preserves `isNoteToSelf` through backend JSON and web normalization, redirects to `/vault/:conversationId`, and renders the real cloud-message history/composer. Browser-verified by `apps/web/e2e/vault.spec.ts`.                                                                                                                                                                                   |
| Spaces / conversation folders                       | Partial | `/spaces` and `/spaces/:spaceId` now mount a first-class routed Space surface backed by `/api/v1/spaces`, with list/create/filter behavior and sidebar navigation. Browser-verified by `apps/web/e2e/spaces.spec.ts`. The remaining gap is explicit per-chat add/remove management from the live conversation list.                                                                                                                                                                                                                           |
| Direct call launch from DM route                    | Partial | `conversation-header.tsx` now routes voice/video buttons through `getDirectCallRoute(...)` to `/call/:recipientId/:callType`, and `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies that the manual call route mounts controls. Full media negotiation, incoming-call, and call-end behavior still need end-to-end coverage.                                                                                                                                                                                                              |
| Group channel text / reply / reactions / threads    | Partial | `apps/web/src/pages/groups/group-channel/group-channel.tsx` supports real text send, reply, reactions, member list, thread paths, copy-message links, report submission, and route-owned edit/delete message actions. `apps/web/e2e/web-owner-uat.spec.ts` now browser-verifies the text-channel route and plain text send. Reply/reaction/thread browser coverage and permission edge states are still pending.                                                                                                                              |
| Group channel file / photo send                     | Partial | The routed group page now uploads files through `/api/v1/uploads` and sends the same shared upload-first attachment payload through `sendChannelMessage(...)`. Browser verification and richer media parity are still open for group channels.                                                                                                                                                                                                                                                                                                |
| Group channel pinned messages                       | Partial | `pinned-messages-panel.tsx` can fetch and unpin pins, and the routed message menu now creates pins through `/api/v1/groups/:groupId/channels/:channelId/pins`. Browser verification and permission-denied states are still pending.                                                                                                                                                                                                                                                                                                           |
| Group channel voice / stickers / GIFs               | Missing | The routed group input exposes emoji and one file attachment only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Group channel search                                | Partial | The routed group header now opens real loaded-channel message search, jumps between matches, highlights the target message, and consumes `?scrollTo=...` links. It is not yet a backend older-history search.                                                                                                                                                                                                                                                                                                                                 |
| Group channel notification / mute control           | Partial | The routed group header now toggles the current member's group notification level through `PATCH /api/v1/groups/:groupId/members/me/notifications`. It is group-level, not per-channel granular.                                                                                                                                                                                                                                                                                                                                              |
| Group create/open after create or public join       | Partial | `CreateGroupModal`, `ExploreGroups`, the server-list join modal, global Explore community cards, Social discovery, and group notification links now route through canonical channel destinations when group/channel metadata is available. Channel-list controls now split voice, video, announcement, forum, and text channels onto mounted type-specific routes. `apps/web/e2e/web-owner-uat.spec.ts` verifies one canonical group text route and one voice-room route; lower-context producers can still fall back to the bare group path. |
| Group settings screen                               | Partial | `/groups/:groupId/settings` now mounts `GroupSettingsPage`, the live channel sidebar exposes a settings icon, and the settings page has a close action back to the group. Browser verification and permissions-path coverage remain open.                                                                                                                                                                                                                                                                                                     |
| Group invite management screen                      | Partial | The routed settings page now mounts the invites tab backed by the group invite APIs. Browser verification and invite edge states remain open.                                                                                                                                                                                                                                                                                                                                                                                                 |
| Group role management screen                        | Partial | The routed settings page now mounts `RoleManager`, which is wired to role CRUD/reorder logic. Browser verification and permission-denied states remain open.                                                                                                                                                                                                                                                                                                                                                                                  |
| Group member management screen                      | Partial | The routed settings page now mounts the members tab. Richer member-management behavior still needs browser verification and permission coverage.                                                                                                                                                                                                                                                                                                                                                                                              |
| Group create channel screen                         | Partial | The routed settings page now mounts the channels tab and create-channel flow. The live sidebar still only exposes create-category inline.                                                                                                                                                                                                                                                                                                                                                                                                     |
| Phone auth entry from auth pages                    | Partial | The routed phone auth flow is surfaced from both login and register, with `/login/phone` and `/register/phone` mounting the same multi-step screen, but the route still needs browser verification across both entry paths and still exposes a checkpoint the web app cannot finish locally.                                                                                                                                                                                                                                                  |
| Phone OTP auth parity on web                        | Partial | `phone-register.tsx` plus `registration-store.ts` implement phone entry, OTP, registration-lock, profile, and permissions, and `verifyCode()` can authenticate existing users, but `next_step = device_attestation` still resolves to a `MobileOnlyFeature` placeholder instead of a real route-owned checkpoint. The web flow is therefore not yet parity-trustworthy.                                                                                                                                                                       |
| Auth route-set parity coverage                      | Partial | The matrix below now identifies real but still-untrusted login, registration, recovery, QR, onboarding, and phone-auth paths individually. The remaining gap is route-owned browser verification across the entire auth surface.                                                                                                                                                                                                                                                                                                              |
| Email/password login                                | Partial | `useLoginForm.ts` calls `useAuthStore.login(...)`, supports the 2FA handoff through `verifyLoginTwoFactor(...)`, and navigates to `/messages`, but this pass has not yet browser-verified session hydration, 2FA fallback, or post-login gating behavior.                                                                                                                                                                                                                                                                                     |
| Email/password registration                         | Partial | `useRegisterForm.ts` validates credentials, calls `useAuthStore.register(...)`, and navigates to `/messages`, but verify-email and onboarding handoff are still not trusted end-to-end from the routed web surface.                                                                                                                                                                                                                                                                                                                           |
| Forgot-password request                             | Partial | `forgot-password.tsx` submits through `apiClient.auth.forgotPassword(email)` and renders a success state, but this pass has not browser-verified delivery, resend, and error recovery against real mail-provider outcomes.                                                                                                                                                                                                                                                                                                                    |
| Password reset confirm                              | Partial | `reset-password.tsx` validates the reset token against `/api/v1/auth/reset-password/validate` and posts the new password to `/api/v1/auth/reset-password/confirm`, but the flow is not yet trusted against real expired, invalid, and replayed token states in-browser.                                                                                                                                                                                                                                                                       |
| Verify-email token and resend                       | Partial | `useVerifyEmail.ts` posts `/api/v1/auth/verify-email` and can resend via `/api/v1/auth/resend-verification`, but resend only works when `useAuthStore().user.email` is present, so expired-link recovery is not fully route-owned for logged-out users.                                                                                                                                                                                                                                                                                       |
| QR login                                            | Partial | `login/qr-login.tsx` creates `/api/v1/auth/qr-session`, joins `qr_auth:{sessionId}`, stores returned tokens, and redirects to `/messages`, but this pass has not yet verified the paired mobile approval flow or stale-session cleanup end-to-end.                                                                                                                                                                                                                                                                                            |
| Web onboarding completion                           | Partial | `useOnboarding.ts` uploads avatar, updates `/api/v1/me`, saves notification preferences, and posts `/api/v1/me/onboarding/complete`, but `handleSkip()` bypasses completion entirely and the failure path only logs instead of giving the routed user a recovery action.                                                                                                                                                                                                                                                                      |
| Social hub route completeness                       | Partial | `social.tsx` fetches real friends, requests, notifications, and discovery results, and the route now renders a real main pane. The remaining gap is destination correctness and deeper action parity, not a placeholder center pane.                                                                                                                                                                                                                                                                                                          |
| Social notifications list / mark-as-read            | Partial | `social.tsx` fetches `useNotificationStore`, the sidebar and main pane can mark notifications read, and the route no longer stops at a placeholder center pane. The remaining gap is contextual detail/action parity.                                                                                                                                                                                                                                                                                                                         |
| Social notification deep-link navigation            | Partial | `social.tsx` now preserves action destinations through `getNotificationActionUrl(...)`, including conversation/message anchors, forum posts, profile routes, friend requests, and group channel/default-channel metadata. Remaining risk is browser verification plus metadata-less group notifications that still fall back to the group-route redirect.                                                                                                                                                                                     |
| Social discover search                              | Partial | `social.tsx` runs real `useSearchStore.search(query)`, `SearchGroupSchema` accepts backend `default_channel_id`, group results open canonical channel routes when that metadata is present, and unjoined group results now call the real public-group join action. `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies routed discover search result rendering; direct-join and edge-state coverage remain open.                                                                                                                            |
| Social discover result routing                      | Partial | Discover results now use `getDiscoverResultRoute(...)`, so forums prefer slugs, users route to profiles, and groups with `defaultChannelId` route directly to `/groups/:groupId/channels/:channelId`. Joined groups and non-group results remain explicit route-open entries; groups without channel metadata still use the group-root redirect fallback.                                                                                                                                                                                     |
| Account deletion confirmation / cancellation        | Partial | `settings.tsx` mounts `DeleteAccount`, and `delete-account.tsx` now calls the password-confirmed `POST /api/v1/me/delete-account` contract. The remaining gap is that there is still no routed cancel-deletion flow for the grace-period state.                                                                                                                                                                                                                                                                                               |
| Call history trustworthiness                        | Partial | `calls/history` is a real route and it now fails honestly instead of showing demo fallback rows, but the broader browser call path still needs full verification and history-management behavior remains limited.                                                                                                                                                                                                                                                                                                                             |
| Call launch coverage                                | Partial | The manual `/call/:recipientId/:callType` route, routed DM header launch, and call-history callback exist, but the web call flows are not yet fully browser-verified route-owned end-to-end in this pass.                                                                                                                                                                                                                                                                                                                                     |
| Friend request / accept / remove actions            | Partial | Real actions exist in profile flows and friend lists refresh from the user channel. Friend-facing identity cards now hydrate backend profile data, but broader friend action parity and browser proof remain incomplete.                                                                                                                                                                                                                                                                                                                      |
| Mini profile cards                                  | Ready   | `UserProfileCard` now fetches `/api/v1/users/:id` when only `userId` is supplied, maps the payload through canonical identity fields, and is covered by `apps/web/src/modules/social/components/user-profile-card/__tests__/user-profile-card.test.tsx`.                                                                                                                                                                                                                                                                                      |
| Full profile cards                                  | Ready   | The same hydrated `UserProfileCard` path feeds the full popout variant, so callers no longer need to pass a complete user object to avoid placeholder data. Covered by focused user-profile-card tests plus existing full-card tests.                                                                                                                                                                                                                                                                                                         |
| Identity / customization sync across surfaces       | Partial | Canonical identity normalization now preserves richer cosmetic fields, `friend_customization_changed` feeds the identity path, `UserProfileCard` hydrates backend profile data for `userId` callers, and the identity-customization route hydrates ownership/equipped truth from backend inventory. Remaining risk is final reload/live-update browser proof.                                                                                                                                                                                 |
| Settings initial hydration                          | Ready   | `settings.tsx` now boots through `usePreferenceOrchestrator` and blocks section panels until settings/customization/theme bootstrap is fulfilled for the current user, with a retry state for bootstrap failures. Focused orchestrator tests cover the readiness rule.                                                                                                                                                                                                                                                                        |
| Notification settings save and reload persistence   | Ready   | Save actions are real, and `apps/backend/test/cgraph_web/controllers/api/v1/settings_controller_test.exs` now proves `notify_group_invites`, `notify_forum_replies`, `notify_economy`, `notify_system`, `notification_sound`, and `dnd_until` round-trip through the settings response. Final browser reload/live-sync proof remains tracked under global settings validation.                                                                                                                                                                |
| Privacy settings correctness                        | Partial | The 2026-05-15 slice adds `packages/shared-types/src/privacy.ts`, backend `selective_privacy` storage/rendering, API-client schemas, and web controls for message requests, phone visibility, calls, and exception lists. Focused mapper/component/backend tests cover the contract; final routed browser reload and cross-device sync validation remain open.                                                                                                                                                                                |
| Settings cross-device sync                          | Partial | `settings_synced` works for `settingsStore` sections, startup has one preference bootstrap owner for settings/theme/customization, and backend/user-channel `customization_synced` plus `theme_synced` events now apply server-owned patches without autosaving inbound events. Final routed multi-tab/device browser proof remains open.                                                                                                                                                                                                     |
| DND schedule                                        | Ready   | `DndSchedulePanel` now saves quiet-hours settings and timezone through the settings store, and the backend notification JSON includes `dnd_until`. The remaining settings risk is routed reload/live-sync proof, not a DND save stub.                                                                                                                                                                                                                                                                                                         |
| Global settings / theme / customization consistency | Partial | `preferenceOrchestrator` is now the explicit bootstrap owner for settings, theme, and customization, the settings route gates panels until that bootstrap is ready, Calls/Stickers reset saves through the settings API, and customization/theme server patches now have user-channel sync owners. The remaining risk is routed reload/live-sync browser proof.                                                                                                                                                                               |
| Nodes wallet route                                  | Partial | The route and wallet endpoint are real, the Nodes client now throws on failed API/schema results instead of returning `null`, and `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies the wallet route and balance render through `/nodes` -> `/me/wallet`. Remaining risk is browser validation of loading/error/retry states.                                                                                                                                                                                                             |
| Nodes bundle shop                                   | Partial | The shop route is real, bundle JSON now includes `is_active`, and the shared schema accepts the current bundle shape. Remaining risk is browser validation of empty/error states and checkout handoff.                                                                                                                                                                                                                                                                                                                                        |
| Nodes tip flow                                      | Partial | `nodesApi.sendTip(...)` now throws `NodesApiError` on failed results, so mutation success cannot fire from a `null` payload. Remaining risk is browser verification of insufficient-balance and other negative paths.                                                                                                                                                                                                                                                                                                                         |
| Nodes content unlock flow                           | Partial | Unlock now uses the throwing Nodes API path and `content-unlock-overlay` has targeted error handling for insufficient balance. Remaining risk is browser verification of already-unlocked/not-gated/not-found paths.                                                                                                                                                                                                                                                                                                                          |
| Nodes gift flow                                     | Partial | Gift backend success now includes the fields expected by `GiftResultSchema`, and the client throws on failed results. Remaining risk is browser verification of self-gift, rate-limit, and insufficient-balance states.                                                                                                                                                                                                                                                                                                                       |
| Nodes checkout failure handling                     | Partial | Checkout now throws if the API fails or returns no redirect URL, and the hook shows an error toast on mutation failure. Remaining risk is browser verification of Stripe redirect and failure UX.                                                                                                                                                                                                                                                                                                                                             |

## Detailed A-to-Z audit

The detailed user-action audit for inbox, cloud DMs, hubs, channel types, and Broadcast parity now
lives in `docs/WEB-MESSAGING-HUBS-BROADCASTS-AUDIT.md`.

Companion summaries created from that audit plus targeted route revalidation now live in:

- `docs/WEB-SUPPORT-MATRIX.md`
- `docs/WEB-IMPLEMENTATION-INVENTORY.md`

Corrective note: two older strict-pass findings are no longer accurate in current source.

- Primary hub create/join flows now route through `getGroupRoute(...)` instead of dead-ending on
  `/groups/:groupId`.
- The routed DM header now builds `/call/:recipientId/:callType`; call launch is partially wired,
  not absent.

## What is already real and should not be re-audited as missing

These are present in code and should be treated as connected building blocks, not as missing work:

- shared chat message bubble support for replies, forwarded badges, media rendering, titles, avatar
  borders, and pin actions
- shared composer support for attachments, GIF flow, voice recording UI, draft autosave, mentions,
  and reply preview
- settings fetch/save actions and WebSocket-driven settings sync
- the live `/api/v1/settings` controller and the live `/api/v1/nodes` controller
- wallet and shop route wiring under `/me/wallet` and `/me/wallet/shop`
- tip, gift, and unlock entry points on profile and forum surfaces
- profile-page action handlers for send request, accept, decline, cancel, remove, block, and message
- group channel reactions, thread panels, member sidebar, and file upload path
- module-level group admin/settings code for settings, invites, roles, members, and channel creation

The strict-pass issue is not "there is no code". The issue is that live route behavior still does
not line up with the richer shared code or the API contract.

## Reference-backed gaps the current strict pass was still understating

The earlier version of this document correctly identified the biggest route-owned gaps, but it was
still understating four reference-backed parity problems that matter for Goal 2.

### 1. Phone auth still contains a non-completable checkpoint on web

- Signal Android keeps the entire registration flow under `RegistrationActivity` with one shared
  `RegistrationViewModel` checkpoint owner.
- Telegram Android keeps login, code entry, call fallback, and secondary-factor checkpoints under
  `LoginActivity`.
- CGraph's web route does centralize state in `registration-store.ts`, but the `device_attestation`
  step still hands off to a `MobileOnlyFeature` placeholder. That means this route can truthfully be
  called connected, but not parity-ready.

### 2. Conversation list parity is thinner than the doc previously made explicit

- Signal Desktop's inbox owner and Telegram's `ChatContextMenus.swift` both treat the list itself as
  a first-class action surface.
- CGraph's routed conversation list is no longer only a navigational shell: mark-read and archive
  are now live route actions. It still does not expose pin, mute, mark unread, archived-list
  recovery, or folder-style controls at the live route level.
- This is not just a missing convenience menu. It means the inbox surface is still below baseline
  messenger parity even before opening a conversation.

### 3. Privacy parity now has the right contract, but still needs routed validation

- Telegram's `SelectivePrivacySettingsController.swift` owns both the top-level mode (`everybody` /
  `contacts` / `nobody`) and the exception editors (`always allow` / `never allow`).
- CGraph now has the same contract shape in `packages/shared-types/src/privacy.ts`, backend
  `selective_privacy`, API-client schemas, web mappers, and the privacy panel exception inputs.
- The remaining privacy gap is proof quality: browser reload, sync, and edge-state validation need
  to confirm the route behaves like the tested contract.

### 4. Settings parity is weaker than a panel checklist implies

- Telegram's `SettingsController.swift` is a profile-card-first grouped hub that owns the user's
  operational settings entry point.
- CGraph's settings route is a section list and now fetches preferences on entry before section
  panels render. The remaining gap against the Telegram reference is final reload/live-sync proof
  and grouped ownership polish.
- That means the remaining work is not just panel-by-panel bug fixing. It is also route-level
  ownership and presentation parity.

## 1. Direct messages and groups still bypass the strongest shared messaging surface

### Group audit boundary

What this strict pass did verify for groups:

- the live router wiring under `/groups` and `/groups/:groupId/channels/:channelId`
- the routed groups shell in `apps/web/src/pages/groups/groups-page.tsx`
- the page-owned group content owner in `apps/web/src/pages/groups/components/content-area.tsx`
- the current server and channel navigation in `server-list.tsx`, `server-icon.tsx`,
  `channel-list.tsx`, and `channel-item.tsx`
- the routed group channel page in `apps/web/src/pages/groups/group-channel/*`
- the Explore Groups entry flow and its route targets in `explore-groups.tsx`
- the join-by-invite modal entry in `server-list.tsx`

What the supplemental group-admin audit verified:

- `apps/web/src/modules/groups/components/group-settings/group-settings.tsx` is a real admin surface
  backed by store actions for overview save, leave, delete, roles, invites, channels, notifications,
  audit log, automod, and danger-zone tabs
- `apps/web/src/modules/groups/components/invite-modal/useInviteManager.ts` is connected to real
  invite APIs (`getInvites`, `createInvite`, `deleteInvite`)
- `apps/web/src/modules/groups/components/role-manager/role-manager.tsx` is connected to real role
  create, update, delete, and reorder actions
- `apps/web/src/modules/groups/components/channel-list/create-channel-modal.tsx` is connected to the
  real create-channel API
- `/groups/:groupId/settings` now mounts `GroupSettingsPage`, and the live channel sidebar links to
  it with a settings control

What that means in practice:

- the richer group-admin screens are now part of the live routed `/groups` experience
- the live page-owned groups shell in `apps/web/src/pages/groups/*` is a separate implementation
  from the richer module stack in `apps/web/src/modules/groups/components/*`
- the module-level alternate sidebar stack is itself not production-ready yet: `server-sidebar.tsx`
  still renders a mock user bar and a placeholder channel-list region, and `server-header.tsx`
  defines admin menu items without action handlers

So the current groups verdict now covers both:

- the live routed shell/channel experience under `pages/groups/*`
- the connection state of the richer admin/settings screens now mounted under
  `/groups/:groupId/settings`

High-confidence findings:

1. Signal Desktop keeps one conversation and one composer owner per open route. The routed cloud-DM
   page still uses `apps/web/src/pages/messages/enhanced-conversation/*` instead of the richer
   `apps/web/src/modules/chat/*` surface.

2. `apps/web/src/pages/messages/enhanced-conversation/message-input-area.tsx` now has a real
   file/photo picker, upload preview, upload-first send path, attachment rendering, and
   browser-verified voice-note recording/send through `/api/v1/voice-messages`.

3. `apps/web/src/modules/chat/hooks/use-media-upload.ts` exists, but the live DM/group routes now
   use page-local upload helpers instead. The remaining risk is duplicate ownership, not a missing
   attachment bridge on the routed happy path.

4. `apps/web/src/modules/chat/store/chatStore.messaging.ts` only knows how to send uploaded
   `file_url` metadata, not raw `File[]` attachments.

5. `apps/web/src/pages/groups/group-channel/group-channel.tsx` and
   `apps/web/src/pages/messages/enhanced-conversation/useEnhancedConversation.ts` now both upload
   through `/api/v1/uploads` and then send attachment metadata, but the wider DM/group composer
   ownership is still split across routed surfaces and shared modules.

6. Primary hub create/join flows now use `getGroupRoute(...)`, so the older blanket dead-link claim
   is stale. The channel-list route problem is also narrower now: text, voice, video, announcement,
   and forum controls resolve to mounted type-specific destinations. Metadata-less producers can
   still fall back to bare `/groups/:groupId` paths, and the richer module-level shell is still not
   merged into the live route owner.

7. Routed group header search and mute are now real at the page-owner layer: `group-channel.tsx`
   opens loaded-channel message search with jump/highlight handling, consumes `?scrollTo=...` links,
   and toggles group notification level through
   `PATCH /api/v1/groups/:groupId/members/me/notifications`. Remaining risk is browser verification,
   older-message search coverage, and channel-vs-group notification granularity.

8. Group message actions are materially wired: the routed message menu can edit and delete through
   the group socket, create pins through the channel pins endpoint, submit reports, and copy
   `?scrollTo=...` links. Remaining risk is browser verification, permission-denied states, and
   richer media/GIF/voice parity.

9. Group voice, stickers, GIFs, and stronger scroll behavior are still missing on the routed page.

10. The richer module-level group-admin stack is now mounted from the live groups route via
    `/groups/:groupId/settings`. The remaining risk is browser verification, permission edge states,
    and dual-shell cleanup because `ServerSidebar` and `ServerHeader` still contain placeholder or
    UI-only behavior.

## 2. Friends, profile cards, and identity surfaces still need final proof

High-confidence findings:

1. `apps/web/src/pages/social/social/friends-tab.tsx` can still use
   `<UserProfileCard userId={friend.id} />` safely because `UserProfileCard` now hydrates
   authoritative `/api/v1/users/:id` data for `userId` callers.

2. `apps/web/src/modules/social/components/user-profile-card/user-profile-card.tsx` no longer uses
   `DEFAULT_PLACEHOLDER_USER` as the rendered data source for `userId` callers once backend data is
   loaded.

3. `apps/web/src/modules/social/components/user-profile-card/use-profile-card-data.ts` is now the
   route-owned hydration path for backend-backed profile cards that are opened with only a user id.

4. `apps/web/src/modules/auth/store/authStore.utils.ts` and the `AuthState.User` shape now preserve
   the canonical identity fields from `apps/web/src/lib/identity/canonicalIdentity.ts`.

5. `apps/web/src/lib/socket/presenceManager.ts` now consumes `friend_customization_changed` through
   `useFriendStore.getState().applyIdentityPatch(...)`, so friend rows and friend-request users
   update through one store-owned identity patch action.

6. `apps/backend/lib/cgraph_web/controllers/api/v1/message_json.ex` and
   `apps/backend/lib/cgraph_web/controllers/api/v1/conversation_json.ex` now serialize the same
   sender/participant cosmetic identity fields that web normalizers preserve.

7. Own-profile socket events now route through one identity sync owner, but visual consumption is
   still spread across auth, customization, profile-card, chat, and helper paths. Avatar borders,
   badges, titles, and other cosmetics still need final live-update/browser proof across every
   visual surface.

## 3. Settings are connected, but the live web settings experience is still broken in specific ways

### What is confirmed real

- `apps/backend/lib/cgraph_web/router/user_routes.ex` mounts the live `/api/v1/settings` routes.
- `apps/backend/lib/cgraph_web/controllers/api/v1/settings_controller.ex` accepts the extended
  notification, privacy, selective privacy, appearance, locale, keyboard, media, stickers, and calls
  fields and broadcasts `settings_synced`.
- `apps/web/src/lib/socket/userChannel.ts` listens for `settings_synced`.
- `apps/web/src/modules/settings/store/settings-actions.ts` merges the payload through
  `mergeSettingsFromSync(...)`.

### Findings to fix

1. The main settings route now gates section panels on authoritative preference bootstrap.
   `apps/web/src/pages/settings/settings.tsx` calls `bootstrapPreferences(...)`, checks
   `isPreferenceBootstrapReady(...)`, and renders a retryable bootstrap state instead of mounting
   Privacy, Calls, Language, or Stickers against stale cached values.

2. The live settings JSON now returns every audited notification field.
   `apps/backend/test/cgraph_web/controllers/api/v1/settings_controller_test.exs` proves
   `notify_group_invites`, `notify_forum_replies`, `notify_economy`, `notify_system`,
   `notification_sound`, and `dnd_until` survive a notification save and are rendered back through
   the settings response.

3. The privacy model decision is now implemented as the fuller selective model. The backend stores
   `selective_privacy`, renders normalized rules through settings JSON, the API-client schema knows
   the shape, and the web panel preserves `contacts` plus always-allow / never-allow exception lists
   instead of collapsing those controls into booleans. The remaining privacy proof is routed browser
   reload and live sync validation, not a missing data model.

4. The routed DND screen is now wired to quiet-hours settings, and the backend settings response
   includes `dnd_until`. DND itself is no longer the blocker; final routed reload/live-sync proof
   is.

5. Settings, theme, and customization now have explicit bootstrap and code-level live-sync owners.
   `apps/web/src/hooks/facades/useSettingsFacade.ts` delegates loading through
   `preferenceOrchestrator` and reports aggregate loading/saving state across `settingsStore`,
   `customizationStore`, and `themeStore`. Backend customization/theme saves now broadcast
   `customization_synced` and `theme_synced`, and the user channel applies those patches without
   autosaving inbound server events. The remaining gap is routed multi-tab/device browser proof.

6. Calls and Stickers settings no longer have a local-only/server-synced mismatch. The panel
   comments now describe the server-synced settings-store path, and `resetAllPreferences(...)` saves
   default Calls/Stickers values through `/api/v1/settings` with rollback proof in
   `settingsStore.test.ts`.

## 4. Nodes / economy is connected and safer, but still needs browser negative-path validation

### What is confirmed real

- `apps/backend/lib/cgraph_web/router/nodes_routes.ex` mounts wallet, transactions, bundles,
  checkout, tip, gift, and unlock routes.
- `apps/backend/lib/cgraph_web/controllers/nodes_controller.ex` implements those routes.
- `apps/web/src/routes/route-groups/me-routes.tsx` mounts the wallet and shop pages.
- `apps/web/src/routes/app-routes.tsx` redirects `/nodes` and `/nodes/shop` into those routes.
- `apps/web/src/modules/nodes/components/tip-modal.tsx`, `gift-modal.tsx`, and
  `content-unlock-overlay.tsx` are used from profile and forum surfaces.

### Fixed in current source

1. The Nodes service no longer swallows API failures.
   `apps/web/src/modules/nodes/services/nodesApi.ts` unwraps `ApiResult<T>` and throws
   `NodesApiError` on failed wallet, checkout, tip, unlock, and gift calls.

2. React Query mutations no longer resolve success from `null` Nodes payloads. Targeted tests cover
   `nodesApi`, tip modal, gift modal, bundle card, and content unlock overlay behavior.

3. Tip and unlock backend error bodies now use the shared nested error contract through
   `error_response(...)`, so the shared API client can surface clean thrown mutation errors.

4. Gift success payload now includes `id`, `amount`, `recipient_id`, `message`, and `created_at`,
   while still carrying `net_amount` and `platform_cut` as extra backend context.

5. Bundle payload now includes required `is_active`, and the shared schema accepts the current
   `nodes`/`price` shape used by the backend and UI.

6. Checkout failure is no longer silent. `nodesApi.createCheckout(...)` throws on failed results or
   missing redirect URLs, and `useCreateCheckout()` shows a failure toast on mutation error.

### Remaining risk

The Nodes economy should now be treated as connected and materially safer, not as false-success
broken. The remaining release risk is browser validation across wallet/shop loading failures,
insufficient balance, already-unlocked, self-gift, rate-limit, Stripe redirect, and retry UX.

## 5. Older high-priority route gaps still remain relevant

These previously verified issues still matter and still belong in the web fix plan:

- social main pane now renders real summaries, but deeper selected-entity actions are still limited
- group entry-point routing still has bare-route producers that depend on route-owner redirection
- profile-card hydration and preference bootstrap are now source-backed, but broader
  profile/cosmetic reload and live-update browser proof remains open
- upload antivirus still metadata-only
- broad web verification coverage still not strong enough to claim "100% working"

## 6. Auth and onboarding still are not covered enough to claim whole-web readiness

### What is confirmed real

- `apps/web/src/routes/route-groups/auth-routes.tsx` mounts `/login`, `/register`,
  `/forgot-password`, `/reset-password`, `/verify-email`, `/register/phone`, `/login/phone`, and
  `/qr-login`.
- `apps/web/src/pages/auth/phone-register.tsx` is a real multi-step phone flow with phone entry,
  OTP, registration-lock, device attestation, profile, and permissions steps.
- `apps/web/src/modules/auth/store/registration-store.ts` calls real phone auth APIs, including
  request-code, verify-code, call-fallback, profile completion, and final token/user session
  hydration.
- `verifyCode()` in `registration-store.ts` is not new-user-only. If the verified phone belongs to
  an existing user and tokens are returned, the flow can advance straight into authenticated steps.
- `apps/web/src/pages/auth/login.tsx` now exposes a phone-auth entry that routes into the same
  existing phone flow already linked from `apps/web/src/pages/auth/register.tsx`.

### Findings to fix

1. The phone auth screens are not missing, and the live auth surface now exposes them from both
   `apps/web/src/pages/auth/login.tsx` and `apps/web/src/pages/auth/register.tsx`. What still
   remains is strict browser-level verification that both entry points resolve the same
   backend-backed flow without auth-state or copy regressions.

2. The underlying phone flow can authenticate both new and existing users, but the product still
   needs parity verification to prove it behaves like the intended mobile-style phone-first flow in
   every route-owned web entry path.

3. The whole-web pass now scores login, forgot-password, verify-email, QR login, and onboarding
   explicitly in the matrix below, but they still are not browser-verified deeply enough to support
   a "100% working web app" claim.

4. If web is intended to keep its current visual language while adopting mobile phone auth, the task
   is not to replace the current auth styling. The task is to surface the existing phone flow as a
   first-class option inside the current web auth UI and then verify it end-to-end against the same
   backend/mobile contract.

## 7. Auth, social, and account-lifecycle coverage is still incomplete

Compared against the first-launch and day-to-day baseline users expect from a real messaging app,
this strict pass was still undercounting several route-owned actions outside the main DM/group
surfaces:

1. Email auth and recovery are connected, but not yet trustworthy enough to count as complete.
   Login, registration, forgot-password, reset-password, verify-email, and QR login all hit real
   contracts, but they still need one browser-level parity pass before they can support a whole-web
   readiness claim.

2. Onboarding still has ambiguous completion semantics. The final path persists profile and
   notification state, but skip jumps straight to `/messages` without calling
   `/api/v1/me/onboarding/complete`, and route-owned failure recovery is missing.

3. The Social Hub is still incomplete, but it is no longer a placeholder shell. Friends,
   notifications, and discover all fetch real store data and the route renders a real main pane; the
   remaining problems are deeper action parity and group destination certainty.

4. Social notifications now preserve destination data through `getNotificationActionUrl(...)` and
   can open conversations, forum posts, profiles, friend requests, and group channel/default-channel
   destinations. The remaining risk is browser verification plus metadata-less group notifications
   that still fall back to group-root redirection.

5. Social discover routes forums by slug when available, users to profiles, and groups with backend
   `default_channel_id` metadata directly to `/groups/:groupId/channels/:channelId`. Global Explore
   group cards now receive the same backend `default_channel_id` contract and route through the same
   canonical channel helper. Unjoined Social group results now call the real public-group join
   action; the remaining discover risk is browser verification and deeper action parity.

6. Account deletion now uses the right backend contract, but the grace-period lifecycle is still
   incomplete on web. The live delete-account UI calls the password-confirmed
   `/api/v1/me/delete-account` contract, but there is still no routed cancel-deletion flow.

## 8. Standard message-app capability coverage is still incomplete

Compared against the basic day-to-day capability set users expect from Signal/Discord-style web
messaging, this strict pass still undercounted several route-owned actions:

1. Conversation list management is still incomplete. The live message sidebar can search, open, mark
   read, and archive conversations, but mute, pin conversation, mark-unread, archived-list recovery,
   and folder controls are still missing from the routed sidebar surface.

2. Routed DM search is only partially verified. The search modal can navigate to a `scrollTo` query
   param and the opened conversation route now consumes it, but guarded scroll and unread-jump
   behavior still need browser verification.

3. Routed DM message-state controls are still incomplete. Mark-as-read is now called after the route
   fetches history, but read-receipt rendering, edit, delete, forward, and message-request handling
   are still not wired into the routed DM page.

4. Routed DM call launch is only partially proven. A call route exists and the main DM header now
   navigates to it, but the end-to-end web call flow still needs browser verification.

5. Group header controls are materially implemented but not fully release-closed. The routed header
   now has loaded-message search, `scrollTo` jump/highlight behavior, and a real group mute/unmute
   action backed by the member notification endpoint. Browser verification and deeper
   older-message/channel-granular search remain open.

6. Call history is still not trustworthy enough to count as fully real. The page now fails honestly
   on API failure, but broader browser verification and richer history-management behavior are still
   missing.

## Recommended implementation order

This is the authoritative Goal 2 release sequence. It is intentionally not capped to ten blockers.
Do not claim full public-web readiness until phases 1-10 are complete and the final browser pass is
green.

1. Messaging contract convergence
   - Pick one authoritative attachment/send contract for web DMs and groups.
   - Remove the split between page-owned composers and shared send helpers.
   - Make one routed cloud-DM surface canonical.

2. Group route and shell convergence
   - Eliminate the remaining bare `/groups/:groupId` producers, especially outside the primary hub
     create/join flows.
   - Pick one canonical groups shell.
   - Bring real settings, invites, roles, members, create-channel, and channel-type-specific
     surfaces into that shell.

3. Routed DM parity
   - Browser-verify the current typing emit and search-jump behavior, then add read-state,
     edit/delete/forward, and message-request handling.
   - Finish conversation-list actions for mute, pin, mark unread, archived-list recovery, and any
     folder-style organization the product keeps.
   - Bring file/photo/voice/GIF/sticker send, pinned-message UI, guarded autoscroll, and call launch
     onto the routed surface.

4. Routed group parity
   - Browser-verify the real group-header search and notification/mute surfaces.
   - Browser-verify the group message action menu, then bring groups to parity on voice, stickers,
     and GIFs.
   - Ensure every explore/join entry point lands on a mounted routed destination.

5. Identity and profile convergence
   - Create one canonical web identity model for avatars, borders, titles, badges, and display
     names.
   - Fix `UserProfileCard` so `userId` resolves authoritative user data instead of placeholder
     fallback.
   - Route profile and cosmetic socket updates through one owner.

6. Settings, privacy, and customization convergence
   - Make the settings route fetch canonical state before panels render.
   - Collapse settings/theme/customization ownership into one explicit model.
   - Expand `settings_json.ex` so persisted settings round-trip through reload.
   - Browser-verify the implemented selective privacy model, including exception persistence.

7. Nodes and calls honesty
   - Browser-verify wallet/shop/tip/gift/unlock/checkout negative paths after the throwing client
     and schema fixes.
   - Finish call-flow browser verification, including call-history callback and incoming-call state.

8. Auth, onboarding, and account lifecycle
   - Browser-verify email login, registration, forgot-password, reset-password, verify-email, QR,
     and phone entry.
   - Resolve the `device_attestation` dead checkpoint before users can enter it on web.
   - Make onboarding completion, skip, and post-auth gate order deterministic.
   - Keep delete-account on the password-confirmed contract and add routed cancel-deletion support.

9. Social, discovery, and notification destinations
   - Keep extending the real Social Hub main pane beyond summary actions.
   - Browser-verify destination metadata through notification mapping and clicks.
   - Finish group deep links so every click lands on a mounted routed destination.

10. Final release validation
    - Rerun a strict browser pass for auth, DMs, groups, social, settings, Nodes, and calls.
    - Recheck fresh-load settings hydration, reload persistence, cross-tab/cross-device sync,
      insufficient-balance Nodes UX, bundle-shop rendering, and tip/gift/unlock failure paths.
    - Verify phone-auth entry from login and register, existing-user phone sign-in, new-user phone
      registration, registration-lock handling, and call-fallback behavior.

Only after those phases are green should the team resume secondary feature expansion or scale work.

## Goal 2 truthful completion snapshot

This percentage is a release-readiness score, not a raw feature-inventory score.

Scoring rule:

- `0%` = not routed, not browser-verified, or still fundamentally placeholder-level
- `25%` = partially connected but still split, misleading, or dead-end prone
- `50%` = basic happy path exists, but major parity or contract gaps remain
- `75%` = route-owned and nearly shippable, with only minor blocking gaps left
- `100%` = browser-verified and release-ready for the public web app

The current Goal 2 release path has 10 phases. Scored against those phases today:

| Phase                                            | Score | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Messaging contract convergence                   | `65%` | Routed DM and group file/photo sends now use the same shared upload-first metadata contract from `packages/shared-types/src/media.ts`; the DM browser proof is green. Canonical composer ownership, group browser verification, and the unused alternate media-upload owner remain unresolved.                                                                                                                                                                                                                                                                                                                                 |
| Group route and shell convergence                | `55%` | Valid channel routes exist, primary create/join flows use `getGroupRoute(...)`, Social discover/notification group links can use canonical channel metadata, global Explore group cards now consume backend `default_channel_id`, channel-list controls split text, voice, video, announcement, and forum destinations, and `/groups/:groupId/settings` mounts the admin/settings stack. Lower-context bare fallbacks, browser verification, and dual-shell cleanup remain.                                                                                                                                                    |
| Routed DM parity                                 | `65%` | Basic DM open/send, typing emit, search anchors, mark-as-read, browser-verified file/photo and voice-note send, routed reply/search jump/edit/delete/forward/request/pin/pinned-panel behavior, and sidebar mark-read/archive are now wired. Remaining gaps are canonical surface convergence, GIF/sticker parity, read-receipt UI, guarded autoscroll, remaining list actions, call-flow verification, and broader final browser verification.                                                                                                                                                                                |
| Routed group parity                              | `50%` | Group fetch/send works after landing on a valid channel, voice/video channel routes now mount a LiveKit-backed group room view, group settings/admin tabs are mounted, the routed header has real loaded-message search plus backend-backed group mute/unmute, and channel message menus now wire edit/delete/report/pin/copy-link actions. Browser verification, permission edge states, older-message search coverage, and media parity remain incomplete.                                                                                                                                                                   |
| Identity and profile convergence                 | `70%` | A shared identity contract and web canonical identity normalizer now preserve avatar, border, title, badges, nameplate, theme, and display-name style fields across auth/profile/friend/chat/group HTTP and socket paths. Routed identity customization now uses backend-owned inventory/equipped truth, `UserProfileCard` hydrates `userId` callers from the backend, friend cosmetic socket patches route through the friend-store identity patch owner, and own-profile cosmetic socket patches route through one identity sync owner. Remaining risk is cross-surface browser proof and cleanup of split visual consumers. |
| Settings, privacy, and customization convergence | `75%` | The settings route and panels are real, preference bootstrap has one owner, section panels are gated until bootstrap is ready, the runtime-neutral settings/defaults contract now lives in `packages/shared-types/src/settings.ts`, selective privacy has shared types/API/backend/web coverage, Calls/Stickers reset now saves through the settings API, customization/theme server patches now sync over the user channel, and identity customization inventory/equipped state now comes from backend inventory with backend rejection of unowned saves. Broader browser validation remains open.                            |
| Nodes and calls honesty                          | `50%` | Nodes false-success and schema drift are materially fixed in targeted tests, but browser negative-path validation and remaining call-history/call-flow trust work are still open.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Auth, onboarding, and account lifecycle          | `50%` | Email auth and recovery are wired, but browser verification is incomplete, phone auth still has a dead checkpoint, onboarding semantics drift, and cancel-deletion management is still missing on web.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Social, discovery, and notification destinations | `68%` | Data loads into the route, the Social Hub has a real main pane, notifications preserve action destinations, forums route by slug, groups with channel metadata route to mounted channel destinations, and unjoined group results now run a real join action. Browser verification and deeper action parity remain.                                                                                                                                                                                                                                                                                                             |
| Final release validation                         | `0%`  | The final strict browser pass has not been rerun after the release-path fixes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Equal-weight release-readiness score: `43.6%`.

Truthful rounded Goal 2 completion: `41%`.

If someone produces a much higher number, they are almost certainly counting shared code existence
or surface count instead of release-trustworthy, route-owned behavior.

## Execution Checklist By Subsystem

Use this as the concrete implementation checklist for the web recovery pass.

### DMs and Groups

- [x] Standardize routed DM/group file-photo send on upload-first `/api/v1/uploads` plus message
      metadata, instead of raw multipart `file` posts to message endpoints.
- [x] Eliminate the remaining producers of bare `/groups/:groupId` routes where the caller has
      enough context, while keeping primary create/join flows on `getGroupRoute(...)`.
- [x] Split group channel navigation by type so text, voice, video, announcement, and forum channels
      resolve to mounted routed destinations instead of one generic text-channel URL.
- [ ] Pick one canonical groups shell: the current page-owned route stack or the richer module-level
      admin stack. Remove or merge the losing path.
- [ ] Browser-verify routed DM typing start/stop events from the live input path.
- [x] Browser-verify routed DM search-result jumps.
- [ ] Add guarded scroll/unread-jump behavior.
- [x] Call routed DM `markAsRead(conversationId)` after conversation history fetch.
- [ ] Add routed read-receipt rendering and richer read-state controls, or explicitly defer those
      actions for web.
- [x] Add routed edit, delete, and forward actions for DM messages instead of leaving them only in
      shared hooks.
- [x] Surface routed message-request accept, reject, block, and report flows where the backend
      contract already exists.
- [x] Add routed conversation-list mark-read and archive actions.
- [ ] Add routed conversation-list management controls for mute, pin, mark unread, archived-list
      recovery, and any folder-style organization the product keeps, or explicitly remove those
      expectations from the product.
- [ ] Decide whether `apps/web/src/modules/chat/hooks/use-media-upload.ts` should be wired into the
      live DM/group send flow or removed now that routed DMs/groups use upload-first metadata
      helpers.
- [ ] Move the routed cloud-DM page onto the shared `modules/chat` conversation surface, or port the
      full shared composer/list/action/media stack into
      `apps/web/src/pages/messages/enhanced-conversation/*`.
- [x] Wire real file and photo send into the routed DM composer and browser-verify it with
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-14.
- [x] Wire real voice record and send into the routed DM composer and browser-verify it with
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-14.
- [ ] Add routed sticker and GIF send flows instead of relying on shared-code existence.
- [x] Add routed pin action and pinned-message UI for cloud DMs.
- [ ] Replace naive DM autoscroll with guarded autoscroll plus unread/jump-to-present behavior.
- [ ] Browser-verify routed DM voice/video call launch, history-based call entry, and incoming-call
      flow now that the header routes to `/call/:recipientId/:callType`.
- [x] Bring real group-admin screens into the live groups experience: settings, invites, role
      manager, member management, and create-channel.
- [x] Make group-header search real or remove the placeholder search control.
- [x] Wire the routed group notification button to a real mute/notification setting or remove the
      placeholder affordance.
- [ ] If the module-level groups stack is kept, replace `ServerSidebar` placeholder content and add
      real handlers for `ServerHeader` admin actions.
- [ ] Bring groups to parity on voice, stickers, GIFs, and browser-verified message action flows.
- [ ] Decide whether groups stay page-local or also move onto the shared chat surface.
- [ ] Fix Explore and other group entry points so every path resolves to a valid routed channel.

Done when:

- Cloud DMs and groups support the same core send/render/action set the user expects on the live
  routed pages, not only in shared modules.

### Auth and Account Lifecycle

- [ ] Browser-verify routed email login, 2FA, registration, forgot-password, reset-password,
      verify-email, QR login, and phone-auth entry paths instead of leaving them as static
      source-only findings.
- [ ] Decide the real post-auth gate order for verify-email, onboarding, and `/messages`, then make
      login and registration follow that same route-owned rule set.
- [ ] Fix verify-email resend so expired-link recovery still works when the user is logged out.
- [ ] Fix onboarding skip semantics so the route either marks onboarding complete or clearly leaves
      a pending onboarding state the app can resume later.
- [ ] Add route-owned failure recovery for onboarding save errors instead of only logging them.
- [ ] Add a routed cancel-deletion flow against `DELETE /api/v1/me/delete-account`, or remove the
      current UI promise that users can manage the deletion grace-period state from web.

Done when:

- Every auth, recovery, onboarding, and account-deletion route completes against the same backend
  contract it presents to the user.

### Social, Search, and Notifications

- [x] Preserve destination metadata when adapting notification-store entries into the routed social
      notification UI.
- [x] Make notification clicks open the relevant message, forum, or profile route instead of only
      marking the item read.
- [x] Finish discover/group result routing so groups open a mounted group/channel destination
      without relying on bare `/groups/:groupId` redirection.
- [x] Make unjoined Social discover group results call the real public-group join action instead of
      presenting a fake or route-only join control.
- [ ] Decide whether social discover should navigate directly from backend-provided canonical URLs
      instead of rebuilding paths locally from partial result data.
- [ ] Re-verify friend-request send, accept, decline, cancel, and remove flows from both the Social
      Hub and profile pages after identity-card fixes land.

Done when:

- Social, search, and notification actions navigate to real routed destinations and no longer end in
  placeholder panes or dead links.

### Calls

- [x] Remove demo fallback data from call history so API failure never renders fake call records.
- [x] Remove local-only call-history delete affordance from the route.
- [ ] Verify call launch from routed DM entry points, call history callback, and incoming-call flow.

Done when:

- Call routes either launch and render real state or fail honestly, without demo fallback records or
  local-only management actions.

### Identity and Profile Surfaces

- [x] Introduce one canonical web identity model for avatar, avatar border, title, badges, display
      name styling, and related profile cosmetics.
- [x] Stop truncating sender, participant, and auth-user cosmetic fields during normalization and
      hydration.
- [ ] Make sidebar, chat, friends, profile page, and profile cards all read that same identity
      shape.
- [x] Fix `UserProfileCard` so `userId` resolves authoritative user data instead of falling back to
      `DEFAULT_PLACEHOLDER_USER`.
- [ ] Stop splitting own-profile cosmetics vs other-profile cosmetics across different stores and
      helper paths.
- [x] Consume `friend_customization_changed` through the friend-store identity patch owner instead
      of leaving it in `presenceManager` cache or direct ad hoc store mutation.
- [x] Route own-profile profile/cosmetic socket updates into one identity sync owner instead of
      inline parallel auth/customization mutations in `userChannel`.
- [ ] Revalidate avatar border, badges, title, and profile-card consistency after reload and live
      updates.

Done when:

- A profile or cosmetic change made once renders the same way in sidebar, friends, chat, hover
  cards, and full profile without refresh hacks.

### Settings

- [x] Fetch canonical settings at the settings-route level before individual panels render.
- [x] Decide whether selective privacy remains boolean-backed or is upgraded to a Telegram-style
      enum plus exception model, then align UI, API, and persistence around that choice.
- [x] Expand/prove `apps/backend/lib/cgraph_web/controllers/api/v1/settings_json.ex` so all
      persisted notification fields round-trip through reload.
- [x] Fix privacy panel value encoding for message requests, phone visibility, call privacy, and
      vanish defaults.
- [x] Resolve the local-only vs server-synced mismatch in Calls and Stickers settings behavior and
      comments. Calls/Stickers panel comments now describe server sync, and `resetAllPreferences`
      writes default values through `/api/v1/settings` with optimistic rollback coverage.
- [x] Collapse `settingsStore`, `themeStore`, and `customizationStore` toward one canonical user
      preference model or one explicit orchestration owner. `preferenceOrchestrator` is now the
      explicit bootstrap owner, and settings panels wait for bootstrap readiness before rendering;
      backend/user-channel sync owners now apply server-owned customization/theme patches; final
      browser proof remains open.
- [ ] Revalidate cross-tab and cross-device sync after store ownership cleanup.

Done when:

- Opening any settings section first shows real server state, saving survives reload, and another
  tab/device receives the same final values.

### Nodes and Economy

- [x] Change `apps/web/src/modules/nodes/services/nodesApi.ts` to reject or throw on failed
      `ApiResult`s instead of returning `null`.
- [x] Update tip, gift, unlock, and checkout UI flows so success UI only appears after a valid
      success payload.
- [x] Align tip and unlock backend error bodies with the shared API-client nested error shape.
- [x] Align gift success payload with `GiftResultSchema`, or update the shared schema and all
      callers together.
- [x] Align bundle JSON with `BundleSchema`, including required fields like `is_active`.
- [ ] Browser-recheck wallet and shop rendering after schema cleanup.
- [ ] Recheck insufficient-balance, already-unlocked, and other negative paths so they show proper
      user-facing failure states.

Done when:

- Wallet, shop, tip, gift, unlock, and checkout either complete successfully with correct state
  updates or fail loudly and correctly without false-success UI.

### Carry-Over Web Gaps

- [x] Replace the Social Hub placeholder main pane with real selected-entity content.
- [ ] Remove remaining dead-end or placeholder-only navigation targets.
- [x] Move customization inventory/equipped state fully onto authoritative backend-owned data for
      the routed identity-customization surface and backend save contract.
- [ ] Finish upload hardening items that still block a real production claim.
- [ ] Browser-verify the surfaced phone-auth entry points from both login and register while keeping
      the existing web visual style intact.
- [ ] Verify the existing phone flow for both existing-user sign-in and new-user registration,
      including OTP retry, call fallback, registration lock, device attestation, profile completion,
      and permission steps.
- [ ] Audit login, forgot-password, verify-email, QR login, and onboarding with the same route-owned
      criteria used in the rest of this file.
- [ ] Re-run targeted browser verification after each subsystem lands instead of waiting for one big
      end pass.

Done when:

- The web app no longer has major route-owned placeholders or fake-success surfaces in the user
  flows covered by this strict pass.

## Bottom line

The web app is partially connected, not fully disconnected.

That matters because it changes the fix strategy:

- do not rebuild settings or Nodes from scratch
- do not count shared code as shipped just because it exists
- fix the route-owned contract drift first

The main blockers are now clearly identified in one place: thin routed DM surfaces, split identity
ownership, incomplete settings hydration/round-trip behavior, incomplete group/admin parity, and the
remaining browser-validation gaps around Nodes, calls, auth, and social/group destinations.
