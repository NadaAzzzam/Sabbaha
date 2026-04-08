/** Web: MMKV is native-only; use localStorage for Zustand persist. */
/// <reference lib="dom" />

export const mmkvStorage = {
  getItem: (key: string): string | null =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};
