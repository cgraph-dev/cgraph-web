#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE_URL = 'https://api.pixellab.ai/v2';
const repoRoot = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, '');
const defaultOutputDir = join(repoRoot, 'apps/web/public/cosmetics/pixellab');
const localSecretFile = join(homedir(), '.config/cgraph/secrets/pixellab.env');

const assetPlan = [
  {
    id: 'border_signal_noir_01',
    kind: 'avatar-border',
    endpoint: 'generate-ui-v2',
    size: { width: 192, height: 192 },
    colorPalette: 'graphite black, dark slate, cyan glow, muted silver',
    prompt:
      'transparent pixel art circular avatar frame, Signal-inspired secure messenger aesthetic, matte black graphite metal, cyan verification glow, subtle lock motifs, premium but restrained, no text, no face, no background',
  },
  {
    id: 'border_aurora_command_01',
    kind: 'avatar-border',
    endpoint: 'generate-ui-v2',
    size: { width: 192, height: 192 },
    colorPalette: 'deep teal, electric cyan, violet, glass highlights',
    prompt:
      'transparent pixel art circular avatar frame, aurora glass energy, teal violet highlights, thin luminous edge, professional social app cosmetic, no text, no face, no background',
  },
  {
    id: 'badge_verified_builder',
    kind: 'badge',
    endpoint: 'generate-ui-v2',
    size: { width: 96, height: 96 },
    colorPalette: 'cyan, silver, graphite, white highlight',
    prompt:
      'transparent pixel art badge icon for verified builder, shield and checkmark motif, cyan and silver palette, clean Discord-quality collectible badge, no text, no letters',
  },
  {
    id: 'badge_privacy_guardian',
    kind: 'badge',
    endpoint: 'generate-ui-v2',
    size: { width: 96, height: 96 },
    colorPalette: 'graphite, cyan, violet, dark navy',
    prompt:
      'transparent pixel art badge icon for privacy guardian, lock and orbiting signal waves, graphite cyan violet palette, premium messenger collectible badge, no text',
  },
  {
    id: 'border_ranked_ascendant_01',
    kind: 'avatar-border',
    endpoint: 'generate-ui-v2',
    size: { width: 192, height: 192 },
    colorPalette: 'royal sapphire, mythic gold, white crystal, dark navy',
    prompt:
      'transparent pixel art single centered circular avatar frame for top ranked players, mythic ascendant tier, fully closed sapphire crystal ring, integrated gold crown crest attached to top of ring, angular MOBA profile border, no extra detached objects, no second frame, transparent outside and inside circle, no face, no text, no background',
  },
  {
    id: 'border_ember_colossus_01',
    kind: 'avatar-border',
    endpoint: 'generate-ui-v2',
    size: { width: 192, height: 192 },
    colorPalette: 'obsidian, molten orange, bronze, ember red',
    prompt:
      'transparent pixel art single centered circular avatar frame only, heroic myth battle pass cosmetic, fully closed obsidian metal ring, molten lava channels built into the ring, bronze spikes attached to the frame, ember particles close to the ring, one object only, no planet, no moon, no sun, no separate orb, no extra detached objects, no second frame, transparent outside and inside circle, no face, no text, no background',
  },
  {
    id: 'border_void_relay_01',
    kind: 'avatar-border',
    endpoint: 'generate-ui-v2',
    size: { width: 192, height: 192 },
    colorPalette: 'black glass, void purple, electric violet, cold cyan',
    prompt:
      'transparent pixel art single centered circular avatar frame, cosmic void relay theme, fully closed black glass ring with violet gravity arcs and tiny star shards attached to the frame, premium profile cosmetic, no multiple frames, no extra sample circles, transparent outside and inside circle, no face, no text, no background',
  },
  {
    id: 'border_solar_grove_01',
    kind: 'avatar-border',
    endpoint: 'generate-ui-v2',
    size: { width: 192, height: 192 },
    colorPalette: 'emerald, sun gold, teal, warm white',
    prompt:
      'transparent pixel art circular avatar frame, solarpunk grove rank frame, emerald leaf filigree, sun-gold power nodes, polished game collectible, no face, no text, no background',
  },
  {
    id: 'theme_signal_noir_preview',
    kind: 'profile-theme-preview',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 180 },
    colorPalette: 'graphite black, cyan grid, subtle slate glass, cool white',
    prompt:
      'pixel art profile card background texture for secure messenger app, signal noir theme, graphite black surface, subtle cyan grid, soft glass highlights, no text, no people, usable as UI preview background',
  },
  {
    id: 'theme_ranked_ascendant_preview',
    kind: 'profile-theme-preview',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 180 },
    colorPalette: 'deep navy, sapphire, mythic gold, white crystal',
    prompt:
      'pixel art profile theme preview background, ranked ascendant game profile bundle, sapphire crystal arena UI, gold crest lighting, dramatic but clean space for app-rendered profile card, no text, no people, no logo',
  },
  {
    id: 'theme_ember_colossus_preview',
    kind: 'profile-theme-preview',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 180 },
    colorPalette: 'obsidian black, bronze, molten orange, ember red',
    prompt:
      'pixel art profile theme preview background, ember colossus heroic fantasy UI, obsidian forge plates, molten orange channels, premium game profile decoration, no text, no people, no logo',
  },
  {
    id: 'theme_void_relay_preview',
    kind: 'profile-theme-preview',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 180 },
    colorPalette: 'black, deep indigo, violet, cyan star light',
    prompt:
      'pixel art profile theme preview background, cosmic void relay, black glass command deck, violet star arcs, subtle constellation grid, premium sci-fi game profile UI, no text, no people, no logo',
  },
  {
    id: 'profile_signal_noir_founder',
    kind: 'profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 640, height: 360 },
    colorPalette: 'graphite black, dark slate, cyan signal glow, muted indigo, silver highlights',
    prompt:
      'wide pixel art full profile background for premium secure social app, Signal Noir Founder theme, graphite-black command surface, subtle cyan privacy grid, quiet node-commerce circuitry, pulse status light trails, space in center for app-rendered profile content, no people, no text, no logo, professional all-ages profile decoration',
  },
  {
    id: 'mini_signal_noir_founder',
    kind: 'mini-profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 285 },
    colorPalette: 'graphite black, dark navy, cyan signal glow, muted silver',
    prompt:
      'compact pixel art mini-profile hover card background for premium secure social app, Signal Noir Founder theme, dark graphite panel with cyan signal grid, subtle node wallet glyph shapes, pulse glow accents, clear empty middle for app-rendered avatar and text, no people, no text, no logo, professional all-ages UI decoration',
  },
  {
    id: 'profile_ranked_ascendant',
    kind: 'profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 640, height: 360 },
    colorPalette: 'deep navy, sapphire crystal, mythic gold, white highlights',
    prompt:
      'wide pixel art full profile background for premium game social app, Ranked Ascendant theme, sapphire crystal arena frame, gold crest rails, layered rank podium geometry, empty center for app-rendered profile content, no text, no logo, no people',
  },
  {
    id: 'mini_ranked_ascendant',
    kind: 'mini-profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 285 },
    colorPalette: 'deep navy, sapphire crystal, mythic gold, white highlights',
    prompt:
      'compact pixel art mini-profile hover card background, Ranked Ascendant theme, sapphire and gold rank frame accents, clean empty middle for app-rendered avatar and username, no text, no logo, no people',
  },
  {
    id: 'profile_ember_colossus',
    kind: 'profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 640, height: 360 },
    colorPalette: 'obsidian, bronze, molten orange, ember red, smoke gray',
    prompt:
      'wide pixel art full profile background for premium game social app, Ember Colossus theme, obsidian forge wall, molten bronze channels, heroic battle pass frame language, empty center for app-rendered profile content, no text, no logo, no people',
  },
  {
    id: 'mini_ember_colossus',
    kind: 'mini-profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 285 },
    colorPalette: 'obsidian, bronze, molten orange, ember red',
    prompt:
      'compact pixel art mini-profile hover card background, Ember Colossus theme, forged bronze edges, molten ember glow, clear empty middle for app-rendered avatar and text, no text, no logo, no people',
  },
  {
    id: 'profile_void_relay',
    kind: 'profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 640, height: 360 },
    colorPalette: 'black glass, deep indigo, void purple, electric violet, cyan starlight',
    prompt:
      'wide pixel art full profile background for premium game social app, Void Relay theme, black glass sci-fi deck, violet gravity arcs, constellation node network, empty center for app-rendered profile content, no text, no logo, no people',
  },
  {
    id: 'mini_void_relay',
    kind: 'mini-profile-background',
    endpoint: 'generate-image-v2',
    size: { width: 320, height: 285 },
    colorPalette: 'black glass, deep indigo, void purple, cyan starlight',
    prompt:
      'compact pixel art mini-profile hover card background, Void Relay theme, violet cosmic arcs, black glass panel, clear empty middle for app-rendered avatar and text, no text, no logo, no people',
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: true,
    wait: true,
    limit: assetPlan.length,
    kind: null,
    ids: null,
    outputDir: defaultOutputDir,
    force: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--') continue;
    if (arg === '--execute') options.dryRun = false;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--no-wait') options.wait = false;
    else if (arg === '--force') options.force = true;
    else if (arg === '--limit') options.limit = Number(args[++i] ?? assetPlan.length);
    else if (arg === '--kind') options.kind = args[++i] ?? null;
    else if (arg === '--id') {
      const value = args[++i] ?? '';
      options.ids = new Set(value.split(',').map((id) => id.trim()).filter(Boolean));
    }
    else if (arg === '--out-dir') options.outputDir = args[++i] ?? defaultOutputDir;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  pnpm pixellab:assets -- --dry-run
  pnpm pixellab:assets -- --execute --limit 1
  pnpm pixellab:assets -- --execute --kind badge --limit 2

Options:
  --execute       Actually call PixelLab and spend generations/credits.
  --dry-run       Print the asset plan only. Default.
  --kind <kind>   Filter by avatar-border, nameplate, badge, profile-theme-preview, profile-background, mini-profile-background.
  --id <ids>      Comma-separated asset IDs to generate.
  --limit <n>     Limit number of queued assets.
  --no-wait       Queue jobs and save job metadata without polling for completion.
  --out-dir <dir> Output directory. Default: apps/web/public/cosmetics/pixellab
  --force         Regenerate existing asset directories.
`);
}

async function loadLocalToken() {
  if (existsSync(localSecretFile)) {
    const raw = await readFile(localSecretFile, 'utf8');
    const match = raw.match(/PIXELLAB_API_TOKEN=(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
    const fileToken = match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
    if (fileToken) return fileToken;
  }

  return process.env.PIXELLAB_API_TOKEN ?? null;
}

function requestBody(asset) {
  const opaqueBackgroundKinds = new Set([
    'profile-theme-preview',
    'profile-background',
    'mini-profile-background',
  ]);
  const body = {
    description: asset.prompt,
    image_size: {
      width: asset.size.width,
      height: asset.size.height,
    },
    no_background: !opaqueBackgroundKinds.has(asset.kind),
  };
  if (asset.colorPalette && asset.endpoint === 'generate-ui-v2') {
    body.color_palette = asset.colorPalette;
  }
  return body;
}

async function pixellabFetch(path, token, init = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data);
    throw new Error(`PixelLab ${response.status} ${response.statusText}: ${detail}`);
  }

  return data;
}

async function queueAsset(asset, token) {
  return pixellabFetch(`/${asset.endpoint}`, token, {
    method: 'POST',
    body: JSON.stringify(requestBody(asset)),
  });
}

async function waitForJob(jobId, token) {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    const job = await pixellabFetch(`/background-jobs/${jobId}`, token);
    const status = String(job.status ?? '').toLowerCase();
    if (['completed', 'succeeded', 'success', 'failed', 'error', 'cancelled'].includes(status)) {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
  }
  throw new Error(`Timed out waiting for PixelLab job ${jobId}`);
}

function collectBase64Images(value, found = []) {
  if (!value || typeof value !== 'object') return found;
  if (
    typeof value.base64 === 'string' &&
    (value.base64.startsWith('data:image/') || value.type === 'base64' || value.format)
  ) {
    found.push({
      base64: value.base64,
      format: typeof value.format === 'string' ? value.format : 'png',
    });
  }
  if (typeof value.image_data === 'string' && value.image_data.startsWith('data:image/')) {
    found.push({ base64: value.image_data, format: 'png' });
  }
  for (const child of Object.values(value)) collectBase64Images(child, found);
  return found;
}

function collectImageUrls(value, found = []) {
  if (!value || typeof value !== 'object') return found;
  for (const key of ['url', 'image_url', 'storage_url', 'signed_url']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && /^https?:\/\//.test(candidate)) {
      found.push(candidate);
    }
  }
  for (const child of Object.values(value)) collectImageUrls(child, found);
  return found;
}

async function saveBase64Image(image, filePath) {
  const base64 = image.base64.includes(',') ? image.base64.split(',').pop() : image.base64;
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(base64, 'base64'));
}

async function saveImageUrl(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download PixelLab image ${url}: ${response.status}`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
}

