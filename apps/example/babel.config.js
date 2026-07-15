module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo (SDK 57) auto-includes the react-native-worklets plugin
  // required by reanimated 4; keep this preset last.
  return {
    presets: ['babel-preset-expo'],
  };
};
