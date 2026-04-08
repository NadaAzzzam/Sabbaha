import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import { useSettingsStore } from '../stores/useSettingsStore';

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const useHaptics = () => {
  const enabled = useSettingsStore(s => s.hapticsEnabled);
  const intensity = useSettingsStore(s => s.hapticIntensity);

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

  const fire = (type: HapticFeedbackTypes) =>
    ReactNativeHapticFeedback.trigger(type, OPTIONS);

  const tap = () => {
    const t = resolveType('light');
    if (t) fire(t);
  };

  const milestone = async () => {
    const t = resolveType('medium');
    if (!t) return;
    fire(t);
    await sleep(100);
    fire(t);
  };

  const complete = async () => {
    const t = resolveType('heavy');
    if (!t) return;
    fire(t);
    await sleep(200);
    fire(t);
    await sleep(200);
    fire(t);
  };

  return { tap, milestone, complete };
};