async function saveAssetResult(asset, outputDir, queued, finalJob = null) {
  const assetDir = join(outputDir, asset.kind, asset.id);
  await mkdir(assetDir, { recursive: true });

  const jobId = queued?.background_job_id ?? queued?.job_id ?? finalJob?.id ?? null;
  const status = finalJob?.status ?? queued?.status ?? null;
  const metadata = {
    asset,
    jobId,
    status,
    imageCount: 0,
    generatedAt: new Date().toISOString(),
    source: 'pixellab',
  };

  const images = collectBase64Images(finalJob ?? queued);
  const imageUrls = [...new Set(collectImageUrls(finalJob ?? queued))];
  await Promise.all(
    images.map((image, index) =>
      saveBase64Image(image, join(assetDir, `${asset.id}_${index}.${image.format || 'png'}`))
    )
  );
  await Promise.all(
    imageUrls.map((url, index) => saveImageUrl(url, join(assetDir, `${asset.id}_url_${index}.png`)))
  );

  metadata.imageCount = images.length + imageUrls.length;
  await writeFile(join(assetDir, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);

  return {
    id: asset.id,
    kind: asset.kind,
    path: assetDir,
    imageCount: metadata.imageCount,
    jobId,
  };
}

async function main() {
  const options = parseArgs();
  const selected = assetPlan
    .filter((asset) => !options.kind || asset.kind === options.kind)
    .filter((asset) => !options.ids || options.ids.has(asset.id))
    .slice(0, options.limit);

  if (selected.length === 0) {
    throw new Error('No assets selected.');
  }

  if (options.dryRun) {
    console.log(JSON.stringify({ mode: 'dry-run', outputDir: options.outputDir, selected }, null, 2));
    return;
  }

  const token = await loadLocalToken();
  if (!token) {
    throw new Error(
      `PIXELLAB_API_TOKEN is not set. Put it in ${localSecretFile} or export it before running.`
    );
  }

  const manifest = [];
  for (const asset of selected) {
    const assetDir = join(options.outputDir, asset.kind, asset.id);
    if (!options.force && existsSync(join(assetDir, 'metadata.json'))) {
      console.log(`Skipping existing ${asset.kind}: ${asset.id}`);
      manifest.push({
        id: asset.id,
        kind: asset.kind,
        path: assetDir,
        imageCount: 0,
        jobId: null,
        skipped: true,
      });
      continue;
    }

    console.log(`Queueing ${asset.kind}: ${asset.id}`);
    const queued = await queueAsset(asset, token);
    const jobId = queued.background_job_id ?? queued.job_id;
    const finalJob = options.wait && jobId ? await waitForJob(jobId, token) : null;
    manifest.push(await saveAssetResult(asset, options.outputDir, queued, finalJob));
  }

  await mkdir(options.outputDir, { recursive: true });
  const manifestPath = join(options.outputDir, '_manifest.json');
  let existingManifest = [];
  if (existsSync(manifestPath)) {
    try {
      const raw = await readFile(manifestPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) existingManifest = parsed;
    } catch {
      existingManifest = [];
    }
  }

  const mergedManifestByKey = new Map();
  for (const entry of [...existingManifest, ...manifest]) {
    const key = `${entry.kind}:${entry.id}`;
    mergedManifestByKey.set(key, entry);
  }
  const mergedManifest = [...mergedManifestByKey.values()].sort((a, b) =>
    `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`)
  );

  await writeFile(manifestPath, `${JSON.stringify(mergedManifest, null, 2)}\n`);
  console.log(JSON.stringify({ outputDir: options.outputDir, manifest }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
