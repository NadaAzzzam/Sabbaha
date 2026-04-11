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

const TAB_CONTENT_HEIGHT = 56; // icon + label fit vertically inside this

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
    {focused && (
      <View style={[styles.activePill, { backgroundColor: colors.accent }]} />
    )}
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
  </View>
);

export const TabNavigator = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 0;
  const tabBarHeight = TAB_CONTENT_HEIGHT + bottomInset;

  return (
    <Tab.Navigator
      id="MainTabs"
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
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              emoji="📿"
              label={t('home.title')}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              emoji="📊"
              label={t('history.title')}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              emoji="⚙️"
              label={t('settings.title')}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    height: TAB_CONTENT_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 2,
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
});
