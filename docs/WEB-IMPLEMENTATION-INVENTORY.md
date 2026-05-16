# Web Implementation Inventory (May 2026)

This document answers four implementation questions:

1. what in the current web UI is fake or decorative
2. what existing routed surfaces still need real handlers
3. what existing module code needs to be mounted into the routed app
4. what first-class web routes or products still need to be created

This inventory is based on the current audit docs plus targeted source revalidation on 2026-05-13.

Closure rule: do not close an implementation task from source reads or diffs alone. Verify the live
routed web behavior first, or run the narrowest equivalent executable check if direct browser
verification is not available.

## Revalidated corrections versus the older May audit

These items were stale in the older audit and should not be re-implemented as if they were still
missing:

- DM search jump is already wired in
  `apps/web/src/pages/messages/enhanced-conversation/useEnhancedConversation.ts`.
- Routed DM typing emit is already wired in
  `apps/web/src/pages/messages/enhanced-conversation/useEnhancedConversation.ts`.
- Group uploads already go through `/api/v1/uploads` plus metadata send in
  `apps/web/src/pages/groups/group-channel/group-channel.tsx`.
- Social now renders a real `SocialMainPane` in `apps/web/src/pages/social/social/social.tsx`
  instead of the old placeholder-only center pane.
- Call history no longer falls back to demo rows; failed loads show a real error state in
  `apps/web/src/pages/calls/call-history/call-history-page.tsx`.
- DND schedule save is live in
  `apps/web/src/modules/settings/components/panels/dnd-schedule-panel.tsx`.
- Account deletion is wired to the password-confirmed endpoint in
  `apps/web/src/pages/settings/delete-account.tsx`.
- Routed group header search and mute are real in
  `apps/web/src/pages/groups/group-channel/group-channel.tsx`: search jumps through loaded channel
  messages and the bell action patches the current member's group notification preference.
- Routed DM read receipts are real in
  `apps/web/src/pages/messages/enhanced-conversation/enhanced-message-bubble.tsx`: backend message
  JSON carries `metadata.readBy`, and the routed bubble renders Seen/read-receipt state.

## Fixed in this slice

These were fake routed controls when the inventory was first written and have now been removed so
the web UI stops implying behavior that does not exist.

- the DM theme-refresh no-op in
  `apps/web/src/pages/messages/enhanced-conversation/enhanced-conversation.tsx`
- the fake DM attachment and microphone controls in
  `apps/web/src/pages/messages/enhanced-conversation/message-input-area.tsx`; they have since been
  replaced with browser-verified file/photo attachment send and voice-note recording/send
- the fake group-channel search and bell controls in
  `apps/web/src/pages/groups/group-channel/channel-header.tsx`; they have since been replaced with
  real loaded-channel search and a backend-backed group mute/unmute action
- the fake group-message `More` button in
  `apps/web/src/pages/groups/group-channel/channel-message-item.tsx`; it has since been replaced
  with route-owned edit, delete, report, pin, and copy-link actions
- the fake hub-shell header dropdown and footer settings button in
  `apps/web/src/pages/groups/components/channel-list.tsx`
- the fake discover `Join` button for non-user results in
  `apps/web/src/pages/social/social/discover-tab.tsx`; unjoined group results now call the real
  public-group join action, while joined groups and forums remain explicit route-open entries

## Fake Or Decorative Controls On Live Web Routes

These controls are visible in the shipped routed web UI but do not currently perform the action the
user would expect.

| Surface              | Visible control            | Current behavior                                                                                                                                                                                                                                                               | Source                                                                                                                                             | Needed fix                                                                                                |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Bare hub destination | `/groups/:groupId` landing | The groups owner redirects to the canonical channel once group data resolves. Social discovery, global Explore cards, and notification callers now use channel metadata when they have it. Lower-context callers can still emit the bare route when they only know a group id. | `apps/web/src/pages/groups/groups-page.tsx`, `apps/web/src/pages/explore/community-routing.ts`, and `apps/web/src/pages/social/social/*routing.ts` | Browser-verify canonical entry paths and keep the bare route as a documented metadata-less fallback only. |

## Broken Destinations And Misleading Navigation

These are not fake buttons in the narrow sense, but they create fake success because the UI looks
connected while navigation lands somewhere blank or semantically wrong.

| Problem                                                  | Current behavior                                                                                                                               | Source                                                                                                                      | Needed fix                                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Bare hub route is mounted as blank                       | `/groups/:groupId` is mounted with `element={null}`, but the parent route redirects to the canonical default channel once group data resolves. | `apps/web/src/routes/app-routes.tsx` and `apps/web/src/pages/groups/groups-page.tsx`                                        | Browser-verify the redirect path and keep it as a metadata-less fallback only.    |
| Voice/video channels use the generic text shell          | Fixed at the route-owner layer: channel items now navigate to `/voice/:channelId` and `/video/:channelId` mounted room routes.                 | `apps/web/src/modules/groups/routing.ts`, `apps/web/src/pages/groups/group-call-channel.tsx`, and `app-routes.tsx`          | Browser-verify LiveKit join, leave, and error states.                             |
| Announcement/forum channels reuse the generic text shell | Fixed at the route-owner layer: announcement and forum channels now use `/announcements/:channelId` and `/forums/:channelId` route owners.     | `apps/web/src/modules/groups/routing.ts`, `group-announcement-channel.tsx`, `group-forum-channel.tsx`, and `app-routes.tsx` | Finish publisher-only announcement semantics and true topic-first forum behavior. |

