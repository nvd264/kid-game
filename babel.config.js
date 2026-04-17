module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Do not add react-native-reanimated/plugin here: babel-preset-expo injects it
    // (Reanimated 4 uses react-native-worklets/plugin when worklets is installed).
  };
};
