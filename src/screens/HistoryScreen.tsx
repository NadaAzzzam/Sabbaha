import React from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { calcStats, weeklyData } from '../utils/statsCalculator';
import { formatDuration } from '../utils/formatters';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.lg * 2;
const CHART_H = 100;
const BAR_GAP = 6;

export const HistoryScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const { sessions } = useHistoryStore();
  const { language } = useSettingsStore();

  const stats = calcStats(sessions);
  const weekly = weeklyData(sessions);
  const maxVal = Math.max(...weekly, 1);
  const barW = (CHART_W - BAR_GAP * 6) / 7;

  const dayKeys = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;

  const todayIdx = 6; // always the last bar is today

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      <FlatList
        data={stats}
        keyExtractor={item => item.dhikrId}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Title */}
            <View style={styles.header}>
              <AppText arabic style={[typography.arabicLarge, { color: colors.text }]}>
                {t('history.title')}
              </AppText>
            </View>

            {/* Weekly chart */}
            {sessions.length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppText style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                  {t('history.thisWeek')}
                </AppText>
                <Svg width={CHART_W} height={CHART_H + 24}>
                  {weekly.map((val, i) => {
                    const barH = Math.max((val / maxVal) * CHART_H, 4);
                    const x = i * (barW + BAR_GAP);
                    const y = CHART_H - barH;
                    const isToday = i === todayIdx;
                    return (
                      <React.Fragment key={i}>
                        <Rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          rx={4}
                          fill={isToday ? colors.accent : colors.surfaceElevated}
                        />
                        <SvgText
                          x={x + barW / 2}
                          y={CHART_H + 18}
                          fontSize={10}
                          fill={isToday ? colors.accent : colors.textMuted}
                          textAnchor="middle"
                        >
                          {t(`days.${dayKeys[i]}`)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </View>
            )}

            {/* Section label */}
            {stats.length > 0 && (
              <AppText
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: spacing.md },
                ]}
              >
                {t('history.total')}
              </AppText>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText arabic style={[typography.arabicMedium, { color: colors.text }]}>
              {item.dhikrText}
            </AppText>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <AppText style={[typography.counterSub, { color: colors.accent }]}>
                  {item.totalSessions}
                </AppText>
                <AppText style={[typography.caption, { color: colors.textMuted }]}>
                  {t('history.sessions')}
                </AppText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <AppText style={[typography.counterSub, { color: colors.accent }]}>
                  {Math.round(item.totalMs / 60000)}
                </AppText>
                <AppText style={[typography.caption, { color: colors.textMuted }]}>
                  {t('history.totalMinutes')}
                </AppText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <AppText style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                  {formatDuration(item.avgDurationMs, language)}
                </AppText>
                <AppText style={[typography.caption, { color: colors.textMuted }]}>
                  {t('history.avgDuration')}
                </AppText>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText arabic style={[typography.arabicLarge, { color: colors.textMuted, textAlign: 'center' }]}>
              {t('history.empty')}
            </AppText>
            <AppText style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
              {t('history.emptyHint')}
            </AppText>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
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
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  statCard: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
});
