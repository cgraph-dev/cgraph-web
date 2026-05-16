# Web Support Matrix (May 2026)

This is the user-facing support matrix for the current web app.

It is derived from the messaging, hubs, broadcasts, auth, and settings audits, then revalidated
against the live routed web source and focused owner UAT on 2026-05-16.

Use this document as the plain-language answer to "Can I do this on web right now?"

## Status meanings

- `Web supported`: the routed web app can do this today.
- `Web partial`: the routed web app can do some of it, but important gaps remain.
- `Mobile/Desktop only`: intentionally or practically completed outside the web app.
- `Not on web yet`: no first-class routed web surface exists yet.

## Messaging

| Feature                      | Availability          | User note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud Chat DMs               | `Web partial`         | You can open cloud DMs, send text, send file/photo attachments through the shared upload-first media contract, send voice notes, reply, react, jump from search results with guarded scroll/latest-jump behavior, edit/delete/forward messages, handle message requests, pin loaded messages, open a pinned-message panel, use browser-verified typing emit, render read-receipt/Seen state, browser-verified launch call routes from the DM header, and accept incoming calls into the mounted call screen. Stickers/GIFs, deeper peer media negotiation, and full list management are still incomplete. |
| Secret Chats / Ghost Chat    | `Mobile/Desktop only` | Web intentionally stays outside the Signal-participant trust boundary for secret-chat style flows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| DM voice/video call entry    | `Web partial`         | The web app can build and open audio/video call routes from the DM header, and focused browser proof verifies the live header plus manual call route mount controls. Incoming-call accept now routes through the root incoming-call handler into `/call/:recipientId/:callType?incoming=true&roomId=...`, shows video controls, and returns cleanly through End Call. Deeper peer media negotiation still needs end-to-end verification.                                                                                                                                                                  |
| Call history                 | `Web partial`         | The call-history route is real, fails honestly on API error, and callback buttons are browser-verified from a real history row. Richer history management and deeper peer media negotiation are still needed.                                                                                                                                                                                                                                                                                                                                                                                             |
| Conversation list management | `Web partial`         | The shipped inbox surface now supports mark-read, mark-unread, pin/unpin, mute/unmute, archive, archived-list recovery, and per-chat Space add/remove controls through mounted backend routes. Final browser verification of the combined menu remains incomplete.                                                                                                                                                                                                                                                                                                                                        |

## Hubs

| Feature                                          | Availability  | User note                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create and join hubs                             | `Web partial` | Primary create/join flows can land you in a routed channel, metadata-less group routes redirect once group data resolves, and focused UAT verifies a canonical text-channel route plus a voice-room route. Broader entry-path edge states remain incomplete.                                           |
| Browse hub server rail and channel list          | `Web partial` | The hub rail and channel list are live, the live sidebar opens routed group settings, and focused UAT verifies the loaded channel list for a real routed hub. Deeper settings-tab verification remains incomplete.                                                                                     |
| Text channels                                    | `Web partial` | Text send, replies, reactions, members, thread panel, emoji, shared-contract file uploads, loaded-message search, group mute/unmute, and edit/delete/report/pin/copy-link message menus are live. Focused UAT verifies routed text send. Older-history search and richer media send remain incomplete. |
| Announcement channels                            | `Web partial` | A dedicated announcement route is mounted, but publisher/read-only announcement semantics are still incomplete.                                                                                                                                                                                        |
| Forum/topic channels                             | `Web partial` | A dedicated forum route is mounted, but the full topic-first model is still incomplete.                                                                                                                                                                                                                |
| Voice channels                                   | `Web partial` | Voice channel entries open a dedicated LiveKit-backed routed room, and focused UAT verifies the route plus Join Call control. LiveKit join/leave/error behavior still needs deeper verification.                                                                                                       |
| Video channels                                   | `Web partial` | Video channel entries open a dedicated LiveKit-backed routed room with video enabled by default. Browser verification is still pending.                                                                                                                                                                |
| Hub settings, invites, roles, audit log, automod | `Web partial` | `/groups/:groupId/settings` mounts the richer admin/settings stack from the live hub shell. Browser verification and permission edge states remain open.                                                                                                                                               |

## Broadcast And Organization

