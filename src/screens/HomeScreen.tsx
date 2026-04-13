import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { DhikrCard } from '../components/dhikr/DhikrCard';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { DEFAULT_DHIKR, type DhikrItem } from '../constants/defaultDhikr';
import { useDhikrStore } from '../stores/useDhikrStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { calcStreak, todayTotals } from '../utils/statsCalculator';
import { formatCount, formatDayName, formatLongDate } from '../utils/formatters';
import { isTablet, contentMaxWidth, ms } from '../utils/responsive';
import type { RootStackParamList } from '../navigation/types';
import { HalalBannerAd } from '../components/ads/HalalBannerAd';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const getGreetingKey = (): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' => {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 18) return 'greetingAfternoon';
  return 'greetingEvening';
};

export const HomeScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const { customDhikr, addCustomDhikr, removeDhikr } = useDhikrStore();
  const { sessions } = useHistoryStore();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const [modalVisible, setModalVisible] = useState(false);
  const [arabicText, setArabicText] = useState('');
  const [countText, setCountText] = useState('');

  const allDhikr = [...DEFAULT_DHIKR, ...customDhikr];

  const streak = useMemo(() => calcStreak(sessions), [sessions]);
  const today = useMemo(() => todayTotals(sessions), [sessions]);
  const greetingKey = useMemo(() => getGreetingKey(), []);
  const now = Date.now();

  // Gentle breathing pulse on the streak flame when active
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (streak > 0) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [streak, pulse]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleSelectDhikr = (item: DhikrItem) => {
    navigation.navigate('SessionSetup', { dhikrId: item.id });
  };

  const handleAddCustom = () => {
    if (!arabicText.trim()) return;
    const target = parseInt(countText, 10);
    const newItem: DhikrItem = {
      id: `custom_${Date.now()}`,
      arabicText: arabicText.trim(),
      transliteration: '',
      translation: '',
      defaultTarget: isNaN(target) || target <= 0 ? 0 : target,
      isCustom: true,
    };
    addCustomDhikr(newItem);
    setArabicText('');
    setCountText('');
    setModalVisible(false);
  };

  const handleLongPress = (item: DhikrItem) => {
    if (!item.isCustom) return;
    Alert.alert(
      item.arabicText,
      '',
      [
        { text: t('settings.resetNo'), style: 'cancel' },
        {
          text: isAr ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => removeDhikr(item.id),
        },
      ],
    );
  };

  const streakLabel = streak === 1 ? t('home.streakLabelOne') : t('home.streakLabel');
  const flame = streak > 0 ? '🔥' : '✨';

  // Responsive horizontal padding — scales for phones and tablets
  const hPad = isTablet
    ? Math.max(spacing.xl, (width - contentMaxWidth) / 2)
    : width < 360
    ? spacing.md
    : spacing.lg;

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      <FlatList
        data={allDhikr}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* ── Greeting + Date ── */}
            <View style={[styles.headerBlock, { paddingHorizontal: hPad }]}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <AppText arabic={isAr} style={[styles.greetingText, { color: colors.textSecondary }]}>
                    {t(`home.${greetingKey}`)}
                  </AppText>
                  <AppText arabic style={[styles.brandText, { color: colors.accent }]}>
                    {t('home.title')}
                  </AppText>
                </View>
                <View style={[styles.datePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <AppText arabic={isAr} style={[styles.dayText, { color: colors.accent }]}>
                    {formatDayName(now, language)}
                  </AppText>
                  <AppText arabic={isAr} style={[styles.dateText, { color: colors.textSecondary }]}>
                    {formatLongDate(now, language)}
                  </AppText>
                </View>
              </View>
            </View>

            {/* ── Streak + Today card (gamification) ── */}
            <View
              style={[
                styles.gameCard,
                {
                  marginHorizontal: hPad,
                  backgroundColor: colors.surface,
                  borderColor: streak > 0 ? colors.accent : colors.border,
                },
              ]}
            >
              {/* Streak flame */}
              <View style={styles.gameLeft}>
                <Animated.Text style={[styles.flameEmoji, flameStyle]}>{flame}</Animated.Text>
                <View style={styles.streakTextBlock}>
                  <AppText style={[styles.streakNumber, { color: colors.accent }]}>
                    {formatCount(streak, language)}
                  </AppText>
                  <AppText arabic={isAr} style={[styles.streakLabel, { color: colors.textMuted }]}>
                    {streakLabel}
                  </AppText>
                </View>
              </View>

              {/* Vertical divider */}
              <View style={[styles.gameDivider, { backgroundColor: colors.border }]} />

              {/* Today count */}
              <View style={styles.gameRight}>
                <AppText style={[styles.todayNumber, { color: colors.text }]}>
                  {formatCount(today.count, language)}
                </AppText>
                <AppText arabic={isAr} style={[styles.todayLabel, { color: colors.textMuted }]}>
                  {t('home.todayCount')}
                </AppText>
                {today.minutes > 0 && (
                  <AppText arabic={isAr} style={[styles.todayMinutes, { color: colors.accent }]}>
                    {formatCount(today.minutes, language)} {t('home.todayMinutes')}
                  </AppText>
                )}
              </View>
            </View>

            {/* Section title */}
            <View style={[styles.sectionHeader, { paddingHorizontal: hPad }]}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accent }]} />
              <AppText arabic style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {t('home.subtitle')}
              </AppText>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <DhikrCard
            item={item}
            onPress={() => handleSelectDhikr(item)}
            onLongPress={item.isCustom ? () => handleLongPress(item) : undefined}
          />
        )}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.addBtn,
              {
                marginHorizontal: hPad,
                borderColor: colors.accent,
                backgroundColor: pressed ? colors.accentGlow : 'transparent',
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <AppText style={[styles.addBtnText, { color: colors.accent }]}>
              + {t('home.addCustom')}
            </AppText>
          </Pressable>
        }
      />

      <HalalBannerAd />

      {/* Add Custom Dhikr Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <AppText arabic style={[typography.arabicMedium, styles.modalTitle, { color: colors.text }]}>
              {t('custom.title')}
            </AppText>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                  textAlign: 'right',
                },
              ]}
              placeholder={t('custom.arabicPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={arabicText}
              onChangeText={setArabicText}
              textAlign="right"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                  marginTop: spacing.sm,
                },
              ]}
              placeholder={t('custom.countPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={countText}
              onChangeText={setCountText}
              keyboardType="number-pad"
              textAlign="left"
            />

            <View style={styles.modalActions}>
              <AppButton
                label={t('custom.cancel')}
                onPress={() => { setModalVisible(false); setArabicText(''); setCountText(''); }}
                variant="ghost"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <AppButton
                label={t('custom.save')}
                onPress={handleAddCustom}
                variant="primary"
                style={{ flex: 1 }}
                disabled={!arabicText.trim()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  /* Header */
  headerBlock: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  greetingText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 2,
  },
  brandText: {
    fontSize: 34,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  datePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 110,
  },
  dayText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'center',
  },

  /* Gamification card */
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 96,
  },
  gameLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flameEmoji: {
    fontSize: 40,
    lineHeight: 48,
    includeFontPadding: false,
  },
  streakTextBlock: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    includeFontPadding: false,
  },
  streakLabel: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  gameDivider: {
    width: 1,
    height: 56,
    marginHorizontal: spacing.md,
  },
  gameRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  todayNumber: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    includeFontPadding: false,
  },
  todayLabel: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'right',
  },
  todayMinutes: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    fontWeight: '600',
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  /* List */
  list: {
    paddingBottom: spacing.xxxl,
  },
  addBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
});
