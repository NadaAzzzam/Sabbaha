# Google Play Publishing Guide — Habbah

## Prerequisites
- [ ] Google Play Developer account ($25 one-time fee) — https://play.google.com/console
- [ ] Signed release AAB (Android App Bundle)
- [ ] All store assets exported as PNG
- [ ] Privacy policy hosted at a public URL

---

## Step 1: Build the Release AAB

### Generate a signing key (one-time)
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore habbah-release.keystore \
  -alias habbah-key \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```
Store this keystore file securely — you cannot recover it.

### Configure signing in `android/app/build.gradle`
```groovy
android {
    signingConfigs {
        release {
            storeFile file('habbah-release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: ''
            keyAlias 'habbah-key'
            keyPassword System.getenv("KEY_PASSWORD") ?: ''
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Build the AAB
```bash
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Step 2: Create the App in Google Play Console

1. Go to **Google Play Console** → **Create app**
2. Fill in:
   - **App name:** Habbah — Dhikr Counter
   - **Default language:** Arabic (ar)
   - **App or game:** App
   - **Free or paid:** Free
3. Accept the declarations

---

## Step 3: Store Listing

### Main store listing
Use content from `store-listing/google-play-listing.md`:
- **App name:** Habbah — Dhikr Counter
- **Short description:** (80 chars from the listing file)
- **Full description:** (from the listing file)

### Graphics
Upload the exported PNGs:
| Asset | File | Size |
|-------|------|------|
| App icon | `icon-512.png` | 512x512 |
| Feature graphic | `feature-graphic-1024x500.png` | 1024x500 |
| Phone screenshots | Mockups 01-06 exported at 1080x1920 | Min 2, rec 5-8 |

### Categorization
- **App category:** Lifestyle
- **Tags:** dhikr, tasbih, Islamic, prayer, counter

---

## Step 4: Content Rating (IARC)

Navigate to **Policy** → **App content** → **Content rating**.

Answer the questionnaire:
| Question | Answer |
|----------|--------|
| Violence | No |
| Sexual content | No |
| Language | No |
| Controlled substance | No |
| Gambling | No |
| User-generated content | No (custom dhikr is local only) |
| Ads | No |
| In-app purchases | No |

**Expected rating:** Everyone / PEGI 3

---

## Step 5: Data Safety Form

Navigate to **Policy** → **App content** → **Data safety**.

### What Habbah collects:
**Nothing.** Habbah stores all data locally via MMKV. No network calls, no analytics, no crash reporting.

| Question | Answer |
|----------|--------|
| Does your app collect or share any user data? | **No** |
| Does your app use any third-party code that collects data? | **No** |
| Is all data encrypted in transit? | N/A (no network calls) |
| Can users request data deletion? | Yes (Clear History in Settings) |

### Declaration summary:
- No data collected
- No data shared with third parties
- No data processing
- Data can be deleted by user (Settings → Clear History)

---

## Step 6: App Access

Since the app has no login/paywall:
- Select **"All functionality is available without special access"**

---

## Step 7: Ads Declaration
- Select **"No, my app does not contain ads"**

---

## Step 8: Target Audience & Content

- **Target age group:** All ages (no age-restricted content)
- **Is it designed for children?** No (general audience)
- **Government apps:** No

---

## Step 9: Permissions Explanation

Habbah requests these permissions:

| Permission | Why | Data Safety Impact |
|------------|-----|-------------------|
| `INTERNET` | Required by React Native (not used by app logic) | None — no data transmitted |
| `VIBRATE` | Haptic feedback during dhikr counting | None |
| `POST_NOTIFICATIONS` | Optional dhikr reminders | None — local notifications only |
| `SCHEDULE_EXACT_ALARM` | Precise reminder scheduling | None |
| `USE_EXACT_ALARM` | Android 14+ exact alarm permission | None |

---

## Step 10: Upload AAB & Create Release

1. Go to **Release** → **Production** → **Create new release**
2. Upload `app-release.aab`
3. Google Play will manage signing via Play App Signing (recommended)
4. Add release notes:
   ```
   Welcome to Habbah! Your mindful dhikr companion.
   • 6 authentic adhkar with full tashkeel
   • Fixed and free count modes  
   • Daily streak tracking
   • Session history with interactive charts
   • Haptic and sound feedback
   • Arabic/English, Dark/Light themes
   ```
5. **Save** → **Review release** → **Start rollout to Production**

---

## Step 11: Testing Strategy (Recommended)

### Before production release:
1. **Internal testing track** — share with 2-5 testers immediately (no review needed)
2. **Closed testing** — up to 100 testers, get feedback
3. **Open testing** — public beta, builds store listing reputation
4. **Production** — full launch

### Pre-launch report:
- Google Play Console automatically runs your app on popular devices
- Check the **Pre-launch report** under **Release** → **Testing** for crashes and issues

---

## Step 12: Review Timeline
- **Internal/Closed testing:** Available within minutes
- **First production review:** 1-7 days (can be longer for new developer accounts)
- **Subsequent updates:** Usually 1-3 days

---

## Checklist Before Submission

- [ ] AAB built and signed
- [ ] App icon (512x512 PNG) uploaded
- [ ] Feature graphic (1024x500 PNG) uploaded
- [ ] At least 2 phone screenshots uploaded
- [ ] Short description filled (both AR and EN)
- [ ] Full description filled (both AR and EN)
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
- [ ] Privacy policy URL live and accessible
- [ ] Target audience set
- [ ] App category selected
- [ ] Contact details provided (email)
- [ ] Release notes written
- [ ] Testing on at least 3 different Android devices
- [ ] ProGuard/R8 not stripping needed classes
- [ ] App works offline (no network dependency)
