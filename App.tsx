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
import { useHistoryStore } from './src/stores/useHistoryStore';
import { useSessionStore, getSessionActiveDurationMs } from './src/stores/useSessionStore';

// Initialize i18n before first render
const settings = useSettingsStore.getState();
initI18n(settings.language);

/** Save in-progress session to history if the app is backgrounded/killed mid-session. */
function autoSaveSessionIfActive() {
  const historyPersist = useHistoryStore.persist;
  if (!historyPersist.hasHydrated()) {
    const unsub = historyPersist.onFinishHydration(() => {
      unsub();
      autoSaveSessionIfActive();
    });
    return;
  }
  const session = useSessionStore.getState();
  if (
    !session.startedAt ||
    session.isComplete ||
    session.currentCount === 0
  ) {
    return;
  }
  const id = `session_${Date.now()}`;
  useHistoryStore.getState().addSession({
    id,
    dhikrId: session.dhikrId,
    dhikrText: session.dhikrText,
    targetCount: session.targetCount,
    totalCount: session.currentCount,
    durationMs: getSessionActiveDurationMs(),
    completedAt: Date.now(),
    wasInterrupted: true,
  });
  useSessionStore.getState().reset();
}

const useReminderScheduler = () => {
  const reminderInterval = useSettingsStore(s => s.reminderInterval);

  useEffect(() => {
    const handleChange = (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        if (state === 'background') {
          autoSaveSessionIfActive();
        }
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