## Implement Next: Existing Routed UI That Needs Real Handlers

These are the highest-value web fixes because the UI is already present.

1. Browser-verify the real group header search and group mute/unmute controls.
2. Decide whether loaded-message group search is enough or whether older-history/backend search is
   required.
3. Browser-verify the real group message context menu, including pin, edit, delete, report, and
   copy-link failure states.
4. Remove remaining direct bare-group producers when the caller already knows the mounted
   destination.
5. Browser-verify the new Social discover direct-join action for groups and the explicit route-open
   behavior for joined groups and forums.
6. Browser-verify the routed hub admin/settings launcher and settings tabs now mounted at
   `/groups/:groupId/settings`.

## Add More: Existing Module Code That Should Be Mounted

These features already exist in module-level code and should be moved onto the live routed web
surfaces instead of being rebuilt from scratch.

Recently closed from this table: routed DM edit/delete/forward actions, routed message-request
accept/reject/block-report actions, routed Seen/read-receipt rendering, and guarded routed DM
scroll/search-anchor behavior are now mounted and browser-verified by
`apps/web/e2e/dm-media-composer.spec.ts`. The read-receipt backend contract is covered by
`apps/backend/test/cgraph_web/controllers/api/v1/message_controller_test.exs`. The focused owner UAT
smoke for auth, DMs, group text send, Social discover, settings, Nodes wallet, direct calls, and
group voice rooms is now covered by `apps/web/e2e/web-owner-uat.spec.ts`.

| Existing capability                              | Existing source                                                                                                                                    | Where it should be mounted                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Conversation list action menu (pin/mute/archive) | `apps/web/src/modules/chat/components/conversation-list/conversation-menu.tsx`                                                                     | Routed inbox sidebar under `apps/web/src/pages/messages/messages/*`             |
| Hub settings shell                               | `apps/web/src/modules/groups/components/group-settings/group-settings.tsx`                                                                         | Mounted at `/groups/:groupId/settings`; browser verification pending            |
| Create channel modal                             | `apps/web/src/modules/groups/components/channel-list/create-channel-modal.tsx`                                                                     | Mounted through the routed settings channels tab; browser verification pending  |
| Invite management                                | `apps/web/src/modules/groups/components/invite-modal/invite-modal.tsx` and `apps/web/src/modules/groups/components/group-settings/invites-tab.tsx` | Mounted through the routed settings invites tab; browser verification pending   |
| Role management                                  | `apps/web/src/modules/groups/components/role-manager/role-manager.tsx`                                                                             | Mounted through the routed settings roles tab; browser verification pending     |
| Member management                                | `apps/web/src/modules/groups/components/group-settings/members-tab.tsx`                                                                            | Mounted through the routed settings members tab; browser verification pending   |
| Audit log                                        | `apps/web/src/modules/groups/components/group-settings/audit-log-tab.tsx`                                                                          | Mounted through the routed settings audit-log tab; browser verification pending |
| Automod                                          | `apps/web/src/modules/groups/components/group-settings/automod-tab.tsx`                                                                            | Mounted through the routed settings automod tab; browser verification pending   |

## Create: First-Class Web Routes Or Surfaces That Do Not Exist Yet

These are real missing products or route surfaces, not just wiring work.

Recently closed from this list: first-class Broadcast directory/detail/create/subscribe/publish
routes now exist and are browser-verified by `apps/web/e2e/broadcasts.spec.ts`; first-class Vault
routes now exist at `/vault` and `/vault/:conversationId`, backed by the backend Note-to-Self
contract and browser-verified by `apps/web/e2e/vault.spec.ts`; first-class Spaces routes now exist
at `/spaces` and `/spaces/:spaceId`, backed by `/api/v1/spaces` and browser-verified by
`apps/web/e2e/spaces.spec.ts`; canonical identity field preservation now exists through
`packages/shared-types/src/identity.ts`, `apps/web/src/lib/identity/canonicalIdentity.ts`, backend
message/conversation JSON, and the web auth/profile/friend/chat/group normalizers; routed DM and
group attachments now share the upload-first media contract in `packages/shared-types/src/media.ts`.

1. A canonical bare-hub surface or redirect strategy for `/groups/:groupId`.
2. Browser-verified voice-channel room behavior.
3. Browser-verified video-channel room behavior.
4. Full announcement-channel publisher/read-only semantics.
5. Full forum/topic-first hub behavior if topics are meant to behave differently from side threads.
6. Per-chat Space membership controls from the live conversation list.

## Not Web Work By Design

These should not be treated as missing web parity tasks.

- Secret Chats / Ghost Chat participation on web.
- Signal-style device attestation on web.
- E2EE key verification flows that require the mobile/desktop trust boundary.

For the user-facing version of this inventory, see `docs/WEB-SUPPORT-MATRIX.md`.
