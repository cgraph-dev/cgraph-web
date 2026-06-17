# Profile Theme Asset Guide

Profile themes are a 3-file cosmetic set. Keep all three visually matched so the picker card, live preview, mini popout, and public profile page feel like the same owned theme.

## Required Sizes

Use these exact exported sizes for the web app:

- Theme picker preview: `320x180`
- Full profile background/header: `640x360`
- Mini profile background/header: `320x285`

Higher-quality source files are fine if the generator supports them, then downscale:

- Theme picker preview source: `640x360`
- Full profile background/header source: `1280x720`
- Mini profile background/header source: `640x570`

The renderer uses these areas:

- Full card header: top `136px` of the `640x360` asset
- Mini card header: top `104px` of the `320x285` asset
- Public profile header: full-width crop from the same `640x360` asset
- Avatar overlap: keep the lower center of the header clean because the avatar anchors there

Export PNG for static themes, GIF or WebP for animated themes. Prefer seamless loops between `8` and `16` frames, `1.5s` to `3s`, with calm motion. No text, letters, logos, icons, avatars, people, or UI buttons inside profile theme backgrounds.

## Safe Composition

- Top 45%: animated hero/header area.
- Middle 20%: avatar landing area, readable and not too busy.
- Bottom 35%: darker profile card surface for nameplates, titles, bio, badges, and future buttons.

Do not put important details in the exact center-bottom edge of the header; the avatar and nameplate will sit there. Avoid pure black empty areas, but keep contrast high enough for white and neon UI.

## Storage Paths

Use lowercase slugs with underscores:

- `apps/web/public/cosmetics/pixellab/profile-theme-preview/theme_<slug>_preview/theme_<slug>_preview_0.gif`
- `apps/web/public/cosmetics/pixellab/profile-background/profile_<slug>/profile_<slug>_0.gif`
- `apps/web/public/cosmetics/pixellab/mini-profile-background/mini_<slug>/mini_<slug>_0.gif`

PNG is also valid. Use the same filename stem and only change the extension.

## Base Prompt Template

Full profile background/header:

```text
Seamless looping animated profile theme background, 640x360, premium pixel-art game profile card, [THEME DETAILS]. Top 45 percent is a rich animated banner scene, bottom 35 percent is a darker readable profile-card surface, center lower header has clean space for a circular avatar overlap. Subtle particles and light movement only, no camera shake. No text, no letters, no numbers, no logos, no icons, no characters, no UI buttons.
```

Mini profile background/header:

```text
Seamless looping animated mini profile card background, 320x285, same style as the full profile theme, [THEME DETAILS]. Strong readable top banner, darker lower card surface, centered safe space for avatar and username overlay. Small subtle loop, no camera shake. No text, no letters, no numbers, no logos, no icons, no characters, no UI buttons.
```

Theme picker preview:

```text
Static or seamless looping animated theme preview tile, 320x180, premium pixel-art game profile theme preview, [THEME DETAILS]. Show the theme mood clearly in a compact card preview. No text, no letters, no numbers, no logos, no icons, no characters, no UI buttons.
```

## Theme Prompts

Signal Noir:

```text
encrypted noir command room, black glass panels, cyan signal lines, faint waveform pulses, subtle privacy-grid scanlines, cold blue edge light, quiet secure messaging mood
```

Aurora Glass:

```text
crystal aurora lounge, polished blue glass ribbons, gold-and-ice trim, soft northern lights moving across transparent panels, premium ranked-profile energy
```

Retro Terminal:

```text
green phosphor terminal world, dark CRT grid, tiny command-line glow, old monitor bloom, subtle horizontal scanlines, hacker console atmosphere
```

Solarpunk Canopy:

```text
lush emerald glass greenhouse, sunlit leaves, botanical brass rails, soft golden pollen particles, premium nature-tech profile card
```

Deep Space:

```text
black cosmic observatory, violet gravity arcs, distant star map, nebula shimmer, dark glass lower surface, mythic space-profile atmosphere
```

Sakura Dream:

```text
moonlit sakura pavilion, rose glass panels, drifting petals, pearl metal rails, soft pink bloom lights, elegant limited-event profile theme
```

Ember Forge:

```text
molten forge hall, bronze armor trim, ember channels, slow heat shimmer, dark basalt card surface, battle-pass legendary profile mood
```

## Animation Prompt Add-On

Append this when animating an existing theme image:

```text
Animate only the environmental light and particles. Keep the exact same composition, crop, scale, colors, safe avatar area, and readable lower card surface in every frame. Make it a seamless loop. Do not add text, letters, numbers, logos, icons, characters, extra panels, or new objects.
```
