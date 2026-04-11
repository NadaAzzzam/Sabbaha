import { useEffect, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';
import Sound from 'react-native-sound';
import { useSettingsStore, type SoundVolume } from '../stores/useSettingsStore';

/** ms between the two tap plays on session complete */
const COMPLETE_DOUBLE_TAP_GAP_MS = 160;

const VOLUME_MAP: Record<SoundVolume, number> = {
  low: 0.35,
  medium: 0.7,
  high: 1.0,
};

// ─── Android: zero-latency SoundPool via native module ───────────────────────
type AndroidPoolNative = {
  playTap?: (volume: number) => void;
  /** Legacy name; New Architecture often fails to expose this on the JS object. */
  playStop?: (volume: number) => void;
  playStopSound?: (volume: number) => void;
  playRaw?: (which: string, volume: number) => void;
};

const androidPool: AndroidPoolNative | null =
  Platform.OS === 'android'
    ? (NativeModules.SoundPoolModule as AndroidPoolNative | undefined) ?? null
    : null;

function resolveAndroidTapPlay(): ((volume: number) => void) | null {
  if (!androidPool) return null;
  if (typeof androidPool.playTap === 'function') {
    return androidPool.playTap.bind(androidPool);
  }
  if (typeof androidPool.playRaw === 'function') {
    const r = androidPool.playRaw.bind(androidPool);
    return (volume: number) => r('tap', volume);
  }
  return null;
}

function resolveAndroidStopPlay(): ((volume: number) => void) | null {
  if (!androidPool) return null;
  if (typeof androidPool.playStopSound === 'function') {
    return androidPool.playStopSound.bind(androidPool);
  }
  if (typeof androidPool.playStop === 'function') {
    return androidPool.playStop.bind(androidPool);
  }
  if (typeof androidPool.playRaw === 'function') {
    const r = androidPool.playRaw.bind(androidPool);
    return (volume: number) => r('stop', volume);
  }
  return null;
}

const androidPlayTap = resolveAndroidTapPlay();
const androidPlayStop = resolveAndroidStopPlay();

if (Platform.OS === 'android') {
  if (androidPool && androidPlayTap && androidPlayStop) {
    console.log('[Sound] Using native SoundPool');
  } else if (androidPool) {
    console.warn(
      '[Sound] SoundPoolModule is missing methods — rebuild the Android app. Fallbacks apply where possible.',
      {
        playTap: !!androidPlayTap,
        playStop: !!androidPlayStop,
        keys: Object.keys(androidPool),
      },
    );
  } else {
    console.warn('[Sound] SoundPoolModule not found — check native registration');
  }
}

// ─── iOS: react-native-sound pool ────────────────────────────────────────────
Sound.setCategory('Playback', true);
const IOS_POOL_SIZE = 4;

/** Android raw resource is sb_stop.wav (see SoundPoolModule); iOS bundle keeps stop.wav. */
const STOP_BUNDLE_FILENAME = Platform.OS === 'android' ? 'sb_stop.wav' : 'stop.wav';

function loadBundledSound(file: string): Promise<Sound | null> {
  return new Promise(resolve => {
    const s = new Sound(file, Sound.MAIN_BUNDLE, err => {
      if (err) { console.warn('[Sound] load error:', file, err); resolve(null); }
      else resolve(s);
    });
  });
}

export const useSound = () => {
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const soundVolume = useSettingsStore(s => s.soundVolume);

  // iOS: tap pool + stop. Android: stop via react-native-sound only if native playStop is absent.
  const iosTapPoolRef = useRef<Sound[]>([]);
  const iosTapCursorRef = useRef(0);
  const stopSoundRef = useRef<Sound | null>(null);

  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let cancelled = false;
    (async () => {
      const [loadedTaps, loadedStop] = await Promise.all([
        Promise.all(
          Array.from({ length: IOS_POOL_SIZE }, () => loadBundledSound('tap.wav')),
        ),
        loadBundledSound(STOP_BUNDLE_FILENAME),
      ]);
      if (cancelled) {
        loadedTaps.forEach(s => s?.release());
        loadedStop?.release();
        return;
      }
      const vol = VOLUME_MAP[useSettingsStore.getState().soundVolume];
      iosTapPoolRef.current = loadedTaps.filter((s): s is Sound => s !== null);
      iosTapPoolRef.current.forEach(s => s.setVolume(vol));
      stopSoundRef.current = loadedStop;
      loadedStop?.setVolume(vol);
    })();
    return () => {
      cancelled = true;
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      iosTapPoolRef.current.forEach(s => s.release());
      iosTapPoolRef.current = [];
      stopSoundRef.current?.release();
      stopSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || androidPlayStop) return;
    let cancelled = false;
    (async () => {
      const loadedStop = await loadBundledSound(STOP_BUNDLE_FILENAME);
      if (cancelled) {
        loadedStop?.release();
        return;
      }
      const vol = VOLUME_MAP[useSettingsStore.getState().soundVolume];
      stopSoundRef.current = loadedStop;
      loadedStop?.setVolume(vol);
    })();
    return () => {
      cancelled = true;
      stopSoundRef.current?.release();
      stopSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' && !(Platform.OS === 'android' && !androidPlayStop)) return;
    const vol = VOLUME_MAP[soundVolume];
    if (Platform.OS === 'ios') {
      iosTapPoolRef.current.forEach(s => s.setVolume(vol));
    }
    stopSoundRef.current?.setVolume(vol);
  }, [soundVolume]);

  const playTapOnce = () => {
    const vol = VOLUME_MAP[soundVolume];
    if (androidPlayTap) {
      androidPlayTap(vol);
    } else {
      const pool = iosTapPoolRef.current;
      if (pool.length === 0) return;
      const s = pool[iosTapCursorRef.current % pool.length];
      iosTapCursorRef.current = (iosTapCursorRef.current + 1) % pool.length;
      s.play();
    }
  };

  const playTap = () => {
    if (!soundEnabled) return;
    playTapOnce();
  };

  const playComplete = () => {
    if (!soundEnabled) return;
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    playTapOnce();
    completeTimerRef.current = setTimeout(() => {
      completeTimerRef.current = null;
      playTapOnce();
    }, COMPLETE_DOUBLE_TAP_GAP_MS);
  };

  const playStop = () => {
    if (!soundEnabled) return;
    const vol = VOLUME_MAP[soundVolume];
    if (androidPlayStop) {
      androidPlayStop(vol);
      return;
    }
    const s = stopSoundRef.current;
    if (!s) return;
    s.setVolume(vol);
    s.stop(() => s.play());
  };

  return { playTap, playComplete, playStop };
};
