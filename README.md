# Habbah حَبّة

A minimal, focused Tasbeeh (Islamic dhikr counter) app. Instead of just counting, the user feels how much **time** they spent in remembrance of Allah.

Built with React Native 0.85 (bare CLI). No Expo, no ads, no clutter.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React Native 0.85 (bare CLI) | iOS + Android, no Expo |
| Language | TypeScript 5.8 | Strict mode |
| Navigation | React Navigation 7 (Stack + BottomTabs) | |
| State | Zustand 5 + persist middleware | Zero boilerplate, offline-first |
| Storage | react-native-mmkv | Synchronous, ~30× faster than AsyncStorage |
| Haptics | react-native-haptic-feedback | Works on both platforms |
| Fonts | Cairo (Google Fonts) | Arabic-friendly, clean |
| Animation | React Native Reanimated 3 | Progress ring, completion glow |
| i18n | i18next + react-i18next | Arabic (default) + English |
| Charts | react-native-svg (custom) | Lightweight weekly bars |
| IDs | nanoid/non-secure | No crypto needed |

**Not included:** Axios, React Query, Redux, Firebase, any remote service.

---

## Design System

```
Background:  #1B3A2D  (deep dark green)
Accent:      #C9A84C  (soft gold)
Text:        #FFFFFF
Subtext:     #A0B4AA
Surface:     #243F32
Error:       #E57373
```

Dark mode by default. Light mode available in settings. Typography uses Cairo for Arabic, System font for Latin.

---

## Project Structure

```
Sabbaha/
├── src/
│   ├── constants/
│   │   ├── defaultDhikr.ts       # 6 preset dhikr items (DhikrItem[])
│   │   └── hapticPatterns.ts     # named haptic timing configs
│   ├── theme/
│   │   ├── colors.ts             # dark + light palette objects
│   │   ├── typography.ts         # Cairo sizes + line heights
│   │   └── spacing.ts            # 4pt grid tokens (xs=4, sm=8, md=16 …)
│   ├── i18n/
│   │   ├── index.ts              # i18next init, RTL detection
│   │   ├── ar.json               # all Arabic strings
│   │   └── en.json               # all English strings
│   ├── stores/
│   │   ├── useSessionStore.ts    # active session (NOT persisted)
│   │   ├── useHistoryStore.ts    # completed sessions (MMKV)
│   │   ├── useSettingsStore.ts   # theme / lang / haptics (MMKV)
│   │   └── useDhikrStore.ts      # custom dhikr library (MMKV)
│   ├── hooks/
│   │   ├── useHaptics.ts         # tap / milestone / complete patterns
│   │   ├── useCounter.ts         # increment, milestone check, completion
│   │   └── useTheme.ts           # reads settingsStore → returns palette
│   ├── components/
│   │   ├── ui/
│   │   │   ├── AppText.tsx       # RTL-aware Text, Cairo font
│   │   │   ├── AppButton.tsx     # gold/ghost variants
│   │   │   └── ScreenWrapper.tsx # SafeArea + theme background
│   │   ├── dhikr/
│   │   │   ├── DhikrCard.tsx     # Home list item
│   │   │   ├── CounterDisplay.tsx
│   │   │   └── ProgressRing.tsx  # SVG circular ring
│   │   └── history/
│   │       └── SessionRow.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── SessionSetupScreen.tsx
│   │   ├── SessionScreen.tsx
│   │   ├── SummaryScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx     # Stack wrapping TabNavigator
│   │   └── TabNavigator.tsx      # Home + History + Settings tabs
│   └── utils/
│       ├── mmkv.ts               # MMKV singleton + Zustand storage adapter
│       ├── formatters.ts         # duration string, Eastern Arabic numerals
│       └── statsCalculator.ts    # SessionRecord[] → DhikrStats[]
├── App.tsx                       # NavigationContainer + i18n init + theme
├── index.js                      # AppRegistry entry
└── README.md
```

---

## Data Models

```typescript
// src/constants/defaultDhikr.ts
interface DhikrItem {
  id: string
  arabicText: string           // "سُبْحَانَ اللَّهِ"
  transliteration: string      // "Subhanallah"
  translation: string          // "Glory be to Allah"
  defaultTarget: number        // 0 = free mode
  isCustom: boolean
}

// src/stores/useHistoryStore.ts
interface SessionRecord {
  id: string
  dhikrId: string
  dhikrText: string            // snapshot — survives dhikr deletion
  targetCount: number          // 0 = free mode session
  totalCount: number
  durationMs: number
  completedAt: number          // Unix ms timestamp
}

// Derived in statsCalculator (never stored)
interface DhikrStats {
  dhikrId: string
  dhikrText: string
  totalSessions: number
  totalMinutes: number
  avgDurationMs: number
}
```

---

## State Management

**Pattern:** Each store is a self-contained Zustand slice. Persisted stores use a shared MMKV adapter.

```typescript
// src/utils/mmkv.ts
import { MMKV } from 'react-native-mmkv'
export const storage = new MMKV()
export const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}
```

| Store | Persisted | Key Responsibility |
|---|---|---|
| `useSessionStore` | No | currentCount, targetCount, dhikr ref, startedAt, isPaused, isComplete |
| `useHistoryStore` | MMKV | `sessions: SessionRecord[]`, addSession, clearHistory |
| `useSettingsStore` | MMKV | language, theme, hapticsEnabled, hapticIntensity |
| `useDhikrStore` | MMKV | `customDhikr: DhikrItem[]`, addCustomDhikr, removeDhikr |

Components read stores directly via hooks — no prop drilling, no Context.

---

## Navigation

