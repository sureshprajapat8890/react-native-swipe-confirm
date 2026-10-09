// Metro config that resolves the library straight from ../src, so edits to
// the component hot-reload in the example without a rebuild.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '..');
const pak = require('../package.json');

const config = getDefaultConfig(__dirname);

config.watchFolders = [root];

// Force the peer dependencies to resolve to the example's own copies.
// Without this Metro also picks up the library's dev copies and React,
// Reanimated and Gesture Handler end up duplicated in the bundle.
const peers = Object.keys(pak.peerDependencies ?? {});

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(root, 'node_modules'),
];

config.resolver.extraNodeModules = {
  [pak.name]: path.resolve(root, 'src'),
  ...Object.fromEntries(
    peers.map((name) => [name, path.resolve(__dirname, 'node_modules', name)])
  ),
};

config.resolver.blockList = peers.map((name) =>
  blockPattern(path.join(root, 'node_modules', name))
);

/**
 * Turns a directory path into a regex matching everything inside it. Either
 * path separator matches, so the same config works on Windows and POSIX.
 */
function blockPattern(target) {
  const escaped = target
    .replace(/[.*+?^${}()|[\]]/g, '\\$&')
    .split(/[\\/]/)
    .join('[\\\\/]');
  return new RegExp(`^${escaped}[\\\\/].*$`);
}

module.exports = config;
