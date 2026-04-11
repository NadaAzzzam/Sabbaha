// Web shim – no-op sound player
class Sound {
  static MAIN_BUNDLE = '';
  static DOCUMENT = '';
  static LIBRARY = '';
  static CACHES = '';
  static setCategory() {}
  setVolume() { return this; }
  play() { return this; }
  stop(_cb?: () => void) { _cb?.(); return this; }
  release() {}
}

export default Sound;
