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

- cloud DMs still keep a route-local page shell, though the live composer, message list, and
  bubble/action/media rendering now flow through shared `modules/chat` adapters
- profile-card identity is now backend-hydrated for `userId` callers, and the sidebar avatar now
  consumes the same current-user avatar/border while opening the mini profile card on hover.
  Production web commit `8e2374fb63f1e368632960575a8f3a0ffeb3b1aa` adds browser proof for sidebar
  profile theme, avatar border, nameplate, display-name effect, and click-through to the public
  profile, and production web commit `dae3416c16b50ff4d8cfad4fc1e96bebbb0895c1` extends the same
  canonical cosmetic rendering to the full public profile header; broader multi-tab/device profile
  and cosmetic proof remains open
- settings hydration, privacy reload persistence, same-origin live sync, customization sync, and
  app-shell theme sync now have routed browser proof; physical second-device validation and broader
  final regression remain open
- Nodes false-success handling is now materially fixed in targeted tests; routed wallet/shop browser
  proof covers wallet, transaction-history, bundle-load, empty-shop, checkout-failure, and
  user-triggered retry recovery states, and routed DM paid-file unlock proof now covers
  insufficient-balance, already-unlocked, rate-limit, and explicit failure-to-user-retry success
  states. Routed forum content unlock proof now covers insufficient balance, not-gated, not-found,
  explicit failure, and retry-to-success without false-success UI. Stripe handoff success and final
  broad validation remain open.

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
- selective privacy now has a shared backend/web contract plus routed reload/live-sync browser proof
- DND schedule save is wired, with routed reload/live-sync trust covered by the settings preference
  sync proof
- Nodes wallet, shop, tip, gift, unlock, and checkout now throw or render explicit failure states in
  targeted tests, with routed browser proof for wallet/shop and paid-file unlock negative plus
  user-triggered retry paths. Paid-DM backend unlock errors now return coded JSON for validation,
  not-found, duplicate unlock, expiry, and insufficient-balance responses. Routed browser proof now
  covers profile tip/gift and forum content-unlock retry behavior as well. Stripe redirect success
  and broader final release validation still need proof.

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

1. DMs and groups are closer to one authoritative chat surface, but not fully there. The routed DM
   composer, message list, and message bubble/action/media rendering now use shared `modules/chat`
   adapters, while the routed page shell orchestration still lives in
   `apps/web/src/pages/messages/enhanced-conversation/*`.

2. Attachment flow now has one upload-first payload contract for routed DM and group happy paths,
   and the routed DM composer now enters through the shared `MessageInput` adapter. Both live routed
   composers upload to `/api/v1/uploads` and build metadata through
   `packages/shared-types/src/media.ts`. The unused alternate
   `apps/web/src/modules/chat/hooks/use-media-upload.ts` owner was removed on 2026-05-23, so the
   remaining blocker is full conversation-list/page convergence rather than a second DM composer
   contract.

3. Identity field preservation now has a canonical contract, and `UserProfileCard` no longer falls
   back to fake placeholder data for `userId` callers. `packages/shared-types/src/identity.ts`
   defines the runtime-neutral identity projection, and
   `apps/web/src/lib/identity/canonicalIdentity.ts` is now used by auth, profile, friend, chat,
   group, HTTP, socket normalizers, and backend-hydrated profile cards.
   `friend_customization_changed` now updates the selective other-user identity sync owner instead
   of staying in a presence-only cache or mutating one store ad hoc. Own-profile `profile_updated`,
   `item_equipped`, and `item_unequipped` socket events now flow through
   `applyOwnProfileUpdate(...)` / `applyOwnItem...(...)` instead of inline auth/customization
   mutations. Routed identity customization now reads ownership/equipped state from backend
   inventory instead of static local unlock flags. Focused owner UAT now browser-verifies a live
   avatar-border/title patch on the routed DM surface.

4. Settings and privacy ownership is closer to the Telegram model after the 2026-05-15 selective
   privacy slice. `packages/shared-types/src/privacy.ts`,
   `apps/backend/lib/cgraph/accounts/user_settings.ex`, and the web privacy panel now share
   `everyone` / `contacts` / `nobody` rules with always-allow and never-allow user-id exceptions.
   Auth boot and the settings route now share one preference orchestrator for settings, theme, and
   customization bootstrap, and the settings route now gates section panels until that bootstrap is
   ready. Routed settings reload, live sync, and same-origin cross-tab sync are browser-verified;
   the remaining settings risk is physical second-device validation and broader final regression.

5. Phone auth now has route-owned browser verification for routed login entry, existing-user OTP
   completion, new-user profile/permission completion, OTP resend, call fallback, registration-lock
   PIN verification, and native-device-required recovery, and the native-attestation dead checkpoint
   is no longer reachable on web. Signal keeps registration under a host activity plus a shared
   registration view model, and Telegram keeps login and verification checkpoints under one route
   owner with explicit retry and fallback handling. CGraph's `phone-register.tsx` uses one shared
   store, and `registration-store.ts` now treats backend `next_step = device_attestation` as an
   in-place native-device-required error instead of advancing the browser route into a
   `MobileOnlyFeature` placeholder. Remaining phone risk is real provider delivery behavior rather
   than a routed web branch gap.

6. Conversation-list parity is weaker than both Signal and Telegram. Signal Desktop keeps inbox tab
   ownership inside one canonical inbox owner, and Telegram's chat-list context menu owns pin, mute,
   mark read, archive, and folder actions from the live list itself. CGraph's routed conversation
   list now exposes mark-read, mark-unread, pin, mute, archive, archived-list recovery, unarchive,
   and per-chat Space include/exclude controls. The combined live menu path is now browser-verified
   by `apps/web/e2e/dm-media-composer.spec.ts`.

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
- selective privacy now has a shared package/API/backend/web contract, backend controller proof, and
  routed settings reload/live-sync browser proof
- the web app now has a canonical identity projection for the audited profile/customization fields;
  the sidebar/avatar-upload consumer gap is materially closed, while final multi-tab/device
  profile/cosmetic browser proof remains open

## Requested-scope status matrix

Status meanings:

- `Ready`: route-owned code is connected and trustworthy enough to count
- `Partial`: real code exists, but the routed behavior is incomplete, split, or unsafe
- `Missing`: the routed surface does not provide the feature yet

