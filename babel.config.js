module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4+ — plugin lives in react-native-worklets (must stay last)
  plugins: ['react-native-worklets/plugin'],
};
