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
