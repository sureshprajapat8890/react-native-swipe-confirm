// Reanimated and React Native both ship a Jest resolver and Jest only accepts
// one, so chain them: Reanimated picks the right platform variants of its own
// (and Worklets') internals, and falls through to React Native's resolver.
const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');
const reanimatedResolver = require('react-native-reanimated/jest/resolver.js');

module.exports = (request, options) =>
  reanimatedResolver(request, {
    ...options,
    defaultResolver: (nextRequest, nextOptions) =>
      reactNativeResolver(nextRequest, {
        ...nextOptions,
        defaultResolver: options.defaultResolver,
      }),
  });
