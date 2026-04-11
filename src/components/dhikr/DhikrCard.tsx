import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';
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

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={600}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.main}>
        <AppText arabic style={[typography.arabicLarge, { color: colors.text }]}>
          {item.arabicText}
        </AppText>
        <AppText style={[typography.transliteration, { color: colors.textSecondary, marginTop: 2 }]}>
          {item.transliteration}
        </AppText>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.accentGlow }]}>
        <AppText style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
          {item.defaultTarget === 0
            ? t('home.free')
            : `${item.defaultTarget}`}
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
