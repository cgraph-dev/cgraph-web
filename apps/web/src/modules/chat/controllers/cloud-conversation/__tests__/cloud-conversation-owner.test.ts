import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Cloud conversation ownership', () => {
  it('keeps the opened Cloud Chat surface on the shared modules/chat owner', () => {
    const route = source('src/pages/messages/conversation/page.tsx');
    const vaultRoute = source('src/pages/vault/vault-page.tsx');
    const cloudSurface = source(
      'src/modules/chat/components/cloud-conversation/cloud-conversation.tsx'
    );
    const routeCompatibilityExport = source(
      'src/pages/messages/enhanced-conversation/enhanced-conversation.tsx'
    );
    const hookCompatibilityExport = source(
      'src/pages/messages/enhanced-conversation/useEnhancedConversation.ts'
    );
    const inputCompatibilityExport = source(
      'src/pages/messages/enhanced-conversation/message-input-area.tsx'
    );

    expect(route).toContain("from '@/modules/chat/components/cloud-conversation'");
    expect(route).toContain('<CloudConversation />');
    expect(route).not.toContain('@/pages/messages/enhanced-conversation');
    expect(vaultRoute).toContain("from '@/modules/chat/components/cloud-conversation'");
    expect(vaultRoute).toContain('<CloudConversation />');
    expect(vaultRoute).not.toContain('@/pages/messages/enhanced-conversation');

    expect(cloudSurface).toContain("from '@/modules/chat/controllers/cloud-conversation'");
    expect(cloudSurface).toContain('useCloudConversationController');
    expect(cloudSurface).toContain('messageRequest.blocksComposer ?');
    expect(cloudSurface).toContain('<MessageRequestPanel');
    expect(cloudSurface).toContain('<MessageInputArea');
    expect(cloudSurface).not.toContain('requestBanner=');
    expect(cloudSurface).not.toContain("from './useEnhancedConversation'");

    expect(routeCompatibilityExport.trim()).toBe(
      [
        'export {',
        '  default,',
        '  CloudConversation,',
        '  EnhancedConversation,',
        "} from '@/modules/chat/components/cloud-conversation';",
      ].join('\n')
    );
    expect(hookCompatibilityExport.trim()).toBe(
      "export { useEnhancedConversation } from '@/modules/chat/components/cloud-conversation';"
    );
    expect(inputCompatibilityExport.trim()).toBe(
      "export { MessageInputArea } from '@/modules/chat/components/cloud-conversation';"
    );

    const routeOwnedApiPatterns = [
      '@/lib/api-client',
      '@/lib/socket',
      'uploadMessageAttachment',
      'uploadVoiceMessage',
      'messageRequests',
      'sendMessage(',
      'fetchMessages(',
      'markAsRead(',
    ];

    for (const pattern of routeOwnedApiPatterns) {
      expect(route).not.toContain(pattern);
      expect(cloudSurface).not.toContain(pattern);
      expect(routeCompatibilityExport).not.toContain(pattern);
      expect(hookCompatibilityExport).not.toContain(pattern);
    }
  });

  it('centralizes data, socket, upload, and action composition in modules/chat', () => {
    const controller = source(
      'src/modules/chat/controllers/cloud-conversation/use-cloud-conversation-controller.ts'
    );
    const messageRequest = source('src/modules/chat/hooks/use-message-request.ts');
    const voiceUpload = source(
      'src/modules/chat/controllers/cloud-conversation/voice-message-upload.ts'
    );
    const groupChannel = source('src/pages/groups/group-channel/group-channel.tsx');

    expect(controller).toContain('useChatStore');
    expect(controller).toContain('socketManager');
    expect(controller).toContain('currentParticipantRequestStatus');
    expect(controller).toContain('useMessageRequest(conversationId, currentParticipantRequestStatus)');
    expect(messageRequest).toContain('apiClient.messageRequests');
    expect(messageRequest).toContain("status === 'pending'");
    expect(messageRequest).toContain("status === 'blocked'");
    expect(controller).toContain('uploadMessageAttachment');
    expect(controller).toContain('shouldUsePrivateCloudChatAttachment');
    expect(controller).toContain("context: usePrivateUpload ? 'cloud_chat' : 'message'");
    expect(groupChannel).toContain("context: 'message'");
    expect(groupChannel).not.toContain("context: 'cloud_chat'");
    expect(controller).toContain('uploadVoiceMessage');
    expect(controller).toContain('sendMessage(conversationId');
    expect(controller).toContain('fetchMessages(conversationId)');
    expect(controller).toContain('markAsRead(conversationId)');
    expect(voiceUpload).toContain("http.post('/api/v1/voice-messages'");
  });

  it('keeps the routed inbox and chat-list actions on the shared conversation-list owner', () => {
    const route = source('src/pages/messages/messages/messages.tsx');
    const sidebarCompatibilityExport = source(
      'src/pages/messages/messages/conversation-sidebar.tsx'
    );
    const itemCompatibilityExport = source('src/pages/messages/messages/conversation-item.tsx');
    const spacesCompatibilityExport = source(
      'src/pages/messages/messages/conversation-spaces.ts'
    );
    const sidebar = source(
      'src/modules/chat/components/conversation-list/conversation-sidebar.tsx'
    );
    const item = source(
      'src/modules/chat/components/conversation-list/routed-conversation-item.tsx'
    );

    expect(route).toContain("from '@/modules/chat/components/conversation-list'");
    expect(route).not.toContain("from './conversation-sidebar'");
    expect(route).not.toContain("from './conversation-spaces'");
    expect(route).not.toContain("from './utils'");
    expect(route).toContain("onAddFriend={() => navigate('/social/friends')}");
    expect(sidebar).not.toContain('FriendRequestsPanel');
    expect(sidebar).not.toContain('acceptRequest');
    expect(sidebar).not.toContain('declineRequest');
    expect(sidebar).not.toContain('removeFriend');

    expect(sidebarCompatibilityExport.trim()).toBe(
      "export { ConversationSidebar } from '@/modules/chat/components/conversation-list';"
    );
    expect(itemCompatibilityExport.trim()).toBe(
      "export { RoutedConversationItem as ConversationItem } from '@/modules/chat/components/conversation-list';"
    );
    expect(spacesCompatibilityExport.trim()).toBe(
      "export * from '@/modules/chat/components/conversation-list/conversation-spaces';"
    );

    for (const action of [
      'onMarkAsRead',
      'onMarkAsUnread',
      'onArchive',
      'onUnarchive',
      'onPin',
      'onMute',
      'onToggleSpace',
      'onShowArchivedChange',
    ]) {
      expect(sidebar).toContain(action);
    }

    expect(item).toContain('conversationMatchesSpace');
    expect(item).toContain('handleMarkAsRead');
    expect(item).toContain('handlePinToggle');
    expect(item).toContain('handleMuteToggle');
    expect(item).toContain('handleSpaceToggle');
  });
});
