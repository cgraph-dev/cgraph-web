#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const snapshotManifestPath = 'packages/CGRAPH_PACKAGES_SNAPSHOT.json';
const packageSourcePattern = /^packages\/(?!CGRAPH_PACKAGES_SNAPSHOT[.]json$)[^/]+\//;
const ignoredPackageFilePatterns = [
  /\/dist\//,
  /\/node_modules\//,
  /\/[.]turbo\//,
  /[.]tsbuildinfo$/,
];

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function lines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function hasRevision(revision) {
  return Boolean(tryGit(['rev-parse', '--verify', `${revision}^{commit}`]));
}

function diffNames(rangeArgs) {
  return lines(tryGit(['diff', '--name-only', ...rangeArgs]));
}

function readGitHubEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) return null;

  try {
    return JSON.parse(readFileSync(eventPath, 'utf8'));
  } catch {
    return null;
  }
}

const gitHubEvent = readGitHubEvent();

function changedFiles() {
  if (process.env.PACKAGE_OWNER_FILES) {
    return unique(lines(process.env.PACKAGE_OWNER_FILES));
  }

  if (process.env.GITHUB_EVENT_NAME === 'pull_request' && process.env.GITHUB_BASE_REF) {
    const baseRef = process.env.GITHUB_BASE_REF;
    const candidates = [`origin/${baseRef}`, baseRef];

    for (const candidate of candidates) {
      if (hasRevision(candidate)) {
        return unique(diffNames([`${candidate}...HEAD`]));
      }
    }
  }

  const before = process.env.GITHUB_EVENT_BEFORE ?? gitHubEvent?.before;
  const head = process.env.GITHUB_SHA ?? 'HEAD';
  if (before && !/^0+$/.test(before) && hasRevision(before)) {
    return unique(diffNames([`${before}..${head}`]));
  }

  const staged = diffNames(['--cached']);
  const unstaged = diffNames(['HEAD']);
  if (staged.length > 0 || unstaged.length > 0) {
    return unique([...staged, ...unstaged]);
  }

  if (hasRevision('HEAD~1')) {
    return unique(diffNames(['HEAD~1..HEAD']));
  }

  return [];
}

function loadManifest() {
  const path = join(process.cwd(), snapshotManifestPath);
  if (!existsSync(path)) {
    throw new Error(`${snapshotManifestPath}: missing canonical package snapshot manifest.`);
  }

  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  if (
    typeof manifest.source_commit !== 'string' ||
    !/^[0-9a-f]{40}$/.test(manifest.source_commit)
  ) {
    throw new Error(`${snapshotManifestPath}: source_commit must be a full 40-character SHA.`);
  }

  return manifest;
}

function referenceText(before, head) {
  const chunks = [
    process.env.PACKAGE_MIRROR_REF,
    process.env.PACKAGE_OWNER_REF,
    gitHubEvent?.pull_request?.title,
    gitHubEvent?.pull_request?.body,
    gitHubEvent?.head_commit?.message,
    ...(Array.isArray(gitHubEvent?.commits)
      ? gitHubEvent.commits.map((commit) => commit?.message)
      : []),
  ];

  if (before && !/^0+$/.test(before) && hasRevision(before)) {
    chunks.push(tryGit(['log', '--format=%B', `${before}..${head}`]));
  } else {
    chunks.push(tryGit(['log', '-1', '--format=%B']));
  }

  return chunks.filter(Boolean).join('\n');
}

function referencesCommit(text, commit) {
  return text.includes(commit) || text.includes(commit.slice(0, 12)) || text.includes(commit.slice(0, 7));
}

const files = changedFiles();
const packageSourceFiles = files.filter(
  (file) =>
    packageSourcePattern.test(file) &&
    !ignoredPackageFilePatterns.some((pattern) => pattern.test(file))
);

if (packageSourceFiles.length === 0) {
  console.log('Package mirror ownership validation passed (no package mirror source changes).');
  process.exit(0);
}

const findings = [];
const manifest = loadManifest();
const before = process.env.GITHUB_EVENT_BEFORE ?? gitHubEvent?.before;
const head = process.env.GITHUB_SHA ?? 'HEAD';
const text = referenceText(before, head);

if (!files.includes(snapshotManifestPath)) {
  findings.push(
    `${snapshotManifestPath} must change with any app-local package mirror source change.`
  );
}

if (!referencesCommit(text, manifest.source_commit)) {
  findings.push(
    `Commit message or PR description must reference canonical cgraph-packages commit ${manifest.source_commit}.`
  );
}

if (findings.length > 0) {
  console.error('Package mirror ownership validation failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  console.error('\nChanged package mirror files:');
  for (const file of packageSourceFiles.slice(0, 40)) {
    console.error(`- ${file}`);
  }
  if (packageSourceFiles.length > 40) {
    console.error(`- ...and ${packageSourceFiles.length - 40} more`);
  }
  process.exit(1);
}

console.log(
  `Package mirror ownership validation passed (${packageSourceFiles.length} package mirror files reference ${manifest.source_commit.slice(0, 12)}).`
);
