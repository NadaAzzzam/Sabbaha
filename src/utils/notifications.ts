import type { ReminderInterval } from '../stores/useSettingsStore';

export const requestNotificationPermission = async (): Promise<boolean> => false;
export const scheduleReminder = async (_interval: ReminderInterval, _title: string, _body: string): Promise<void> => {};
export const cancelReminder = async (): Promise<void> => {};
