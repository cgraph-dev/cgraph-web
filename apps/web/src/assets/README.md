# CGraph Web Assets

This directory contains assets imported by the React bundle. Files that must be served by stable URL
belong in `public/` instead.

## Layout

- `lottie/borders/`: checked-in border animations used by cosmetics.
- `lottie/nameplates/`: nameplate animations. Do not add placeholder JSON; unresolved nameplates
  fall back to CSS rendering.
- `fonts/`, `images/`, `icons/`, `audio/`, `videos/`, `files/`: reserved asset buckets for
  feature-owned imports.

## Rules

- Use descriptive kebab-case filenames.
- Optimize images and videos before committing them.
- Keep runtime-generated files and design experiments out of this tree.
- Add assets only when a shipped component imports them or a documented registry references them.
