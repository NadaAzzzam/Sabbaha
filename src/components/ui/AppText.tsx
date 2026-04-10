import React from 'react';
import { Text, TextStyle, StyleSheet, I18nManager } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { fontFamily } from '../../theme/typography';

interface Props {
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  arabic?: boolean;
  numberOfLines?: number;
  onPress?: () => void;
}

export const AppText = ({ style, children, arabic, numberOfLines, onPress }: Props) => {
  const colors = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      onPress={onPress}
      style={[
        styles.base,
        { color: colors.text },
        arabic && styles.arabic,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  arabic: {
    textAlign: I18nManager.isRTL ? 'left' : 'right',
    writingDirection: 'rtl',
  },
});
