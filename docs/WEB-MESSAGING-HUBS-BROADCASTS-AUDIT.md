# Web Messaging, Hubs, and Broadcasts Audit (May 2026)

This is the detailed A-to-Z user-action audit behind `WEB-ULTIMATE-STRICT-PASS.md`. It compares:

- Signal's inbox and conversation ownership model
- Telegram's chat-list, folder, supergroup, and broadcast-channel UX
- The live CGraph web app as it exists in the current source tree

## Scope and status legend

- `Ready`: route-owned and currently usable on web
- `Partial`: reachable on web, but parity or semantic gaps are still material
- `Missing`: no first-class live web route or action
- `Intentional`: intentionally excluded from web by product architecture

Included in scope:

- inbox and chat-list actions
- cloud DMs
- hubs and per-hub channels
- Telegram-style channel and broadcast semantics
- folders / Spaces, Vault / Saved Messages, invite links, roles, moderation, and call entry points
- sender/member/friend identity fields required by routed messaging and hub surfaces

Excluded from scope:

- Secret Chats on web. ADR-022 keeps web outside the Signal-participant trust boundary, so those
  surfaces are intentionally mobile or desktop only.
- Forums, Nodes, and other non-messaging surfaces unless they directly break a messaging, hub, or
  broadcast destination.

## Reference files used

Upstream contract references:

- `reference/Signal/Signal-Desktop/ts/state/smart/Inbox.preload.tsx`
- `reference/Signal/Signal-Desktop/ts/state/smart/ConversationView.preload.tsx`
- `reference/Telegram/Telegram-iOS/submodules/ChatListUI/Sources/ChatContextMenus.swift`
- `reference/Telegram/Telegram-iOS/submodules/ChatListUI/Sources/ChatListFilterPresetController.swift`
- `reference/Telegram/Telegram-Android/TMessagesProj/src/main/java/org/telegram/ui/DialogsActivity.java`
- `reference/Telegram/Telegram-Android/TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java`
- `reference/Telegram/Telegram-Android/TMessagesProj/src/main/java/org/telegram/ui/Components/ChatActivityEnterView.java`
- `reference/Telegram/Telegram-Android/TMessagesProj/src/main/java/org/telegram/messenger/ChatObject.java`
- `reference/Telegram/Telegram-Android/TMessagesProj/src/main/java/org/telegram/ui/ChatRightsEditActivity.java`
- `reference/Telegram/Telegram-Android/TMessagesProj/src/main/java/org/telegram/ui/ManageLinksActivity.java`

Current web references:

- `apps/web/src/routes/app-routes.tsx`
- `apps/web/src/pages/messages/messages/messages.tsx`
- `apps/web/src/pages/messages/messages/conversation-sidebar.tsx`
- `apps/web/src/pages/messages/messages/conversation-item.tsx`
- `apps/web/src/pages/messages/conversation/page.tsx`
- `apps/web/src/pages/messages/enhanced-conversation/enhanced-conversation.tsx`
- `apps/web/src/pages/messages/enhanced-conversation/useEnhancedConversation.ts`
- `apps/web/src/pages/messages/enhanced-conversation/message-input-area.tsx`
- `apps/web/src/modules/chat/components/conversation-list/conversation-item.tsx`
- `apps/web/src/modules/chat/components/conversation-list/conversation-menu.tsx`
- `apps/web/src/modules/chat/hooks/useMessageActions.ts`
- `apps/web/src/pages/groups/groups-page.tsx`
- `apps/web/src/pages/groups/components/server-list.tsx`
- `apps/web/src/pages/groups/components/channel-list.tsx`
- `apps/web/src/pages/groups/components/content-area.tsx`
- `apps/web/src/pages/groups/group-channel/group-channel.tsx`
- `apps/web/src/pages/groups/group-channel/channel-header.tsx`
- `apps/web/src/pages/groups/group-channel/channel-message-item.tsx`
- `apps/web/src/pages/groups/group-channel/message-input.tsx`
- `apps/web/src/pages/groups/group-channel/pinned-messages-panel.tsx`
- `apps/web/src/pages/groups/group-channel/channel-thread-panel.tsx`
- `apps/web/src/modules/groups/routing.ts`
- `apps/web/src/modules/groups/components/group-list/create-group-modal.tsx`
- `apps/web/src/modules/groups/components/group-settings/group-settings.tsx`
- `apps/web/src/modules/groups/components/group-settings/useGroupSettings.ts`
- `apps/web/src/pages/social/social/discover-routing.ts`

