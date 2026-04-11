import { useSessionStore } from '../stores/useSessionStore';
import { useHaptics } from './useHaptics';
import { useSound } from './useSound';
import { MILESTONE_COUNTS } from '../constants/hapticPatterns';

export const useCounter = (onComplete?: (finalCount: number) => void) => {
  const increment = useSessionStore(s => s.increment);
  const complete = useSessionStore(s => s.complete);
  const haptics = useHaptics();
  const sound = useSound();

  const tap = () => {
    const result = increment();
    if (!result) return;

    const { next, targetCount: limit } = result;
    const isMilestone = MILESTONE_COUNTS.includes(next);
    const isComplete = limit > 0 && next >= limit;

    if (isComplete) {
      complete();
      // Completion: distinct vibration pattern + double tap sound
      haptics.complete();
      sound.playComplete();
      onComplete?.(next);
    } else if (isMilestone) {
      haptics.milestone();
      // Milestones get the tap sound too — distinct enough from completion
      sound.playTap();
    } else {
      haptics.tap();
      sound.playTap();
    }
  };

  return { tap };
};
