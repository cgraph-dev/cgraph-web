/* global console, process */

import fs from 'node:fs';
import path from 'node:path';

const assetsDir = path.resolve(process.cwd(), 'dist/assets');
const lazyPagesPath = path.resolve(process.cwd(), 'src/routes/lazyPages.ts');
const appRoutesPath = path.resolve(process.cwd(), 'src/routes/app-routes.tsx');

const JS_CHUNK_LIMIT_BYTES = 500 * 1024;
const MIN_ROUTE_LAZY_IMPORTS = 50;

const budgetRules = [
  {
    label: 'conversation chunk',
    pattern: /^conversation-.*\.js$/,
    maxBytes: 250 * 1024,
    required: true,
  },
  {
    label: 'largest index chunk',
    pattern: /^index-.*\.js$/,
    maxBytes: 250 * 1024,
    required: true,
  },
  {
    label: 'largest charts chunk',
    pattern: /^charts.*\.js$/,
    maxBytes: 475 * 1024,
    required: false,
  },
];

const requiredLazyPageImports = [
  ['Login', '@/pages/auth/login'],
  ['Onboarding', '@/pages/auth/onboarding'],
  ['PhoneRegister', '@/pages/auth/phone-register'],
  ['Messages', '@/pages/messages/messages'],
  ['Conversation', '@/pages/messages/conversation'],
  ['Groups', '@/pages/groups/groups'],
  ['GroupSettingsPage', '@/pages/groups/group-settings-page'],
  ['Settings', '@/pages/settings/settings'],
  ['UserProfile', '@/pages/profile/user-profile'],
  ['AdminDashboard', '@/pages/admin/admin-dashboard'],
];

const routeChunkRules = [
  {
    label: 'login route lazy chunk',
    pattern: /^login-.*\.js$/,
  },
  {
    label: 'onboarding route lazy chunk',
    pattern: /^onboarding-.*\.js$/,
  },
  {
    label: 'messages route lazy chunk',
    pattern: /^messages-.*\.js$/,
  },
  {
    label: 'conversation route lazy chunk',
    pattern: /^conversation-.*\.js$/,
  },
  {
    label: 'groups route lazy chunk',
    pattern: /^groups-.*\.js$/,
  },
  {
    label: 'group settings route lazy chunk',
    pattern: /^group-settings-page-.*\.js$/,
  },
  {
    label: 'settings route lazy chunk',
    pattern: /^settings-.*\.js$/,
  },
  {
    label: 'profile route lazy chunk',
    pattern: /^user-profile-.*\.js$/,
  },
  {
    label: 'admin route lazy chunk',
    pattern: /^admin-dashboard-.*\.js$/,
  },
];

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

function readJsAssetSizes(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => {
      const fullPath = path.join(directory, entry.name);
      const sizeBytes = fs.statSync(fullPath).size;
      return { name: entry.name, sizeBytes };
    });

  return files;
}

function findLargest(files) {
  if (files.length === 0) {
    return null;
  }

  return files.reduce((largest, current) =>
    current.sizeBytes > largest.sizeBytes ? current : largest
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Bundle budgets failed: could not read ${filePath}`);
    throw error;
  }
}

function hasLazyImportExport(text, exportName, importPath) {
  const pattern = new RegExp(
    `export\\s+const\\s+${escapeRegExp(exportName)}\\s*=\\s*lazyRetry\\(\\s*\\(\\)\\s*=>\\s*import\\(\\s*['"]${escapeRegExp(importPath)}['"]\\s*\\)\\s*\\)`,
    'm'
  );
  return pattern.test(text);
}

function checkRouteLazyContract() {
  const lazyPages = readTextFile(lazyPagesPath);
  const appRoutes = readTextFile(appRoutesPath);
  const failures = [];

  const lazyImportCount = Array.from(
    lazyPages.matchAll(/export\s+const\s+\w+\s*=\s*lazyRetry\(\s*\(\)\s*=>\s*import\(/g)
  ).length;

  if (lazyImportCount < MIN_ROUTE_LAZY_IMPORTS) {
    failures.push(
      `expected at least ${MIN_ROUTE_LAZY_IMPORTS} route lazy imports in src/routes/lazyPages.ts, found ${lazyImportCount}`
    );
  }

  for (const [exportName, importPath] of requiredLazyPageImports) {
    if (!hasLazyImportExport(lazyPages, exportName, importPath)) {
      failures.push(`${exportName} must be exported from lazyPages.ts through lazyRetry(${importPath})`);
    }
  }

  if (!/from ['"]\.\/lazyPages['"]/.test(appRoutes)) {
    failures.push('app-routes.tsx must import routed page components from ./lazyPages');
  }

  if (/from ['"]@\/pages\//.test(appRoutes) || /from ['"]@\/modules\/[^'"]*\/pages\//.test(appRoutes)) {
    failures.push('app-routes.tsx must not statically import routed page modules');
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL: route lazy-loading contract: ${failure}`);
    }
    return false;
  }

  console.log(
    `PASS: route lazy-loading contract keeps ${lazyImportCount} routed page imports behind lazyRetry.`
  );
  return true;
}

if (!fs.existsSync(assetsDir)) {
  console.error(`Bundle budgets failed: assets directory not found at ${assetsDir}`);
  process.exit(1);
}

const jsAssets = readJsAssetSizes(assetsDir);
if (jsAssets.length === 0) {
  console.error('Bundle budgets failed: no JS assets found in dist/assets.');
  process.exit(1);
}

let hasFailures = false;

if (!checkRouteLazyContract()) {
  hasFailures = true;
}

const largestOverall = findLargest(jsAssets);
if (largestOverall && largestOverall.sizeBytes > JS_CHUNK_LIMIT_BYTES) {
  hasFailures = true;
  console.error(
    `FAIL: largest JS chunk ${largestOverall.name} is ${formatKiB(largestOverall.sizeBytes)} (limit ${formatKiB(JS_CHUNK_LIMIT_BYTES)})`
  );
} else if (largestOverall) {
  console.log(
    `PASS: largest JS chunk ${largestOverall.name} is ${formatKiB(largestOverall.sizeBytes)} (limit ${formatKiB(JS_CHUNK_LIMIT_BYTES)})`
  );
}

for (const rule of budgetRules) {
  const matching = jsAssets.filter((asset) => rule.pattern.test(asset.name));

  if (matching.length === 0) {
    if (rule.required) {
      hasFailures = true;
      console.error(`FAIL: ${rule.label} not found for pattern ${rule.pattern}`);
    } else {
      console.log(`SKIP: ${rule.label} not present.`);
    }
    continue;
  }

  const largest = findLargest(matching);
  if (!largest) {
    continue;
  }

  if (largest.sizeBytes > rule.maxBytes) {
    hasFailures = true;
    console.error(
      `FAIL: ${rule.label} ${largest.name} is ${formatKiB(largest.sizeBytes)} (limit ${formatKiB(rule.maxBytes)})`
    );
  } else {
    console.log(
      `PASS: ${rule.label} ${largest.name} is ${formatKiB(largest.sizeBytes)} (limit ${formatKiB(rule.maxBytes)})`
    );
  }
}

for (const rule of routeChunkRules) {
  const matching = jsAssets.filter((asset) => rule.pattern.test(asset.name));

  if (matching.length === 0) {
    hasFailures = true;
    console.error(`FAIL: ${rule.label} not found for pattern ${rule.pattern}`);
    continue;
  }

  console.log(`PASS: ${rule.label} found ${matching.map((asset) => asset.name).join(', ')}`);
}

if (hasFailures) {
  process.exit(1);
}
