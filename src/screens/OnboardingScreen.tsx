import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Defs, RadialGradient, LinearGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/useSettingsStore';
import { spacing } from '../theme/spacing';
import { ms, isTablet } from '../utils/responsive';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingProps {
  onDone?: () => void;
}

const BEAD_POSITIONS = [
  { angle: 0 },
  { angle: 45 },
  { angle: 90 },
  { angle: 135 },
  { angle: 180 },
  { angle: 225 },
  { angle: 270 },
  { angle: 315 },
];

export const OnboardingScreen = ({ onDone }: OnboardingProps) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { language } = useSettingsStore();
  const { width, height } = useWindowDimensions();
  const isAr = language === 'ar';

  // Responsive sizes
  const ringRadius = Math.min(width * 0.33, isTablet ? 200 : 150);
  const beadRx = ms(55, 0.4);
  const beadRy = ms(65, 0.4);
  const smallBeadR = ms(7, 0.3);
  const centerY = height * 0.36;

  // Animations
  const beadScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const beadGlow = useSharedValue(0.15);

  useEffect(() => {
    beadScale.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) }));
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    btnOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false,
    );
    beadGlow.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [beadScale, titleOpacity, taglineOpacity, btnOpacity, ringRotation, beadGlow]);

  const beadStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beadScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
  }));

  const handleStart = () => {
    if (onDone) {
      onDone();
    } else {
      navigation.navigate('Tabs' as any);
    }
  };

  return (
    <ScreenWrapper noSafeArea>
      <View style={styles.container}>
        {/* Central bead illustration */}
        <View style={[styles.illustrationArea, { top: centerY - ringRadius - 30 }]}>
          <Svg
            width={ringRadius * 2 + 60}
            height={ringRadius * 2 + 60}
            viewBox={`0 0 ${ringRadius * 2 + 60} ${ringRadius * 2 + 60}`}
          >
            <Defs>
              <RadialGradient id="onbGlow" cx="50%" cy="48%" r="40%">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.25" />
                <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
              </RadialGradient>
              <LinearGradient id="onbGold" x1="20%" y1="10%" x2="80%" y2="90%">
                <Stop offset="0%" stopColor="#E8D06A" />
                <Stop offset="35%" stopColor={colors.accent} />
                <Stop offset="100%" stopColor={colors.accentMuted} />
              </LinearGradient>
              <RadialGradient id="onbHL" cx="38%" cy="35%" r="40%">
                <Stop offset="0%" stopColor="white" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="white" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Dashed tasbih ring */}
            <Circle
              cx={ringRadius + 30}
              cy={ringRadius + 30}
              r={ringRadius}
              fill="none"
              stroke={colors.surfaceElevated}
              strokeWidth={2}
              strokeDasharray="8 14"
              opacity={0.5}
            />

            {/* Small beads on the ring */}
            {BEAD_POSITIONS.map((pos, i) => {
              const rad = (pos.angle * Math.PI) / 180;
              const cx = ringRadius + 30 + Math.cos(rad) * ringRadius;
              const cy = ringRadius + 30 + Math.sin(rad) * ringRadius;
              const opacity = 0.3 + (i % 2 === 0 ? 0.15 : 0);
              return (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={smallBeadR}
                  fill={colors.accent}
                  opacity={opacity}
                />
              );
            })}

            {/* Glow behind central bead */}
            <Circle
              cx={ringRadius + 30}
              cy={ringRadius + 20}
              r={beadRy + 30}
              fill="url(#onbGlow)"
            />

            {/* Central bead */}
            <Ellipse
              cx={ringRadius + 30}
              cy={ringRadius + 20}
              rx={beadRx}
              ry={beadRy}
              fill="url(#onbGold)"
            />
            {/* Highlight */}
            <Ellipse
              cx={ringRadius + 22}
              cy={ringRadius + 8}
              rx={beadRx * 0.62}
              ry={beadRy * 0.62}
              fill="url(#onbHL)"
            />
            {/* String hole */}
            <Ellipse
              cx={ringRadius + 30}
              cy={ringRadius + 20}
              rx={7}
              ry={10}
              fill="none"
              stroke={colors.accentMuted}
              strokeWidth={1.5}
              opacity={0.5}
            />

            {/* String threads */}
            <Line
              x1={ringRadius + 30}
              y1={ringRadius + 20 - beadRy - 5}
              x2={ringRadius + 30}
              y2={ringRadius + 20 - beadRy - 15}
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.6}
            />
            <Line
              x1={ringRadius + 30}
              y1={ringRadius + 20 + beadRy + 5}
              x2={ringRadius + 30}
              y2={ringRadius + 20 + beadRy + 15}
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.6}
            />
          </Svg>
        </View>

        {/* Text content */}
        <View style={[styles.textArea, { top: centerY + ringRadius + ms(40, 0.3) }]}>
          {/* App name */}
          <Animated.View style={titleStyle}>
            <AppText
              arabic
              style={[
                styles.appName,
                { color: colors.accent, fontSize: ms(52, 0.4) },
              ]}
            >
              حَبّة
            </AppText>
          </Animated.View>

          {/* English tagline */}
          <Animated.View style={taglineStyle}>
            <AppText
              style={[
                styles.taglineEn,
                { color: colors.textSecondary, fontSize: ms(18, 0.3) },
              ]}
            >
              Feel every bead
            </AppText>
            {/* Arabic tagline */}
            <AppText
              arabic
              style={[
                styles.taglineAr,
                { color: colors.textMuted, fontSize: ms(20, 0.3) },
              ]}
            >
              اشعر بكل حبّة
            </AppText>
          </Animated.View>
        </View>

        {/* CTA Button */}
        <Animated.View
          style={[
            styles.btnArea,
            btnStyle,
            { maxWidth: isTablet ? 400 : undefined },
          ]}
        >
          <AppButton
            label={isAr ? 'ابدأ رحلتك' : 'Begin your journey'}
            onPress={handleStart}
            arabic={isAr}
            style={styles.ctaBtn}
          />
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  illustrationArea: {
    position: 'absolute',
    alignItems: 'center',
  },
  textArea: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  appName: {
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 72,
  },
  taglineEn: {
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  taglineAr: {
    fontWeight: '400',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  btnArea: {
    position: 'absolute',
    bottom: 80,
    left: spacing.xl,
    right: spacing.xl,
  },
  ctaBtn: {
    width: '100%',
  },
});
