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

  const fire = (type: HapticFeedbackTypes) =>
    ReactNativeHapticFeedback.trigger(type, {
      enableVibrateFallback: true,
      // When the user turns haptics on in the app, still run on Android if system touch vibration is off.
      ignoreAndroidSystemSettings: Platform.OS === 'android' && enabled,
    });

  const resolveType = (
    base: 'light' | 'medium' | 'heavy',
  ): HapticFeedbackTypes | null => {
    if (!enabled) return null;
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

  const androidTapMs = (): number => {
    const map: Record<typeof intensity, number> = {
      light: 22,
      medium: 38,
      strong: 58,
    };
    return map[intensity];
  };

  const tap = () => {
    if (!enabled) return;
    // Short motor pulse is reliable on all Android devices; the library often needs VIBRATE + system settings.
    if (Platform.OS === 'android') {
      Vibration.vibrate(androidTapMs());
      return;
    }
    const t = resolveType('light');
    if (t) fire(t);
  };

  const milestone = async () => {
    if (!enabled) return;
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 42, 88, 42]);
      return;
    }
    const t = resolveType('medium');
    if (!t) return;
    fire(t);
    await sleep(100);
    fire(t);
  };

  const complete = async () => {
    if (!enabled) return;
    const t = resolveType('heavy');

    if (Platform.OS === 'android') {
      if (t) {
        fire(t);
        await sleep(170);
        fire(t);
        await sleep(170);
        fire(t);
      }
      // After the “counting” bursts, a longer two-pulse pattern = “target reached” (distinct from a single tap).
      await sleep(280);
      Vibration.vibrate([0, 130, 150, 130, 180, 420]);
      return;
    }

    if (!t) return;
    fire(t);
    await sleep(200);
    fire(t);
    await sleep(200);
    fire(t);
    await sleep(320);
    fire(HapticFeedbackTypes.notificationSuccess);
  };

  return { tap, milestone, complete };
};