| Surface                                             | Status  | Strict-pass finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud DM creation/opening                           | Partial | `apps/web/src/pages/messages/messages/messages.tsx` handles `?userId=` and can create/select a cloud conversation, but the opened route still keeps a route-local page shell instead of using one shared conversation surface end to end. The live composer, message list, and bubble/action/media stack now flow through shared `modules/chat` adapters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Cloud DM text send                                  | Ready   | The routed DM composer now enters through the shared `modules/chat` `MessageInput` adapter and sends trimmed text through the route-owned Cloud Chat send contract. Browser proof lives in `apps/web/e2e/dm-media-composer.spec.ts`; the remaining convergence gap is page/list ownership, not text send itself.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Cloud DM replies                                    | Ready   | The routed DM page now renders reply preview/cancel state in the composer, sends `reply_to_id` through the message endpoint, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Cloud DM stickers / GIFs                            | Ready   | The routed DM composer now mounts route-owned sticker and GIF pickers, sends `content_type: "sticker"` / `content_type: "gif"` with structured metadata through the conversation message endpoint, renders the sent sticker/GIF in the live routed bubble, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Cloud DM pinned messages                            | Ready   | The routed DM page now exposes pin from the message action menu, updates the local message state, shows a pinned badge, and opens a header pinned-message panel with jump-back behavior. Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Cloud DM file / photo send                          | Ready   | The routed DM composer now opens a file picker, uploads through `/api/v1/uploads`, sends the shared upload-first metadata contract from `packages/shared-types/src/media.ts` through `sendMessage(...)`, renders file/photo metadata before and after server normalization, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Cloud DM voice record / send                        | Ready   | The routed DM composer now reaches `VoiceMessageRecorder` through the shared composer adapter, uploads recordings through `/api/v1/voice-messages` with `conversation_id`, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Cloud DM scroll behavior                            | Ready   | The routed conversation now delegates the rendered list to shared `MessageList`, while the route adapter passes `scrollTo` and manual latest/pinned jump requests by message id. Initial opens still land on latest, `scrollTo` anchors stay in view, users reading older messages get a latest/new-messages jump instead of being dragged to the bottom, and self-sent/bottom-adjacent messages keep the latest view sticky. Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Cloud DM typing send / indicator                    | Ready   | The routed DM page emits typing from input changes, clears typing on timeout/send/leave, and the live input start/stop path is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts` with an E2E-only observer. The incoming indicator still renders from canonical chat-store typing state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Cloud DM search jump-to-message                     | Ready   | `messages.tsx` opens message search and the routed conversation consumes `/messages/:conversationId?scrollTo=:messageId`; the routed jump-to-message path and stable guarded-scroll anchor are browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Cloud DM read receipts / mark-as-read               | Ready   | The routed conversation calls `markAsRead(conversationId)` after history fetch, backend message JSON now preloads read receipts and exposes them as `metadata.readBy`, and the shared `MessageBubble` renders the routed Seen/read-receipt state through the route adapter. Backend controller proof lives in `apps/backend/test/cgraph_web/controllers/api/v1/message_controller_test.exs`; browser proof is in `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Cloud DM edit / delete / forward actions            | Ready   | `EnhancedConversation` now mounts `useMessageActions(...)` through the shared `MessageActionMenu` rendered by the route adapter, with edit, delete, and forward browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Cloud DM message requests / block / report          | Ready   | The routed DM page now loads pending request state, mounts `MessageRequestBanner`, and browser-verifies accept, reject/delete, and block-and-report actions in `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Conversation list management                        | Ready   | `conversation-sidebar.tsx` and `conversation-item.tsx` expose routed actions for mark-read, mark-unread, pin/unpin, mute/unmute, archive, archived-list recovery, unarchive, and per-chat Space include/exclude controls. Backend routes are mounted for participant controls, the Space controls patch `/api/v1/spaces/:id`, focused controller/store/helper tests cover the path, and `apps/web/e2e/dm-media-composer.spec.ts` browser-verifies the combined live menu.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Vault / Saved Messages                              | Ready   | `/vault` now creates or fetches the authenticated user's backend Note-to-Self conversation through `/api/v1/conversations/note-to-self`, preserves `isNoteToSelf` through backend JSON and web normalization, redirects to `/vault/:conversationId`, and renders the real cloud-message history/composer. Browser-verified by `apps/web/e2e/vault.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Spaces / conversation folders                       | Ready   | `/spaces` and `/spaces/:spaceId` mount a first-class routed Space surface backed by `/api/v1/spaces`, with list/create/filter behavior and sidebar navigation. Browser-verified by `apps/web/e2e/spaces.spec.ts`. The live conversation list add/remove path uses the same server-owned include/exclude lists and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Direct call launch from DM route                    | Ready   | `conversation-header.tsx` routes voice/video buttons through `getDirectCallRoute(...)` to `/call/:recipientId/:callType`; `apps/web/e2e/dm-media-composer.spec.ts` browser-verifies live DM-header audio/video launch, and `apps/web/e2e/web-owner-uat.spec.ts` verifies the manual call route mounts controls. Incoming-call accept and end-call navigation are now verified separately; deeper peer media negotiation remains tracked under final call-flow coverage.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Group channel text / reply / reactions / threads    | Ready   | `apps/web/src/pages/groups/group-channel/group-channel.tsx` supports real text send, reply, reactions, member list, thread paths, copy-message links, report submission, and route-owned edit/delete message actions. `apps/web/src/modules/groups/store/channel-message-normalizer.ts` now normalizes main-channel and thread-reply API payloads through the same message boundary. `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies the text-channel route, plain text send, direct reply payload plus rendered reply preview, reaction toggle, thread open/send/render, edit, delete, report, copy-link, and pin-entry actions.                                                                                                                                                                                                                                                                                            |
| Group channel file / photo send                     | Ready   | The routed group page uploads files through `/api/v1/uploads`, sends the full shared upload-first attachment payload including `metadata` through `sendChannelMessage(...)`, renders the returned attachment on the live route, and is browser-verified by `apps/web/e2e/web-owner-uat.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Group channel pinned messages                       | Ready   | `pinned-messages-panel.tsx` fetches pins, renders the pinned message list, and unpins through `/api/v1/groups/:groupId/channels/:channelId/pins/:pinId`. Pin creation, panel fetch, unpin, and loaded-message pinned-state reconciliation are browser-verified by `apps/web/e2e/web-owner-uat.spec.ts`; route-level 403 contracts for pin create, pin list, and unpin are browser-verified by `apps/web/e2e/group-settings-permissions.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Group channel voice / stickers / GIFs               | Ready   | The routed group composer now exposes sticker and GIF pickers plus `VoiceMessageRecorder`, sends structured `sticker` / `gif` metadata through the group channel message endpoint, uploads channel voice notes through `/api/v1/voice-messages`, and renders the returned sticker/GIF/audio payloads on the live route. Browser proof lives in `apps/web/e2e/web-owner-uat.spec.ts`; backend payload proof lives in `apps/backend/test/cgraph_web/controllers/api/v1/channel_message_controller_test.exs`.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Group channel search                                | Ready   | The routed group header now opens real message search, searches loaded messages immediately, asks the channel message endpoint for server-side older-history matches through `search` / `q`, hydrates an unloaded match into the visible route when selected, highlights the target message, and consumes `?scrollTo=...` links. Backend proof lives in `apps/backend/test/cgraph_web/controllers/api/v1/channel_message_controller_test.exs`; browser proof lives in `apps/web/e2e/web-owner-uat.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Group channel notification / mute control           | Ready   | The routed group header now loads and saves the current channel's notification preference through `/api/v1/notification-preferences/channel/:channelId`, mapping the backend `mentions_only` / `none` modes onto the header bell state. `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies channel mute and unmute requests while group-level notification settings remain owned by the routed settings Notifications tab.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Group create/open after create or public join       | Ready   | `CreateGroupModal`, `ExploreGroups`, the server-list join modal, global Explore community cards, Social discovery, and group notification links route through canonical channel destinations when group/channel metadata is available. Channel-list controls split voice, video, announcement, forum, and text channels onto mounted type-specific routes. `apps/web/e2e/web-owner-uat.spec.ts` verifies one canonical group text route and one voice-room route, and `apps/web/e2e/group-entry-routes.spec.ts` verifies that a metadata-less bare `/groups/:groupId` entry redirects to the mounted default channel route after group data loads.                                                                                                                                                                                                                                                                                 |
| Group settings screen                               | Ready   | `/groups/:groupId/settings` now cold-loads as a child route without being redirected back to the default channel, fetches the group by id when needed, exposes the live sidebar settings icon, browser-verifies overview save through `PATCH /api/v1/groups/:groupId`, and closes back to the canonical group route in `apps/web/e2e/web-owner-uat.spec.ts`. Production web commit `5351b03` gates management tabs by owner/admin/member permissions and adds `apps/web/e2e/group-settings-permissions.spec.ts` proof that owners keep management access while ordinary members only see personal Notifications/Danger actions and do not issue admin PATCH requests. The same routed spec now verifies endpoint-level 403 copy for denied overview saves, icon/banner upload-to-PATCH contracts, node-gated access saves and 403 copy, and danger-zone leave/delete 403 copy. Role, invite, member, and channel management breadth is tracked in their dedicated rows below.                                                                                                      |
| Group invite management screen                      | Ready   | The routed settings page now mounts the invites tab backed by the group invite APIs, and `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies invite-list load plus default invite creation through `POST /api/v1/groups/:groupId/invites`. `apps/web/e2e/group-settings-permissions.spec.ts` verifies endpoint-level 403 copy when invite list, create, and delete requests are denied, including optimistic delete rollback. The same routed spec verifies selected expiry/max-use payloads, no-expiry/no-limit omission, generated-link rendering, successful invite delete reconciliation, server-owned lifecycle normalization, and accessible invite-limit controls. `/invite/:code` is mounted and `apps/web/e2e/group-invite-landing.spec.ts` browser-verifies invite preview, join through `POST /api/v1/invites/:code/join`, canonical channel navigation, and expired-invite no-redeem behavior. Production backend now locks invite redemption in one transaction, rejects expired/revoked/maxed invites without consuming a use, honors explicit `expires_in`, keeps omitted expiry as no expiry, deletes invites through the mounted route, and proves the route contract in `apps/backend/test/cgraph/groups/invites_test.exs` plus `apps/backend/test/cgraph_web/controllers/api/v1/invite_controller_test.exs`. |
| Group role management screen                        | Ready   | The routed settings page now mounts `RoleManager`, the role list initializes from backend group truth without render-time state writes, and `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies the roles tab and edit panel. `apps/web/e2e/group-settings-permissions.spec.ts` browser-verifies routed role create, update, reorder, and delete contracts plus endpoint-level 403 copy for denied role create, update, reorder rollback, and delete rollback. The same routed spec proves blank role names are rejected locally without calling `POST /api/v1/groups/:groupId/roles`, backend default-role plus highest-role hierarchy errors surface as specific route copy for save and reorder paths, and backend validation details for invalid color plus unknown permission bits surface on the routed role-save path. Backend controller tests prove role-name trimming/blank rejection, valid hex color enforcement, unknown permission-bit rejection, default role protection, mounted `PUT /api/v1/groups/:group_id/roles/reorder`, numeric plus map permission JSON, non-owner role managers being allowed to update/delete/reorder only roles below their highest role, default-role reorder protection, and rejection of reorders that move protected roles.                                                                                                        |
| Group member management screen                      | Ready   | The routed settings page now mounts the members tab, and `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies member search, action-menu access, role assignment, and `PUT /api/v1/groups/:groupId/members/:memberId/roles`. `apps/web/e2e/group-settings-permissions.spec.ts` verifies endpoint-level 403 copy for denied member role assignment plus denied kick, ban, and mute actions while preserving the visible member row. The same routed spec now verifies successful member mute, unmute, kick, and ban reconciliation on the live members tab. Backend controller tests prove kick removal, ban creation plus membership removal, mute/unmute JSON state, and the mounted `DELETE /api/v1/groups/:group_id/members/:id/mute` unmute route.                                                                                                                                                                                                                                                                               |
| Group create channel screen                         | Ready   | The routed settings channels tab is browser-verified in `apps/web/e2e/web-owner-uat.spec.ts`: it loads categories from `GET /api/v1/groups/:groupId/channels`, creates a normalized text channel through `POST /api/v1/groups/:groupId/channels`, refetches, and renders the created channel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Phone auth entry from auth pages                    | Ready   | The routed phone auth flow is surfaced from both login and register, with `/login/phone` and `/register/phone` mounting the same multi-step screen. The web route no longer exposes a native-attestation checkpoint it cannot finish, and `apps/web/e2e/user-flow.spec.ts` browser-verifies both login and registration entry links land on the mounted phone flow with the correct mode-specific back links.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Phone OTP auth parity on web                        | Ready   | `phone-register.tsx` plus `registration-store.ts` implement phone entry, OTP, registration-lock, profile, permissions, OTP resend, call fallback, and native-device-required recovery. Production web commit `5f86bb9` extends `apps/web/e2e/auth-account-routes.spec.ts` so it browser-verifies existing-user phone login, new-user phone registration through profile and permissions, OTP resend, voice-call fallback, PIN registration-lock completion, and native-device-required recovery against the routed backend contracts. Real SMS provider delivery remains an external provider risk, not a missing web route branch.                                                                                                                                                                                                                                                                                                |
| Auth route-set parity coverage                      | Partial | The matrix below now browser-verifies routed email login with 2FA, registration, forgot-password, reset-password including invalid/expired/reused-token recovery, verify-email token/resend, QR session creation plus stale-code expiry/retry, existing-user phone login, new-user phone registration, OTP resend, call fallback, registration-lock, native-device-required recovery, onboarding, and destructive account lifecycle scheduling/cancellation. Remaining risk is real provider delivery, paired QR approval, and final production-style browser validation.                                                                                                                                                                                                                                                                                                                                     |
| Email/password login                                | Partial | `useLoginForm.ts` calls `useAuthStore.login(...)`, supports the 2FA handoff through `verifyLoginTwoFactor(...)`, navigates to `/messages`, and the routed 2FA login path is browser-verified by `apps/web/e2e/auth-account-routes.spec.ts`. Remaining risk is real provider/session edge validation and the final production-style browser pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Email/password registration                         | Partial | `useRegisterForm.ts` validates credentials and calls `useAuthStore.register(...)`; `apps/web/e2e/auth-account-routes.spec.ts` browser-verifies the routed registration submit contract. The app route guard now owns the post-auth order and sends unverified email users to `/verify-email?email=...` before onboarding or `/messages`; backend auth JSON includes `onboarding_completed` so the decision can happen immediately. Remaining risk is real mail-provider delivery and gate transitions.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Forgot-password request                             | Partial | `forgot-password.tsx` submits through `apiClient.auth.forgotPassword(email)`, renders a success state, and the routed request is browser-verified by `apps/web/e2e/auth-account-routes.spec.ts`. Remaining risk is real mail-provider delivery and error recovery against expired/invalid provider outcomes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Password reset confirm                              | Ready   | `reset-password.tsx` posts the new password to `/api/v1/auth/reset-password`, routes `invalid_reset_token` responses into the expired/reused-link recovery state, and keeps users on the reset recovery route with a Request New Link action. Backend contract proof in `apps/backend/test/cgraph_web/controllers/api/v1/auth_controller_test.exs` verifies valid reset, login with the new password, replay rejection, invalid token, expired token, and missing-param validation. `apps/web/e2e/auth-account-routes.spec.ts` browser-verifies successful reset plus invalid, expired, and replayed token recovery against the mounted route. Real mail-provider delivery remains tracked by the forgot/verify/provider rows, not this confirm contract.                                                                                                                                                                                                                                                                      |
| Verify-email token and resend                       | Partial | `useVerifyEmail.ts` posts `/api/v1/auth/verify-email`; expired-link recovery and no-token gate arrivals accept an email and post `/api/v1/auth/resend-verification`, which is mounted in the public strict auth pipeline with non-enumerating responses. Remaining risk is full browser/mail-provider verification.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QR login                                            | Partial | `login/qr-login.tsx` creates `/api/v1/auth/qr-session`, joins `qr_auth:{sessionId}`, stores returned tokens, and redirects to `/messages`. Production backend `qr_auth_controller_test.exs` now proves session creation, coded stale-session/missing-param/invalid-signature failures, valid approval broadcast, and one-time session consumption. Production web `auth-account-routes.spec.ts` browser-verifies QR session creation, stale-code expiry, and explicit Generate New Code retry. Remaining risk is paired mobile approval against a real second client and final production-style browser validation.                                                                                                                                                                                                                                                                                                                 |
| Web onboarding completion                           | Ready   | `useOnboarding.ts` uploads avatar, updates `/api/v1/me`, saves notification preferences, and posts `/api/v1/me/onboarding/complete`. Skip posts `/api/v1/onboarding/skip`, updates the local auth gate before leaving, save/skip failures render a routed recovery error, and the app route guard sends users to onboarding only after email verification is satisfied. `apps/web/e2e/user-flow.spec.ts` now browser-verifies the required onboarding gate renders the wizard, suppresses the floating tutorial, exits to `/messages` after skip, and completes the full profile/notification/onboarding-complete path into `/messages`.                                                                                                                                                                                                                                                                                           |
| Social hub route completeness                       | Ready   | `social.tsx` fetches real friends, requests, sent requests, notifications, and discovery results, renders a real main pane, exposes route-owned send, accept, decline, cancel, and remove friend actions, and is browser-verified by `apps/web/e2e/social-main-pane.spec.ts` across Social and profile friendship paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Social notifications list / mark-as-read            | Ready   | `social.tsx` fetches `useNotificationStore`, the sidebar and main pane can mark notifications read, and `apps/web/e2e/social-main-pane.spec.ts` browser-verifies the main-pane notification click posts `/api/v1/notifications/:id/read` before navigating.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Social notification deep-link navigation            | Ready   | `social.tsx` preserves action destinations through `getNotificationActionUrl(...)`, including conversation/message anchors, forum posts, profile routes, friend requests, and group channel/default-channel metadata. `apps/web/e2e/social-main-pane.spec.ts` browser-verifies a group-channel notification deep link with a message anchor on the mounted `/groups/:groupId/channels/:channelId` route. Metadata-less group notifications still intentionally fall back through the group-root redirect owner.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Social discover search                              | Ready   | `social.tsx` runs real `useSearchStore.search(query)`, `SearchGroupSchema` accepts backend `default_channel_id`, group results open canonical channel routes when that metadata is present, and unjoined group results call the real public-group join action. `apps/web/e2e/social-main-pane.spec.ts` browser-verifies routed discover search, result rendering, join endpoint submission, and post-join navigation to the mounted group channel route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Social discover result routing                      | Ready   | Discover results use `getDiscoverResultRoute(...)`, so forums prefer slugs, users route to profiles, and groups with `defaultChannelId` route directly to `/groups/:groupId/channels/:channelId`. `apps/web/e2e/social-main-pane.spec.ts` browser-verifies the group result path; focused route-helper tests cover the remaining local result-shape routing branches. Groups without channel metadata still use the group-root redirect fallback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Account deletion confirmation / cancellation        | Ready   | `settings.tsx` mounts `DeleteAccount`; `delete-account.tsx` calls the password-confirmed `POST /api/v1/me/delete-account` contract and exposes a cancel-pending-deletion action against `DELETE /api/v1/me/delete-account`. Focused component tests cover both endpoints, and production web commit `93febe9` adds `apps/web/e2e/settings-preference-sync.spec.ts` browser proof for the mounted grace-period cancellation, deletion scheduling, password payload, and follow-up auth logout side effect.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Call history trustworthiness                        | Ready   | `calls/history` is a real route, fails honestly instead of showing demo fallback rows, consumes backend-owned `end_reason` / `missed_seen` call state for missed-call filtering, and `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies that a real history row callback launches the mounted call screen. Production backend `test/cgraph_web/controllers/api/v1/call_controller_test.exs` proves the call-history API serializes missed-call truth and does not leak another user's call by id. Production packages `api-client/src/endpoints/__tests__/calls.test.ts` proves the shared API client preserves the backend call-history envelope and missed-call fields. Focused web proof lives in `apps/web/src/pages/calls/call-history/__tests__/hooks.test.tsx`.                                                                                                                                                                                                                                                                            |
| Call launch coverage                                | Partial | The manual `/call/:recipientId/:callType` route, routed DM header launch, call-history callback, and incoming-call modal accept into `/call/:recipientId/:callType?incoming=true&roomId=...` are browser-verified. The incoming path also proves visible video controls and end-call navigation back to the DM route. Deeper peer media negotiation is still not fully browser-verified in this pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Friend request / accept / remove actions            | Ready   | Social discover can send friend requests, Social friends can accept, decline, cancel outgoing requests, and remove existing friends, and profile pages now bootstrap the friend list before remove so they use the backend friendship id instead of silently failing. `apps/web/e2e/social-main-pane.spec.ts` browser-verifies Social send/accept/decline/cancel/remove plus profile send/accept/decline/cancel/remove.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Mini profile cards                                  | Ready   | `UserProfileCard` now fetches `/api/v1/users/:id` when only `userId` is supplied, maps the payload through canonical identity fields, and is covered by `apps/web/src/modules/social/components/user-profile-card/__tests__/user-profile-card.test.tsx`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Full profile cards                                  | Ready   | The same hydrated `UserProfileCard` path feeds the full popout variant, so callers no longer need to pass a complete user object to avoid placeholder data. Covered by focused user-profile-card tests plus existing full-card tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Identity / customization sync across surfaces       | Ready   | Canonical identity normalization now preserves richer cosmetic fields, `friend_customization_changed` feeds one selective other-user identity owner that updates friend plus routed chat stores, `UserProfileCard` hydrates backend profile data for `userId` callers, and the identity-customization route hydrates ownership/equipped truth from backend inventory. `apps/web/e2e/web-owner-uat.spec.ts` browser-verifies a live friend avatar-border/title update on the routed DM surface; broader settings multi-tab/device sync remains tracked separately.                                                                                                                                                                                                                                                                                                                                                                  |
| Settings initial hydration                          | Ready   | `settings.tsx` now boots through `usePreferenceOrchestrator` and blocks section panels until settings/customization/theme bootstrap is fulfilled for the current user, with a retry state for bootstrap failures. Focused orchestrator tests cover the readiness rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Notification settings save and reload persistence   | Ready   | Save actions are real, and `apps/backend/test/cgraph_web/controllers/api/v1/settings_controller_test.exs` now proves `notify_group_invites`, `notify_forum_replies`, `notify_economy`, `notify_system`, `notification_sound`, and `dnd_until` round-trip through the settings response. `apps/web/e2e/settings-preference-sync.spec.ts` browser-verifies mounted settings reload/live-sync behavior for the shared preference owner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Privacy settings correctness                        | Ready   | The 2026-05-15 slice adds `packages/shared-types/src/privacy.ts`, backend `selective_privacy` storage/rendering, API-client schemas, and web controls for message requests, phone visibility, calls, and exception lists. `apps/backend/test/cgraph_web/controllers/api/v1/settings_controller_test.exs` proves selective privacy persistence and rendering, while `apps/web/e2e/settings-preference-sync.spec.ts` browser-verifies the mounted privacy route hydrates message-request/online/group-invite values, preserves them across reload, and applies live server-shaped privacy sync. Physical second-device validation remains tracked by the separate settings cross-device row.                                                                                                                                                                                                                                       |
| Settings cross-device sync                          | Partial | `settings_synced` works for `settingsStore` sections, startup has one preference bootstrap owner for settings/theme/customization, and backend/user-channel `customization_synced` plus `theme_synced` events now apply server-owned patches without autosaving inbound events. The 2026-05-23 preference sync bus adds user-scoped same-origin `BroadcastChannel` fan-out for settings, customization, and theme patches, and `apps/web/e2e/settings-preference-sync.spec.ts` browser-verifies two already-open tabs converging on one incoming server-shaped settings patch. Remaining proof is a physical second-device / separate browser-profile socket lab run against production-like sessions.                                                                                                                                                                                                                             |
| DND schedule                                        | Ready   | `DndSchedulePanel` now saves quiet-hours settings and timezone through the settings store, and the backend notification JSON includes `dnd_until`. The remaining settings risk is physical second-device validation, not a DND save or routed reload/live-sync stub.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Global settings / theme / customization consistency | Ready   | `preferenceOrchestrator` is now the explicit bootstrap owner for settings, theme, and customization, the settings route gates panels until that bootstrap is ready, Calls/Stickers reset saves through the settings API, and customization/theme server patches now have user-channel sync owners. `apps/web/e2e/settings-preference-sync.spec.ts` browser-verifies privacy reload/live-sync, customization profile-card live sync, app-shell theme live sync, and same-origin cross-tab preference convergence. Physical second-device validation remains tracked by the separate settings cross-device row.                                                                                                                                                                                                                                                                                                          |
| Nodes wallet route                                  | Ready   | The route and wallet endpoint are real, the Nodes client now throws on failed API/schema results instead of returning `null`, and backend contract proof in `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` verifies the authenticated wallet balance and filtered transaction history route responses. `apps/web/e2e/nodes-wallet-shop.spec.ts` browser-verifies routed wallet balance/transactions, wallet failure without false zero-balance UI, transaction-history failure while wallet state remains visible, and user-triggered retry recovery after API/circuit-breaker failure.                                                                                                                                                                                                                                                                                                           |
| Nodes bundle shop                                   | Ready   | The shop route is real, bundle JSON now includes `is_active`, the shared schema accepts the current bundle shape, and backend contract proof in `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` verifies the active web shop bundle schema. `apps/web/e2e/nodes-wallet-shop.spec.ts` browser-verifies shop bundle rendering, bundle-load failure without empty-success UI, user-triggered retry recovery, true empty-shop state, and checkout failure copy on `/me/wallet/shop`. Stripe redirect success remains tracked under checkout/Stripe handoff rather than the mounted shop route itself.                                                                                                                                                                                                                                                                                 |
| Nodes tip flow                                      | Ready   | `nodesApi.sendTip(...)` now throws `NodesApiError` on failed results, so mutation success cannot fire from a `null` payload. The shared Nodes failure mapper normalizes self-tip, backend self-tip, insufficient-balance, already-unlocked, and rate-limit responses. Backend contract proof in `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` covers insufficient-balance and successful tip response shape, and `apps/web/e2e/nodes-profile-actions.spec.ts` browser-verifies the mounted `/user/:userId` tip modal keeps the server-rejected insufficient-balance state visible, shows canonical recovery copy, retries, and closes only after a successful server response.                                                                                                                                                                                                                                         |
| Nodes content unlock flow                           | Ready   | Unlock now uses the throwing Nodes API path, `content-unlock-overlay` has targeted error handling for insufficient balance, already-unlocked, rate-limit, not-gated, not-found, and generic failure responses, and insufficient balance routes to the canonical `/me/wallet/shop` destination instead of relying on the legacy `/nodes/shop` redirect. Backend contract proof in `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` covers insufficient-balance, success, duplicate unlock, free-thread, and unknown-thread responses for `POST /api/v1/nodes/unlock`. `apps/web/e2e/nodes-content-unlock.spec.ts` browser-verifies the mounted `/forums/:forumSlug/post/:postId` route keeps failed unlocks retryable, does not hide the gate until server success, and recovers only after the user's second explicit unlock action. The shared HTTP client now refuses automatic retries for mutating requests by default and preserves idempotency keys for explicit mutating retries. |
| Paid-file unlock flow                               | Ready   | The Cloud Chat message route sends locked paid files through the same paid unlock owner instead of rendering them as normal files, the backend `PaidDmController` now returns coded JSON errors instead of raw changesets or plain strings, and `apps/backend/test/cgraph_web/controllers/api/v1/paid_dm_controller_test.exs` proves validation, not-found, insufficient-balance, success schema, and duplicate-unlock contracts. `apps/web/e2e/dm-media-composer.spec.ts` browser-verifies insufficient balance, already-unlocked reconciliation, rate-limit failures, and an explicit failed unlock that stays locked until the user's second unlock action succeeds. `message-media-content.test.tsx` and `paid-file-card.test.tsx` cover paid-file renderer states and file-type labels. Broader media breadth remains under final release validation rather than this unlock-owner row.                                                                                                                                                                                                                           |
| Nodes gift flow                                     | Ready   | Gift backend success now includes the fields expected by `GiftResultSchema`, the client throws on failed results, and the shared failure mapper normalizes self-gift, backend gift rate-limit, and insufficient-balance copy. Backend contract proof in `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` covers insufficient-balance and successful gift response shape, and `apps/web/e2e/nodes-profile-actions.spec.ts` browser-verifies the mounted `/user/:userId` gift modal keeps the server-rejected insufficient-balance state visible, shows canonical recovery copy, retries, and renders success only after the server accepts the gift.                                                                                                                                                                                                                                                                         |
| Nodes checkout failure handling                     | Ready   | Checkout now throws if the API fails or returns no redirect URL, the hook shows an error toast on mutation failure, and the backend route no longer needs a real Stripe call to prove success/failure contracts in tests. `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` verifies success creates a checkout session with canonical `/me/wallet` return routes, Stripe rejection returns `checkout_failed`, and unknown bundles short-circuit before Stripe. `apps/web/e2e/nodes-wallet-shop.spec.ts` browser-verifies that a checkout API failure stays on `/me/wallet/shop` and renders user-facing failure copy, while the web unit suite verifies the client rejects missing checkout URLs.                                                                                                                                                                                           |

