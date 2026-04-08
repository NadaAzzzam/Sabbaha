export interface DhikrItem {
  id: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  defaultTarget: number; // 0 = free mode
  isCustom: boolean;
}

// Arabic texts use full tashkeel matching classical hadith transmission.
// Counts sourced from Sahih Muslim (after salah: 33 each) and
// "من قالها مئة مرة" hadith (subhanallahi wabihamdih × 100).
export const DEFAULT_DHIKR: DhikrItem[] = [
  {
    // Sahih Muslim 597 — after every salah, 33×
    id: 'subhanallah',
    arabicText: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subḥāna-llāh',
    translation: 'Glory be to Allah',
    defaultTarget: 33,
    isCustom: false,
  },
  {
    // Sahih Muslim 597 — after every salah, 33×
    id: 'alhamdulillah',
    arabicText: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Al-ḥamdu li-llāh',
    translation: 'All praise is due to Allah',
    defaultTarget: 33,
    isCustom: false,
  },
  {
    // Sahih Muslim 597 — after every salah, 33×
    id: 'allahuakbar',
    arabicText: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    translation: 'Allah is the Greatest',
    defaultTarget: 33,
    isCustom: false,
  },
  {
    // Sahih Muslim 2691 — free count, no fixed number stipulated
    id: 'lailaha',
    arabicText: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: 'Lā ilāha illā-llāh',
    translation: 'There is no deity worthy of worship except Allah',
    defaultTarget: 0,
    isCustom: false,
  },
  {
    // Sahih Bukhari 6405, Sahih Muslim 2692 — 100× wipes sins
    id: 'subhanallahiwabihamdih',
    arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subḥāna-llāhi wa-biḥamdih',
    translation: 'Glory be to Allah and all praise is due to Him',
    defaultTarget: 100,
    isCustom: false,
  },
  {
    // Sahih Muslim 2702 — free count (70+ times recommended)
    id: 'astaghfirullah',
    arabicText: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfiru-llāh',
    translation: 'I seek forgiveness from Allah',
    defaultTarget: 0,
    isCustom: false,
  },
];
