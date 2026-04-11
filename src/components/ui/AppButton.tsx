import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  arabic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppButton = ({
  label,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  loading,
  arabic,
}: Props) => {
  const colors = useTheme();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const bgColor =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
      ? colors.error
      : 'transparent';

  const textColor =
    variant === 'primary'
      ? '#1B3A2D'
      : variant === 'danger'
      ? colors.error
      : colors.accent;

  const borderColor = variant === 'ghost' ? colors.accent : 'transparent';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value * 0.35,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
        glow.value = withTiming(1, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        glow.value = withTiming(0, { duration: 200 });
      }}
      disabled={disabled || loading}
      style={[
        styles.btn,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
          shadowColor: variant === 'primary' ? colors.accent : 'transparent',
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: variant === 'primary' && !disabled ? 4 : 0,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <AppText
          arabic={arabic}
          style={[typography.button, { color: textColor }, textStyle]}
        >
          {label}
        </AppText>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
