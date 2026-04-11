const EASTERN = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toEasternNumerals = (n: number): string =>
  String(n).replace(/\d/g, d => EASTERN[parseInt(d, 10)]);

export const formatDuration = (ms: number, lang: 'ar' | 'en'): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (lang === 'ar') {
    const m = toEasternNumerals(minutes);
    const s = toEasternNumerals(seconds);
    if (minutes === 0) return `${s} ثانية`;
    if (seconds === 0) return `${m} دقيقة`;
    return `${m} دقيقة و${s} ثانية`;
  }
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

export const formatTimer = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const formatCount = (n: number, lang: 'ar' | 'en'): string =>
  lang === 'ar' ? toEasternNumerals(n) : String(n);

const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const formatDayName = (ts: number, lang: 'ar' | 'en'): string => {
  const d = new Date(ts);
  return lang === 'ar' ? AR_DAYS[d.getDay()] : EN_DAYS[d.getDay()];
};

export const formatLongDate = (ts: number, lang: 'ar' | 'en'): string => {
  const d = new Date(ts);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  if (lang === 'ar') {
    return `${toEasternNumerals(day)} ${AR_MONTHS[month]} ${toEasternNumerals(year)}`;
  }
  return `${EN_MONTHS[month]} ${day}, ${year}`;
};
