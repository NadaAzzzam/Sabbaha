import type { SessionRecord } from '../stores/useHistoryStore';

export interface DhikrStats {
  dhikrId: string;
  dhikrText: string;
  totalSessions: number;
  totalCount: number;
  totalMs: number;
  avgDurationMs: number;
  lastAt: number;
}

export interface DailyPoint {
  date: string;       // 'YYYY-MM-DD'
  timestamp: number;  // midnight ms of that day
  sessions: number;
  totalCount: number;
  totalMs: number;
}

// ─── per-dhikr aggregate ────────────────────────────────────────────────────
export const calcStats = (sessions: SessionRecord[]): DhikrStats[] => {
  const map = new Map<string, DhikrStats>();
  for (const s of sessions) {
    const existing = map.get(s.dhikrId);
    if (existing) {
      existing.totalSessions += 1;
      existing.totalCount += s.totalCount;
      existing.totalMs += s.durationMs;
      existing.avgDurationMs = existing.totalMs / existing.totalSessions;
      if (s.completedAt > existing.lastAt) existing.lastAt = s.completedAt;
    } else {
      map.set(s.dhikrId, {
        dhikrId: s.dhikrId,
        dhikrText: s.dhikrText,
        totalSessions: 1,
        totalCount: s.totalCount,
        totalMs: s.durationMs,
        avgDurationMs: s.durationMs,
        lastAt: s.completedAt,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastAt - a.lastAt);
};

// ─── last 7 days (for mini-chart on HistoryScreen) ─────────────────────────
export const weeklyData = (sessions: SessionRecord[]): number[] => {
  const now = new Date();
  const days = Array(7).fill(0);
  for (const s of sessions) {
    const d = new Date(s.completedAt);
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) {
      days[6 - diff] += Math.round(s.durationMs / 60000);
    }
  }
  return days;
};

// ─── helpers ────────────────────────────────────────────────────────────────
const toDateKey = (ts: number): string => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dayMidnight = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// ─── full daily history, all time, optionally filtered ─────────────────────
export const dailyHistory = (
  sessions: SessionRecord[],
  from?: number,   // inclusive, midnight ms
  to?: number,     // inclusive, midnight ms
): DailyPoint[] => {
  const map = new Map<string, DailyPoint>();

  for (const s of sessions) {
    const mid = dayMidnight(s.completedAt);
    if (from !== undefined && mid < from) continue;
    if (to !== undefined && mid > to) continue;

    const key = toDateKey(s.completedAt);
    const existing = map.get(key);
    if (existing) {
      existing.sessions += 1;
      existing.totalCount += s.totalCount;
      existing.totalMs += s.durationMs;
    } else {
      map.set(key, {
        date: key,
        timestamp: mid,
        sessions: 1,
        totalCount: s.totalCount,
        totalMs: s.durationMs,
      });
    }
  }

  // Fill gaps so every day in range appears (zero values for empty days)
  if (map.size > 0) {
    const allMids = Array.from(map.values()).map(p => p.timestamp);
    const minDay = from ?? Math.min(...allMids);
    const maxDay = to ?? Math.max(...allMids);
    let cursor = dayMidnight(minDay);
    while (cursor <= maxDay) {
      const key = toDateKey(cursor);
      if (!map.has(key)) {
        map.set(key, { date: key, timestamp: cursor, sessions: 0, totalCount: 0, totalMs: 0 });
      }
      cursor += 86400000;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
};

// ─── aggregate daily points into weekly buckets for zoom-out view ──────────
export const toWeeklyBuckets = (
  points: DailyPoint[],
): DailyPoint[] => {
  const map = new Map<string, DailyPoint>();
  for (const p of points) {
    const d = new Date(p.timestamp);
    // ISO week start = Monday; anchor to Sunday for simplicity
    const day = d.getDay(); // 0=Sun
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);
    const key = toDateKey(weekStart.getTime());
    const ex = map.get(key);
    if (ex) {
      ex.sessions += p.sessions;
      ex.totalCount += p.totalCount;
      ex.totalMs += p.totalMs;
    } else {
      map.set(key, { ...p, date: key, timestamp: weekStart.getTime() });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
};

// ─── aggregate into monthly buckets ────────────────────────────────────────
export const toMonthlyBuckets = (
  points: DailyPoint[],
): DailyPoint[] => {
  const map = new Map<string, DailyPoint>();
  for (const p of points) {
    const d = new Date(p.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const ex = map.get(key);
    if (ex) {
      ex.sessions += p.sessions;
      ex.totalCount += p.totalCount;
      ex.totalMs += p.totalMs;
    } else {
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      map.set(key, { date: key, timestamp: first.getTime(), sessions: p.sessions, totalCount: p.totalCount, totalMs: p.totalMs });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
};

// ─── earliest session date ──────────────────────────────────────────────────
export const earliestSessionDate = (sessions: SessionRecord[]): number | null => {
  if (sessions.length === 0) return null;
  return Math.min(...sessions.map(s => s.completedAt));
};
