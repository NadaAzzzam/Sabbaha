import {
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

/** In-memory fallback when MMKV/storage init throws (e.g. odd load order); avoids persist with no storage. */
const memoryStateStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const safeMmkvJSONStorage =
  createJSONStorage(() => mmkvStorage) ??
  createJSONStorage(() => memoryStateStorage);
