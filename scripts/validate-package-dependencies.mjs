#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const expectedPackages = new Map([
  ['@cgraph-dev/animation-constants', '1.0.1'],
  ['@cgraph-dev/api-client', '1.0.2'],
  ['@cgraph-dev/design-tokens', '1.0.1'],
  ['@cgraph-dev/shared-types', '1.0.1'],
  ['@cgraph-dev/utils', '1.0.1'],
]);

const forbiddenLocalProtocols = ['workspace:', 'file:', 'link:', 'portal:'];
const findings = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    findings.push(`${path}: could not read JSON (${error.message}).`);
    return {};
  }
}

const rootDir = process.cwd();
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

if (findings.length > 0) {
  console.error('Package dependency validation failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Package dependency validation passed (@cgraph-dev packages pinned to reviewed versions).');
