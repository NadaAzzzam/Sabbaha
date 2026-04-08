import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../utils/mmkv';
import type { DhikrItem } from '../constants/defaultDhikr';

interface DhikrState {
  customDhikr: DhikrItem[];
  addCustomDhikr: (item: DhikrItem) => void;
  removeDhikr: (id: string) => void;
}

export const useDhikrStore = create<DhikrState>()(
  persist(
    set => ({
      customDhikr: [],
      addCustomDhikr: item =>
        set(state => ({ customDhikr: [...state.customDhikr, item] })),
      removeDhikr: id =>
        set(state => ({
          customDhikr: state.customDhikr.filter(d => d.id !== id),
        })),
    }),
    {
      name: 'habbah-dhikr',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