| Feature    | Availability  | User note                                                                                                                                                                                                                                                                                                                      |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Broadcasts | `Web partial` | `/broadcasts` and `/broadcasts/:broadcastId` now support directory browsing, creation, subscribe, feed reading, and owner publishing. Post edit/delete/pin, link/admin management, comments, scheduled publish, media, polls, analytics, and deeper edge-state verification are still incomplete.                              |
| Spaces     | `Web partial` | `/spaces` and `/spaces/:spaceId` list/create server-owned Spaces and filter conversations through `/api/v1/spaces`. Browser-verified by `apps/web/e2e/spaces.spec.ts`; the live inbox can now add/remove chats through the same server-owned include/exclude lists. Final browser verification of that combined route remains. |
| Vault      | `Web ready`   | `/vault` opens the authenticated user's backend Note-to-Self conversation, redirects to `/vault/:conversationId`, and uses the real cloud-message history/composer. Browser-verified by `apps/web/e2e/vault.spec.ts`.                                                                                                          |

## Social And Discovery

| Feature                 | Availability    | User note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Social Hub              | `Web partial`   | Friends, notifications, and discover all render on web, but some deep links and secondary actions still need correction.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Discover results        | `Web partial`   | Search results render, group results with backend default-channel metadata open mounted channel routes, and unjoined groups can be joined directly. Focused UAT verifies routed search-result rendering; direct-join edge states remain incomplete.                                                                                                                                                                                                                                                                                                                                    |
| Notification deep links | `Web partial`   | Notifications can route to messages, profiles, forums, and group channel targets when metadata is present; browser verification is still pending.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Identity cosmetics      | `Web supported` | Auth, profile, friend, chat, group member, profile-card, and socket normalizers now preserve one shared identity field set for avatar borders, titles, badges, nameplates, themes, and display-name styles. The customization route now uses backend inventory for ownership/equipped truth, own-profile cosmetic socket patches flow through an explicit identity owner, and friend cosmetic patches now update routed friend/chat surfaces through one selective identity-sync owner. Focused owner UAT browser-verifies a live avatar-border/title update on the routed DM surface. |

## Auth And Security

| Feature                               | Availability          | User note                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email login and registration          | `Web partial`         | Core routed flows exist, expired or pending verification can request a new email while logged out, onboarding skip persists through the backend, and the post-auth route owner gates verify-email before onboarding before app routes. Full end-to-end auth, recovery, 2FA, mail-provider, and edge-state browser verification remains incomplete. |
| Phone login and registration          | `Web partial`         | Phone entry, OTP, PIN, profile, and permissions steps exist on web. If the backend requires native device attestation, web now stays on the current step with a native-device-required error instead of entering a dead checkpoint. Full browser verification remains incomplete.                                                                  |
| Device verification during phone auth | `Mobile/Desktop only` | Native device attestation requires keys that do not live on web. The web phone flow now treats that backend continuation as a guarded native-device-required state, not a browser-routed feature.                                                                                                                                                  |
| Key/E2EE verification pages           | `Mobile/Desktop only` | These intentionally render mobile-only placeholders on web.                                                                                                                                                                                                                                                                                        |

## Settings And Account

| Feature                    | Availability    | User note                                                                                                                                                  |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account deletion           | `Web supported` | The settings page uses the password-confirmed delete-account endpoint and exposes pending-deletion cancellation through the backend grace-period endpoint. |
| DND schedule               | `Web supported` | Quiet-hours schedule save is wired through the settings store and notification settings route.                                                             |
| Calls/Stickers preferences | `Web supported` | Calls and Stickers/Emoji saves and reset now flow through the server settings API with focused store rollback coverage.                                    |
| Customization/theme sync   | `Web partial`   | Backend saves now broadcast user-channel customization/theme sync events and web applies those patches; final routed multi-tab/device proof remains.       |
| Selective privacy          | `Web partial`   | Message-request, phone, and call privacy use the shared selective contract with exception lists; final browser reload and live-sync validation remain.     |

## Practical summary

Today, the web app is usable for:

- cloud-chat text messaging
- basic hub participation in text channels
- social friends/notifications/discovery browsing
- account settings, deletion, and quiet-hours scheduling
- server-synced Calls and Stickers preference updates
- code-level customization/theme live-sync updates
- Nodes wallet viewing through the routed wallet surface

The biggest remaining web gaps are:

- fake or decorative controls on routed messaging and hub screens
- metadata-less bare hub fallbacks (`/groups/:groupId`) that still need browser verification as
  deliberate redirects rather than dead destinations
- unmounted inbox features that already exist in module code
- incomplete Broadcast management parity and final browser verification for the new Space inbox
  controls
- settings reload/live-sync browser proof that still needs final multi-tab/device validation

For the engineering inventory behind those gaps, see `docs/WEB-IMPLEMENTATION-INVENTORY.md`.