## Detailed A-to-Z audit

The detailed user-action audit for inbox, cloud DMs, hubs, channel types, and Broadcast parity now
lives in `docs/WEB-MESSAGING-HUBS-BROADCASTS-AUDIT.md`.

Companion summaries created from that audit plus targeted route revalidation now live in:

- `docs/WEB-SUPPORT-MATRIX.md`
- `docs/WEB-IMPLEMENTATION-INVENTORY.md`

Corrective note: two older strict-pass findings are no longer accurate in current source.

- Primary hub create/join flows now route through `getGroupRoute(...)` instead of dead-ending on
  `/groups/:groupId`.
- The command-palette Create Group action now routes to `/groups?create=true` and opens the mounted
  groups-shell create modal instead of sending users to non-mounted `/groups/create`.
- The settings dead-end sweep now keeps notification-profile editor routes mounted at
  `/me/settings/notification-profiles/:id`, redirects old billing/subscription settings paths to
  `/me/subscription`, and moves command-palette settings shortcuts to mounted Me destinations.
- The routed DM header now builds `/call/:recipientId/:callType`; live audio/video call-entry launch
  is browser-verified, so the remaining calls gap is broader media/incoming/history flow coverage.

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

### 1. Phone auth still needs browser proof, but the dead checkpoint is guarded on web

