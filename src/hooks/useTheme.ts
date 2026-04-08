import { useSettingsStore } from '../stores/useSettingsStore';
import { darkColors, lightColors, type ColorPalette } from '../theme/colors';

export const useTheme = (): ColorPalette => {
  const theme = useSettingsStore(s => s.theme);
  return theme === 'dark' ? darkColors : lightColors;
};
