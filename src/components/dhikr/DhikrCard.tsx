import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';
import type { DhikrItem } from '../../constants/defaultDhikr';

interface Props {
  item: DhikrItem;
  onPress: () => void;
}

export const DhikrCard = ({ item, onPress }: Props) => {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
    </TouchableOpacity>
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
