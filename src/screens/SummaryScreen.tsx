import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, Vibration } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { useTheme } from '../hooks/useTheme';
import { useSound } from '../hooks/useSound';
import { useHaptics } from '../hooks/useHaptics';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatCount, formatDuration } from '../utils/formatters';
import { isTablet, contentMaxWidth, ms } from '../utils/responsive';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Summary'>;

export const SummaryScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessions } = useHistoryStore();
  const { language, hapticsEnabled, soundEnabled } = useSettingsStore();
  const { playStop } = useSound();
  const { tap } = useHaptics();

  const handleStrayTap = () => {
    if (soundEnabled) {
      playStop();
    } else if (hapticsEnabled) {
      // use the same haptic engine the rest of the app uses — more reliable than Vibration API
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 80, 60, 80]);
      } else {
        tap();
      }
    }
  };

  const session = sessions.find(s => s.id === route.params.sessionId);

  const blessingOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const glowRadius = useSharedValue(0);

  useEffect(() => {
    blessingOpacity.value = withDelay(200, withTiming(1, { duration: 700 }));
    cardScale.value = withDelay(400, withSpring(1, { damping: 14, stiffness: 100 }));
    cardOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    glowRadius.value = withDelay(400, withSpring(120));
  }, [blessingOpacity, cardScale, cardOpacity, glowRadius]);

  const blessingStyle = useAnimatedStyle(() => ({ opacity: blessingOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    width: glowRadius.value * 2,
    height: glowRadius.value * 2,
    borderRadius: glowRadius.value,
    opacity: 0.2,
  }));

  if (!session) return null;

  const handleNewDhikr = () => navigation.popToTop();

  const handleRepeat = () => {
    navigation.replace('Session', {
      dhikrId: session.dhikrId,
      targetCount: session.targetCount,
    });
  };

  return (
    <ScreenWrapper>
      <Pressable style={styles.container} onPress={handleStrayTap}>
        {/* Glow orb */}
        <Animated.View
          style={[
            styles.glowOrb,
            { backgroundColor: colors.accent },
            glowStyle,
          ]}
        />

        {/* Blessing */}
        <Animated.View style={blessingStyle}>
          <AppText
            arabic
            style={[
              typography.arabicMedium,
              { color: colors.textSecondary, textAlign: 'center' },
            ]}
          >
            {t('summary.blessing')}
          </AppText>
        </Animated.View>

        {/* Stats card */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            cardStyle,
          ]}
        >
          {/* Dhikr name */}
          <AppText
            arabic
            style={[
              typography.arabicLarge,
              styles.dhikrTitle,
              { color: colors.accent },
            ]}
          >
            {session.dhikrText}
          </AppText>

          {/* Count */}
          <View style={styles.statRow}>
            <AppText style={[typography.counterHero, { color: colors.text }]}>
              {formatCount(session.totalCount, language)}
            </AppText>
            <AppText
              arabic
              style={[
                typography.arabicSmall,
                { color: colors.textSecondary, marginRight: spacing.sm, alignSelf: 'flex-end', marginBottom: 8 },
              ]}
            >
              {t('summary.count')}
            </AppText>
          </View>

          {/* Duration */}
          <View style={[styles.durationRow, { borderTopColor: colors.border }]}>
            <AppText style={[typography.body, { color: colors.textMuted }]}>
              {t('summary.duration')}
            </AppText>
            <AppText style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
              {formatDuration(session.durationMs, language)}
            </AppText>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, cardStyle]}>
          <AppButton
            label={t('summary.newDhikr')}
            onPress={handleNewDhikr}
            variant="ghost"
            arabic
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <AppButton
            label={t('summary.repeat')}
            onPress={handleRepeat}
            variant="primary"
            arabic
            style={{ flex: 1 }}
          />
        </Animated.View>
      </Pressable>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    maxWidth: isTablet ? contentMaxWidth : undefined,
    alignSelf: isTablet ? 'center' as const : undefined,
    width: isTablet ? '100%' as any : undefined,
  },
  glowOrb: {
    position: 'absolute',
    top: '15%',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  dhikrTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.xl,
  },
});
