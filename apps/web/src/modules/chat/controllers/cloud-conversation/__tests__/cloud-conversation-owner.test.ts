import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Cloud conversation ownership', () => {
  it('keeps the messages route on the shared modules/chat controller', () => {
    const route = source('src/pages/messages/enhanced-conversation/enhanced-conversation.tsx');
    const compatibilityExport = source(
      'src/pages/messages/enhanced-conversation/useEnhancedConversation.ts'
    );

    expect(route).toContain("from '@/modules/chat/controllers/cloud-conversation'");
    expect(route).toContain('useCloudConversationController');
    expect(route).not.toContain("from './useEnhancedConversation'");

    expect(compatibilityExport).toContain(
      'useCloudConversationController as useEnhancedConversation'
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
      expect(compatibilityExport).not.toContain(pattern);
    }
  });

  it('centralizes data, socket, upload, and action composition in modules/chat', () => {
    const controller = source(
      'src/modules/chat/controllers/cloud-conversation/use-cloud-conversation-controller.ts'
    );
    const voiceUpload = source(
      'src/modules/chat/controllers/cloud-conversation/voice-message-upload.ts'
    );

    expect(controller).toContain('useChatStore');
    expect(controller).toContain('socketManager');
    expect(controller).toContain('apiClient.messageRequests');
    expect(controller).toContain('uploadMessageAttachment');
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
