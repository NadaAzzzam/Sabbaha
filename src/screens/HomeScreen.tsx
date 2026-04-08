import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { DhikrCard } from '../components/dhikr/DhikrCard';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { DEFAULT_DHIKR, type DhikrItem } from '../constants/defaultDhikr';
import { useDhikrStore } from '../stores/useDhikrStore';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { customDhikr, addCustomDhikr, removeDhikr } = useDhikrStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [arabicText, setArabicText] = useState('');
  const [countText, setCountText] = useState('');

  const allDhikr = [...DEFAULT_DHIKR, ...customDhikr];

  const handleSelectDhikr = (item: DhikrItem) => {
    navigation.navigate('SessionSetup', { dhikrId: item.id });
  };

  const handleAddCustom = () => {
    if (!arabicText.trim()) return;
    const target = parseInt(countText, 10);
    const newItem: DhikrItem = {
      id: `custom_${Date.now()}`,
      arabicText: arabicText.trim(),
      transliteration: '',
      translation: '',
      defaultTarget: isNaN(target) || target <= 0 ? 0 : target,
      isCustom: true,
    };
    addCustomDhikr(newItem);
    setArabicText('');
    setCountText('');
    setModalVisible(false);
  };

  const handleLongPress = (item: DhikrItem) => {
    if (!item.isCustom) return;
    Alert.alert(
      item.arabicText,
      '',
      [
        { text: t('settings.resetNo'), style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => removeDhikr(item.id),
        },
      ],
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText arabic style={[typography.arabicHero, { color: colors.accent }]}>
            {t('home.title')}
          </AppText>
          <AppText style={[typography.body, { color: colors.textSecondary }]}>
            {t('home.subtitle')}
          </AppText>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Dhikr List */}
      <FlatList
        data={allDhikr}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleLongPress(item)}
            delayLongPress={600}
          >
            <DhikrCard item={item} onPress={() => handleSelectDhikr(item)} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[styles.addBtn, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <AppText style={[typography.body, { color: colors.textMuted }]}>
              + {t('home.addCustom')}
            </AppText>
          </TouchableOpacity>
        }
      />

      {/* Add Custom Dhikr Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <AppText arabic style={[typography.arabicMedium, { color: colors.text, marginBottom: spacing.lg }]}>
              {t('custom.title')}
            </AppText>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                  textAlign: 'right',
                },
              ]}
              placeholder={t('custom.arabicPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={arabicText}
              onChangeText={setArabicText}
              textAlign="right"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                  marginTop: spacing.sm,
                },
              ]}
              placeholder={t('custom.countPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={countText}
              onChangeText={setCountText}
              keyboardType="number-pad"
              textAlign="left"
            />

            <View style={styles.modalActions}>
              <AppButton
                label={t('custom.cancel')}
                onPress={() => { setModalVisible(false); setArabicText(''); setCountText(''); }}
                variant="ghost"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <AppButton
                label={t('custom.save')}
                onPress={handleAddCustom}
                variant="primary"
                style={{ flex: 1 }}
                disabled={!arabicText.trim()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  list: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  addBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
});
