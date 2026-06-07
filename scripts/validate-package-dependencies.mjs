#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const expectedPackages = new Map([
  ['@cgraph-dev/animation-constants', '1.1.4'],
  ['@cgraph-dev/api-client', '1.1.1'],
  ['@cgraph-dev/design-tokens', '1.0.1'],
  ['@cgraph-dev/shared-types', '1.1.4'],
  ['@cgraph-dev/utils', '1.0.1'],
]);

const forbiddenLocalProtocols = ['workspace:', 'file:', 'link:', 'portal:'];
const forbiddenWebRuntimePackages = new Set([
  '@cgraph-dev/crypto',
  '@cgraph/crypto',
  '@signalapp/libsignal-client',
]);
const sourceExtensions = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const findings = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    findings.push(`${path}: could not read JSON (${error.message}).`);
    return {};
  }
}

function walkSourceFiles(dir) {
  const files = [];
  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSourceFiles(path));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (sourceExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

const rootDir = process.cwd();
const rootPackagePath = join(rootDir, 'package.json');
const rootPackage = readJson(rootPackagePath);
const webPackagePath = join(rootDir, 'apps/web/package.json');
const webPackage = readJson(webPackagePath);
const dependencies = webPackage.dependencies ?? {};
const allDependencySections = [
  webPackage.dependencies,
  webPackage.devDependencies,
  webPackage.optionalDependencies,
  webPackage.peerDependencies,
].filter(Boolean);

for (const [packageName, expectedVersion] of expectedPackages.entries()) {
  const actualVersion = dependencies[packageName];
  if (actualVersion !== expectedVersion) {
    findings.push(
      `apps/web/package.json: ${packageName} must be dependency version "${expectedVersion}", found "${actualVersion ?? 'missing'}".`
    );
    continue;
  }

  if (forbiddenLocalProtocols.some((protocol) => actualVersion.startsWith(protocol))) {
    findings.push(`apps/web/package.json: ${packageName} must not use ${actualVersion}.`);
  }
}

for (const section of allDependencySections) {
  for (const [packageName, version] of Object.entries(section)) {
    if (forbiddenWebRuntimePackages.has(packageName)) {
      findings.push(
        `apps/web/package.json: ${packageName} is native-trust-boundary code and must not be a web dependency.`
      );
    }

    if (packageName.startsWith('@cgraph/') && packageName !== '@cgraph/web') {
      findings.push(`apps/web/package.json: remove old package scope ${packageName}.`);
    }

    if (
      packageName.startsWith('@cgraph-dev/') &&
      typeof version === 'string' &&
      forbiddenLocalProtocols.some((protocol) => version.startsWith(protocol))
    ) {
      findings.push(`apps/web/package.json: ${packageName} must not use ${version}.`);
    }
  }
}

const onlyBuiltDependencies = rootPackage.pnpm?.onlyBuiltDependencies ?? [];
for (const packageName of onlyBuiltDependencies) {
  if (forbiddenWebRuntimePackages.has(packageName)) {
    findings.push(
      `package.json: pnpm.onlyBuiltDependencies must not allow native-trust-boundary package ${packageName} in the web repo.`
    );
  }
}

const workspacePath = join(rootDir, 'pnpm-workspace.yaml');
const workspaceText = readFileSync(workspacePath, 'utf8');
if (/['"]?packages\/\*['"]?/.test(workspaceText)) {
  findings.push('pnpm-workspace.yaml: packages/* must not be part of the web workspace.');
}

if (existsSync(join(rootDir, 'packages'))) {
  findings.push('packages/: local package mirrors must be removed; use published @cgraph-dev packages.');
}

const tsconfigPath = join(rootDir, 'apps/web/tsconfig.json');
const tsconfigText = readFileSync(tsconfigPath, 'utf8');
if (tsconfigText.includes('../../packages/')) {
  findings.push('apps/web/tsconfig.json: remove local package mirror path aliases.');
}

for (const file of walkSourceFiles(join(rootDir, 'apps/web/src'))) {
  const source = readFileSync(file, 'utf8');
  for (const packageName of forbiddenWebRuntimePackages) {
    if (source.includes(`'${packageName}'`) || source.includes(`"${packageName}"`)) {
      findings.push(
        `${file}: web source must not import native-trust-boundary package ${packageName}.`
      );
    }
  }
}

if (findings.length > 0) {
  console.error('Package dependency validation failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Package dependency validation passed (@cgraph-dev packages pinned to reviewed versions).');
