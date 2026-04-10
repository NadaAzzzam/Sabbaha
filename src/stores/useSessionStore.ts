import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../utils/mmkv';

interface SessionState {
  dhikrId: string;
  dhikrText: string;
  targetCount: number; // 0 = free
  currentCount: number;
  startedAt: number;
  isPaused: boolean;
  isComplete: boolean;
  /** Wall time when pause began; used with pausedAccumulatedMs for active elapsed. */
  pauseStartedAt: number | null;
  /** Total ms spent paused (completed pause segments only). */
  pausedAccumulatedMs: number;
  // actions
  initSession: (dhikrId: string, dhikrText: string, target: number) => void;
  /** Returns new count after tap, or null if capped (fixed target already reached). */
  increment: () => { next: number; targetCount: number } | null;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  reset: () => void;
}

const emptySession = {
  dhikrId: '',
  dhikrText: '',
  targetCount: 0,
  currentCount: 0,
  startedAt: 0,
  isPaused: false,
  isComplete: false,
  pauseStartedAt: null as number | null,
  pausedAccumulatedMs: 0,
};

export const useSessionStore = create<SessionState>()(
  persist(
    set => ({
      ...emptySession,

      initSession: (dhikrId, dhikrText, target) =>
        set({
          dhikrId,
          dhikrText,
          targetCount: target,
          currentCount: 0,
          startedAt: Date.now(),
          isPaused: false,
          isComplete: false,
          pauseStartedAt: null,
          pausedAccumulatedMs: 0,
        }),

      increment: () => {
        let outcome: { next: number; targetCount: number } | null = null;
        set(state => {
          if (state.targetCount > 0 && state.currentCount >= state.targetCount) {
            return {};
          }
          const next = state.currentCount + 1;
          outcome = { next, targetCount: state.targetCount };
          return { currentCount: next };
        });
        return outcome;
      },

      pause: () =>
        set(s =>
          s.isPaused
            ? {}
            : { isPaused: true, pauseStartedAt: Date.now() },
        ),

      resume: () =>
        set(s => {
          if (!s.isPaused) return {};
          const segment =
            s.pauseStartedAt != null ? Date.now() - s.pauseStartedAt : 0;
          return {
            isPaused: false,
            pausedAccumulatedMs: s.pausedAccumulatedMs + segment,
            pauseStartedAt: null,
          };
        }),

      complete: () => set({ isComplete: true }),

      reset: () => set(emptySession),
    }),
    {
      name: 'habbah-session',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: s => ({
        dhikrId: s.dhikrId,
        dhikrText: s.dhikrText,
        targetCount: s.targetCount,
        currentCount: s.currentCount,
        startedAt: s.startedAt,
        isPaused: s.isPaused,
        isComplete: s.isComplete,
        pauseStartedAt: s.pauseStartedAt,
        pausedAccumulatedMs: s.pausedAccumulatedMs,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SessionState> | undefined;
        if (!p || typeof p !== 'object') return current;
        return {
          ...current,
          ...p,
          pauseStartedAt: p.pauseStartedAt ?? null,
          pausedAccumulatedMs: p.pausedAccumulatedMs ?? 0,
        };
      },
    },
  ),
);

/** Active session time in ms (excludes paused intervals, including current pause if any). */
export function getSessionActiveDurationMs(): number {
  const s = useSessionStore.getState();
  if (!s.startedAt) return 0;
  const now = Date.now();
  let pauseMs = s.pausedAccumulatedMs;
  if (s.isPaused && s.pauseStartedAt != null) {
    pauseMs += now - s.pauseStartedAt;
  }
  return Math.max(0, now - s.startedAt - pauseMs);
}
