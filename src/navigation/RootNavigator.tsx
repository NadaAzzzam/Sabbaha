import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { SessionSetupScreen } from '../screens/SessionSetupScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="SessionSetup" component={SessionSetupScreen} />
    <Stack.Screen
      name="Session"
      component={SessionScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen name="Summary" component={SummaryScreen} />
  </Stack.Navigator>
);
