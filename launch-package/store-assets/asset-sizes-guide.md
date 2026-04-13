# Asset Export Sizes Guide

## How to Export
Use any SVG-to-PNG tool (e.g., Inkscape, Figma, or `sharp`/`svg2png` CLI) to export the SVG files at the required sizes below.

---

## App Icon

**Source file:** `branding/app-icon.svg` (with text) or `branding/icon-no-text.svg` (without text)

### Android (use `icon-no-text.svg` — text unreadable at small sizes)
| Density | Size | Output Path |
|---------|------|-------------|
| mdpi | 48x48 | `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` |
| hdpi | 72x72 | `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` |
| xhdpi | 96x96 | `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` |
| xxhdpi | 144x144 | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` |
| xxxhdpi | 192x192 | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` |
| Play Store | 512x512 | `launch-package/store-assets/exports/play-store-icon-512.png` |

### Android Adaptive Icon
| Layer | Size | Notes |
|-------|------|-------|
| Foreground | 432x432 (108dp @4x) | Bead centered in safe zone (72dp center) |
| Background | 432x432 | Solid `#1B3A2D` |

### iOS (AppIcon.appiconset)
| Usage | Pixels |
|-------|--------|
| iPhone Notification @2x | 40x40 |
| iPhone Notification @3x | 60x60 |
| iPhone Settings @2x | 58x58 |
| iPhone Settings @3x | 87x87 |
| iPhone Spotlight @2x | 80x80 |
| iPhone Spotlight @3x | 120x120 |
| iPhone App @2x | 120x120 |
| iPhone App @3x | 180x180 |
| iPad App @2x | 152x152 |
| iPad Pro App @2x | 167x167 |
| App Store | 1024x1024 |

---

## Feature Graphic (Google Play)
- **Source:** `store-assets/feature-graphic.svg`
- **Export size:** 1024x500 PNG
- **Output:** `store-assets/exports/feature-graphic-1024x500.png`

---

## Splash Screen
- **Source:** `store-assets/splash-screen.svg`
- Export per platform:

| Platform | Size |
|----------|------|
| Android mdpi | 320x480 |
| Android hdpi | 480x800 |
| Android xhdpi | 720x1280 |
| Android xxhdpi | 960x1600 |
| Android xxxhdpi | 1280x1920 |
| iOS @2x | 750x1334 |
| iOS @3x | 1242x2688 |

---

## Store Screenshots

### Google Play (Phone)
- **Size:** 1080x1920 (or 1242x2208)
- **Minimum:** 2 screenshots, **Recommended:** 5-8
- **Screens to capture:**
  1. Onboarding (01-onboarding.svg)
  2. Home Screen (02-home.svg)
  3. Session Counter (03-session.svg)
  4. Summary (04-summary.svg)
  5. History & Charts (05-history.svg)
  6. Settings (06-settings.svg)

### Apple App Store
| Device | Size |
|--------|------|
| iPhone 6.7" (15 Pro Max) | 1290x2796 |
| iPhone 6.5" (14 Plus) | 1284x2778 |
| iPhone 5.5" (SE/8 Plus) | 1242x2208 |
| iPad Pro 12.9" | 2048x2732 |

**Minimum:** 3 screenshots per device size
**Maximum:** 10 screenshots per device size

---

## Promotional Banner
- **Source:** `store-assets/promotional-banner.svg`
- **Export:** 1024x500 PNG

---

## Quick Export Script (Node.js with sharp)

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');
const fs = require('fs');

const exports = [
  { input: 'branding/icon-no-text.svg', output: 'exports/icon-512.png', width: 512, height: 512 },
  { input: 'branding/icon-no-text.svg', output: 'exports/icon-1024.png', width: 1024, height: 1024 },
  { input: 'branding/icon-no-text.svg', output: 'exports/icon-192.png', width: 192, height: 192 },
  { input: 'branding/icon-no-text.svg', output: 'exports/icon-144.png', width: 144, height: 144 },
  { input: 'branding/icon-no-text.svg', output: 'exports/icon-96.png', width: 96, height: 96 },
  { input: 'branding/icon-no-text.svg', output: 'exports/icon-72.png', width: 72, height: 72 },
  { input: 'branding/icon-no-text.svg', output: 'exports/icon-48.png', width: 48, height: 48 },
  { input: 'store-assets/feature-graphic.svg', output: 'exports/feature-graphic.png', width: 1024, height: 500 },
  { input: 'store-assets/splash-screen.svg', output: 'exports/splash-1242x2688.png', width: 1242, height: 2688 },
];

async function exportAll() {
  if (!fs.existsSync('exports')) fs.mkdirSync('exports');
  for (const { input, output, width, height } of exports) {
    await sharp(input).resize(width, height).png().toFile(output);
    console.log(`Exported ${output}`);
  }
}

exportAll();
```
