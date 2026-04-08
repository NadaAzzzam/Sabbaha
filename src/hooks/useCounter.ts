import { useSessionStore } from '../stores/useSessionStore';
import { useHaptics } from './useHaptics';
import { MILESTONE_COUNTS } from '../constants/hapticPatterns';

export const useCounter = (onComplete?: () => void) => {
  const { currentCount, targetCount, increment, complete } = useSessionStore();
  const haptics = useHaptics();

  const tap = () => {
    const next = currentCount + 1;
    increment();

    // Milestone check (33, 66, 99, 100)
    const isMilestone = MILESTONE_COUNTS.includes(next);
    const isComplete = targetCount > 0 && next >= targetCount;

    if (isComplete) {
      complete();
      haptics.complete();
      onComplete?.();
    } else if (isMilestone) {
      haptics.milestone();
    } else {
      haptics.tap();
    }
  };

  return { tap, currentCount, targetCount };
};
