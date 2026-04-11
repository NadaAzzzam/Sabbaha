/**
 * Hijri (Umm al-Qura) via Intl. Uses local noon to avoid DST edge cases at midnight.
 */

const LOCALE = 'en-u-ca-islamic-umalqura';

let cachedFormatter: Intl.DateTimeFormat | null = null;

function formatter(): Intl.DateTimeFormat {
  if (!cachedFormatter) {
    cachedFormatter = new Intl.DateTimeFormat(LOCALE, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }
  return cachedFormatter;
}

/** Local civil day anchor (noon) for stable Hijri calendar date from an instant. */
export function localNoon(ts: number): Date {
  const d = new Date(ts);
  d.setHours(12, 0, 0, 0);
  return d;
}

export interface HijriParts {
  year: number;
  month: number; // 1–12
  day: number;
}

export function hijriParts(ts: number): HijriParts {
  const d = localNoon(ts);
  const parts = formatter().formatToParts(d);
  const v = (type: string) => parts.find(p => p.type === type)?.value ?? '0';
  return {
    year: parseInt(v('year'), 10),
    month: parseInt(v('month'), 10),
    day: parseInt(v('day'), 10),
  };
}

export function hijriDateKey(ts: number): string {
  const { year, month, day } = hijriParts(ts);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function hijriYearMonthKey(ts: number): string {
  const { year, month } = hijriParts(ts);
  return `${year}-${String(month).padStart(2, '0')}`;
}

export const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const;

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  "Rabi' I",
  "Rabi' II",
  'Jumada I',
  'Jumada II',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu'l-Qa'dah",
  "Dhu'l-Hijjah",
] as const;

export function hijriMonthName(month1to12: number, lang: 'ar' | 'en'): string {
  const i = month1to12 - 1;
  if (i < 0 || i >= 12) return '';
  return lang === 'ar' ? HIJRI_MONTHS_AR[i] : HIJRI_MONTHS_EN[i];
}
