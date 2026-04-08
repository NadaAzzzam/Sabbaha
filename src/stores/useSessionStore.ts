import { create } from 'zustand';

interface SessionState {
  dhikrId: string;
  dhikrText: string;
  targetCount: number; // 0 = free
  currentCount: number;
  startedAt: number;
  isPaused: boolean;
  isComplete: boolean;
  // actions
  initSession: (dhikrId: string, dhikrText: string, target: number) => void;
  increment: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(set => ({
  dhikrId: '',
  dhikrText: '',
  targetCount: 0,
  currentCount: 0,
  startedAt: 0,
  isPaused: false,
  isComplete: false,

  initSession: (dhikrId, dhikrText, target) =>
    set({
      dhikrId,
      dhikrText,
      targetCount: target,
      currentCount: 0,
      startedAt: Date.now(),
      isPaused: false,
      isComplete: false,
    }),

  increment: () =>
    set(state => ({ currentCount: state.currentCount + 1 })),

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  complete: () => set({ isComplete: true }),
  reset: () =>
    set({
      dhikrId: '',
      dhikrText: '',
      targetCount: 0,
      currentCount: 0,
      startedAt: 0,
      isPaused: false,
      isComplete: false,
    }),
}));
