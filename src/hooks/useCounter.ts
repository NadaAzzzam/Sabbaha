import { useSessionStore } from '../stores/useSessionStore';
import { useHaptics } from './useHaptics';
import { MILESTONE_COUNTS } from '../constants/hapticPatterns';

export const useCounter = (onComplete?: (finalCount: number) => void) => {
  const increment = useSessionStore(s => s.increment);
  const complete = useSessionStore(s => s.complete);
  const haptics = useHaptics();

  const tap = () => {
    const result = increment();
    if (!result) {
      return;
    }

    const { next, targetCount: limit } = result;

    // Milestone check (33, 66, 99, 100)
    const isMilestone = MILESTONE_COUNTS.includes(next);
    const isComplete = limit > 0 && next >= limit;

    if (isComplete) {
      complete();
      haptics.complete();
      onComplete?.(next);
    } else if (isMilestone) {
      haptics.milestone();
    } else {
      haptics.tap();
    }
  };

  return { tap };
};