- Signal Android keeps the entire registration flow under `RegistrationActivity` with one shared
  `RegistrationViewModel` checkpoint owner.
- Telegram Android keeps login, code entry, call fallback, and secondary-factor checkpoints under
  `LoginActivity`.
- CGraph's web route centralizes state in `registration-store.ts`, and `device_attestation` no
  longer hands off to a `MobileOnlyFeature` placeholder. Web stays on the current step with a
  native-device-required error, so the dead checkpoint is closed, but the route still needs browser
  proof across entry, retry, call fallback, PIN-lock, profile, and permission paths.

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
  panels render. Routed reload/live-sync proof is now green; the remaining gap against the Telegram
  reference is grouped ownership polish and physical second-device validation.
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
- the live page-owned groups shell in `apps/web/src/pages/groups/*` is now the canonical routed
  shell
- the richer module stack remains a source of reusable settings/list/store primitives, not a second
  app shell; unused module-level shell fragments with mock or placeholder behavior were removed

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

3. The unused alternate `apps/web/src/modules/chat/hooks/use-media-upload.ts` owner was removed on
   2026-05-23. The remaining risk is composer-surface convergence, not a missing attachment bridge
   on the routed, browser-verified happy path.

4. `apps/web/src/modules/chat/store/chatStore.messaging.ts` only knows how to send uploaded
   `file_url` metadata, not raw `File[]` attachments.

5. `apps/web/src/pages/groups/group-channel/group-channel.tsx` and
   `apps/web/src/pages/messages/enhanced-conversation/useEnhancedConversation.ts` now both upload
   through `/api/v1/uploads` and then send the shared attachment metadata payload with browser proof
   on both routed surfaces, but the wider DM/group composer ownership is still split across routed
   surfaces and shared modules.

