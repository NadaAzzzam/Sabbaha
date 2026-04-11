import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { calcStats, weeklyData } from '../utils/statsCalculator';
import { formatDuration, formatCount } from '../utils/formatters';
import { hijriParts } from '../utils/hijri';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');
// Chart card: marginH lg (24) + padding md (16) on each side  →  inner width
const CHART_CARD_MARGIN = spacing.lg;
const CHART_CARD_PADDING = spacing.md;
const CHART_W = SCREEN_W - (CHART_CARD_MARGIN + CHART_CARD_PADDING) * 2;
const CHART_H = 120;
const CHART_TOP_PAD = 22;   // reserve space for value labels above the tallest bar
const CHART_BOTTOM_PAD = 6;  // baseline breathing room (day labels now rendered as RN Text)
const BAR_GAP = 8;

export const HistoryScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { sessions } = useHistoryStore();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const stats = calcStats(sessions);
  const weekly = weeklyData(sessions);
  const maxVal = Math.max(...weekly, 1);
  const barW = (CHART_W - BAR_GAP * 6) / 7;

  const totalSessions = stats.reduce((s, i) => s + i.totalSessions, 0);
  const totalMinutes = stats.reduce((s, i) => s + Math.round(i.totalMs / 60000), 0);

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      <FlatList
        data={stats}
        keyExtractor={item => item.dhikrId}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Title + chart button ── */}
            <View style={styles.header}>
              <AppText arabic style={[styles.titleText, { color: colors.text }]}>
                {t('history.title')}
              </AppText>
              {sessions.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Chart')}
                  style={[styles.chartBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
                  activeOpacity={0.75}
                >
                  <AppText style={[styles.chartBtnIcon, { color: colors.accent }]}>📈</AppText>
                  <AppText arabic={isAr} style={[styles.chartBtnLabel, { color: colors.accent }]}>
                    {isAr ? 'المخطط' : 'Chart'}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Summary pills ── */}
            {sessions.length > 0 && (
              <View style={styles.pillsRow}>
                <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <AppText style={[typography.counterSub, { color: colors.accent, textAlign: 'center' }]}>
                    {totalSessions}
                  </AppText>
                  <AppText arabic style={[styles.pillLabel, { color: colors.textMuted }]}>
                    {t('history.sessions')}
                  </AppText>
                </View>
                <View style={[styles.pillDivider, { backgroundColor: colors.border }]} />
                <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <AppText style={[typography.counterSub, { color: colors.accent, textAlign: 'center' }]}>
                    {totalMinutes}
                  </AppText>
                  <AppText arabic style={[styles.pillLabel, { color: colors.textMuted }]}>
                    {t('history.totalMinutes')}
                  </AppText>
                </View>
              </View>
            )}

            {/* ── Weekly chart ── */}
            {sessions.length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.chartHeader}>
                  <AppText arabic style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    {t('history.thisWeek')}
                  </AppText>
                </View>

                <Svg
                  width={CHART_W}
                  height={CHART_TOP_PAD + CHART_H + CHART_BOTTOM_PAD}
                >
                  <Defs>
                    <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={colors.accent} stopOpacity="1" />
                      <Stop offset="1" stopColor={colors.accent} stopOpacity="0.35" />
                    </LinearGradient>
                    <LinearGradient id="barGradMuted" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={colors.surfaceElevated} stopOpacity="1" />
                      <Stop offset="1" stopColor={colors.surfaceElevated} stopOpacity="0.6" />
                    </LinearGradient>
                  </Defs>

                  {/* Baseline */}
                  <Line
                    x1={0}
                    y1={CHART_TOP_PAD + CHART_H}
                    x2={CHART_W}
                    y2={CHART_TOP_PAD + CHART_H}
                    stroke={colors.border}
                    strokeWidth={1}
                  />

                  {weekly.map((val, i) => {
                    const isToday = i === 6;
                    const minH = 6;
                    const barH = val > 0 ? Math.max((val / maxVal) * CHART_H, minH) : minH;
                    const x = i * (barW + BAR_GAP);
                    const y = CHART_TOP_PAD + CHART_H - barH;
                    const rx = Math.min(barW / 2, 6);

                    return (
                      <React.Fragment key={i}>
                        <Rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          rx={rx}
                          ry={rx}
                          fill={isToday ? 'url(#barGrad)' : 'url(#barGradMuted)'}
                        />
                        {/* Today top dot */}
                        {isToday && val > 0 && (
                          <Rect
                            x={x + barW / 2 - 3}
                            y={Math.max(y - 7, 4)}
                            width={6}
                            height={6}
                            rx={3}
                            ry={3}
                            fill={colors.accent}
                          />
                        )}
                        {/* Value label above bar — clamped to top pad */}
                        {val > 0 && (
                          <SvgText
                            x={x + barW / 2}
                            y={Math.max(y - (isToday ? 12 : 4), 11)}
                            fontSize={9}
                            fontWeight={isToday ? '700' : '400'}
                            fill={isToday ? colors.accent : colors.textMuted}
                            textAnchor="middle"
                          >
                            {val}
                          </SvgText>
                        )}
                      </React.Fragment>
                    );
                  })}
                </Svg>

                {/* Day labels (RN Text — renders Arabic with proper shaping) */}
                <View style={[styles.dayLabelRow, { width: CHART_W }]}>
                  {weekly.map((_, i) => {
                    const isToday = i === 6;
                    const anchor = new Date();
                    anchor.setHours(12, 0, 0, 0);
                    anchor.setDate(anchor.getDate() - (6 - i));
                    const { day } = hijriParts(anchor.getTime());
                    return (
                      <View
                        key={i}
                        style={[
                          styles.dayLabelCell,
                          {
                            width: barW,
                            marginRight: i < 6 ? BAR_GAP : 0,
                          },
                        ]}
                      >
                        <AppText
                          arabic={isAr}
                          style={{
                            fontSize: isToday ? 12 : 11,
                            lineHeight: 18,
                            fontWeight: isToday ? '700' : '500',
                            color: isToday ? colors.accent : colors.textMuted,
                            textAlign: 'center',
                            includeFontPadding: false,
                          }}
                        >
                          {formatCount(day, language)}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Section label ── */}
            {stats.length > 0 && (
              <View style={styles.sectionHeader}>
                <AppText arabic style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t('history.total')}
                </AppText>
                <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Dhikr name */}
            <AppText
              arabic
              numberOfLines={2}
              style={[styles.dhikrName, { color: colors.text }]}
            >
              {item.dhikrText}
            </AppText>

            {/* Divider */}
            <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

            {/* Stats row */}
            <View style={styles.statRow}>
              <StatCell
                value={String(item.totalSessions)}
                label={t('history.sessions')}
                accentColor={colors.accent}
                mutedColor={colors.textMuted}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatCell
                value={String(Math.round(item.totalMs / 60000))}
                label={t('history.totalMinutes')}
                accentColor={colors.accent}
                mutedColor={colors.textMuted}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatCell
                value={formatDuration(item.avgDurationMs, language)}
                label={t('history.avgDuration')}
                accentColor={colors.text}
                mutedColor={colors.textMuted}
                valueBold
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText style={[styles.emptyIcon, { color: colors.textMuted }]}>📿</AppText>
            <AppText arabic style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {t('history.empty')}
            </AppText>
            <AppText arabic style={[typography.arabicSmall, { color: colors.textMuted, textAlign: 'center' }]}>
              {t('history.emptyHint')}
            </AppText>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </ScreenWrapper>
  );
};

/* ── Small helper component ── */
const StatCell = ({
  value,
  label,
  accentColor,
  mutedColor,
  valueBold,
}: {
  value: string;
  label: string;
  accentColor: string;
  mutedColor: string;
  valueBold?: boolean;
}) => (
  <View style={styles.statItem}>
    <AppText
      arabic
      style={[
        styles.statValue,
        { color: accentColor, fontWeight: valueBold ? '600' : '400' },
      ]}
    >
      {value}
    </AppText>
    <AppText arabic style={[styles.statLabel, { color: mutedColor }]}>
      {label}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  chartBtnIcon: {
    fontSize: 14,
    lineHeight: 20,
  },
  chartBtnLabel: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 30,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Summary pills */
  pillsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pill: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xs / 2,
  },
  pillDivider: {
    width: spacing.xs,
  },
  pillLabel: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'center',
  },

  /* Chart */
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chartHeader: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  dayLabelRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    // Force LTR regardless of app RTL — bar index 0 always leftmost
    direction: 'ltr',
  },
  dayLabelCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },

  /* Stat card */
  statCard: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'flex-end',
  },
  dhikrName: {
    fontSize: 22,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'right',
    width: '100%',
  },
  cardDivider: {
    width: '100%',
    height: 1,
    marginVertical: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    alignSelf: 'center',
  },

  /* Empty */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },

  listContent: {
    paddingBottom: spacing.xxxl,
  },
});
