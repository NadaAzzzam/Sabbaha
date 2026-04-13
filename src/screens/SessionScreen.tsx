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
  useWindowDimensions,
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
  withSpring,
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
import { useSettingsStore, type Language } from '../stores/useSettingsStore';
import { DEFAULT_DHIKR } from '../constants/defaultDhikr';
import { useDhikrStore } from '../stores/useDhikrStore';
import { spacing } from '../theme/spacing';
import { typography, typographyTimer } from '../theme/typography';
import { formatTimer, formatCount } from '../utils/formatters';
import { ms, isTablet } from '../utils/responsive';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Session'>;

// ─── Timer: isolated to its own component so SVG ring never re-renders on tick ───
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

  const elapsed = useMemo(() => {
    void tick;
    if (!startedAt) return 0;
    const now = Date.now();
    let pauseMs = pausedAccumulatedMs;
    if (isPaused && pauseStartedAt != null) pauseMs += now - pauseStartedAt;
    return Math.max(0, Math.floor((now - startedAt - pauseMs) / 1000));
  }, [tick, startedAt, isPaused, pauseStartedAt, pausedAccumulatedMs]);

  return (
    <View style={styles.timerRow}>
      <AppText style={[typographyTimer, { color: textColor }]}>
        {formatTimer(elapsed)}
      </AppText>
    </View>
  );
});

// ─── Counter display: isolated so timer tick never re-renders the big number ───
const CountDisplay = memo(function CountDisplay({
  count,
  targetCount,
  language,
  accentColor,
  mutedColor,
}: {
  count: number;
  targetCount: number;
  language: Language;
  accentColor: string;
  mutedColor: string;
}) {
  const countStr = useMemo(() => formatCount(count, language), [count, language]);
  const targetStr = useMemo(() => formatCount(targetCount, language), [targetCount, language]);
  const counterFontSize = ms(72, 0.4);
  const subFontSize = ms(22, 0.3);
  return (
    <>
      <AppText style={[typography.counterHero, { color: accentColor, marginTop: spacing.sm, fontSize: counterFontSize, lineHeight: counterFontSize * 1.1 }]}>
        {countStr}
      </AppText>
      {targetCount > 0 && (
        <AppText style={[typography.counterSub, { color: mutedColor, fontSize: subFontSize }]}>
          / {targetStr}
        </AppText>
      )}
    </>
  );
});