6. Primary hub create/join flows now use `getGroupRoute(...)`, so the older blanket dead-link claim
   is stale. The channel-list route problem is also narrower now: text, voice, video, announcement,
   and forum controls resolve to mounted type-specific destinations. Metadata-less producers can
   still fall back to bare `/groups/:groupId` paths, and the richer module-level shell is still not
   merged into the live route owner.

7. Routed group header search and mute are now real at the page-owner layer and browser-verified in
   `apps/web/e2e/web-owner-uat.spec.ts`: `group-channel.tsx` opens channel message search with
   jump/highlight handling, consumes `?scrollTo=...` links, asks the backend for older-history
   matches, hydrates an unloaded result, and toggles channel notification level through
   `/api/v1/notification-preferences/channel/:channelId`.

8. Group message actions are browser-verified on the routed text-channel surface: the live message
   menu edits and deletes through the group socket action contract, creates pins through the channel
   pins endpoint, submits reports, and copies `?scrollTo=...` links. The pinned panel also fetches
   and unpins pins through the routed browser path while reconciling loaded message state. Remaining
   risk is permission-denied states and richer media/GIF/voice parity.

9. Group voice, stickers, GIFs, and stronger routed scroll behavior are now browser-verified on the
   routed page. Remaining group risk is richer admin edge-state breadth.

10. The richer module-level group-admin stack is now mounted from the live groups route via
    `/groups/:groupId/settings`. The 2026-05-23 follow-up makes the page-owned routed groups shell
    canonical and removes the unused module-level `ServerSidebar`, `ServerHeader`, `ServerBanner`,
    `ServerIconBar`, and old `VoiceChannelPanel` shell fragments. Role CRUD/reorder, settings 403
    copy, and guarded group scroll behavior now have route, contract, and focused browser proof.
    Remaining risk is richer admin edge-state breadth.

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
   `apps/web/src/lib/identity/otherIdentitySync.ts`, so friend rows, friend-request users,
   conversation participants, sidebar previews, and routed message senders update through one
   selective identity patch owner.

6. `apps/backend/lib/cgraph_web/controllers/api/v1/message_json.ex` and
   `apps/backend/lib/cgraph_web/controllers/api/v1/conversation_json.ex` now serialize the same
   sender/participant cosmetic identity fields that web normalizers preserve.

7. Own-profile socket events route through `ownIdentitySync`, and other-profile socket events route
   through `otherIdentitySync`, which updates friend and routed chat state together. Avatar-border
   and title live-update proof is covered by owner UAT on the routed DM surface; broader badge and
   multi-tab/device settings proof remains tracked separately.

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
   instead of collapsing those controls into booleans. The routed browser reload and live-sync proof
   is green; remaining privacy risk is physical second-device validation.

4. The routed DND screen is now wired to quiet-hours settings, and the backend settings response
   includes `dnd_until`. DND itself is no longer the blocker, and final routed reload/live-sync proof
   is covered by the settings preference sync spec.

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

## 4. Nodes / economy is connected and safer, but still needs Stripe and retry validation

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

7. Wallet and shop query failures no longer look like empty success states. The routed wallet page
   now shows retryable failure states for wallet and transaction-history load errors, the routed
   shop page shows retryable balance and bundle-load failures, a real empty bundle response renders
   an honest empty state, and insufficient-balance unlock recovery navigates straight to the
   canonical `/me/wallet/shop` route. Focused proof lives in
   `apps/web/src/pages/nodes/__tests__/nodes-pages.test.tsx` and
   `apps/web/src/modules/nodes/components/__tests__/content-unlock-overlay.test.tsx`. Production web
   commit `69ee0b4b4b8a88f898805577af2716f73a5b7ae2` adds routed Chromium proof for wallet render,
   transaction render, wallet failure, transaction failure, shop bundle render, checkout failure
   toast, bundle failure, and true empty-shop state in `apps/web/e2e/nodes-wallet-shop.spec.ts`.
   The 2026-05-27 follow-up adds backend wallet/transaction/bundle route contracts and routed
   wallet, transaction-history, and shop retry recovery proof after API/circuit-breaker failure.

8. Production web commit `436d4ff` adds one shared Nodes failure mapper for tip, gift, content
   unlock, and paid-file unlock errors; updates routed Cloud Chat to render the paid-file locked
   overlay instead of bypassing it through `FileMessage`; and adds focused component plus routed
   Chromium proof for insufficient-balance, already-unlocked, self-gift, and rate-limit behavior.
   The browser proof lives in `apps/web/e2e/dm-media-composer.spec.ts`; component proof lives in the
   Nodes modal/overlay tests and `message-media-content.test.tsx`.

### Remaining risk

The Nodes economy should now be treated as connected and materially safer, not as false-success
broken. Profile tip/gift and forum content-unlock retry UX now have focused routed browser proof.
The remaining release risk is Stripe redirect success/handoff and the broader final browser pass
that exercises Nodes together with the rest of the app.

## 5. Older high-priority route gaps still remain relevant

These previously verified issues still matter and still belong in the web fix plan:

- social main pane now has route-owned browser proof for selected notifications, discover group
  join/open, and friend-request accept; broader friend action parity is still limited
- group entry-point routing still has bare-route producers that depend on route-owner redirection
- profile-card hydration and preference bootstrap are now source-backed, but broader
  profile/cosmetic reload and live-update browser proof remains open
- upload antivirus can still run metadata-only in production until a real ClamAV service is
  provisioned, but dangerous executable/script upload metadata is now rejected at the shared package
  contract, web upload adapter, direct presign endpoint, and server-ingested `/api/v1/uploads` path
- broad web verification coverage still not strong enough to claim "100% working"

## 6. Auth and onboarding still are not covered enough to claim whole-web readiness

### What is confirmed real

- `apps/web/src/routes/route-groups/auth-routes.tsx` mounts `/login`, `/register`,
  `/forgot-password`, `/reset-password`, `/verify-email`, `/register/phone`, `/login/phone`, and
  `/qr-login`.
- `apps/web/src/pages/auth/phone-register.tsx` is a real multi-step phone flow with phone entry,
  OTP, registration-lock, profile, and permissions steps.
- `apps/web/src/modules/auth/store/registration-store.ts` now prevents web from entering the
  native-only device-attestation checkpoint; focused store tests cover both OTP and PIN-lock
  continuations returning `next_step = device_attestation`.
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

2. Onboarding no longer silently bypasses the server on skip, and it no longer depends on ad hoc
   login/register navigation order. The final path persists profile and notification state, skip now
   calls `/api/v1/onboarding/skip`, route-owned save/skip failures render a recovery error, and
   `post-auth-redirect.ts` enforces verify-email before onboarding before `/messages`. The required
   onboarding gate, skip exit, and full profile/notification/onboarding-complete path are now
   browser-verified in `apps/web/e2e/user-flow.spec.ts`.

3. The Social Hub is still incomplete at the whole-product validation level, but it is no longer a
   placeholder shell. Friends, sent requests, notifications, and discover all fetch real store data,
   the route renders a real main pane, and focused browser proof now covers selected notification
   deep links, discover group join/open, Social friend-request send/accept/decline/cancel/remove,
   and matching profile-page send/accept/decline/cancel/remove flows. The remaining problem is
   broader final social/profile regression coverage, not missing routed friend action parity.

4. Social notifications now preserve destination data through `getNotificationActionUrl(...)` and
   can open conversations, forum posts, profiles, friend requests, and group channel/default-channel
   destinations. Focused browser proof now covers group-channel notification navigation with a
   message anchor; metadata-less group notifications still intentionally fall back to group-root
   redirection.

5. Social discover routes forums by slug when available, users to profiles, and groups with backend
   `default_channel_id` metadata directly to `/groups/:groupId/channels/:channelId`. Global Explore
   group cards now receive the same backend `default_channel_id` contract and route through the same
   canonical channel helper. Unjoined Social group results now call the real public-group join
   action; focused browser proof now covers the direct join and mounted channel navigation path.
   Social/profile friend-action parity is now browser-verified, so deeper remaining risk moves to
   final regression breadth.

6. Account deletion now uses the right backend contract and exposes grace-period recovery on web.
   The live delete-account UI calls the password-confirmed `POST /api/v1/me/delete-account` contract
   and exposes `DELETE /api/v1/me/delete-account` for pending-deletion cancellation. Production web
   commit `93febe9` now browser-verifies the mounted cancellation and scheduling lifecycle,
   including the password payload and follow-up auth logout side effect.

## 8. Standard message-app capability coverage is still incomplete

Compared against the basic day-to-day capability set users expect from Signal/Discord-style web
messaging, this strict pass still undercounted several route-owned actions:

1. Conversation list management is release-closed for the routed live menu. The live message sidebar
   can search, open, mark read, mark unread, pin, mute, archive, open archived conversations, and
   unarchive from the routed sidebar surface, and per-chat Space move controls patch the
   server-owned Space include/exclude lists. `apps/web/e2e/dm-media-composer.spec.ts` now
   browser-verifies mark unread/read, pin/unpin, mute/unmute, archive/recover, and Space add/remove
   from the live route.

2. Routed DM search anchors are now browser-verified with guarded scroll. The search modal can
   navigate to a `scrollTo` query param, the opened conversation route consumes it, and
   `apps/web/e2e/dm-media-composer.spec.ts` proves the target stays in view until the user jumps to
   latest.

3. Routed DM message-state controls are browser-proven for the audited route-owned state.
   Mark-as-read runs after route history fetch, backend message JSON carries read receipts as
   `metadata.readBy`, and the routed enhanced bubble renders Seen/read-receipt state. The live
   conversation-list menu is also verified for mark unread/read, pin/unpin, mute/unmute,
   archive/recover, and Space add/remove.

