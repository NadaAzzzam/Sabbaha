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

const TAB_ICON_AREA = 44; // fixed height for icon + label content

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
    {/* Active indicator pill */}
    {focused && (
      <View style={[styles.activePill, { backgroundColor: colors.accentGlow }]} />
    )}
    <AppText style={[styles.tabEmoji, { opacity: focused ? 1 : 0.45 }]}>
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

  // Full tab bar height = icon area + bottom safe area (home indicator on iOS, nav bar on Android)
  const tabBarHeight = TAB_ICON_AREA + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          // Eliminate React Navigation's own paddingBottom so we control layout fully
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarShowLabel: false,
        // Keep the icon filling the whole tab bar cell
        tabBarItemStyle: {
          height: tabBarHeight,
          paddingTop: 0,
          paddingBottom: insets.bottom,
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
    alignItems: 'center',
    justifyContent: 'center',
    // Ensure the item never clips its children
    overflow: 'visible',
    width: '100%',
    paddingTop: 6,
  },
  activePill: {
    position: 'absolute',
    top: -4,
    width: 36,
    height: 3,
    borderRadius: 2,
  },
  tabEmoji: {
    fontSize: 22,
    lineHeight: 28,
    includeFontPadding: false,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
