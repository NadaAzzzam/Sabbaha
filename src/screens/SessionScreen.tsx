import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { ProgressRing } from '../components/dhikr/ProgressRing';
import { useTheme } from '../hooks/useTheme';
import { useCounter } from '../hooks/useCounter';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_DHIKR } from '../constants/defaultDhikr';
import { useDhikrStore } from '../stores/useDhikrStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatTimer, formatCount } from '../utils/formatters';
import type { RootStackParamList } from '../navigation/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Session'>;

export const SessionScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { dhikrId, targetCount } = route.params;

  const { customDhikr } = useDhikrStore();
  const allDhikr = [...DEFAULT_DHIKR, ...customDhikr];
  const item = allDhikr.find(d => d.id === dhikrId);

  const {
    initSession,
    currentCount,
    isPaused,
    startedAt,
    pause,
    resume,
    reset,
  } = useSessionStore();
  const { addSession } = useHistoryStore();
  const { language } = useSettingsStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Init session on mount
  useEffect(() => {
    initSession(dhikrId, item?.arabicText ?? dhikrId, targetCount);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const startedAtRef = useRef(startedAt);
  useEffect(() => { startedAtRef.current = startedAt; }, [startedAt]);

  const saveAndNavigate = useCallback(
    (count: number) => {
      const duration = Date.now() - startedAtRef.current;
      const id = `session_${Date.now()}`;
      addSession({
        id,
        dhikrId,
        dhikrText: item?.arabicText ?? dhikrId,
        targetCount,
        totalCount: count,
        durationMs: duration,
        completedAt: Date.now(),
      });
      reset();
      navigation.replace('Summary', { sessionId: id });
    },
    [dhikrId, item, targetCount],
  );

  const triggerCompletionGlow = useCallback(() => {
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(600, withTiming(0, { duration: 800 })),
    );
    pulseScale.value = withSequence(
      withTiming(1.05, { duration: 150 }),
      withTiming(1, { duration: 300 }),
    );
  }, []);

  const currentCountRef = useRef(currentCount);
  useEffect(() => { currentCountRef.current = currentCount; }, [currentCount]);

  const handleComplete = useCallback(() => {
    triggerCompletionGlow();
    const finalCount = currentCountRef.current + 1; // +1 because increment fires before complete
    setTimeout(() => saveAndNavigate(finalCount), 1500);
  }, [triggerCompletionGlow, saveAndNavigate]);

  const { tap } = useCounter(handleComplete);

  const handleFinishFree = () => {
    saveAndNavigate(currentCountRef.current);
  };

  const handlePausePress = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
      Alert.alert(t('session.exitTitle'), t('session.exitMessage'), [
        {
          text: t('session.exitCancel'),
          onPress: () => resume(),
          style: 'cancel',
        },
        {
          text: t('session.exitConfirm'),
          style: 'destructive',
          onPress: () => saveAndNavigate(currentCountRef.current),
        },
      ]);
    }
  };

  const progress = targetCount > 0 ? Math.min(currentCount / targetCount, 1) : 0;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <ScreenWrapper noSafeArea>
      {/* Gold completion glow overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: colors.accentGlow },
          glowStyle,
        ]}
      />

      <TouchableWithoutFeedback onPress={tap}>
        <View style={styles.tapArea}>
          {/* Progress ring + counter */}
          <Animated.View style={[styles.centerContent, scaleStyle]}>
            {targetCount > 0 && (
              <View style={styles.ringWrapper}>
                <ProgressRing
                  size={SCREEN_W * 0.75}
                  progress={progress}
                  accentColor={colors.accent}
                  trackColor={colors.surface}
                  strokeWidth={8}
                />
              </View>
            )}

            {/* Dhikr text */}
            <AppText
              arabic
              style={[
                typography.arabicMedium,
                { color: colors.textSecondary, textAlign: 'center' },
              ]}
            >
              {item?.arabicText ?? dhikrId}
            </AppText>

            {/* Counter */}
            <AppText
              style={[
                typography.counterHero,
                { color: colors.accent, marginTop: spacing.sm },
              ]}
            >
              {formatCount(currentCount, language)}
            </AppText>

            {targetCount > 0 && (
              <AppText
                style={[typography.counterSub, { color: colors.textMuted }]}
              >
                / {formatCount(targetCount, language)}
              </AppText>
            )}
          </Animated.View>

          {/* Timer */}
          <View style={styles.timerRow}>
            <AppText style={[typography.timer, { color: colors.textMuted }]}>
              {formatTimer(elapsedSeconds)}
            </AppText>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomRow}>
            {/* Pause / exit */}
            <TouchableOpacity
              onPress={handlePausePress}
              style={[styles.pauseBtn, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText style={{ color: colors.textSecondary, fontSize: 22 }}>
                {isPaused ? '▶' : '⏸'}
              </AppText>
            </TouchableOpacity>

            {/* Finish for free mode */}
            {targetCount === 0 && (
              <TouchableOpacity
                onPress={handleFinishFree}
                style={[styles.finishBtn, { backgroundColor: colors.surface, borderColor: colors.accent }]}
              >
                <AppText arabic style={[typography.arabicSmall, { color: colors.accent }]}>
                  {t('session.finish')}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tapArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    position: 'absolute',
  },
  timerRow: {
    position: 'absolute',
    top: 60,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  pauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
  },
});