4. Routed DM call launch is now proven from the live header, and incoming-call accept now hands off
   to the same mounted call route. Browser proof lives in `apps/web/e2e/dm-media-composer.spec.ts`
   for header launch and `apps/web/e2e/web-owner-uat.spec.ts` for incoming accept, visible video
   controls, call-history callback, and end-call navigation. Deeper peer media negotiation still
   needs browser verification against a production-like WebRTC session.

5. Group header controls are materially implemented but not fully release-closed. The routed header
   now has message search, `scrollTo` jump/highlight behavior, backend older-history search, and
   real channel mute/unmute behavior backed by the notification preference endpoint. Broader final
   regression breadth remains open.

6. Call history trustworthiness is now route/contract/test aligned. The page fails honestly on API
   failure, consumes backend-owned `end_reason` / `missed_seen` state instead of inferring missed
   calls locally, the backend prevents ID-based cross-user call leakage, the packages API client
   preserves the same envelope, and the callback button is browser-verified from a real history row.
   Incoming-call accept and end-call route behavior are also browser-verified, but deeper peer media
   negotiation still needs production-like WebRTC validation.

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
   - Keep the page-owned routed groups shell canonical.
   - Bring real settings, invites, roles, members, create-channel, and channel-type-specific
     surfaces into that shell.

3. Routed DM parity
   - Keep the browser-verified typing, GIF/sticker send, and call-entry paths green while finishing
     full call-flow parity.
   - Keep the routed conversation-list menu proof green, including per-chat Space move controls.
   - Keep file/photo/voice, pinned-message UI, guarded autoscroll, search anchors, and DM call
     launch green while bringing full call-flow proof onto the routed surface.

4. Routed group parity
   - Keep the browser-verified group file/photo attachment send path green.
   - Keep browser-verified channel search, older-history hydration, and channel mute/unmute green.
   - Keep the browser-verified group message action menu proof green, then bring groups to parity on
     voice, stickers, and GIFs.
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
   - Keep wallet/shop/tip/gift/unlock/checkout negative-path proofs green after throwing-client and
     schema fixes.
   - Finish deeper call-flow browser verification against a production-like peer media session.

8. Auth, onboarding, and account lifecycle
   - Browser-verify email login, registration, forgot-password, reset-password, verify-email, QR,
     and phone entry.
   - Keep the resolved `device_attestation` guard green so web never advances into a native-only
     checkpoint.
   - Keep verify-email before onboarding before app-route gate order deterministic.
   - Keep delete-account on the password-confirmed contract and add routed cancel-deletion support.

9. Social, discovery, and notification destinations
   - Keep extending the real Social Hub main pane beyond summary actions.
   - Browser-verify destination metadata through notification mapping and clicks.
   - Finish group deep links so every click lands on a mounted routed destination.

10. Final release validation
    - Rerun a strict browser pass for auth, DMs, groups, social, settings, Nodes, and calls.
    - Recheck fresh-load settings hydration, reload persistence, cross-tab/cross-device sync,
      insufficient-balance Nodes UX, bundle-shop rendering, and broad Nodes regression paths.
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

| Phase                                            | Score | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Messaging contract convergence                   | `80%` | Routed DM and group file/photo sends now use the same shared upload-first metadata contract from `packages/shared-types/src/media.ts`; both routed browser proofs are green, the unused alternate media-upload owner was removed, the routed Cloud Chat composer now consumes the shared `modules/chat` `MessageInput` contract for text, files, paid-file pricing, GIFs, stickers, voice notes, draft ownership, and typing events, the routed bubble delegates shared message rendering, media, pinned state, receipts, and actions to `MessageBubble`, and the routed list delegates virtualized rendering plus id-based scroll requests to shared `MessageList`. Remaining convergence work is the route-owned page shell and final broad release validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Group route and shell convergence                | `79%` | Valid channel routes exist, primary create/join flows use `getGroupRoute(...)`, Social discover/notification group links can use canonical channel metadata, global Explore group cards now consume backend `default_channel_id`, channel-list controls split text, voice, video, announcement, and forum destinations, `/groups/:groupId/settings` is now a cold-loadable child route that avoids the bare-group redirect and fetches group truth by id, non-admin settings tab gating is browser-verified, `/invite/:code` now mounts generated invite links to a route-owned preview/join surface, and the page-owned routed groups shell is now canonical. Unused module-level shell fragments with mock/placeholder behavior have been removed. Role CRUD/reorder now has route, contract, and focused browser proof; role-name validation, default-role protection, role hierarchy errors for save/delete/reorder, invalid role color, and unknown permission-bit rejection now have backend plus routed browser proof. The routed settings page now proves 403 copy for overview save, icon/banner upload-to-PATCH, node-gated access save/denial, danger-zone leave/delete denial, role create/update/reorder/delete, invite list/create/delete, invite expiry/max-use creation, unlimited invite omission, invite delete reconciliation, member role assignment, member mute/unmute/kick/ban success reconciliation, and kick/ban/mute denial paths, the backend invite redemption contract now rejects expired/revoked/maxed invites without consuming uses, honors explicit expiry and no-expiry creation, deletes invites through the mounted route, and the groups shell now constrains routed channel height so the message list owns scroll state. Lower-context bare fallbacks and remaining richer admin edge states remain. |
| Routed DM parity                                 | `88%` | Basic DM open/send, browser-verified typing emit, stable guarded search anchors, jump-to-latest behavior, mark-as-read, browser-verified read-receipt rendering, browser-verified file/photo, voice-note, GIF, and sticker send, browser-verified DM call-entry launch, routed reply/search jump/edit/delete/forward/request/pin/pinned-panel behavior, incoming-call accept/end-call route proof, browser-verified sidebar mark unread/read, pin/unpin, mute/unmute, archive/recover, and Space add/remove are now wired. The live Cloud Chat composer, message list, and routed message bubble now route through shared `modules/chat` contracts and are reverified by the full routed DM media/composer browser spec. Remaining gaps are canonical page-shell convergence, deeper media-negotiation proof, and broader final browser verification.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Routed group parity                              | `87%` | Group fetch/send works after landing on a valid channel, routed text and file/photo sends are browser-verified, routed GIF/sticker/voice sends are browser-verified, voice/video channel routes now mount a LiveKit-backed group room view, routed settings overview save, icon/banner upload-to-PATCH, invite creation, invite delete reconciliation, member role assignment, member mute/unmute/kick/ban reconciliation, role create/update/reorder/delete contracts, role payload validation detail rendering, channel creation, owner/non-admin settings permission gating, loaded-message plus backend older-history search, group-level settings notifications, and channel-level mute/unmute are browser-verified. The live message action menu is browser-verified for edit, delete, report, pin, and copy-link, group reply/reaction/thread behavior is browser-verified, the pinned panel is browser-verified for fetch/unpin/state reconciliation, route-level 403 pin create/list/unpin contracts are browser-verified, non-pin settings 403 copy is browser-verified for overview save, node-gated access save/denial, danger-zone leave/delete denial, role create/update/reorder/delete, invite list/create/delete, member role assignment, and kick/ban/mute denial paths, and `apps/web/e2e/group-channel-scroll.spec.ts` verifies routed scroll anchors, incoming-message stability, and jump-to-latest behavior. Remaining gap is richer admin edge-state breadth.             |
| Identity and profile convergence                 | `86%` | A shared identity contract and web canonical identity normalizer now preserve avatar, border, title, badges, nameplate, theme, and display-name style fields across auth/profile/friend/chat/group HTTP and socket paths. Routed identity customization now uses backend-owned inventory/equipped truth, `UserProfileCard` hydrates `userId` callers from the backend, friend cosmetic socket patches route through one selective friend/chat identity owner, own-profile cosmetic socket patches route through one identity sync owner, owner UAT verifies a live avatar-border/title update on the routed DM surface, and `apps/web/e2e/sidebar-profile-card.spec.ts` verifies current-user sidebar avatar/profile-theme/nameplate/display-name-effect hover rendering, public-profile click-through, and full public-profile nameplate/display-name-effect rendering. Remaining risk is broader badge/nameplate live-update and multi-tab/device proof.                                                                                                                                                                                                                                                                                                                       |
| Settings, privacy, and customization convergence | `84%` | The settings route and panels are real, preference bootstrap has one owner, section panels are gated until bootstrap is ready, the runtime-neutral settings/defaults contract now lives in `packages/shared-types/src/settings.ts`, selective privacy has shared types/API/backend/web coverage, Calls/Stickers reset now saves through the settings API, customization/theme server patches now sync over the user channel, identity customization inventory/equipped state now comes from backend inventory with backend rejection of unowned saves, and `apps/web/e2e/settings-preference-sync.spec.ts` verifies privacy hydration, reload persistence, live settings sync, customization profile-card live sync, app-shell theme live sync, and same-origin cross-tab convergence for server-shaped settings patches. Remaining risk is physical second-device socket validation and broader final browser coverage.                                                                                                                                                                                                                                                                                                                   |
| Nodes and calls honesty                          | `76%` | Nodes false-success and schema drift are materially fixed in targeted tests, wallet/shop query failures now render explicit retryable failure states in focused page tests, `apps/backend/test/cgraph_web/controllers/nodes_controller_test.exs` proves wallet balance, filtered transaction history, active bundle schema, canonical checkout contracts, tip/gift insufficient-balance plus success response contracts, and content-unlock insufficient-balance, success, duplicate unlock, free-thread, and unknown-thread contracts. `apps/backend/test/cgraph_web/controllers/api/v1/paid_dm_controller_test.exs` proves paid-file validation, not-found, insufficient-balance, success schema, and duplicate-unlock contracts with coded JSON errors. `apps/web/e2e/nodes-wallet-shop.spec.ts` browser-verifies routed wallet/shop rendering plus wallet, transaction-history, bundle-load, empty-shop, checkout-failure, and user-triggered retry recovery states. `apps/web/e2e/dm-media-composer.spec.ts` browser-verifies routed paid-file insufficient-balance, already-unlocked, rate-limit, and failed-then-explicit-retry success states, `apps/web/e2e/nodes-profile-actions.spec.ts` browser-verifies routed profile tip/gift insufficient-balance and retry-to-success behavior, and `apps/web/e2e/nodes-content-unlock.spec.ts` browser-verifies routed forum content-unlock insufficient-balance routing, not-gated/not-found retryability, explicit failure retryability, and success only after a second user action. The shared HTTP client now blocks automatic mutating retries by default and preserves idempotency keys when mutating retries are explicitly enabled. Call-history callback is browser-verified, backend call-history detail lookup is user-scoped, missed-call state now flows from backend `end_reason` / `missed_seen` through packages into web, and incoming-call accept/end-call route behavior is browser-verified. Stripe handoff success behavior and deeper peer media-negotiation trust work are still open. |
| Auth, onboarding, and account lifecycle          | `85%` | Email auth and recovery are wired, logged-out verification resend works at the route level, onboarding skip/failure recovery and full onboarding completion are route-owned and browser-verified, `apps/backend/test/cgraph_web/controllers/api/v1/auth_controller_test.exs` proves reset-password success, new-password login, replay rejection, invalid-token, expired-token, and missing-param contracts, backend `qr_auth_controller_test.exs` proves QR session/approval/stale failure contracts, and `apps/web/e2e/auth-account-routes.spec.ts` now browser-verifies routed email login with 2FA, registration, forgot-password, reset-password success plus invalid/expired/reused-token recovery, verify-email, QR login creation/stale expiry/retry, existing-user phone login OTP completion, new-user phone registration, OTP resend, voice-call fallback, registration-lock PIN completion, and native-device-required recovery against backend contracts. Delete-account scheduling/cancellation is browser-verified in `apps/web/e2e/settings-preference-sync.spec.ts`, web no longer advances phone auth into the native-only device-attestation checkpoint, post-auth route order is now verify-email before onboarding before app routes, and auth re-check now preserves a still-authenticated session on non-401/403 failures. Remaining auth/account risk is real provider delivery, paired QR approval, and the final production-style browser pass.                                                                                            |
| Social, discovery, and notification destinations | `82%` | Data loads into the route, the Social Hub has a real main pane, notifications preserve action destinations, forums route by slug, groups with channel metadata route to mounted channel destinations, and unjoined group results run a real join action. Backend search results now publish `canonical_url` for user and group results, the web API schema preserves it, and Social discovery prefers safe backend canonical URLs while rejecting external or malformed routes. `apps/web/e2e/social-main-pane.spec.ts` now browser-verifies notification mark-read plus deep-link navigation, discover search plus group join/open, backend-canonical discover open, Social friend-request send/accept/decline/cancel/remove, and matching profile-page friend send/accept/decline/cancel/remove flows. Remaining risk is final regression breadth across live social/profile surfaces.                                                                                                                                                                                                                                                                                                                                                                                         |
| Final release validation                         | `25%` | The full local release-gates are green after the routed-placeholder sweep, `apps/web/src/routes/__tests__/route-inventory.test.ts` guards against reintroducing literal coming-soon routed panels, and 2026-05-28 production web commit `01f55bf` passed a rebuilt broad owner UAT route pass for auth entry, DMs, groups/settings, social, settings/privacy, Nodes, calls, call history, and voice rooms via `apps/web/e2e/web-owner-uat.spec.ts`. Vercel deployed the commit successfully and `pnpm --filter @cgraph/web smoke:production` passed against `https://web.cgraph.org` and `https://cgraph-backend-prod-v2.fly.dev`. This is not the full strict per-suite release signoff yet: the remaining validation work is the broader focused browser suite sweep, external provider checks, paired QR/mobile approval, physical cross-device sync, Stripe handoff success, and deeper media/call negotiation.                                                                                                                                                                                                                      |

