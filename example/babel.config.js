module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo adds the Worklets/Reanimated plugin automatically when
  // react-native-reanimated is installed, so it does not need listing here.
  return {
    presets: ['babel-preset-expo'],
  };
};
