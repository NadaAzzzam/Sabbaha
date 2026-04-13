import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';
import { ms, isTablet } from '../../utils/responsive';
import type { DhikrItem } from '../../constants/defaultDhikr';

interface Props {
  item: DhikrItem;
  onPress: () => void;
  /** Single surface avoids nested Touchables (Android often drops inner onPress). */
  onLongPress?: () => void;
}

export const DhikrCard = ({ item, onPress, onLongPress }: Props) => {
  const colors = useTheme();
  const { t } = useTranslation();

  // Auto-size Arabic text for long dhikr strings
  const arabicFontSize = useMemo(() => {
    const len = item.arabicText.length;
    if (len <= 15) return ms(28, 0.3);
    if (len <= 25) return ms(22, 0.3);
    if (len <= 35) return ms(18, 0.3);
    return ms(16, 0.3);
  }, [item.arabicText]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={600}
      style={({ pressed }) => [
        styles.card,
        isTablet && styles.cardTablet,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.main}>
        <AppText
          arabic
          numberOfLines={2}
          style={[
            typography.arabicLarge,
            { color: colors.text, fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.6 },
          ]}
        >
          {item.arabicText}
        </AppText>
        {!!item.transliteration && (
          <AppText style={[typography.transliteration, { color: colors.textSecondary, marginTop: 2 }]}>
            {item.transliteration}
          </AppText>
        )}
      </View>
      <View style={[styles.badge, { backgroundColor: colors.accentGlow }]}>
        <AppText style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
          {item.defaultTarget === 0
            ? t('home.free')
            : `×${item.defaultTarget}`}
        </AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  main: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    minWidth: 44,
    alignItems: 'center',
  },
});