Equal-weight release-readiness score: `77.2%`.

Truthful rounded Goal 2 completion: `77%`.

If someone produces a much higher number, they are almost certainly counting shared code existence
or surface count instead of release-trustworthy, route-owned behavior.

## Execution Checklist By Subsystem

Use this as the concrete implementation checklist for the web recovery pass.

### DMs and Groups

- [x] Standardize routed DM/group file-photo send on upload-first `/api/v1/uploads` plus message
      metadata, instead of raw multipart `file` posts to message endpoints.
- [x] Browser-verify routed group file/photo send on the live group channel route.
- [x] Eliminate the remaining producers of bare `/groups/:groupId` routes where the caller has
      enough context, while keeping primary create/join flows on `getGroupRoute(...)`.
- [x] Split group channel navigation by type so text, voice, video, announcement, and forum channels
      resolve to mounted routed destinations instead of one generic text-channel URL.
- [x] Pick one canonical groups shell: the page-owned routed groups stack is canonical. The
      module-level settings, list, routing, and store pieces remain reusable primitives, while the
      unused alternate shell fragments were removed on 2026-05-23.
- [x] Browser-verify routed DM typing start/stop events from the live input path.
- [x] Browser-verify routed DM search-result jumps.
- [x] Add guarded scroll/unread-jump behavior. The routed conversation now preserves `scrollTo`
      anchors, only sticks to bottom when appropriate, and exposes a latest/new-messages jump.
      Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-16.
- [x] Call routed DM `markAsRead(conversationId)` after conversation history fetch.
- [x] Add routed read-receipt rendering on the live DM route. Backend message JSON now carries
      `metadata.readBy`, the shared `MessageBubble` renders Seen/read-receipt state through the
      routed adapter, and the path is covered by backend controller proof plus
      `apps/web/e2e/dm-media-composer.spec.ts`.
- [x] Add routed edit, delete, and forward actions for DM messages instead of leaving them only in
      shared hooks.
- [x] Surface routed message-request accept, reject, block, and report flows where the backend
      contract already exists.
- [x] Add routed conversation-list mark-read and archive actions.
- [x] Add routed conversation-list controls for mute, pin, mark unread, archived-list recovery, and
      unarchive.
- [x] Add per-chat Space move/folder controls to the routed conversation list, or explicitly remove
      those expectations from the product.
- [x] Remove the unused alternate `apps/web/src/modules/chat/hooks/use-media-upload.ts` owner now
      that routed DMs/groups use upload-first metadata helpers. Closed on 2026-05-23 with a clean
      typecheck in production web.
- [x] Move the routed cloud-DM page onto the shared `modules/chat` conversation surface, or port the
      full shared composer/list/action/media stack into
      `apps/web/src/pages/messages/enhanced-conversation/*`. 2026-05-25 progress: the routed Cloud
      Chat composer now uses the shared `MessageInput` adapter for text, files, paid-file pricing,
      GIFs, stickers, voice notes, draft ownership, and typing events. Focused component tests and
      the full routed `apps/web/e2e/dm-media-composer.spec.ts` browser proof are green. 2026-05-26
      progress: `EnhancedMessageBubble` is now a route adapter over shared `MessageBubble`, and the
      shared bubble owns sticker rendering, pinned badges, read receipts, media rendering, and the
      action menu for the routed DM proof. 2026-05-26 continuation: the routed conversation now
      delegates rendered rows, virtualization, menu stacking, and id-based search/pinned/latest
      scroll requests to shared `MessageList`, while keeping the route shell as the adapter that
      binds backend actions and route params. Verified by typecheck, lint, production build, and the
      full routed `apps/web/e2e/dm-media-composer.spec.ts` Chromium proof. This closes the
      composer/list/action/media stack row; final broad release validation remains separate.
- [x] Wire real file and photo send into the routed DM composer and browser-verify it with
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-14.
- [x] Wire real voice record and send into the routed DM composer and browser-verify it with
      `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-14.
- [x] Add routed sticker and GIF send flows instead of relying on shared-code existence.
      Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts` on 2026-05-17.
- [x] Add routed pin action and pinned-message UI for cloud DMs.
- [x] Replace naive DM autoscroll with guarded autoscroll plus unread/jump-to-present behavior.
- [x] Browser-verify routed DM voice/video call launch from the live header now that it routes to
      `/call/:recipientId/:callType`.
- [x] Browser-verify call-history callback from a real history row.
- [x] Browser-verify incoming-call accept flow and call-screen end-state behavior.
- [x] Bring real group-admin screens into the live groups experience: settings, invites, role
      manager, member management, and create-channel.
- [x] Make group-header search real or remove the placeholder search control.
- [x] Wire the routed group notification button to a real mute/notification setting or remove the
      placeholder affordance.
- [x] If the module-level groups stack is kept, replace `ServerSidebar` placeholder content and add
      real handlers for `ServerHeader` admin actions. Not kept: the unused `ServerSidebar`,
      `ServerHeader`, `ServerBanner`, `ServerIconBar`, and old `VoiceChannelPanel` shell fragments
      were removed instead.
- [x] Bring groups to parity on routed voice, stickers, GIFs, and browser-verified message action
      happy paths. Verified by `apps/web/e2e/web-owner-uat.spec.ts` on 2026-05-18.
- [x] Finish the remaining non-pin group permission-edge proof. Channel-level notification
      semantics, backend older-history channel search, pinned-message 403 contracts, role
      CRUD/reorder contracts, overview-save 403 copy, role create/update/reorder/delete 403 copy,
      invite-list/create/delete 403 copy, member-role-assignment 403 copy, and kick/ban/mute
      permission-denied paths are now browser-verified through the routed group page.
