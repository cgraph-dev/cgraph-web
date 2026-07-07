import { describe, expect, it } from "vitest";
import { CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS } from "@cgraph-dev/shared-types";

import {
  CHAT_THEME_BASES,
  bubbleAnimations,
  chatThemeBaseTabs,
  chatThemePresetId,
  deriveDarkChatThemeMessageColors,
  getChatThemeAccentPresetsForBase,
  getChatThemePresetSwatch,
  getChatThemePreviewStyle,
} from "../chat-panel.constants";

describe("chat panel constants", () => {
  it("uses the shared package entrance animation set", () => {
    expect(bubbleAnimations.map((animation) => animation.id)).toEqual(
      CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS,
    );
    expect(bubbleAnimations.map((animation) => animation.id)).toEqual([
      "none",
      "slide",
      "fade",
      "scale",
      "bounce",
      "flip",
    ]);
  });

  it("keeps the source-first T3G base order and preset counts", () => {
    expect(CHAT_THEME_BASES).toEqual(["classic", "day", "night", "tinted"]);
    expect(chatThemeBaseTabs.map((tab) => tab.id)).toEqual(CHAT_THEME_BASES);
    expect(getChatThemeAccentPresetsForBase("classic")).toHaveLength(16);
    expect(getChatThemeAccentPresetsForBase("day")).toHaveLength(13);
    expect(getChatThemeAccentPresetsForBase("night")).toHaveLength(11);
    expect(getChatThemeAccentPresetsForBase("tinted")).toHaveLength(9);
    expect(getChatThemeAccentPresetsForBase("classic")[0]?.id).toBe(106);
    expect(getChatThemeAccentPresetsForBase("day")[0]?.id).toBe(101);
    expect(getChatThemeAccentPresetsForBase("night")[0]?.id).toBe(102);
    expect(getChatThemeAccentPresetsForBase("tinted")[0]?.id).toBe(10);
  });

  it("keeps T3G preset ids, swatches, and dark bubble HSV math", () => {
    const dayPreset = getChatThemeAccentPresetsForBase("day")[0];
    const tintedPreset = getChatThemeAccentPresetsForBase("tinted")[0];

    expect(dayPreset).toBeDefined();
    expect(tintedPreset).toBeDefined();
    if (!dayPreset || !tintedPreset) {
      throw new Error("expected chat theme presets");
    }

    expect(chatThemePresetId(dayPreset)).toBe("preset:101");
    expect(getChatThemePresetSwatch(dayPreset)).toBe(
      "linear-gradient(135deg, #0088ff, #ff53f4)",
    );
    expect(deriveDarkChatThemeMessageColors(0x0088ff)).toEqual([
      0x517893, 0x285c96,
    ]);
    expect(tintedPreset.messageColors).toEqual([0x517893, 0x285c96]);
  });

  it("builds a preview style from source preset settings", () => {
    const preview = getChatThemePreviewStyle("tinted", "preset:10");

    expect(preview).toMatchObject({
      base: "tinted",
      presetId: "preset:10",
      accentHex: "#0088ff",
      ownBackground: "linear-gradient(135deg, #517893, #285c96)",
      ownTailBackground: "#285c96",
      ownTextColor: "#f8fafc",
      incomingTextColor: "#f8fafc",
      previewBorderColor: "#0088ff",
    });
    expect(preview.previewBackground).toContain("#1e3557");
  });
});
