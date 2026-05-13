#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const srcRoot = join(process.cwd(), 'src');
const sourceExtensions = new Set(['.ts', '.tsx']);
const createImportPattern = /import\s+\{\s*create\s*\}\s+from\s+['"]zustand['"]/;
const maxCreateStores = 40;

const allowedLegacyRootStores = new Set([
  'src/stores/theme/store.ts',
  'src/stores/voiceStateStore.ts',
  'src/stores/featureFlagStore.ts',
  'src/stores/experimentStore.ts',
]);

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
      if (entry === 'node_modules' || entry === 'dist') continue;
      files.push(...walk(path));
      continue;
    }

    if (stat.isFile() && sourceExtensions.has(extname(path))) {
      files.push(path);
    }
  }
  return files;
}

const createStoreFiles = [];
const findings = [];

for (const file of walk(srcRoot)) {
  const rel = relativePath(file);
  const content = readFileSync(file, 'utf8');
  if (!createImportPattern.test(content)) continue;

  createStoreFiles.push(rel);

  if (rel.startsWith('src/stores/') && !allowedLegacyRootStores.has(rel)) {
    findings.push(`${rel}: root-level Zustand stores are not allowed; move state to an owning domain module.`);
  }
}

if (createStoreFiles.length > maxCreateStores) {
  findings.push(
    `Zustand store creation count is ${createStoreFiles.length}; limit is ${maxCreateStores}. Consolidate an existing store before adding another.`
  );
}

if (findings.length > 0) {
  console.error('State-store architecture gate failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(`State-store architecture gate passed (${createStoreFiles.length}/${maxCreateStores} create sites).`);
