export const HAPTIC_PATTERNS = {
  tap: { type: 'impactLight' as const },
  milestone: { type: 'impactMedium' as const, repeat: 2, gap: 100 },
  complete: { type: 'impactHeavy' as const, repeat: 3, gap: 200 },
};

export const MILESTONE_COUNTS = [33, 66, 99, 100];