```
RootNavigator (Stack)
├── TabNavigator (BottomTabs)  ← initial screen
│   ├── Home        → HomeScreen
│   ├── History     → HistoryScreen
│   └── Settings    → SettingsScreen
├── SessionSetup    (push from Home, params: { dhikrId })
├── Session         (push from Setup, params: { dhikrId, targetCount })
│   gestureEnabled: false
│   headerShown: false
└── Summary         (replace from Session, params: { sessionId })
```

**Session exit:** swipe-down disabled. Pause button triggers alert "هل تريد الخروج؟" with confirm/cancel.

**Summary routing:**
- `[تسبيح جديد]` → `navigation.popToTop()`
- `[نفس الذكر]` → `navigation.replace('Session', sameParams)`

---

## Haptic System

```typescript
// src/hooks/useHaptics.ts
tap()        // ImpactFeedbackStyle.Light
milestone()  // Medium → 100ms wait → Medium
complete()   // Heavy → 200ms → Heavy → 200ms → Heavy
             // + Reanimated gold background pulse on SessionScreen
```

All haptics are no-ops when `settingsStore.hapticsEnabled === false`. Intensity maps `low → Light`, `medium → Medium`, `strong → Heavy`.

---

## i18n

Language stored in `useSettingsStore`. On change:
1. `i18next.changeLanguage(lang)`
2. `I18nManager.forceRTL(lang === 'ar')`
3. App reload required for layout flip (RN limitation)

All UI strings live in `src/i18n/ar.json` and `src/i18n/en.json`. Arabic is the default locale. Eastern Arabic numerals (٠١٢٣…) used for counts in AR mode, via `formatters.toEasternNumerals()`.

---

## Preset Dhikr

| Arabic | Transliteration | Default Target |
|---|---|---|
| سُبْحَانَ اللَّهِ | Subhanallah | 33 |
| الْحَمْدُ لِلَّهِ | Alhamdulillah | 33 |
| اللَّهُ أَكْبَرُ | Allahu Akbar | 33 |
| لَا إِلَهَ إِلَّا اللَّهُ | La ilaha illallah | 0 (free) |
| سُبْحَانَ اللَّهِ وَبِحَمْدِهِ | Subhanallahi wabihamdih | 100 |
| أَسْتَغْفِرُ اللَّهَ | Astaghfirullah | 0 (free) |

Custom dhikr: user enters Arabic text + optional target count. Saved permanently in `useDhikrStore`.

---

## Screens Reference

### HomeScreen
- `FlashList` (or `FlatList`) of all dhikr (defaults + custom)
- Each row: Arabic text, transliteration, target count chip
- FAB `+` → AddCustomDhikrModal (bottom sheet)
- Tab bar navigation to History / Settings

### SessionSetupScreen
- Large Arabic dhikr text
- Toggle: `عد محدد` (Fixed) / `عد حر` (Free)
- Fixed: editable count input (pre-filled from `defaultTarget`)
- `ابدأ` → pushes SessionScreen

### SessionScreen
- Full-screen `TouchableWithoutFeedback` tap area
- Counter: `currentCount / targetCount` (or just current in free mode)
- `ProgressRing` SVG — animated fill via Reanimated derived value
- Session timer: `MM:SS` updated every second via `useRef` interval
- Milestone (33/100): haptic + subtle flash
- Completion: haptic sequence + gold pulse animation → auto-advance to Summary
- Pause icon (bottom-right, 36px, semi-transparent)
- `expo-keep-awake` equivalent: `Activation.activate()` to prevent screen sleep

### SummaryScreen
- Blessing text: "بارك الله في وقتك"
- Dhikr name, total count (Eastern numerals), duration ("٧ دقائق و٢٣ ثانية")
- Mount animation: soft glow ripple (Reanimated)
- Two CTA buttons

### HistoryScreen
- Sessions grouped by dhikr
- Per-dhikr card: total sessions, total minutes, avg duration
- Weekly bar chart: SVG rects, 7-day range, current day highlighted gold

### SettingsScreen
- Haptic feedback: ON/OFF toggle
- Haptic intensity: low / medium / strong (segment)
- Language: AR / EN
- Theme: Dark / Light
- Danger zone: "Reset all history" (with confirm alert)

---

## Implementation Sequence (future prompts)

Each prompt below is scoped to be completable in one session:

| # | Prompt Scope |
|---|---|
| 1 | Install all dependencies (single npm install) |
| 2 | Foundation: mmkv.ts, theme/, i18n/, update App.tsx |
| 3 | All 4 Zustand stores + defaultDhikr constants |
| 4 | Navigation skeleton (RootNavigator + TabNavigator + screen stubs) |
| 5 | UI primitives: AppText, AppButton, ScreenWrapper |
| 6 | HomeScreen + DhikrCard + AddCustomDhikrModal |
| 7 | SessionSetupScreen |
| 8 | SessionScreen (counter, timer, ProgressRing, haptics, completion) |
| 9 | SummaryScreen |
| 10 | HistoryScreen (stats + SVG chart) |
| 11 | SettingsScreen |
| 12 | Polish: RTL audit, accessibility labels, performance pass |

---

## Running the App

```bash
# Start Metro
npm start

# Android
npm run android

# iOS (first time)
bundle install
bundle exec pod install
npm run ios
```

### Rebuild after adding native deps
```bash
# Android
cd android && ./gradlew clean && cd ..
npm run android

# iOS
bundle exec pod install
npm run ios
```

---

## Conventions

- **No default exports** for stores and hooks — named exports only
- **No `any`** — use `unknown` and narrow
- **Styles co-located** — `StyleSheet.create` at the bottom of each screen file
- **No inline styles** except for dynamic values (e.g., animated transforms)
- **RTL-safe layout** — use `start/end` instead of `left/right` in styles
- **Formatters always pure** — no side effects in `utils/formatters.ts`
- **Store actions are synchronous** — async work (future: cloud sync) goes in hooks
