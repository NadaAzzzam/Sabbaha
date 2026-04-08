import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { DEFAULT_DHIKR } from '../constants/defaultDhikr';
import { useDhikrStore } from '../stores/useDhikrStore';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SessionSetup'>;

export const SessionSetupScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { customDhikr } = useDhikrStore();

  const allDhikr = [...DEFAULT_DHIKR, ...customDhikr];
  const item = allDhikr.find(d => d.id === route.params.dhikrId)!;

  const [isFree, setIsFree] = useState(item?.defaultTarget === 0);
  const [countText, setCountText] = useState(
    item?.defaultTarget > 0 ? String(item.defaultTarget) : '',
  );

  const handleStart = () => {
    const target = isFree ? 0 : parseInt(countText, 10) || 0;
    navigation.navigate('Session', {
      dhikrId: route.params.dhikrId,
      targetCount: target,
    });
  };

  if (!item) return null;

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppText style={{ color: colors.textSecondary, fontSize: 16 }}>
            {t('setup.back')} ←
          </AppText>
        </TouchableOpacity>

        {/* Dhikr display */}
        <View style={styles.dhikrArea}>
          <AppText
            arabic
            style={[typography.arabicHero, { color: colors.text, textAlign: 'center' }]}
          >
            {item.arabicText}
          </AppText>
          {!!item.transliteration && (
            <AppText
              style={[
                typography.transliteration,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
              ]}
            >
              {item.transliteration}
            </AppText>
          )}
        </View>

        {/* Mode toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={() => setIsFree(false)}
            style={[
              styles.toggleOption,
              !isFree && { backgroundColor: colors.accent },
            ]}
            activeOpacity={0.8}
          >
            <AppText
              arabic
              style={[
                typography.arabicSmall,
                { color: isFree ? colors.textMuted : '#1B3A2D', fontWeight: '600' },
              ]}
            >
              {t('setup.fixedMode')}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsFree(true)}
            style={[
              styles.toggleOption,
              isFree && { backgroundColor: colors.accent },
            ]}
            activeOpacity={0.8}
          >
            <AppText
              arabic
              style={[
                typography.arabicSmall,
                { color: isFree ? '#1B3A2D' : colors.textMuted, fontWeight: '600' },
              ]}
            >
              {t('setup.freeMode')}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Count input */}
        {!isFree && (
          <View style={styles.countRow}>
            <AppText style={[typography.body, { color: colors.textSecondary }]}>
              {t('setup.count')}
            </AppText>
            <TextInput
              style={[
                styles.countInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.accent,
                },
              ]}
              value={countText}
              onChangeText={setCountText}
              keyboardType="number-pad"
              textAlign="center"
              selectionColor={colors.accent}
            />
          </View>
        )}

        {/* Start button */}
        <AppButton
          label={t('setup.start')}
          onPress={handleStart}
          arabic
          style={styles.startBtn}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  backBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  dhikrArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    minHeight: 200,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.xl,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  countInput: {
    width: 100,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '600',
  },
  startBtn: {
    marginTop: 'auto',
  },
});
