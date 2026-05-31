import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(fileURLToPath(new URL('..', import.meta.url)));
const packageSourceRoot = join(
  webRoot,
  'node_modules/@cgraph-dev/animation-constants/src'
);
const publicLottieRoot = join(webRoot, 'public/lottie');

const registryFiles = [
  'borders.ts',
  'registries/badges.ts',
  'registries/displayNameStyles.ts',
  'registries/nameplates.ts',
  'registries/titles.ts',
];

const requiredAssets = new Set([
  'effects/placeholder.json',
  'nameplates/placeholder.json',
]);

function normalizeLottiePath(rawPath) {
  if (/^(https?:)?\/\//.test(rawPath)) return null;
  if (rawPath.startsWith('/lottie/')) return rawPath.slice('/lottie/'.length);
  if (rawPath.startsWith('/')) return rawPath.slice(1);
  return rawPath;
}

for (const registryFile of registryFiles) {
  const sourcePath = join(packageSourceRoot, registryFile);
  const source = readFileSync(sourcePath, 'utf8');
  const matches = source.matchAll(/\blottieUrl:\s*['"]([^'"]+)['"]/g);

  for (const match of matches) {
    const normalizedPath = normalizeLottiePath(match[1]);
    if (normalizedPath) requiredAssets.add(normalizedPath);
  }
}

const failures = [];

for (const assetPath of [...requiredAssets].sort()) {
  const fullPath = join(publicLottieRoot, assetPath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing public Lottie asset: /lottie/${assetPath}`);
    continue;
  }

  try {
    const parsed = JSON.parse(readFileSync(fullPath, 'utf8'));
    if (parsed == null || typeof parsed !== 'object') {
      failures.push(`Invalid Lottie JSON object: /lottie/${assetPath}`);
      continue;
    }
    if (typeof parsed.v !== 'string' || !Array.isArray(parsed.layers)) {
      failures.push(`Lottie asset lacks version/layers: /lottie/${assetPath}`);
    }
  } catch (error) {
    failures.push(`Unparseable Lottie JSON: /lottie/${assetPath} (${error.message})`);
  }
}

if (failures.length > 0) {
  console.error('Customization Lottie asset check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Customization Lottie asset check passed (${requiredAssets.size} assets).`);