## Upstream contract summary

### Signal sets the baseline for inbox and conversation ownership

- One inbox owner owns the routed inbox surface. `SmartInbox` composes chats, calls, settings, and
  tab navigation under one route owner.
- One conversation owner owns the open conversation. `SmartConversationView` composes header,
  timeline, composition area, and side panel under the same routed surface.
- Composer, selection, attachment processing, and message-state controls live under that canonical
  conversation owner instead of being split between a page-local shell and a richer detached module.
- Signal is the DM and group baseline. It does not define Telegram-style broadcast channels.

### Telegram sets the baseline for chat-list actions, folders, hubs, and broadcast channels

- The chat list itself owns pin, mute, archive, mark-as-read, and folder add or remove actions.
- Folders are first-class user surfaces. They are not hidden internal filters. Users can include
  categories such as contacts, groups, channels, and bots.
- The chat surface owns reply, reactions, forward or edit bars, sticker and GIF pickers, voice/video
  recording, polls, pinned headers, report actions, and call entry points.
- Supergroups and broadcast channels are distinct products with different rights. `ChatObject` and
  `ChatRightsEditActivity` make that explicit.
- Invite-link lifecycle and admin rights have dedicated screens instead of placeholder menus.

### CGraph naming map for this audit

- Telegram `supergroup` maps to CGraph `Hub`
- Telegram `channel` maps to CGraph `Broadcast`
- Signal-style or Telegram-style DM maps to CGraph `Cloud Chat` on web

## Corrections versus the older strict pass

Two April findings are now stale in source and should not be carried forward:

- Primary hub create and join flows no longer dead-end on `/groups/:groupId`. `CreateGroupModal`,
  `ExploreGroups`, global Explore community cards, and the server-list join modal now route through
  canonical channel helpers when channel metadata is available.
- Routed DM call launch is no longer absent. `ConversationHeader` now navigates through
  `getDirectCallRoute(...)` to `/call/:recipientId/:callType`.

What is still broken:

- Metadata-less group entry points can still fall back to bare `/groups/:groupId`; Social discovery,
  global Explore cards, and notifications now use canonical channel routes when backend
  `default_channel_id` or notification channel metadata is present, and unjoined Social group
  results now call the real public-group join action.
- The DM call-entry route is now browser-proven from the live header.
  `apps/web/e2e/web-owner-uat.spec.ts` proves the manual call route mounts controls, and
  `apps/web/e2e/dm-media-composer.spec.ts` proves the routed DM voice/video buttons navigate to
  audio and video call screens. The broader web call flow still needs full media/incoming/end-state
  browser verification end-to-end.

## Current web route model

- The live router mounts `/messages/:conversationId`, `/groups/:groupId/channels/:channelId`,
  `/groups/:groupId/voice/:channelId`, `/groups/:groupId/video/:channelId`,
  `/groups/:groupId/announcements/:channelId`, and `/groups/:groupId/forums/:channelId`.
- The live router now mounts first-class `/broadcasts` and `/broadcasts/:broadcastId` routes backed
  by `apps/web/src/modules/broadcast/store/broadcastStore.ts`.
- The live router now mounts first-class `/vault` and `/vault/:conversationId` routes backed by the
  authenticated user's backend Note-to-Self conversation.
