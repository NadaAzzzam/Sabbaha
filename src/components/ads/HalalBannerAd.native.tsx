import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { loadGoogleMobileAds } from '../../ads/loadGoogleMobileAds';

/**
 * Set your live banner ad unit from AdMob before shipping to the store.
 * Debug builds use Google’s test banner automatically.
 */
const RELEASE_BANNER_AD_UNIT_ID = '';

export function HalalBannerAd(): React.ReactElement | null {
  const gma = useMemo(() => loadGoogleMobileAds(), []);
  const [failed, setFailed] = useState(false);

  const banner = useMemo(() => {
    if (!gma || failed) {
      return null;
    }
    const { BannerAd, BannerAdSize, TestIds } = gma;
    const unitId = __DEV__
      ? TestIds.BANNER
      : RELEASE_BANNER_AD_UNIT_ID.trim() || null;
    if (!unitId) {
      return null;
    }
    return (
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    );
  }, [gma, failed]);

  if (!banner) {
    return null;
  }

  return (
    <View style={styles.wrap} collapsable={false}>
      {banner}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
});
