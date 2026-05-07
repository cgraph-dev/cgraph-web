import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const extensions = ['.ts', '.tsx'];
const graph = new Map();

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (entry === '__tests__' || entry === 'test') continue;
      walk(path);
      continue;
    }

    if (!extensions.includes(extname(path))) continue;
    if (path.includes('.test.') || path.includes('.spec.') || path.includes('.stories.')) continue;
    graph.set(path, importsFor(path));
  }
}

function importsFor(file) {
  const text = readFileSync(file, 'utf8');
  const imports = [];
  const importPattern = /^\s*import(?:\s+type)?[\s\w{},*]+from\s+['"]([^'"]+)['"];?/gm;
  let match;

  while ((match = importPattern.exec(text))) {
    const resolved = resolveImport(file, match[1]);
    if (resolved) imports.push(resolved);
  }

  return imports;
}

function resolveImport(fromFile, specifier) {
  if (specifier.startsWith('@/')) {
    return resolveCandidate(join(sourceRoot, specifier.slice(2)));
  }

  if (specifier.startsWith('.')) {
    return resolveCandidate(resolve(dirname(fromFile), specifier));
  }

  return null;
}

function resolveCandidate(basePath) {
  const normalizedBase = normalize(basePath);
  const candidates = [
    normalizedBase,
    ...extensions.map((ext) => `${normalizedBase}${ext}`),
    ...extensions.map((ext) => join(normalizedBase, `index${ext}`)),
  ];

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

walk(sourceRoot);

const visiting = new Set();
const visited = new Set();
const stack = [];
const cycles = [];

function visit(file) {
  if (visited.has(file)) return;

  if (visiting.has(file)) {
    const cycle = stack.slice(stack.indexOf(file)).concat(file);
    cycles.push(cycle.map((item) => relative(root, item).replaceAll('\\', '/')));
    return;
  }

  visiting.add(file);
  stack.push(file);

  for (const dep of graph.get(file) ?? []) {
    if (graph.has(dep)) visit(dep);
  }

  stack.pop();
  visiting.delete(file);
  visited.add(file);
}

for (const file of graph.keys()) visit(file);

if (cycles.length > 0) {
  console.error('Import cycle gate failed:\n');
  for (const cycle of cycles.slice(0, 20)) {
    console.error(cycle.join(' -> '));
  }
  if (cycles.length > 20) console.error(`...and ${cycles.length - 20} more cycles`);
  process.exit(1);
}

console.log('Import cycle gate passed.');
