import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../utils/mmkv';

export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';
export type HapticIntensity = 'light' | 'medium' | 'strong';

interface SettingsState {
  language: Language;
  theme: Theme;
  hapticsEnabled: boolean;
  hapticIntensity: HapticIntensity;
  soundEnabled: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setHapticsEnabled: (v: boolean) => void;
  setHapticIntensity: (v: HapticIntensity) => void;
  setSoundEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      language: 'ar',
      theme: 'dark',
      hapticsEnabled: true,
      hapticIntensity: 'medium',
      soundEnabled: true,
      setLanguage: lang => set({ language: lang }),
      setTheme: theme => set({ theme }),
      setHapticsEnabled: v => set({ hapticsEnabled: v }),
      setHapticIntensity: v => set({ hapticIntensity: v }),
      setSoundEnabled: v => set({ soundEnabled: v }),
    }),
    {
      name: 'habbah-settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
