import { loadGoogleMobileAds } from './loadGoogleMobileAds';

/**
 * AdMob is Google’s mobile ad network (banners, interstitials, etc.).
 *
 * In-app we can only tighten Google’s own content labels. For gambling,
 * alcohol, dating, and similar categories, use AdMob → Blocking controls
 * (and review odd creatives in the Ad review center). That is how you
 * further reduce non-halal ads; the SDK cannot guarantee fiqh-level filtering.
 *
 * If the native module is missing, rebuild the app (e.g. `npx react-native run-android`).
 */
export async function initAdMob(): Promise<void> {
  const gma = loadGoogleMobileAds();
  if (!gma) {
    if (__DEV__) {
      console.warn(
        '[AdMob] Native module not linked. Rebuild Android/iOS after installing react-native-google-mobile-ads.',
      );
    }
    return;
  }
  const mobileAds = gma.default;
  const { MaxAdContentRating } = gma;
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.G,
  });
  await mobileAds().initialize();
}
