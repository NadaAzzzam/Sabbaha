import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';
import {
  useSettingsStore,
  type Language,
  type Theme,
  type HapticIntensity,
  type SoundVolume,
} from '../stores/useSettingsStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import i18n from '../i18n';

const Row = ({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>;
}) => (
  <View style={[styles.row, { borderBottomColor: colors.border }]}>
    <AppText style={[typography.body, { color: colors.textSecondary }]}>{label}</AppText>
    <View style={styles.rowRight}>{children}</View>
  </View>
);

const SegmentGroup = ({
  options,
  selected,
  onSelect,
  colors,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  colors: ReturnType<typeof useTheme>;
}) => (
  <View style={[styles.segment, { backgroundColor: colors.surface }]}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.value}
        onPress={() => onSelect(opt.value)}
        style={[
          styles.segItem,
          selected === opt.value && { backgroundColor: colors.accent },
        ]}
        activeOpacity={0.8}
      >
        <AppText
          style={[
            typography.caption,
            {
              color: selected === opt.value ? '#1B3A2D' : colors.textMuted,
              fontWeight: '600',
            },
          ]}
        >
          {opt.label}
        </AppText>
      </TouchableOpacity>
    ))}
  </View>
);

export const SettingsScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const {
    hapticsEnabled,
    hapticIntensity,
    soundEnabled,
    soundVolume,
    language,
    theme,
    setHapticsEnabled,
    setHapticIntensity,
    setSoundEnabled,
    setSoundVolume,
    setLanguage,
    setTheme,
  } = useSettingsStore();
  const { clearHistory } = useHistoryStore();

  const handleLanguage = (v: string) => {
    setLanguage(v as Language);
    i18n.changeLanguage(v);
  };

  const handleResetHistory = () => {
    Alert.alert(t('settings.resetConfirm'), t('settings.resetMessage'), [
      { text: t('settings.resetNo'), style: 'cancel' },
      {
        text: t('settings.resetYes'),
        style: 'destructive',
        onPress: clearHistory,
      },
    ]);
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={[styles.header, { alignItems: language === 'ar' ? 'flex-end' : 'flex-start' }]}>
          <AppText arabic={language === 'ar'} style={[typography.arabicLarge, { color: colors.text }]}>
            {t('settings.title')}
          </AppText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Haptic toggle */}
          <Row label={t('settings.haptics')} colors={colors}>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={hapticsEnabled ? '#1B3A2D' : colors.textMuted}
            />
          </Row>

          {/* Haptic intensity */}
          {hapticsEnabled && (
            <Row label={t('settings.intensity')} colors={colors}>
              <SegmentGroup
                options={[
                  { label: t('settings.intensityLight'), value: 'light' },
                  { label: t('settings.intensityMedium'), value: 'medium' },
                  { label: t('settings.intensityStrong'), value: 'strong' },
                ]}
                selected={hapticIntensity}
                onSelect={v => setHapticIntensity(v as HapticIntensity)}
                colors={colors}
              />
            </Row>
          )}

          {/* Sound toggle */}
          <Row label={t('settings.sound')} colors={colors}>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={soundEnabled ? '#1B3A2D' : colors.textMuted}
            />
          </Row>

          {/* Sound volume */}
          {soundEnabled && (
            <Row label={t('settings.soundVolume')} colors={colors}>
              <SegmentGroup
                options={[
                  { label: t('settings.soundVolumeLow'), value: 'low' },
                  { label: t('settings.soundVolumeMedium'), value: 'medium' },
                  { label: t('settings.soundVolumeHigh'), value: 'high' },
                ]}
                selected={soundVolume}
                onSelect={v => setSoundVolume(v as SoundVolume)}
                colors={colors}
              />
            </Row>
          )}

          {/* Language */}
          <Row label={t('settings.language')} colors={colors}>
            <SegmentGroup
              options={[
                { label: t('settings.arabic'), value: 'ar' },
                { label: t('settings.english'), value: 'en' },
              ]}
              selected={language}
              onSelect={handleLanguage}
              colors={colors}
            />
          </Row>

          {/* Theme */}
          <Row label={t('settings.theme')} colors={colors}>
            <SegmentGroup
              options={[
                { label: t('settings.dark'), value: 'dark' },
                { label: t('settings.light'), value: 'light' },
              ]}
              selected={theme}
              onSelect={v => setTheme(v as Theme)}
              colors={colors}
            />
          </Row>
        </View>

        {/* Danger zone */}
        <TouchableOpacity
          onPress={handleResetHistory}
          style={[styles.dangerBtn, { borderColor: colors.error }]}
          activeOpacity={0.8}
        >
          <AppText arabic style={[typography.body, { color: colors.error }]}>
            {t('settings.resetHistory')}
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  section: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  rowRight: {
    flexShrink: 0,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.full,
    padding: 3,
  },
  segItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    minWidth: 52,
    alignItems: 'center',
  },
  dangerBtn: {
    margin: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
});
