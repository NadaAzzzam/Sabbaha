import {
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkvStorage } from './mmkv';

/** Last-resort memory storage when no native storage is available. */
const memoryStorage = new Map<string, string>();
let hasWarnedAsyncStorageUnavailable = false;

const warnAsyncStorageUnavailable = (error: unknown): void => {
  if (!hasWarnedAsyncStorageUnavailable) {
    console.warn(
      '[persist] AsyncStorage native module unavailable, using in-memory fallback.',
      error,
    );
    hasWarnedAsyncStorageUnavailable = true;
  }
};

/**
 * Persistent fallback when MMKV is unavailable in a given runtime.
 * If AsyncStorage native bindings are missing, this degrades to in-memory
 * storage to keep the app functional.
 */
const asyncStateStorage: StateStorage = {
  getItem: async key => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ?? memoryStorage.get(key) ?? null;
    } catch (error) {
      warnAsyncStorageUnavailable(error);
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem: async (key, value) => {
    memoryStorage.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      warnAsyncStorageUnavailable(error);
    }
  },
  removeItem: async key => {
    memoryStorage.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      warnAsyncStorageUnavailable(error);
    }
  },
};

const canUseMmkv = (): boolean => {
  try {
    const probeKey = '__habbah_mmkv_probe__';
    mmkvStorage.setItem(probeKey, '1');
    mmkvStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    console.warn('[persist] MMKV unavailable, using AsyncStorage fallback.', error);
    return false;
  }
};

const selectedStateStorage = canUseMmkv() ? mmkvStorage : asyncStateStorage;

export const safeMmkvJSONStorage =
  createJSONStorage(() => selectedStateStorage);
