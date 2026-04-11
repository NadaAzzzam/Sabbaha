import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Path,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import {
  dailyHistory,
  toWeeklyBuckets,
  toMonthlyBuckets,
  earliestSessionDate,
  type DailyPoint,
} from '../utils/statsCalculator';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_SIDE_PAD = spacing.lg;
const CHART_W = SCREEN_W - CHART_SIDE_PAD * 2;
const CHART_H = 200;
const Y_AXIS_W = 36;
const PLOT_W = CHART_W - Y_AXIS_W;

// ─── Types ────────────────────────────────────────────────────────────────
type Granularity = 'day' | 'week' | 'month';
type Metric = 'sessions' | 'count' | 'minutes';

type PresetKey = '7d' | '30d' | '90d' | '1y' | 'all';
interface Preset {
  key: PresetKey;
  labelAr: string;
  labelEn: string;
  days: number | null; // null = all time
}

const PRESETS: Preset[] = [
  { key: '7d',  labelAr: '٧ أيام',   labelEn: '7D',   days: 7 },
  { key: '30d', labelAr: '٣٠ يوم',   labelEn: '30D',  days: 30 },
  { key: '90d', labelAr: '٣ أشهر',   labelEn: '90D',  days: 90 },
  { key: '1y',  labelAr: 'سنة',      labelEn: '1Y',   days: 365 },
  { key: 'all', labelAr: 'الكل',     labelEn: 'All',  days: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
const midnight = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const pointValue = (p: DailyPoint, metric: Metric): number => {
  if (metric === 'sessions') return p.sessions;
  if (metric === 'count') return p.totalCount;
  return Math.round(p.totalMs / 60000);
};

const formatAxisDate = (ts: number, granularity: Granularity, lang: 'ar' | 'en'): string => {
  const d = new Date(ts);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  if (granularity === 'month') {
    const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return lang === 'ar' ? MONTHS_AR[d.getMonth()] : MONTHS_EN[d.getMonth()];
  }
  if (granularity === 'week') {
    return lang === 'ar' ? `${day}/${month}` : `${month}/${day}`;
  }
  return lang === 'ar' ? `${day}/${month}` : `${month}/${day}`;
};

const formatFullDate = (ts: number, lang: 'ar' | 'en'): string => {
  const d = new Date(ts);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (lang === 'ar') return `${day} ${MONTHS_AR[d.getMonth()]} ${year}`;
  return `${MONTHS_EN[d.getMonth()]} ${day}, ${year}`;
};

// ─── Component ───────────────────────────────────────────────────────────
export const ChartScreen = () => {
  const colors = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { sessions } = useHistoryStore();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const [preset, setPreset] = useState<PresetKey>('30d');
  const [metric, setMetric] = useState<Metric>('sessions');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Animation value for bar entrance
  const animProgress = useSharedValue(0);

  const earliest = useMemo(() => earliestSessionDate(sessions), [sessions]);

  // Compute date range from preset
  const { fromMs, toMs } = useMemo(() => {
    const now = midnight(Date.now());
    const active = PRESETS.find(p => p.key === preset)!;
    if (active.days === null) {
      return { fromMs: earliest ? midnight(earliest) : now, toMs: now };
    }
    return { fromMs: now - (active.days - 1) * 86400000, toMs: now };
  }, [preset, earliest]);

  // Raw daily points in range
  const dailyPoints = useMemo(
    () => dailyHistory(sessions, fromMs, toMs),
    [sessions, fromMs, toMs],
  );

  // Bucketed by granularity
  const points = useMemo((): DailyPoint[] => {
    if (granularity === 'week') return toWeeklyBuckets(dailyPoints);
    if (granularity === 'month') return toMonthlyBuckets(dailyPoints);
    return dailyPoints;
  }, [dailyPoints, granularity]);

  // Trigger entrance animation when points change
  const pointsKey = points.map(p => p.date).join(',');
  const prevPointsKeyRef = useRef('');
  useEffect(() => {
    if (pointsKey === prevPointsKeyRef.current) return;
    prevPointsKeyRef.current = pointsKey;
    animProgress.value = 0;
    animProgress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    setSelectedIdx(null);
  }, [pointsKey, animProgress]);

  const values = points.map(p => pointValue(p, metric));
  const maxVal = Math.max(...values, 1);

  // Summary stats
  const totalVal = values.reduce((s, v) => s + v, 0);
  const avgVal = points.filter(p => pointValue(p, metric) > 0).length > 0
    ? Math.round(totalVal / points.filter(p => pointValue(p, metric) > 0).length)
    : 0;
  const maxPoint = points[values.indexOf(Math.max(...values))];

  // Bar layout
  const BAR_GAP = Math.max(2, Math.min(6, Math.floor((PLOT_W / Math.max(points.length, 1)) * 0.2)));
  const barW = points.length > 0
    ? Math.max(4, (PLOT_W - BAR_GAP * (points.length - 1)) / points.length)
    : 10;

  // Y-axis grid lines
  const Y_LINES = 4;
  const yGridValues = Array.from({ length: Y_LINES + 1 }, (_, i) =>
    Math.round((maxVal / Y_LINES) * i),
  );

  const handleBarPress = useCallback((idx: number) => {
    setSelectedIdx(prev => (prev === idx ? null : idx));
  }, []);

  const handlePreset = (key: PresetKey) => {
    setPreset(key);
    setSelectedIdx(null);
  };

  const handleGranularity = (g: Granularity) => {
    setGranularity(g);
    setSelectedIdx(null);
  };

  const metricLabel = (m: Metric): string => {
    if (m === 'sessions') return isAr ? 'الجلسات' : 'Sessions';
    if (m === 'count') return isAr ? 'التسبيحات' : 'Count';
    return isAr ? 'الدقائق' : 'Minutes';
  };

  const selectedPoint = selectedIdx !== null ? points[selectedIdx] : null;

  // Build SVG bar path — animated height
  const renderBars = () =>
    points.map((p, i) => {
      const val = pointValue(p, metric);
      const isSelected = i === selectedIdx;
      const x = Y_AXIS_W + i * (barW + BAR_GAP);
      const fullH = Math.max((val / maxVal) * CHART_H, val > 0 ? 4 : 1);
      const rx = Math.min(barW / 2, 5);

      return (
        <React.Fragment key={p.date}>
          {/* Tap target */}
          <Rect
            x={x}
            y={0}
            width={barW}
            height={CHART_H}
            fill="transparent"
            onPress={() => handleBarPress(i)}
          />
          {/* Bar */}
          <Rect
            x={x}
            y={CHART_H - fullH}
            width={barW}
            height={fullH}
            rx={rx}
            ry={rx}
            fill={
              isSelected
                ? colors.accent
                : val > 0
                ? 'url(#barGrad)'
                : colors.surfaceElevated
            }
            opacity={isSelected ? 1 : 0.9}
          />
          {/* Selection dot */}
          {isSelected && (
            <Rect
              x={x + barW / 2 - 3}
              y={CHART_H - fullH - 9}
              width={6}
              height={6}
              rx={3}
              ry={3}
              fill={colors.accent}
            />
          )}
        </React.Fragment>
      );
    });

  // X-axis labels (show subset to avoid crowding)
  const xLabelStep = Math.max(1, Math.ceil(points.length / 8));
  const renderXLabels = () =>
    points.map((p, i) => {
      if (i % xLabelStep !== 0 && i !== points.length - 1) return null;
      const x = Y_AXIS_W + i * (barW + BAR_GAP) + barW / 2;
      const isSelected = i === selectedIdx;
      return (
        <SvgText
          key={p.date}
          x={x}
          y={CHART_H + 20}
          fontSize={isSelected ? 11 : 10}
          fontWeight={isSelected ? '700' : '400'}
          fill={isSelected ? colors.accent : colors.textMuted}
          textAnchor="middle"
        >
          {formatAxisDate(p.timestamp, granularity, language)}
        </SvgText>
      );
    });

  const renderYAxis = () =>
    yGridValues.map((v, i) => {
      const y = CHART_H - (v / maxVal) * CHART_H;
      return (
        <React.Fragment key={i}>
          <Line
            x1={Y_AXIS_W}
            y1={y}
            x2={CHART_W}
            y2={y}
            stroke={colors.border}
            strokeWidth={0.75}
            strokeDasharray={i === 0 ? undefined : '3,4'}
          />
          <SvgText
            x={Y_AXIS_W - 4}
            y={y + 4}
            fontSize={9}
            fill={colors.textMuted}
            textAnchor="end"
          >
            {v > 0 ? v : ''}
          </SvgText>
        </React.Fragment>
      );
    });

  const hasData = sessions.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <AppText style={[styles.backArrow, { color: colors.accent }]}>
            {isAr ? '→' : '←'}
          </AppText>
        </TouchableOpacity>
        <AppText arabic style={[styles.headerTitle, { color: colors.text }]}>
          {isAr ? 'المخطط التفصيلي' : 'Detailed Chart'}
        </AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        {!hasData ? (
          <View style={styles.emptyState}>
            <AppText style={[styles.emptyIcon, { color: colors.textMuted }]}>📊</AppText>
            <AppText arabic style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {isAr ? 'لا توجد بيانات بعد' : 'No data yet'}
            </AppText>
            <AppText arabic style={[typography.arabicSmall, { color: colors.textMuted, textAlign: 'center' }]}>
              {isAr ? 'ابدأ جلستك الأولى لترى مخططك' : 'Complete your first session to see your chart'}
            </AppText>
          </View>
        ) : (
          <>
            {/* ── Preset filter row ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetRow}
            >
              {PRESETS.map(p => {
                const active = preset === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => handlePreset(p.key)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: active ? colors.accent : colors.surface,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <AppText
                      arabic={isAr}
                      style={[
                        styles.presetLabel,
                        { color: active ? colors.background : colors.textSecondary },
                      ]}
                    >
                      {isAr ? p.labelAr : p.labelEn}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── Metric selector ── */}
            <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {(['sessions', 'count', 'minutes'] as Metric[]).map(m => {
                const active = metric === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMetric(m)}
                    style={[
                      styles.metricBtn,
                      active && { backgroundColor: colors.surfaceElevated },
                    ]}
                    activeOpacity={0.75}
                  >
                    <AppText
                      arabic={isAr}
                      style={[
                        styles.metricLabel,
                        { color: active ? colors.accent : colors.textMuted },
                      ]}
                    >
                      {metricLabel(m)}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Summary cards ── */}
            <View style={styles.summaryRow}>
              <SummaryCard
                label={isAr ? 'الإجمالي' : 'Total'}
                value={String(totalVal)}
                colors={colors}
              />
              <SummaryCard
                label={isAr ? 'المتوسط/يوم' : 'Avg/day'}
                value={String(avgVal)}
                colors={colors}
              />
              {maxPoint && (
                <SummaryCard
                  label={isAr ? 'أفضل يوم' : 'Best day'}
                  value={formatFullDate(maxPoint.timestamp, language)}
                  small
                  colors={colors}
                />
              )}
            </View>

            {/* ── Granularity toggle ── */}
            <View style={styles.granularityRow}>
              {(['day', 'week', 'month'] as Granularity[]).map(g => {
                const active = granularity === g;
                const label =
                  g === 'day'
                    ? isAr ? 'يومي' : 'Daily'
                    : g === 'week'
                    ? isAr ? 'أسبوعي' : 'Weekly'
                    : isAr ? 'شهري' : 'Monthly';
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => handleGranularity(g)}
                    style={[
                      styles.granBtn,
                      {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active ? colors.accentGlow : 'transparent',
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <AppText
                      arabic={isAr}
                      style={[styles.granLabel, { color: active ? colors.accent : colors.textMuted }]}
                    >
                      {label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Selected point tooltip ── */}
            {selectedPoint !== null && (
              <View style={[styles.tooltip, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
                <AppText arabic={isAr} style={[styles.tooltipDate, { color: colors.textSecondary }]}>
                  {formatFullDate(selectedPoint.timestamp, language)}
                </AppText>
                <AppText arabic={isAr} style={[styles.tooltipValue, { color: colors.accent }]}>
                  {pointValue(selectedPoint, metric)} {metricLabel(metric)}
                </AppText>
              </View>
            )}

            {/* ── Chart ── */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Svg width={CHART_W} height={CHART_H + 32} style={{ overflow: 'visible' }}>
                <Defs>
                  <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.accent} stopOpacity="0.85" />
                    <Stop offset="1" stopColor={colors.accent} stopOpacity="0.3" />
                  </LinearGradient>
                </Defs>

                {renderYAxis()}
                {renderBars()}
                {renderXLabels()}
              </Svg>
            </View>

            {/* ── Date range label ── */}
            <AppText
              arabic={isAr}
              style={[styles.rangeLabel, { color: colors.textMuted }]}
            >
              {formatFullDate(fromMs, language)} — {formatFullDate(toMs, language)}
            </AppText>
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Summary card sub-component ──────────────────────────────────────────
const SummaryCard = ({
  label,
  value,
  small,
  colors,
}: {
  label: string;
  value: string;
  small?: boolean;
  colors: ReturnType<typeof useTheme>;
}) => (
  <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <AppText style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</AppText>
    <AppText
      arabic
      style={[
        small ? styles.summaryValueSmall : styles.summaryValue,
        { color: colors.accent },
      ]}
      numberOfLines={2}
    >
      {value}
    </AppText>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 22,
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '700',
  },

  /* Scroll */
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  /* Preset chips */
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingRight: spacing.lg,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  presetLabel: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },

  /* Metric row */
  metricRow: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  metricBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },

  /* Summary cards */
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 2,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryValueSmall: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Granularity */
  granularityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  granBtn: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  granLabel: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  /* Tooltip */
  tooltip: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipDate: {
    fontSize: 13,
    lineHeight: 20,
  },
  tooltipValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },

  /* Chart */
  chartCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'visible',
  },

  /* Range label */
  rangeLabel: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
});
