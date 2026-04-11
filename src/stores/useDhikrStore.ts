import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeMmkvJSONStorage } from '../utils/zustandPersistStorage';
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
      storage: safeMmkvJSONStorage,
    },
  ),
);
