import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

type GoogleMobileAdsPkg = typeof import('react-native-google-mobile-ads');

let cached: GoogleMobileAdsPkg | null | undefined;

function isNativeModuleLinked(): boolean {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return false;
  }
  if (TurboModuleRegistry.get('RNGoogleMobileAdsModule') != null) {
    return true;
  }
  return NativeModules.RNGoogleMobileAdsModule != null;
}

/**
 * Loads AdMob JS only when the native module is present (avoids crash after `npm install`
 * if the app binary was not rebuilt). Callers must not statically import
 * `react-native-google-mobile-ads`.
 */
export function loadGoogleMobileAds(): GoogleMobileAdsPkg | null {
  if (cached !== undefined) {
    return cached;
  }
  if (!isNativeModuleLinked()) {
    cached = null;
    return null;
  }
  try {
    cached = require('react-native-google-mobile-ads') as GoogleMobileAdsPkg;
  } catch {
    cached = null;
  }
  return cached;
}
