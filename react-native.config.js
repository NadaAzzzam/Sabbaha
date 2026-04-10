// react-native-mmkv expects a Gradle project named :react-native-nitro-modules.
// We register it explicitly in android/settings.gradle (before autolink) so it always
// exists when MMKV's build.gradle runs; listing it here as android: null avoids a
// duplicate include from autolinking.
module.exports = {
  dependencies: {
    'react-native-nitro-modules': {
      platforms: {
        android: null,
      },
    },
  },
};
