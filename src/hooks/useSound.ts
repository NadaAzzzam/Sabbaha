import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Sound from 'react-native-sound';
import { useSettingsStore } from '../stores/useSettingsStore';

// Allow playing over silent mode / in background on iOS
Sound.setCategory('Playback', true);

/** ms between the two tap plays on session complete */
const COMPLETE_DOUBLE_TAP_GAP_MS = 160;

type SoundName = 'tap';

/**
 * On Android: files live in res/raw/ — use basename WITHOUT extension (e.g. tap.mp3 → "tap").
 * On iOS: files are in the app bundle — use filename WITH extension.
 */
function loadSound(name: SoundName): Sound | null {
  try {
    const filename = Platform.OS === 'android' ? name : `${name}.mp3`;
    const s = new Sound(filename, Sound.MAIN_BUNDLE, err => {
      if (err) console.warn(`[Sound] failed to load ${name}:`, err);
    });
    s.setVolume(1);
    return s;
  } catch {
    return null;
  }
}

export const useSound = () => {
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const tapRef = useRef<Sound | null>(null);
  const completeSecondTapRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    tapRef.current = loadSound('tap');

    return () => {
      if (completeSecondTapRef.current) clearTimeout(completeSecondTapRef.current);
      tapRef.current?.release();
      tapRef.current = null;
    };
  }, []);

  const playTap = () => {
    if (!soundEnabled) return;
    const s = tapRef.current;
    if (!s) return;
    // stop resets position so rapid taps don't stack
    s.stop(() => s.play());
  };

  const playComplete = () => {
    if (!soundEnabled) return;
    const s = tapRef.current;
    if (!s) return;
    if (completeSecondTapRef.current) {
      clearTimeout(completeSecondTapRef.current);
      completeSecondTapRef.current = null;
    }
    s.stop(() => {
      s.play();
      completeSecondTapRef.current = setTimeout(() => {
        completeSecondTapRef.current = null;
        s.stop(() => s.play());
      }, COMPLETE_DOUBLE_TAP_GAP_MS);
    });
  };

  return { playTap, playComplete };
};
