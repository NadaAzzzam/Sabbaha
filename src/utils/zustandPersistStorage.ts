import {
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkvStorage } from './mmkv';

/** Persistent fallback when MMKV is unavailable in a given runtime. */
const asyncStateStorage: StateStorage = {
  getItem: key => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: key => AsyncStorage.removeItem(key),
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