export const SessionScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { dhikrId, targetCount } = route.params;

  // Responsive ring size
  const { width: screenW, height: screenH } = useWindowDimensions();
  const RING_SIZE = Math.min(
    screenW * (isTablet ? 0.5 : 0.75),
    screenH * 0.4,
    400,
  );

  // Granular selectors — each only re-renders on its own slice
  const customDhikr = useDhikrStore(s => s.customDhikr);
  const item = useMemo(
    () => [...DEFAULT_DHIKR, ...customDhikr].find(d => d.id === dhikrId),
    [customDhikr, dhikrId],
  );

  // Auto-size dhikr text: shrink for long strings so they fit inside the ring
  const dhikrText = item?.arabicText ?? dhikrId;
  const dhikrTextFontSize = useMemo(() => {
    const len = dhikrText.length;
    if (len <= 12) return ms(20, 0.3);
    if (len <= 20) return ms(18, 0.3);
    if (len <= 30) return ms(16, 0.3);
    return ms(14, 0.3);
  }, [dhikrText]);

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

  // Reanimated shared values — never trigger JS re-renders
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const tapScale = useSharedValue(1);

  const [sessionHydrated, setSessionHydrated] = useState(() =>
    useSessionStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useSessionStore.persist.hasHydrated()) {
      setSessionHydrated(true);
      return;
    }
    return useSessionStore.persist.onFinishHydration(() => setSessionHydrated(true));
  }, []);

  // Resume in-progress session or start fresh
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
  }, [sessionHydrated, dhikrId, targetCount, item?.arabicText, initSession]);

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
      withTiming(1, { duration: 150 }),
      withDelay(500, withTiming(0, { duration: 700 })),
    );
    pulseScale.value = withSequence(
      withTiming(1.08, { duration: 120 }),
      withTiming(1, { duration: 300 }),
    );
  }, [glowOpacity, pulseScale]);

  const triggerTapFeedback = useCallback(() => {
    tapScale.value = withSequence(
      withTiming(0.96, { duration: 60 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  }, [tapScale]);

  // Keep a ref so handleComplete closure doesn't stale
  const currentCountRef = useRef(currentCount);
  useEffect(() => { currentCountRef.current = currentCount; }, [currentCount]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const handleComplete = useCallback(
    (finalCount: number) => {
      triggerCompletionGlow();
      setTimeout(() => saveAndNavigate(finalCount), 1400);
    },
    [triggerCompletionGlow, saveAndNavigate],
  );

  const { tap: counterTap } = useCounter(handleComplete);

  // Prevent taps while paused — block at this level so useCounter never fires
  const tap = useCallback(() => {
    if (isPausedRef.current) return;
    triggerTapFeedback();
    counterTap();
  }, [counterTap, triggerTapFeedback]);

  const handleFinishFree = useCallback(() => {
    saveAndNavigate(currentCountRef.current);
  }, [saveAndNavigate]);

  const handlePausePress = useCallback(() => {
    if (isPausedRef.current) {
      resume();
      return;
    }
    pause();
    Alert.alert(
      t('session.exitTitle'),
      t('session.exitMessage'),
      [
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
      ],
      { onDismiss: () => resume() },
    );
  }, [pause, resume, saveAndNavigate, t]);

  const progress = targetCount > 0 ? Math.min(currentCount / targetCount, 1) : 0;

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const tapScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }],
  }));

  return (
    <ScreenWrapper noSafeArea>
      {/* Gold completion glow overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.accentGlow }, glowStyle]}
      />

      {/* Tap handler must not wrap bottom buttons — on Android the parent steals touches from nested Touchables. */}
      <View style={styles.tapArea}>
        <TouchableWithoutFeedback onPress={tap}>
          <View style={styles.tapSurface}>
            {/* Center: ring + dhikr text + counter */}
            <Animated.View style={[styles.centerContent, scaleStyle]}>
              {targetCount > 0 && (
                <View style={styles.ringWrapper}>
                  <ProgressRing
                    size={RING_SIZE}
                    progress={progress}
                    accentColor={colors.accent}
                    trackColor={colors.surface}
                    strokeWidth={8}
                  />
                </View>
              )}

              <AppText
                arabic
                numberOfLines={2}
                style={[
                  typography.arabicMedium,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    fontSize: dhikrTextFontSize,
                    lineHeight: dhikrTextFontSize * 1.6,
                    paddingHorizontal: spacing.md,
                    maxWidth: RING_SIZE + spacing.xl,
                  },
                ]}
              >
                {item?.arabicText ?? dhikrId}
              </AppText>

              <Animated.View style={tapScaleStyle}>
                <CountDisplay
                  count={currentCount}
                  targetCount={targetCount}
                  language={language}
                  accentColor={colors.accent}
                  mutedColor={colors.textMuted}
                />
              </Animated.View>
            </Animated.View>

            <SessionElapsedTimer
              startedAt={startedAt}
              isPaused={isPaused}
              pauseStartedAt={pauseStartedAt}
              pausedAccumulatedMs={pausedAccumulatedMs}
              textColor={colors.textMuted}
            />
          </View>
        </TouchableWithoutFeedback>

        <View style={[styles.bottomRow, isTablet && styles.bottomRowTablet]} pointerEvents="box-none">
          <TouchableOpacity
            onPress={handlePausePress}
            style={[styles.pauseBtn, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppText style={{ color: colors.textSecondary, fontSize: ms(22, 0.3) }}>
              {isPaused ? '▶' : '⏸'}
            </AppText>
          </TouchableOpacity>

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
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tapArea: {
    flex: 1,
  },
  tapSurface: {
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
  },
  bottomRowTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    left: 0,
    right: 0,
  },
});