- [x] Finish stronger group scroll behavior. Closed on 2026-05-25 by constraining the routed group
      shell height, replacing naive message-list autoscroll with guarded latest-anchor behavior, and
      browser-verifying routed anchors, incoming-message stability, and jump-to-latest behavior in
      `apps/web/e2e/group-channel-scroll.spec.ts`.
- [x] Decide whether groups stay page-local or also move onto the shared chat surface. Decision:
      groups stay page-owned for the routed shell; shared modules own primitives and contracts only
      until the broader chat-surface convergence item is explicitly executed.
- [x] Fix Explore and other group entry points so every path resolves to a valid routed channel.

Done when:

- Cloud DMs and groups support the same core send/render/action set the user expects on the live
  routed pages, not only in shared modules.

### Auth and Account Lifecycle

- [x] Browser-verify routed email login, 2FA, registration, forgot-password, reset-password,
      verify-email, QR login, and phone-auth entry paths instead of leaving them as static
      source-only findings. Verified by `apps/web/e2e/auth-account-routes.spec.ts` on 2026-05-23.
- [x] Decide the real post-auth gate order for verify-email, onboarding, and `/messages`, then make
      login and registration follow that same route-owned rule set.
- [x] Fix verify-email resend so expired-link recovery still works when the user is logged out.
- [x] Fix onboarding skip semantics so the route either marks onboarding complete or clearly leaves
      a pending onboarding state the app can resume later.
- [x] Add route-owned failure recovery for onboarding save errors instead of only logging them.
- [x] Add a routed cancel-deletion flow against `DELETE /api/v1/me/delete-account`, or remove the
      current UI promise that users can manage the deletion grace-period state from web.
- [x] Prevent backend `device_attestation` continuations from routing web users into a native-only
      placeholder checkpoint.

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
- [x] Decide whether social discover should navigate directly from backend-provided canonical URLs
      instead of rebuilding paths locally from partial result data. Closed on 2026-05-23: backend
      search responses now expose `canonical_url`, web schemas preserve it, and Social discovery
      uses safe backend canonical routes with local route fallback.
- [x] Re-verify friend-request send, accept, decline, cancel, and remove flows from both the Social
      Hub and profile pages after identity-card fixes land. Closed on 2026-05-23: Social now exposes
      sent-request cancellation and friend removal in the routed Friends tab/main pane, profile
      remove bootstraps the friend list before looking up `friendshipId`, and
      `apps/web/e2e/social-main-pane.spec.ts` browser-verifies the Social plus profile action set.

Done when:

- Social, search, and notification actions navigate to real routed destinations and no longer end in
  placeholder panes or dead links.

### Calls

- [x] Remove demo fallback data from call history so API failure never renders fake call records.
- [x] Remove local-only call-history delete affordance from the route.
- [x] Preserve backend-owned missed-call state through the API, shared package contract, and web
      normalizer.
- [x] Prevent ID-based call-history detail lookup from leaking records outside the authenticated
      user.
- [x] Verify call launch from routed DM entry points.
- [x] Verify call-history callback from a real history row.
- [x] Verify incoming-call accept flow and call-screen end-state behavior.
- [ ] Verify deeper peer media negotiation against a production-like WebRTC session.

Done when:

- Call routes either launch and render real state or fail honestly, without demo fallback records or
  local-only management actions.

### Identity and Profile Surfaces

- [x] Introduce one canonical web identity model for avatar, avatar border, title, badges, display
      name styling, and related profile cosmetics.
- [x] Stop truncating sender, participant, and auth-user cosmetic fields during normalization and
      hydration.
- [x] Make sidebar, chat, friends, profile page, and profile cards all read that same identity
      shape. The 2026-05-21 production web slice closes the remaining sidebar consumer by rendering
      the current auth avatar URL and avatar border through `ThemedAvatar`, wrapping the top avatar
      in a mini hover `UserProfileCard`, and routing clicks to `/user/:id`. Production web commit
      `8e2374fb63f1e368632960575a8f3a0ffeb3b1aa` adds browser proof that the sidebar mini-card
      preserves current-user profile theme, avatar border, nameplate, and display-name effect, and
      that the public-profile route accepts the app's handle-style E2E profile id instead of
      rejecting non-UUID profile identifiers. Production web commit
      `dae3416c16b50ff4d8cfad4fc1e96bebbb0895c1` extends the same proof to the full public profile
      header.
- [x] Fix `UserProfileCard` so `userId` resolves authoritative user data instead of falling back to
      `DEFAULT_PLACEHOLDER_USER`.
- [x] Stop splitting own-profile cosmetics vs other-profile cosmetics across different stores and
      helper paths for the audited routed surfaces; own-profile updates use `ownIdentitySync`, and
      other-profile updates use `otherIdentitySync`.
- [x] Consume `friend_customization_changed` through the selective other-user identity patch owner
      instead of leaving it in `presenceManager` cache or direct ad hoc store mutation.
- [x] Route own-profile profile/cosmetic socket updates into one identity sync owner instead of
      inline parallel auth/customization mutations in `userChannel`.
- [x] Revalidate avatar border, title, and routed profile/chat consistency after live updates.
      `apps/web/e2e/web-owner-uat.spec.ts` dispatches a live friend identity patch and verifies the
      routed DM surface renders the updated avatar border plus `Founder` title. Broader badge and
      multi-tab/device settings proof remains outside this row.

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
      backend/user-channel sync owners now apply server-owned customization/theme patches, and
      `apps/web/e2e/settings-preference-sync.spec.ts` verifies the routed reload/live-sync path.
- [ ] Revalidate real cross-tab and cross-device socket delivery after store ownership cleanup.
      Same-origin cross-tab delivery is now production-backed by
      `apps/web/src/lib/preferences/preference-sync-bus.ts`, wired into user-channel
      settings/customization/theme events, and browser-verified with two already-open tabs in
      `apps/web/e2e/settings-preference-sync.spec.ts`. Remaining: physical second-device or separate
      browser-profile socket delivery against production-like sessions.

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
- [x] Add focused wallet/shop failure-state proof so wallet load errors, transaction load errors,
      bundle load errors, and true empty bundle responses do not collapse into false success UI.
- [x] Browser-recheck wallet and shop rendering after schema cleanup. Production web commit
      `69ee0b4b4b8a88f898805577af2716f73a5b7ae2` adds `apps/web/e2e/nodes-wallet-shop.spec.ts` to
      verify routed wallet balance/transactions, wallet failure, transaction-history failure, shop
      bundle rendering, checkout failure toast, bundle-load failure, true empty-shop state, and the
      later user-triggered wallet/transaction/shop retry recovery states.
- [x] Recheck insufficient-balance, already-unlocked, self-gift, rate-limit, and remaining negative
      paths so they show proper user-facing failure states. Production web commit `436d4ff`
      centralizes Nodes action failure copy, keeps paid files locked on failure, treats
      already-unlocked server responses as completed, exposes Add Nodes recovery for insufficient
      balance, and proves the routed paid-file negative states in
      `apps/web/e2e/dm-media-composer.spec.ts`. Later 2026-05-28 proof adds backend coded
      paid-file unlock contracts plus routed failed-then-explicit-retry success; later routed proof
      closes profile tip/gift and forum content-unlock retry UX. Remaining release risk moves to
      Stripe handoff success and broad final regression.

Done when:

- Wallet, shop, tip, gift, unlock, and checkout either complete successfully with correct state
  updates or fail loudly and correctly without false-success UI.

### Carry-Over Web Gaps

- [x] Replace the Social Hub placeholder main pane with real selected-entity content.
- [x] Remove remaining dead-end or placeholder-only navigation targets. The command-palette Create
      Group dead end was fixed on 2026-05-23 and covered by `quick-switcher.test.tsx` plus
      `server-list.test.tsx`. The same dead-end sweep routes notification-profile editor,
      billing/subscription, web-push notification, and command-palette settings destinations to
      mounted Me/settings surfaces, covered by focused settings panel and quick-switcher tests. The
      follow-up routed-placeholder sweep replaces the creator tiers route, creator subscribers
      route, forum-admin Node Gating panel, forum post poll creator, and forum directory widgets
      with real store/API-backed surfaces, then adds
      `apps/web/src/routes/__tests__/route-inventory.test.ts` so routed source fails if literal
      coming-soon panels return.
- [x] Move customization inventory/equipped state fully onto authoritative backend-owned data for
      the routed identity-customization surface and backend save contract.
- [ ] Finish upload hardening items that still block a real production claim. The 2026-05-23
      hardening slice adds shared `@cgraph/shared-types` blocked upload metadata rules, rejects
      dangerous files in the routed web message attachment adapter before transfer, and makes the
      backend reject dangerous filenames on server-ingested `/api/v1/uploads` before storage, with
      focused package/web/backend tests. This remains open until production has a provisioned,
      reachable ClamAV scanner and the final browser/API pass proves upload failure UX end to end.
- [x] Browser-verify the surfaced phone-auth entry points from both login and register while keeping
      the existing web visual style intact.
- [x] Verify the remaining phone flow for new-user registration, OTP retry, call fallback,
      registration lock, native-device-required handling, profile completion, and permission steps.
      `apps/web/e2e/auth-account-routes.spec.ts` now browser-verifies existing-user OTP sign-in,
      new-user registration through profile and permissions, OTP resend, voice-call fallback,
      registration-lock PIN completion, and native-device-required recovery.
- [x] Audit login, forgot-password, verify-email, QR login, and onboarding with the same route-owned
      criteria used in the rest of this file. Auth/recovery/QR proof lives in
      `apps/web/e2e/auth-account-routes.spec.ts`; onboarding proof remains in the existing
      route-owned onboarding specs. Later 2026-05-28 production proof adds backend QR coded
      stale-session/missing-param/invalid-signature/approval-broadcast contracts plus routed
      stale-code expiry and Generate New Code retry proof.
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
