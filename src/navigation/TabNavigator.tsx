import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_CONTENT_HEIGHT = 60;

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
    <AppText
      style={[
        styles.tabEmoji,
        { opacity: focused ? 1 : 0.5 },
      ]}
    >
      {emoji}
    </AppText>
    <AppText
      arabic
      style={[
        styles.tabLabel,
        { color: focused ? colors.accent : colors.textMuted },
      ]}
    >
      {label}
    </AppText>
    {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
  </View>
);

function HomeTabBarIcon({ focused }: { focused: boolean }) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <TabIcon emoji="📿" label={t('home.title')} focused={focused} colors={colors} />
  );
}

function HistoryTabBarIcon({ focused }: { focused: boolean }) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <TabIcon emoji="📊" label={t('history.title')} focused={focused} colors={colors} />
  );
}

function SettingsTabBarIcon({ focused }: { focused: boolean }) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <TabIcon emoji="⚙️" label={t('settings.title')} focused={focused} colors={colors} />
  );
}

export const TabNavigator = () => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 0;
  const tabBarHeight = TAB_CONTENT_HEIGHT + bottomInset;

  return (
    <Tab.Navigator
      id="bottom-tabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 0,
          paddingBottom: bottomInset,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: TAB_CONTENT_HEIGHT,
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          // Let the icon component size itself — no forced margins
          width: '100%',
          height: TAB_CONTENT_HEIGHT,
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: HomeTabBarIcon }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: HistoryTabBarIcon }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: SettingsTabBarIcon }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
    textAlign: 'center',
    includeFontPadding: false,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
