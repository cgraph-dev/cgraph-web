#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const packageRoots = [
  'packages/animation-constants',
  'packages/api-client',
  'packages/crypto',
  'packages/design-tokens',
  'packages/shared-types',
  'packages/utils',
];

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs']);
const allowedExternalImports = new Set(['@signalapp/libsignal-client', 'axios', 'zod']);
const wildcardExportPattern = /^\s*export\s+\*\s+from\s+['"][^'"]+['"];?/m;
const snapshotManifestPath = 'packages/CGRAPH_PACKAGES_SNAPSHOT.json';
const canonicalPackagesRepository = 'cgraph-dev/cgraph-packages';

const forbiddenImportPrefixes = [
  '@expo/',
  '@radix-ui/',
  '@react-native',
  '@tauri-apps/',
  '@tanstack/',
  '@vercel/',
  'expo',
  'framer-motion',
  'lucide-react',
  'motion',
  'next',
  'react',
  'react-dom',
  'react-native',
  'svelte',
  'vite',
  'vue',
  'zustand',
];

const forbiddenGlobals = new Map([
  ['AsyncStorage', 'Native storage belongs in the mobile client adapter.'],
  ['document', 'Browser DOM access belongs in a web adapter.'],
  ['indexedDB', 'Browser persistence belongs in a web adapter.'],
  ['localStorage', 'Browser persistence belongs in a web adapter.'],
  ['navigator', 'Runtime detection must stay explicitly allowlisted.'],
  ['sessionStorage', 'Browser persistence belongs in a web adapter.'],
  ['window', 'Browser globals belong in a web or desktop adapter.'],
]);

const allowedGlobalsByFile = new Map([
  ['packages/crypto/src/browser.ts', new Set(['navigator', 'window'])],
  ['packages/crypto/src/libsignal-bridge.ts', new Set(['navigator', 'window'])],
  ['packages/utils/src/httpClient.ts', new Set(['document'])],
]);

const importSourcePattern =
  /(?:import(?:\s+type)?[\s\S]*?\sfrom\s*|import\s*)['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
const retiredMobileRepositoryName = ['mobile', 'legacy', 'expo'].join('-');

function normalize(path) {
  return path.split(sep).join('/');
}

function relativePath(path) {
  return normalize(relative(process.cwd(), path));
}

function walk(dir) {
  if (!existsSync(dir)) return [];

  const files = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (entry === 'dist' || entry === 'node_modules') continue;
      files.push(...walk(path));
      continue;
    }

    if (stat.isFile() && sourceExtensions.has(extname(path))) {
      files.push(path);
    }
  }

  return files;
}

function sourceFiles() {
  return packageRoots
    .flatMap((root) => {
      const files = walk(join(process.cwd(), root, 'src'));
      const scriptsDir = join(process.cwd(), root, 'scripts');
      if (existsSync(scriptsDir)) files.push(...walk(scriptsDir));
      return files;
    })
    .filter((file) => {
      const rel = relativePath(file);
      return !rel.includes('/__tests__/') && !/[.]test[.]/.test(rel) && !/[.]spec[.]/.test(rel);
    });
}

function isInternalImport(source) {
  return source.startsWith('.') || source.startsWith('@cgraph/');
}

function isForbiddenImport(source) {
  return forbiddenImportPrefixes.some(
    (prefix) => source === prefix || source.startsWith(`${prefix}/`)
  );
}

function isAllowedNodeImport(rel, source) {
  return rel.startsWith('packages/api-client/scripts/') && source.startsWith('node:');
}

const findings = [];

function validateSnapshotManifest() {
  const path = join(process.cwd(), snapshotManifestPath);

  if (!existsSync(path)) {
    findings.push(`${snapshotManifestPath}: missing canonical package snapshot manifest.`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    findings.push(`${snapshotManifestPath}: invalid JSON.`);
    return;
  }

  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    findings.push(`${snapshotManifestPath}: manifest must be a JSON object.`);
    return;
  }

  if (manifest.source_repository !== canonicalPackagesRepository) {
    findings.push(
      `${snapshotManifestPath}: source_repository must be "${canonicalPackagesRepository}".`
    );
  }

  if (manifest.source_branch !== 'main') {
    findings.push(`${snapshotManifestPath}: source_branch must be "main".`);
  }

  if (
    typeof manifest.source_commit !== 'string' ||
    !/^[0-9a-f]{40}$/.test(manifest.source_commit)
  ) {
    findings.push(`${snapshotManifestPath}: source_commit must be a full 40-character commit SHA.`);
  }

  if (
    manifest.sync_status !== 'source-sync' &&
    manifest.sync_status !== 'source-drift' &&
    manifest.sync_status !== 'unverified'
  ) {
    findings.push(
      `${snapshotManifestPath}: sync_status must be "source-sync", "source-drift", or "unverified".`
    );
  }

  if (
    typeof manifest.sync_policy !== 'string' ||
    !manifest.sync_policy.includes('cgraph-packages')
  ) {
    findings.push(`${snapshotManifestPath}: sync_policy must name cgraph-packages.`);
  }
}

validateSnapshotManifest();

for (const file of sourceFiles()) {
  const rel = relativePath(file);
  const content = readFileSync(file, 'utf8');

  if (content.includes(retiredMobileRepositoryName)) {
    findings.push(`${rel}: references the retired mobile repository name.`);
  }

  if (wildcardExportPattern.test(content)) {
    findings.push(
      `${rel}: wildcard public re-exports hide package ownership; mirror named exports from cgraph-packages.`
    );
  }

  const allowedGlobals = allowedGlobalsByFile.get(rel) ?? new Set();
  for (const [globalName, reason] of forbiddenGlobals.entries()) {
    const pattern = new RegExp(`\\b${globalName}\\b`);
    if (pattern.test(content) && !allowedGlobals.has(globalName)) {
      findings.push(`${rel}: uses global "${globalName}". ${reason}`);
    }
  }

  for (const match of content.matchAll(importSourcePattern)) {
    const source = match[1] ?? match[2];
    if (!source) continue;
    if (isInternalImport(source)) continue;
    if (allowedExternalImports.has(source)) continue;
    if (isAllowedNodeImport(rel, source)) continue;

    if (isForbiddenImport(source)) {
      findings.push(`${rel}: imports "${source}", which belongs in app code.`);
      continue;
    }

    findings.push(`${rel}: imports unreviewed external dependency "${source}".`);
  }
}

if (findings.length > 0) {
  console.error('Package snapshot validation failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

const syncStatus = manifestSyncStatus();
console.log(`Package snapshot validation passed (${syncStatus}).`);

function manifestSyncStatus() {
  const manifest = JSON.parse(readFileSync(join(process.cwd(), snapshotManifestPath), 'utf8'));
  return `sync_status: ${manifest.sync_status}`;
}
