import { memo, useMemo } from 'react';
import { SectionHeader } from '../customization-ui';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import {
  chatThemeBaseTabs,
  chatThemeSettingsToPreviewStyle,
  getChatThemeAccentPresetsForBase,
  getChatThemePresetSwatch,
  getDefaultChatThemePresetId,
  chatThemePresetId,
  type ChatThemeBase,
} from './chat-panel.constants';
import { ChatBubbleDemo } from './chat-bubble-demo';
import { ChatColorPicker } from './chat-color-picker';

export const ChatPanel = memo(function ChatPanel() {
  const chatThemeSettings = useCustomizationStore((state) => state.chatThemeSettings);
  const setChatThemePreset = useCustomizationStore((state) => state.setChatThemePreset);

  const selectedChatThemeBase = chatThemeSettings.base;
  const selectedChatThemePresetId = chatThemeSettings.presetId;
  const chatThemePresets = useMemo(
    () => getChatThemeAccentPresetsForBase(selectedChatThemeBase),
    [selectedChatThemeBase],
  );
  const chatThemePreview = useMemo(
    () => chatThemeSettingsToPreviewStyle(chatThemeSettings),
    [chatThemeSettings],
  );
  const selectChatThemeBase = (base: ChatThemeBase) => {
    setChatThemePreset(base, getDefaultChatThemePresetId(base));
  };

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          title="Chat Theme"
          subtitle="Message appearance"
          icon={
            <span
              className="block h-4 w-4 rounded-full"
              style={{ background: chatThemePreview.ownBackground }}
            />
          }
        />
        <div className="aurora-section-card space-y-4 rounded-xl p-4">
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Chat theme base"
          >
            {chatThemeBaseTabs.map((base) => (
              <button
                key={base.id}
                type="button"
                role="tab"
                aria-selected={selectedChatThemeBase === base.id}
                className={`h-9 shrink-0 rounded-md border px-3 text-sm font-medium transition ${
                  selectedChatThemeBase === base.id
                    ? "border-white/35 bg-white/[0.18] text-white"
                    : "border-white/10 bg-white/[0.07] text-white/70 hover:bg-white/[0.12]"
                }`}
                onClick={() => selectChatThemeBase(base.id)}
              >
                {base.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
            {chatThemePresets.map((preset) => {
              const presetId = chatThemePresetId(preset);
              const selected = selectedChatThemePresetId === presetId;

              return (
                <button
                  key={presetId}
                  type="button"
                  aria-label={`${selectedChatThemeBase} ${presetId}`}
                  aria-pressed={selected}
                  title={`${selectedChatThemeBase} ${presetId}`}
                  className={`h-9 rounded-md border transition ${
                    selected
                      ? "border-white/80 ring-2 ring-white/35"
                      : "border-white/15 hover:border-white/45"
                  }`}
                  style={{ background: getChatThemePresetSwatch(preset) }}
                  onClick={() =>
                    setChatThemePreset(selectedChatThemeBase, presetId)
                  }
                />
              );
            })}
          </div>

          <div
            className="space-y-3 rounded-lg border p-4"
            aria-label="Chat theme preview"
            role="region"
            style={{
              background: chatThemePreview.previewBackground,
              borderColor: `${chatThemePreview.previewBorderColor}80`,
            }}
          >
            <div className="space-y-3">
              <ChatBubbleDemo
                isOwn={false}
                message="Profile card is ready."
                themePreview={chatThemePreview}
              />
              <ChatBubbleDemo
                isOwn
                message="Send it to the node."
                themePreview={chatThemePreview}
              />
              <ChatBubbleDemo
                isOwn={false}
                message="Shared with the team."
                themePreview={chatThemePreview}
              />
            </div>
          </div>
        </div>
      </section>

      <ChatColorPicker />
    </div>
  );
});

export default ChatPanel;
