module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Required for Reanimated/Skia animations. Must be last.
    plugins: ['react-native-worklets/plugin'],
  };
};
