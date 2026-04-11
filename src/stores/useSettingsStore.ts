import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeMmkvJSONStorage } from '../utils/zustandPersistStorage';

export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';
export type HapticIntensity = 'light' | 'medium' | 'strong';
export type SoundVolume = 'low' | 'medium' | 'high';
export type ReminderInterval = 'off' | '5min' | '10min' | '15min';

interface SettingsState {
  language: Language;
  theme: Theme;
  hapticsEnabled: boolean;
  hapticIntensity: HapticIntensity;
  soundEnabled: boolean;
  soundVolume: SoundVolume;
  reminderInterval: ReminderInterval;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setHapticsEnabled: (v: boolean) => void;
  setHapticIntensity: (v: HapticIntensity) => void;
  setSoundEnabled: (v: boolean) => void;
  setSoundVolume: (v: SoundVolume) => void;
  setReminderInterval: (v: ReminderInterval) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      language: 'ar',
      theme: 'dark',
      hapticsEnabled: true,
      hapticIntensity: 'medium',
      soundEnabled: true,
      soundVolume: 'medium',
      reminderInterval: 'off',
      setLanguage: lang => set({ language: lang }),
      setTheme: theme => set({ theme }),
      setHapticsEnabled: v => set({ hapticsEnabled: v }),
      setHapticIntensity: v => set({ hapticIntensity: v }),
      setSoundEnabled: v => set({ soundEnabled: v }),
      setSoundVolume: v => set({ soundVolume: v }),
      setReminderInterval: v => set({ reminderInterval: v }),
    }),
    {
      name: 'habbah-settings',
      storage: safeMmkvJSONStorage,
    },
  ),
);
