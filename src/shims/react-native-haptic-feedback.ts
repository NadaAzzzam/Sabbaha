/** Web shim — haptics are native-only */
const HapticFeedbackTypes = {
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  impactHeavy: 'impactHeavy',
  notificationSuccess: 'notificationSuccess',
};

const trigger = (_type: string, _options?: unknown): void => {};

export default { trigger };
export { HapticFeedbackTypes };
