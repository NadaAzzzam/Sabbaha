import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  useState,
} from 'react';
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
} from 'react-native-reanimated';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { ProgressRing } from '../components/dhikr/ProgressRing';
import { useTheme } from '../hooks/useTheme';
import { useCounter } from '../hooks/useCounter';
import { useHistoryStore } from '../stores/useHistoryStore';
import {
  useSessionStore,
  getSessionActiveDurationMs,
} from '../stores/useSessionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_DHIKR } from '../constants/defaultDhikr';
import { useDhikrStore } from '../stores/useDhikrStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatTimer, formatCount } from '../utils/formatters';
import type { RootStackParamList } from '../navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Session'>;

/** Owns the 1s tick so the rest of SessionScreen (SVG ring, layout) does not re-render every second. */
const SessionElapsedTimer = memo(function SessionElapsedTimer({
  startedAt,
  isPaused,
  pauseStartedAt,
  pausedAccumulatedMs,
  textColor,
}: {
  startedAt: number;
  isPaused: boolean;
  pauseStartedAt: number | null;
  pausedAccumulatedMs: number;
  textColor: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isPaused) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  const elapsedSeconds = useMemo(() => {
    void tick;
    const now = Date.now();
    if (!startedAt) return 0;
    let pauseMs = pausedAccumulatedMs;
    if (isPaused && pauseStartedAt != null) {
      pauseMs += now - pauseStartedAt;
    }
    return Math.max(0, Math.floor((now - startedAt - pauseMs) / 1000));
  }, [tick, startedAt, isPaused, pauseStartedAt, pausedAccumulatedMs]);

  return (
    <View style={styles.timerRow}>
      <AppText style={[typography.timer, { color: textColor }]}>
        {formatTimer(elapsedSeconds)}
      </AppText>
    </View>
  );
});

export const SessionScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { dhikrId, targetCount } = route.params;

  const customDhikr = useDhikrStore(s => s.customDhikr);
  const item = useMemo(
    () => [...DEFAULT_DHIKR, ...customDhikr].find(d => d.id === dhikrId),
    [customDhikr, dhikrId],
  );

  const initSession = useSessionStore(s => s.initSession);
  const currentCount = useSessionStore(s => s.currentCount);
  const isPaused = useSessionStore(s => s.isPaused);
  const startedAt = useSessionStore(s => s.startedAt);
  const pauseStartedAt = useSessionStore(s => s.pauseStartedAt);
  const pausedAccumulatedMs = useSessionStore(s => s.pausedAccumulatedMs);
  const pause = useSessionStore(s => s.pause);
  const resume = useSessionStore(s => s.resume);
  const reset = useSessionStore(s => s.reset);
  const addSession = useHistoryStore(s => s.addSession);
  const language = useSettingsStore(s => s.language);

  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const [sessionHydrated, setSessionHydrated] = useState(() =>
    useSessionStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useSessionStore.persist.hasHydrated()) {
      setSessionHydrated(true);
    }
    return useSessionStore.persist.onFinishHydration(() =>
      setSessionHydrated(true),
    );
  }, []);

  // After MMKV rehydrate: resume in-progress session if it matches this screen; else start fresh.
  useEffect(() => {
    if (!sessionHydrated) return;
    const s = useSessionStore.getState();
    const canResume =
      s.dhikrId === dhikrId &&
      s.targetCount === targetCount &&
      s.startedAt > 0 &&
      !s.isComplete;

    if (canResume) {
      if (!s.dhikrText && item?.arabicText) {
        useSessionStore.setState({ dhikrText: item.arabicText });
      }
      return;
    }
    initSession(dhikrId, item?.arabicText ?? dhikrId, targetCount);
  }, [
    sessionHydrated,
    dhikrId,
    targetCount,
    item?.arabicText,
    initSession,
  ]);

  const saveAndNavigate = useCallback(
    (count: number) => {
      const duration = getSessionActiveDurationMs();
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
    [addSession, dhikrId, item, navigation, reset, targetCount],
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

  const handleComplete = useCallback(
    (finalCount: number) => {
      triggerCompletionGlow();
      setTimeout(() => saveAndNavigate(finalCount), 1500);
    },
    [triggerCompletionGlow, saveAndNavigate],
  );

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

          <SessionElapsedTimer
            startedAt={startedAt}
            isPaused={isPaused}
            pauseStartedAt={pauseStartedAt}
            pausedAccumulatedMs={pausedAccumulatedMs}
            textColor={colors.textMuted}
          />

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
