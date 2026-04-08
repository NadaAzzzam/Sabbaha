import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon = ({
  emoji,
  label,
  focused,
  colors,
}: {
  emoji: string;
  label: string;
  focused: boolean;
  colors: ReturnType<typeof useTheme>;
}) => (
  <View style={styles.tabItem}>
    <AppText style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</AppText>
    <AppText
      style={{
        fontSize: 10,
        color: focused ? colors.accent : colors.textMuted,
        marginTop: 2,
      }}
    >
      {label}
    </AppText>
  </View>
);

export const TabNavigator = () => {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📿" label={t('home.title')} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label={t('history.title')} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label={t('settings.title')} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
