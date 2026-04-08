import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
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

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.btn,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
        },
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