- The live router now mounts first-class `/spaces` and `/spaces/:spaceId` routes backed by
  `/api/v1/spaces`.
- Channel-list controls now resolve channel ids by type. Text uses the message channel owner,
  voice/video use the LiveKit-backed group-call route, and announcement/forum have dedicated route
  owners that still need deeper product semantics.
- Cloud DMs are the web parity target.
- Secret DMs are intentionally mobile or desktop only.

## Inbox and chat-list actions

Upstream references for this section:

- Signal `SmartInbox`
- Telegram `DialogsActivity`
- Telegram `ChatContextMenus.swift`
- Telegram `ChatListFilterPresetController.swift`

| Action                                 | Status  | Source-backed note                                                                                                                                                                                                                                                                                                              | Exact web work                                                                 |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Open inbox and unread list             | Partial | `pages/messages/messages/messages.tsx` fetches and renders conversations, but the live route uses `pages/messages/messages/*` instead of the richer `modules/chat/components/conversation-list/*` stack.                                                                                                                        | Converge on one canonical inbox owner.                                         |
| Filter current conversation list       | Partial | `conversation-sidebar.tsx` only filters the already-loaded list locally.                                                                                                                                                                                                                                                        | Keep local filtering, but move it into the canonical inbox surface.            |
| Global search and jump to message      | Ready   | `messages.tsx` opens `MessageSearch` and navigates with `?scrollTo=...`; `useEnhancedConversation.ts` consumes that query param, preserves the target anchor instead of forcing bottom scroll, and exposes a latest/new-messages jump. Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                            | Keep the jump and guarded-scroll proof green while converging inbox ownership. |
| Start a new DM from the inbox          | Partial | The route can open `NewChatModal`, but the inbox still lacks the surrounding chat-list parity actions.                                                                                                                                                                                                                          | Keep the modal, but mount it under the canonical inbox owner.                  |
| Pin or unpin a chat                    | Ready   | The routed inbox sidebar menu now pins and unpins through `/api/v1/conversations/:id/pin`, updates the live list state, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                    | Keep the live menu proof green while converging inbox ownership.               |
| Mute or unmute a chat                  | Ready   | The routed inbox sidebar menu now mutes and unmutes through `/api/v1/conversations/:id/mute`, updates the live list state, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                 | Keep the live menu proof green while converging inbox ownership.               |
| Archive or unarchive a chat            | Ready   | The routed sidebar can archive from the inbox, open the archived list, and unarchive from the recovery surface. Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                   | Keep archived-list recovery proof green while converging inbox ownership.      |
| Mark chat unread or read from the list | Ready   | The routed conversation sidebar exposes mark-read and mark-unread actions backed by `/api/v1/conversations/:id/read` and `/api/v1/conversations/:id/unread`; the combined menu path is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                            | Keep the combined conversation-list menu proof green.                          |
| Move chats into folders / Spaces       | Ready   | `/spaces` and `/spaces/:spaceId` list/create server-owned Spaces and apply filter rules to the conversation list. Browser-verified by `apps/web/e2e/spaces.spec.ts`. Per-chat add/remove controls patch server-owned Space membership from the live inbox and are browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`. | Keep the combined Space membership menu proof green.                           |
| Open Vault / Saved Messages            | Ready   | `/vault` creates or fetches the backend Note-to-Self conversation through `/api/v1/conversations/note-to-self`, routes to `/vault/:conversationId`, and renders the real cloud-message history/composer. Browser-verified by `apps/web/e2e/vault.spec.ts`.                                                                      | Keep the browser proof green while converging wider inbox ownership.           |

## Direct-message actions

Upstream references for this section:

- Signal `SmartConversationView`
- Telegram `ChatActivity`
- Telegram `ChatActivityEnterView`
- Telegram `ChatActivityEnterTopView`

| Action                                         | Status      | Source-backed note                                                                                                                                                                                                                                                                                               | Exact web work                                                                     |
| ---------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Open a cloud DM                                | Partial     | `pages/messages/conversation/page.tsx` correctly gates cloud conversations to `EnhancedConversation`, but the route owner is still the thin page-local stack.                                                                                                                                                    | Pick one canonical routed DM surface.                                              |
| Open a secret DM                               | Intentional | The route renders `MobileOnlyFeature` for `conversationType === 'secret'`.                                                                                                                                                                                                                                       | Do not treat this as web parity work.                                              |
| Send plain text                                | Ready       | `useEnhancedConversation.ts` fetches messages, joins the conversation socket, and sends text through the chat store.                                                                                                                                                                                             | Keep this path.                                                                    |
| Reply to a message                             | Ready       | The routed composer now renders reply preview/cancel state, sends `reply_to_id`, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                                            | Keep the browser proof green while converging the wider DM surface.                |
| React to a message                             | Partial     | `enhanced-message-bubble.tsx` can add reactions optimistically and now mounts the routed message action menu, but routed remove/toggle parity is still incomplete.                                                                                                                                               | Add routed reaction remove/toggle parity.                                          |
| Edit, delete, or forward a message             | Ready       | The routed DM page now mounts `useMessageActions(...)` through `MessageActionMenu`; edit, delete, and forward are browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                                                  | Keep the browser proof green while converging the wider DM surface.                |
| Select multiple messages                       | Missing     | No routed select-mode surface exists.                                                                                                                                                                                                                                                                            | Add batch select and batch actions.                                                |
| Send photo or file attachments                 | Ready       | The routed DM composer now selects files, previews the attachment, uploads through `/api/v1/uploads`, sends the shared upload-first metadata contract through the conversation message endpoint, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                            | Keep the browser proof green while converging the wider composer surface.          |
| Record and send voice or video notes           | Partial     | The routed DM composer now mounts `VoiceMessageRecorder`, posts voice recordings to `/api/v1/voice-messages` with `conversation_id`, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`. Video-note send is still not implemented.                                                              | Keep voice send; decide/build video notes if product keeps them.                   |
| Send stickers or GIFs                          | Ready       | The routed composer now mounts sticker and GIF pickers, sends structured `sticker` / `gif` message payloads through the conversation message endpoint, renders the sent media in the routed bubble, and is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                         | Keep proof green while converging the wider DM surface.                            |
| Emit typing while typing                       | Ready       | `useEnhancedConversation.ts` emits `typing=true` from input changes and clears typing on timeout, send, voice send, or route leave. The live routed input path is browser-verified by `apps/web/e2e/dm-media-composer.spec.ts` with an E2E-only observer.                                                        | Keep the browser proof green while converging the wider DM surface.                |
| Display incoming typing                        | Ready       | `TypingIndicator` renders from the canonical chat-store typing state, and the routed emit path is now paired with browser proof.                                                                                                                                                                                 | Keep the store/socket typing path covered while converging DM ownership.           |
| Search within a DM and jump to result          | Ready       | Search opens `/messages/:conversationId?scrollTo=:messageId`; the routed conversation consumes that anchor, avoids naive bottom-scroll override, and browser-verifies stable target focus plus jump-to-latest behavior in `apps/web/e2e/dm-media-composer.spec.ts`.                                              | Keep the browser proof green while converging the wider DM surface.                |
| Read and delivery receipts                     | Ready       | The routed conversation marks history as read, backend message JSON preloads `read_receipts` and exposes `metadata.readBy`, and `EnhancedMessageBubble` renders the Seen/read-receipt state; backend proof plus `apps/web/e2e/dm-media-composer.spec.ts` cover the path.                                         | Keep the receipt proof green while converging the wider DM surface.                |
| Pin messages and open a pinned panel           | Ready       | The routed DM action menu pins messages, the bubble shows pinned state, and the header opens a pinned-message panel with jump-back behavior; browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`.                                                                                                       | Keep the panel proof green while converging the wider DM surface.                  |
| Guard autoscroll and jump to unread            | Ready       | The routed conversation now keeps initial latest-open behavior, preserves explicit `scrollTo` anchors, only sticks to bottom for self-sent or bottom-adjacent updates, and renders a latest/new-messages jump when the reader is above the bottom. Browser-verified by `apps/web/e2e/dm-media-composer.spec.ts`. | Keep this path green while adding remaining composer/call parity.                  |
| Launch voice or video calls from the DM header | Ready       | `conversation-header.tsx` routes through `getDirectCallRoute(...)`, and `apps/web/e2e/dm-media-composer.spec.ts` browser-verifies that the live DM header opens `/call/:recipientId/audio` and `/call/:recipientId/video` with call-screen controls.                                                             | Keep the header proof green; verify incoming, media, and history entry separately. |
| Open sender profile from a message             | Ready       | `enhanced-message-bubble.tsx` routes avatar clicks to `/user/:userId`.                                                                                                                                                                                                                                           | Keep this path.                                                                    |
| Handle message requests, block, or report      | Ready       | The routed DM page loads pending request state, mounts `MessageRequestBanner`, and browser-verifies accept, reject/delete, and block-and-report actions.                                                                                                                                                         | Keep the browser proof green and add edge-state coverage later.                    |

## Hub access and navigation

Upstream references for this section:

- Telegram `DialogsActivity`
- Telegram `ChatObject`
- Telegram `ManageLinksActivity`

| Action                                               | Status  | Source-backed note                                                                                                                                                                                                                                             | Exact web work                                                                    |
| ---------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Create a hub                                         | Partial | `modules/groups/components/group-list/create-group-modal.tsx` creates a group and now routes via `getGroupRoute(...)`.                                                                                                                                         | Keep the create path, but land users in a surface with full hub semantics.        |
| Join a public hub from Explore                       | Partial | `pages/groups/explore-groups.tsx` joins and routes via `getGroupRoute(...)`.                                                                                                                                                                                   | Keep this, but ensure all channel types land on the correct destination surface.  |
| Join by invite code                                  | Partial | `pages/groups/components/server-list.tsx` includes a join-by-code modal and routes via `getGroupRoute(...)`.                                                                                                                                                   | Keep it, but add full invite-link management and preview parity.                  |
| Browse hubs in the server rail                       | Ready   | `server-list.tsx` renders a hub rail and navigates to mounted routes.                                                                                                                                                                                          | Keep it.                                                                          |
| Browse categories and channels within a hub          | Partial | `channel-list.tsx` renders categories and channels, but only create-category is live there.                                                                                                                                                                    | Keep browsing, then add real server-header and channel-management actions.        |
| Open the default routed channel after create or join | Partial | `modules/groups/routing.ts` resolves the first routeable channel, and typed channel destinations now include text, voice, video, announcement, and forum paths. `apps/web/e2e/web-owner-uat.spec.ts` verifies one text-channel route and one voice-room route. | Keep `getGroupRoute(...)`, then browser-verify each remaining entry path.         |
| Open a text channel                                  | Partial | `group-channel.tsx` loads messages, reactions, members, and thread panel; `apps/web/e2e/web-owner-uat.spec.ts` verifies a routed text-channel send. Key chat and admin parity remain incomplete.                                                               | Finish text-channel parity on the live route.                                     |
| Open an announcement channel                         | Partial | Announcement channels now route to `/groups/:groupId/announcements/:channelId` and render an announcement-labeled owner, but publisher/read-only semantics are still incomplete.                                                                               | Split announcement permissions and posting semantics from ordinary text channels. |
| Open a forum/topic channel                           | Partial | Forum channels now route to `/groups/:groupId/forums/:channelId` and render a topic-labeled owner, but it is not yet a true topic-first surface.                                                                                                               | Add the full topic/forum channel model.                                           |
| Open a voice channel                                 | Partial | Voice channels now route to `/groups/:groupId/voice/:channelId` and mount `GroupCallChannel` with `GroupCallView` plus LiveKit token context; `apps/web/e2e/web-owner-uat.spec.ts` verifies the room route and Join Call control.                              | Browser-verify the LiveKit join, leave, and error paths.                          |
| Open a video channel                                 | Partial | Video channels now route to `/groups/:groupId/video/:channelId` and mount the same room owner with video enabled by default.                                                                                                                                   | Browser-verify the video room join, leave, and camera paths.                      |
| Leave a hub from the routed shell                    | Partial | `/groups/:groupId/settings` now mounts the settings danger tab where `leaveGroup(...)` is wired, but browser verification and permission edge states remain open.                                                                                              | Browser-verify the leave flow inside the live hub shell.                          |

## Hub channel messaging and moderation

Upstream references for this section:

- Telegram `ChatActivity`
- Telegram `ChatActivityEnterView`
- Telegram `ChatRightsEditActivity`

| Action                                   | Status  | Source-backed note                                                                                                                                                                                                                                                                   | Exact web work                                                                    |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Send plain text in a text channel        | Ready   | `group-channel.tsx` can send plain text through `sendChannelMessage(...)`, and `apps/web/e2e/web-owner-uat.spec.ts` verifies the routed browser send path.                                                                                                                           | Keep this path.                                                                   |
| Reply to a channel message               | Ready   | The live channel page exposes reply-to state and reply preview in `message-input.tsx`.                                                                                                                                                                                               | Keep this path.                                                                   |
| React to a channel message               | Ready   | Reactions are live, and the routed message menu now covers edit, delete, report, copy-link, and pin entry actions. The message action menu is browser-verified by `apps/web/e2e/web-owner-uat.spec.ts`.                                                                              | Add permission edge-state proof.                                                  |
| Open and reply in a thread               | Partial | `channel-thread-panel.tsx` is real and mounted, but it is a side-panel thread, not a full Telegram topic model.                                                                                                                                                                      | Keep thread replies, then split full forum/topic semantics where needed.          |
| Attach files or images                   | Ready   | `message-input.tsx` has file picker UI, and `group-channel.tsx` now uploads through `/api/v1/uploads` before sending the full shared upload-first attachment payload through `sendChannelMessage(...)`. The routed browser path is verified by `apps/web/e2e/web-owner-uat.spec.ts`. | Keep this path while adding richer media parity.                                  |
| Send emoji from a picker                 | Ready   | `message-input.tsx` has an emoji picker and inserts emoji into the textarea.                                                                                                                                                                                                         | Keep this path.                                                                   |
| Send stickers, GIFs, or voice notes      | Missing | The routed group composer only covers text, attachments, emoji, and reply preview.                                                                                                                                                                                                   | Add sticker, GIF, and voice parity.                                               |
| Search messages in a channel             | Partial | The routed header now opens real loaded-channel message search, jumps between matches, highlights the target message, consumes `?scrollTo=...` links, and has routed browser proof in `apps/web/e2e/web-owner-uat.spec.ts`. It is not yet a backend older-history search.            | Decide whether older-message search is required.                                  |
| Change notifications or mute the channel | Partial | The routed header now toggles the current member's group notification level through `PATCH /api/v1/groups/:groupId/members/me/notifications`, with mute/unmute browser proof in `apps/web/e2e/web-owner-uat.spec.ts`. It is group-level, not per-channel granular.                   | Decide whether channel-level preferences are needed.                              |
| Open pinned messages list                | Partial | `pinned-messages-panel.tsx` fetches and renders pins, unpins through the channel pins endpoint, and reconciles loaded message state. Pin creation, panel fetch, and unpin are browser-verified; permission-denied states remain open.                                                 | Browser-verify permission-denied states.                                           |
| Pin a message from the live message UI   | Ready   | The routed message menu creates pins through `/api/v1/groups/:groupId/channels/:channelId/pins`, updates the live message state, and is browser-verified by `apps/web/e2e/web-owner-uat.spec.ts`.                                                                                    | Keep this path; decide separately if inline unpin is needed.                      |
| Report a message                         | Partial | `group-channel.tsx` now passes a real report handler that submits `/api/v1/reports` with `target_type: message`.                                                                                                                                                                     | Replace browser prompt with a richer report dialog when UX polish is prioritized. |
| Edit or delete a message                 | Partial | The routed message menu now edits and deletes through the joined group channel socket and reconciles local state.                                                                                                                                                                    | Browser-verify socket failure, timeout, and permission-denied states.             |
| See members in a sidebar                 | Ready   | `MembersSidebar` is mounted and populated.                                                                                                                                                                                                                                           | Keep this read-only surface.                                                      |

## Hub administration and settings

Upstream references for this section:

- Telegram `ChatRightsEditActivity`
- Telegram `ManageLinksActivity`
- Telegram `ChatObject`

| Action                                   | Status  | Source-backed note                                                                                                            | Exact web work                                           |
| ---------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Open hub settings                        | Partial | `/groups/:groupId/settings` now mounts `GroupSettingsPage`, and the live channel sidebar exposes a settings icon.             | Browser-verify settings load, close, save, and errors.   |
| Manage invites and invite links          | Partial | The routed settings page now mounts the invites tab and invite manager code.                                                  | Browser-verify create, list, copy, and delete flows.     |
| Create a new channel from the live shell | Partial | The routed settings page now mounts the channels tab and create-channel flow; the live sidebar still only creates categories. | Browser-verify channel creation and sidebar refresh.     |
| Create channel categories                | Ready   | `channel-list.tsx` posts to `/api/v1/groups/:id/categories`.                                                                  | Keep this path.                                          |
| Manage roles                             | Partial | The routed settings page now mounts `RoleManager`.                                                                            | Browser-verify role CRUD, reorder, and denial states.    |
| Manage members, kick, or ban             | Partial | The routed settings page now mounts member-management components.                                                             | Browser-verify member actions and rights flows.          |
| View audit log                           | Partial | The routed settings page now mounts `AuditLogTab`.                                                                            | Browser-verify audit-log loading and empty/error states. |
| Configure automod                        | Partial | The routed settings page now mounts `AutomodTab`.                                                                             | Browser-verify automod read/write states.                |
| Delete a hub                             | Partial | The routed settings page now mounts the danger tab where `deleteGroup(...)` is wired.                                         | Browser-verify delete confirmation and navigation.       |

## Broadcasts / Telegram channels / CGraph Broadcasts

Upstream references for this section:

- Telegram `ChatObject`
- Telegram `ChatRightsEditActivity`
- Telegram `ManageLinksActivity`

Important distinction:

- Telegram broadcast channels are one-way publisher surfaces with separate post, edit, delete, and
  pin rights.
- CGraph product language calls that a `Broadcast`.
- The web app now has first-class Broadcast routes for directory/create/detail/subscribe/publish.
  Per-hub announcement routes are still separate from this standalone Broadcast product.

| Action                                              | Status  | Source-backed note                                                                                                                                                                   | Exact web work                                                                        |
| --------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Browse a broadcast list                             | Ready   | `/broadcasts` now mounts `BroadcastsPage`, fetches the Broadcast directory through `useBroadcastStore`, and is browser-verified by `apps/web/e2e/broadcasts.spec.ts`.                | Keep the route and browser proof green.                                               |
| Create a broadcast                                  | Ready   | `/broadcasts` includes a route-owned create form backed by `POST /api/v1/broadcasts`; browser-verified by `apps/web/e2e/broadcasts.spec.ts`.                                         | Keep create contract coverage while adding richer management.                         |
| Open a broadcast feed                               | Ready   | `/broadcasts/:broadcastId` now mounts `BroadcastDetail`, fetches detail/posts, and renders the subscriber feed. Browser-verified by `apps/web/e2e/broadcasts.spec.ts`.               | Keep the feed route and add deeper post parity.                                       |
| Subscribe or join a broadcast                       | Ready   | The Broadcast detail route now toggles subscribe/unsubscribe through the Broadcast store with optimistic state and browser proof for subscribe.                                      | Add unsubscribe/error edge coverage later.                                            |
| Post as an admin only                               | Ready   | Broadcast owners now get a publisher composer on `/broadcasts/:broadcastId` backed by `POST /api/v1/broadcasts/:id/posts` and browser-verified by `apps/web/e2e/broadcasts.spec.ts`. | Add scheduled/media/poll publishing later.                                            |
| Edit or delete posts as a broadcaster               | Missing | No first-class broadcast post-management UI exists.                                                                                                                                  | Add post-management actions.                                                          |
| Pin broadcast posts                                 | Missing | No first-class broadcast surface exists to own post pinning.                                                                                                                         | Add pinned-post behavior in the Broadcast route.                                      |
| Manage broadcast invite or public links             | Missing | No Broadcast route exists to mount invite-link management.                                                                                                                           | Add link management for Broadcasts.                                                   |
| Configure broadcast admin rights                    | Missing | No Broadcast admin route exists.                                                                                                                                                     | Add admin-rights surface for Broadcasts.                                              |
| Open comments/discussion linked to a broadcast post | Missing | No broadcast discussion surface exists.                                                                                                                                              | Decide whether Broadcast comments map to a linked hub or thread model, then build it. |

## What the web app needs exactly

1. Keep Secret Chats out of scope on web. Do not spend web time trying to make the browser a
   Signal-participant device.
2. Replace the page-local messages shell with one canonical inbox and one canonical cloud-DM owner.
   The routed surface should own the list, composer, message actions, search jump, receipts,
   autoscroll, and pins.
3. Keep the browser-verified live inbox actions green: pin, mute, archive/recover, mark unread/read,
   and per-chat Space moves. Spaces are first-class at `/spaces`; Vault is first-class at `/vault`.
4. Split hub channel types into real routed products: text, forum/topic, voice, video, and
   announcement are not the same surface.
5. Finish remaining Broadcast management parity on web. Telegram-style broadcast channels map to
   CGraph Broadcasts, not to generic per-hub announcement channels.
6. Mount the existing hub administration stack inside the live routes: settings, invites, roles,
   member management, audit log, automod, leave, and delete.
7. Browser-verify the new routed hub header search and group mute/unmute behavior, then decide
   whether older-history search and per-channel notification preferences are required.
8. Converge DM and hub attachment flow onto one authoritative composer surface. The routed DM page
   has no real file path and the routed hub page still relies on a divergent multipart path.
9. Finish route-owned message parity: report, remaining delivery-state UI, and any message-state
   controls beyond the now-routed read receipts, guarded latest-jump behavior, and GIF/sticker send.
10. Finish route-owned call parity: keep the routed DM call-entry and call-history callback proofs
    green, then verify incoming and media/end-state behavior in the browser.
11. Browser-verify the canonical group entry paths and keep metadata-less `/groups/:groupId`
    fallbacks only for callers that truly cannot obtain channel context before navigation.

## Short conclusion

The live web app already has the beginnings of a real cloud-DM and hub experience, but it is still
missing the product shape that Signal and Telegram actually ship:

- one canonical inbox and conversation owner
- one canonical inbox and conversation owner, even though first-class chat-list actions and folders
  are now mounted and browser-verified
- channel-type-specific routed surfaces
- mounted hub admin screens
- first-class Broadcast routes

Until those are in place, the web app is still a partial messaging shell, not a truthful
Signal-plus-Telegram web parity surface.
