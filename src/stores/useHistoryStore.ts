import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../utils/mmkv';

export interface SessionRecord {
  id: string;
  dhikrId: string;
  dhikrText: string;
  targetCount: number;
  totalCount: number;
  durationMs: number;
  completedAt: number;
}

interface HistoryState {
  sessions: SessionRecord[];
  addSession: (record: SessionRecord) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    set => ({
      sessions: [],
      addSession: record =>
        set(state => ({ sessions: [record, ...state.sessions] })),
      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: 'habbah-history',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
