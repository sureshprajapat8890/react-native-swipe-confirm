#!/usr/bin/env node
/**
 * Renames the package everywhere before the first publish:
 *
 *   node scripts/rename.js @acme/react-native-swipe-confirm [github-user/repo]
 */
const fs = require('fs');
const path = require('path');

const [, , nextName, repoSlug] = process.argv;

if (!nextName) {
  console.error(
    'Usage: node scripts/rename.js <new-package-name> [github-user/repo]'
  );
  process.exit(1);
}

const CURRENT_NAME = '@your-scope/react-native-swipe-confirm';
const CURRENT_SLUG = 'your-scope/react-native-swipe-confirm';
const nextSlug = repoSlug || nextName.replace(/^@/, '');

const root = path.join(__dirname, '..');
const targets = [
  'package.json',
  'tsconfig.json',
  'README.md',
  'example/package.json',
  'example/metro.config.js',
  'example/App.tsx',
  'example/tsconfig.json',
];

let touched = 0;
for (const relative of targets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = before
    .split(CURRENT_NAME)
    .join(nextName)
    .split(CURRENT_SLUG)
    .join(nextSlug);
  if (before !== after) {
    fs.writeFileSync(file, after);
    console.log(`updated ${relative}`);
    touched += 1;
  }
}

console.log(`\nRenamed to ${nextName} across ${touched} file(s).`);
console.log('Remember to update "author" and the LICENSE copyright line.');
