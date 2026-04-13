import { Platform, Vibration } from 'react-native';
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import { useSettingsStore } from '../stores/useSettingsStore';

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export const useHaptics = () => {
  const enabled = useSettingsStore(s => s.hapticsEnabled);
  const intensity = useSettingsStore(s => s.hapticIntensity);

  const fire = (type: HapticFeedbackTypes) => {
    try {
      ReactNativeHapticFeedback.trigger(type, {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: true,
      });
    } catch {
      // If the native module is unavailable, fall back to a perceptible motor pulse.
      if (Platform.OS === 'android') Vibration.vibrate(androidFallbackMs());
    }
  };

  const resolveType = (
    base: 'light' | 'medium' | 'heavy',
  ): HapticFeedbackTypes => {
    const map: Record<
      typeof base,
      Record<typeof intensity, HapticFeedbackTypes>
    > = {
      light: {
        light: HapticFeedbackTypes.impactLight,
        medium: HapticFeedbackTypes.impactLight,
        strong: HapticFeedbackTypes.impactMedium,
      },
      medium: {
        light: HapticFeedbackTypes.impactLight,
        medium: HapticFeedbackTypes.impactMedium,
        strong: HapticFeedbackTypes.impactHeavy,
      },
      heavy: {
        light: HapticFeedbackTypes.impactMedium,
        medium: HapticFeedbackTypes.impactHeavy,
        strong: HapticFeedbackTypes.notificationSuccess,
      },
    };
    return map[base][intensity];
  };

  // Long enough to be felt on Android phones whose motors ignore <40ms pulses.
  const androidFallbackMs = (): number => {
    const map: Record<typeof intensity, number> = {
      light: 45,
      medium: 75,
      strong: 110,
    };
    return map[intensity];
  };

  const tap = () => {
    if (!enabled) return;
    fire(resolveType('light'));
    // Belt-and-braces on Android: many OEMs gate the haptic API by system settings,
    // so also kick the motor directly with a perceptible pulse.
    if (Platform.OS === 'android') {
      Vibration.vibrate(androidFallbackMs());
    }
  };

  /**
   * Fixed-target sessions: short “tick” each count so progress is felt.
   * Must stay clearly lighter / shorter than `complete()` so the finale feels different.
   */
  const tapLimited = async () => {
    if (!enabled) return;
    fire(resolveType('light'));
    if (Platform.OS === 'android') {
      const pulse = Math.max(38, Math.round(androidFallbackMs() * 0.5));
      Vibration.vibrate([0, pulse, 32, pulse]);
      return;
    }
    await sleep(42);
    fire(resolveType('light'));
  };

  const milestone = async () => {
    if (!enabled) return;
    const t = resolveType('medium');
    fire(t);
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 60, 90, 60]);
      return;
    }
    await sleep(100);
    fire(t);
  };

  const complete = async () => {
    if (!enabled) return;
    const t = resolveType('heavy');

    if (Platform.OS === 'android') {
      fire(t);
      // Long, heavy pattern = “done” — much longer pulses than tapLimited’s short ticks.
      Vibration.vibrate([0, 160, 160, 160, 200, 160, 220, 480]);
      return;
    }

    fire(t);
    await sleep(200);
    fire(t);
    await sleep(200);
    fire(t);
    await sleep(320);
    fire(HapticFeedbackTypes.notificationSuccess);
  };

  return { tap, tapLimited, milestone, complete };
};
