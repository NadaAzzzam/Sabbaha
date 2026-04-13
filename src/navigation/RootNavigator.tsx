import React, { useEffect, useState, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { TabNavigator } from './TabNavigator';
import { SessionSetupScreen } from '../screens/SessionSetupScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const hasSeenOnboarding = useSettingsStore(s => s.hasSeenOnboarding);
  const setHasSeenOnboarding = useSettingsStore(s => s.setHasSeenOnboarding);

  const [hydrated, setHydrated] = useState(() =>
    useSettingsStore.persist.hasHydrated(),
  );
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding);

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setHydrated(true);
      setShowOnboarding(!useSettingsStore.getState().hasSeenOnboarding);
      return;
    }
    return useSettingsStore.persist.onFinishHydration(() => {
      setHydrated(true);
      setShowOnboarding(!useSettingsStore.getState().hasSeenOnboarding);
    });
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setHasSeenOnboarding();
    setShowOnboarding(false);
  }, [setHasSeenOnboarding]);

  if (!hydrated) return null;

  if (showOnboarding) {
    return <OnboardingScreen onDone={handleOnboardingDone} />;
  }

  return (
    <Stack.Navigator id="root-stack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="SessionSetup" component={SessionSetupScreen} />
      <Stack.Screen
        name="Session"
        component={SessionScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Summary" component={SummaryScreen} />
      <Stack.Screen
        name="Chart"
        component={ChartScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
};
