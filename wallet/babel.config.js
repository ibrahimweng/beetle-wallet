/* Reanimated 4 does its work on the UI thread, which needs the worklets babel
   plugin. It must be the last plugin in the list. Expo Router's own plugin is
   part of babel-preset-expo. */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
