import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, StyleSheet, type AppStateStatus } from 'react-native';
import i18n, { initI18n } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useSettingsStore } from './src/stores/useSettingsStore';
import { darkColors, lightColors } from './src/theme/colors';
import { navigationUiFontFamily } from './src/theme/typography';
import { cancelReminder, scheduleReminder } from './src/utils/notifications';

// Initialize i18n before first render
const settings = useSettingsStore.getState();
initI18n(settings.language);

const useReminderScheduler = () => {
  const reminderInterval = useSettingsStore(s => s.reminderInterval);

  useEffect(() => {
    const handleChange = (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        scheduleReminder(
          reminderInterval,
          i18n.t('notifications.reminderTitle'),
          i18n.t('notifications.reminderBody'),
        );
      } else if (state === 'active') {
        cancelReminder();
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [reminderInterval]);
};

const ThemedNavContainer = () => {
  const theme = useSettingsStore(s => s.theme);
  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <NavigationContainer
      theme={{
        dark: theme === 'dark',
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: navigationUiFontFamily, fontWeight: '400' },
          medium: { fontFamily: navigationUiFontFamily, fontWeight: '500' },
          bold: { fontFamily: navigationUiFontFamily, fontWeight: '700' },
          heavy: { fontFamily: navigationUiFontFamily, fontWeight: '900' },
        },
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

const AppInner = () => {
  useReminderScheduler();
  return <ThemedNavContainer />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
