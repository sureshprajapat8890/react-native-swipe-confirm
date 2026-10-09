require('react-native-gesture-handler/jestSetup');

// Under Jest, Worklets resolves to its web implementation, where
// `getUIRuntimeHolder` throws. Gesture Handler v3 calls it from a microtask as
// soon as it loads, which would otherwise tear the whole test run down.
jest.mock('react-native-worklets', () => ({
  ...jest.requireActual('react-native-worklets'),
  getUIRuntimeHolder: () => ({}),
}));

require('react-native-reanimated').setUpTests();
