import { NativeModules, Platform } from 'react-native';
import type { ReminderInterval } from '../stores/useSettingsStore';
import type { TimestampTrigger } from '@notifee/react-native';

const REMINDER_ID = 'habbah-reminder';
const CHANNEL_ID = 'habbah-reminders';

const intervalToMs: Record<Exclude<ReminderInterval, 'off'>, number> = {
  '5min': 5 * 60 * 1000,
  '10min': 10 * 60 * 1000,
  '15min': 15 * 60 * 1000,
};

let channelCreated = false;

type NotifeeModule = typeof import('@notifee/react-native');

/**
 * Notifee's JS entry constructs NativeEventEmitter in the constructor, which throws if
 * `NativeModules.NotifeeApiModule` is missing (e.g. stale native build or New Architecture edge cases).
 * Only require the package after the native module is present.
 */
function getNotifee(): NotifeeModule | null {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  if (NativeModules.NotifeeApiModule == null) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@notifee/react-native') as NotifeeModule;
  } catch {
    return null;
  }
}

const ensureChannel = async () => {
  const mod = getNotifee();
  if (!mod || Platform.OS !== 'android' || channelCreated) return;
  await mod.default.createChannel({
    id: CHANNEL_ID,
    name: 'Dhikr Reminders',
    importance: mod.AndroidImportance.DEFAULT,
    vibration: true,
  });
  channelCreated = true;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const mod = getNotifee();
  if (!mod) return false;
  const settings = await mod.default.requestPermission();
  return (
    settings.authorizationStatus === mod.AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === mod.AuthorizationStatus.PROVISIONAL
  );
};

export const cancelReminder = async (): Promise<void> => {
  const mod = getNotifee();
  if (!mod) return;
  await mod.default.cancelTriggerNotification(REMINDER_ID);
};

export const scheduleReminder = async (
  interval: ReminderInterval,
  title: string,
  body: string,
): Promise<void> => {
  await cancelReminder();
  if (interval === 'off') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const mod = getNotifee();
  if (!mod) return;

  await ensureChannel();

  const trigger: TimestampTrigger = {
    type: mod.TriggerType.TIMESTAMP,
    timestamp: Date.now() + intervalToMs[interval],
    repeatFrequency: mod.RepeatFrequency.NONE,
    alarmManager: Platform.OS === 'android' ? { allowWhileIdle: true } : undefined,
  };

  await mod.default.createTriggerNotification(
    {
      id: REMINDER_ID,
      title,
      body,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
      ios: {
        sound: 'default',
      },
    },
    trigger,
  );
};
