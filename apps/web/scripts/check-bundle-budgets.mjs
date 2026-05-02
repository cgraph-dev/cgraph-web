import fs from 'node:fs';
import path from 'node:path';

const assetsDir = path.resolve(process.cwd(), 'dist/assets');

const JS_CHUNK_LIMIT_BYTES = 500 * 1024;

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

if (hasFailures) {
  process.exit(1);
}
