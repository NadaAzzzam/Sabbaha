import { Platform, type TextStyle } from 'react-native';

/** UI stack: Cairo on web (loaded in index.html), platform fonts on native */
const webFontStack =
  'Cairo, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: webFontStack,
  default: 'system-ui, sans-serif',
}) as string;

/** React Navigation header / label fonts */
export const navigationUiFontFamily = Platform.select({
  web: webFontStack,
  default: 'System',
}) as string;

/** Split out so `fontVariant` is `FontVariant[]` under `TextStyle`, not widened `string[]`. */
export const typographyTimer: TextStyle = {
  fontSize: 18,
  lineHeight: 24,
  fontWeight: '300',
  letterSpacing: 2,
  fontVariant: ['tabular-nums'],
};

export const typography = {
  arabicHero: {
    fontSize: 42,
    lineHeight: 64,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  arabicLarge: {
    fontSize: 28,
    lineHeight: 44,
    fontWeight: '600' as const,
  },
  arabicMedium: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '500' as const,
  },
  arabicSmall: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  transliteration: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  counterHero: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '300' as const,
    letterSpacing: -2,
  },
  counterSub: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '300' as const,
  },
  timer: typographyTimer,
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
};
