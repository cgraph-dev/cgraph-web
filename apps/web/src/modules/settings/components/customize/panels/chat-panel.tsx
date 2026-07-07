/**
 * Chat Panel
 *
 * Customization panel for chat bubbles, colors, animations, and layout options.
 */

import { memo, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  ColorPickerGrid,
  GradientSlider,
  ToggleRow,
  SectionHeader,
  OptionButton,
} from "../customization-ui";
import { useCustomizationStore } from "@/modules/settings/store/customization/customizationStore";
import {
  DEFAULT_CHAT_THEME_BASE,
  bubbleAnimations,
  bubbleStyles,
  chatThemeBaseTabs,
  getChatThemeAccentPresetsForBase,
  getChatThemePresetSwatch,
  getChatThemePreviewStyle,
  getDefaultChatThemePresetId,
  chatThemePresetId,
  type ChatThemeBase,
} from "./chat-panel.constants";
import { ChatBubbleDemo } from "./chat-bubble-demo";

// CHAT PANEL COMPONENT

export const ChatPanel = memo(function ChatPanel() {
  const [selectedChatThemeBase, setSelectedChatThemeBase] =
    useState<ChatThemeBase>(DEFAULT_CHAT_THEME_BASE);
  const [selectedChatThemePresetId, setSelectedChatThemePresetId] = useState(
    () => getDefaultChatThemePresetId(DEFAULT_CHAT_THEME_BASE),
  );
  const {
    chatBubbleStyle,
    chatBubbleColor,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    bubbleEntranceAnimation,
    bubbleGlassEffect,
    bubbleShowTail,
    bubbleHoverEffect,
    groupMessages,
    showTimestamps,
    compactMode,
    themePreset,
    setChatBubbleStyle,
    setChatBubbleColor,
    setBubbleBorderRadius,
    setBubbleShadowIntensity,
    setBubbleAnimation,
    toggleBubbleGlass,
    toggleBubbleTail,
    toggleBubbleHover,
    toggleGroupMessages,
    toggleTimestamps,
    toggleCompactMode,
  } = useCustomizationStore();

  const chatThemePresets = useMemo(
    () => getChatThemeAccentPresetsForBase(selectedChatThemeBase),
    [selectedChatThemeBase],
  );
  const chatThemePreview = useMemo(
    () =>
      getChatThemePreviewStyle(
        selectedChatThemeBase,
        selectedChatThemePresetId,
      ),
    [selectedChatThemeBase, selectedChatThemePresetId],
  );
  const selectChatThemeBase = (base: ChatThemeBase) => {
    setSelectedChatThemeBase(base);
    setSelectedChatThemePresetId(getDefaultChatThemePresetId(base));
  };

  return (
    <div className="space-y-8">
      {/* Cross-platform chat theme */}
      <section>
        <SectionHeader
          title="Chat Theme"
          subtitle="Cross-platform preset"
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
                  onClick={() => setSelectedChatThemePresetId(presetId)}
                />
              );
            })}
          </div>

          <div
            className="space-y-3 rounded-lg border p-4"
            style={{
              background: chatThemePreview.previewBackground,
              borderColor: `${chatThemePreview.previewBorderColor}80`,
            }}
          >
            <AnimatePresence mode="wait">
              <div
                key={`${chatThemePreview.base}-${chatThemePreview.presetId}-${bubbleEntranceAnimation}`}
                className="space-y-3"
              >
                <ChatBubbleDemo
                  isOwn={false}
                  message="Profile card is ready."
                  themePreview={chatThemePreview}
                />
                <ChatBubbleDemo
                  isOwn={true}
                  message="Send it to the node."
                  themePreview={chatThemePreview}
                />
                <ChatBubbleDemo
                  isOwn={false}
                  message="Shared with the team."
                  themePreview={chatThemePreview}
                />
              </div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Live Chat Preview */}
      <section>
        <SectionHeader
          title="Preview"
          subtitle="See how your chat bubbles look"
          icon={<span className="text-lg">💬</span>}
        />
        <div className="aurora-section-card space-y-3 rounded-xl p-4">
          <AnimatePresence mode="wait">
            <div
              key={`${chatBubbleStyle}-${bubbleEntranceAnimation}`}
              className="space-y-3"
            >
              <ChatBubbleDemo
                isOwn={false}
                message="Hey, check out my new profile!"
              />
              <ChatBubbleDemo
                isOwn={true}
                message="Wow, those effects look amazing! 🔥"
              />
              <ChatBubbleDemo
                isOwn={false}
                message="Thanks! Just customized everything"
              />
            </div>
          </AnimatePresence>
        </div>
      </section>

      {/* Bubble Style */}
      <section>
        <SectionHeader
          title="Bubble Style"
          subtitle="Choose your message bubble shape"
          icon={<span className="text-lg">🎨</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {bubbleStyles.map((style) => (
            <OptionButton
              key={style.id}
              selected={chatBubbleStyle === style.id}
              onClick={() => setChatBubbleStyle(style.id)}
              icon={<span className="text-xl">{style.icon}</span>}
              label={style.name}
              colorPreset={themePreset}
            />
          ))}
        </div>
      </section>

      {/* Bubble Color */}
      <section>
        <SectionHeader
          title="Bubble Color"
          subtitle="Set your outgoing message color"
          icon={<span className="text-lg">🌈</span>}
        />
        <ColorPickerGrid
          selected={chatBubbleColor}
          onSelect={setChatBubbleColor}
          size="lg"
        />
      </section>

      {/* Sliders */}
      <section>
        <SectionHeader
          title="Fine Tuning"
          subtitle="Adjust bubble appearance"
          icon={<span className="text-lg">🎚️</span>}
        />
        <div className="aurora-section-card space-y-6 rounded-xl p-4">
          <GradientSlider
            label="Border Radius"
            value={bubbleBorderRadius}
            min={0}
            max={50}
            onChange={setBubbleBorderRadius}
            colorPreset={themePreset}
            suffix="px"
          />
          <GradientSlider
            label="Shadow Intensity"
            value={bubbleShadowIntensity}
            min={0}
            max={100}
            onChange={setBubbleShadowIntensity}
            colorPreset={themePreset}
            suffix="%"
          />
        </div>
      </section>

      {/* Entrance Animation */}
      <section>
        <SectionHeader
          title="Entrance Animation"
          subtitle="How messages appear on screen"
          icon={<span className="text-lg">✨</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {bubbleAnimations.map((anim) => (
            <OptionButton
              key={anim.id}
              selected={bubbleEntranceAnimation === anim.id}
              onClick={() => setBubbleAnimation(anim.id)}
              icon={<span className="text-xl">{anim.icon}</span>}
              label={anim.name}
              colorPreset={themePreset}
            />
          ))}
        </div>
      </section>

      {/* Visual Effects */}
      <section>
        <SectionHeader
          title="Visual Effects"
          subtitle="Toggle bubble visual features"
          icon={<span className="text-lg">💎</span>}
        />
        <div className="aurora-section-card rounded-xl p-4">
          <ToggleRow
            label="Glass Effect"
            description="Frosted glass appearance"
            icon="🪟"
            enabled={bubbleGlassEffect}
            onToggle={toggleBubbleGlass}
            colorPreset={themePreset}
          />
          <div className="aurora-divider my-2 border-t" />
          <ToggleRow
            label="Message Tail"
            description="Speech bubble pointer"
            icon="💬"
            enabled={bubbleShowTail}
            onToggle={toggleBubbleTail}
            colorPreset={themePreset}
          />
          <div className="aurora-divider my-2 border-t" />
          <ToggleRow
            label="Hover Animation"
            description="Lift effect on hover"
            icon="✨"
            enabled={bubbleHoverEffect}
            onToggle={toggleBubbleHover}
            colorPreset={themePreset}
          />
        </div>
      </section>

      {/* Layout Options */}
      <section>
        <SectionHeader
          title="Layout Options"
          subtitle="Customize chat layout"
          icon={<span className="text-lg">📐</span>}
        />
        <div className="aurora-section-card rounded-xl p-4">
          <ToggleRow
            label="Show Timestamps"
            description="Display message times"
            icon="🕐"
            enabled={showTimestamps}
            onToggle={toggleTimestamps}
            colorPreset={themePreset}
          />
          <div className="aurora-divider my-2 border-t" />
          <ToggleRow
            label="Group Messages"
            description="Stack consecutive messages"
            icon="📦"
            enabled={groupMessages}
            onToggle={toggleGroupMessages}
            colorPreset={themePreset}
          />
          <div className="aurora-divider my-2 border-t" />
          <ToggleRow
            label="Compact Mode"
            description="Reduce spacing between messages"
            icon="📐"
            enabled={compactMode}
            onToggle={toggleCompactMode}
            colorPreset={themePreset}
          />
        </div>
      </section>
    </div>
  );
});

export default ChatPanel;
