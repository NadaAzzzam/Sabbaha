# Apple App Store Publishing Guide — Habbah

## Prerequisites
- [ ] Apple Developer Program membership ($99/year) — https://developer.apple.com
- [ ] Mac with Xcode installed (latest stable)
- [ ] Valid Apple ID enrolled in the developer program
- [ ] Privacy policy hosted at a public URL

---

## Step 1: Certificates & Provisioning Profiles

### Distribution Certificate
1. Open **Xcode** → **Settings** → **Accounts**
2. Add your Apple ID if not already added
3. Select your team → **Manage Certificates**
4. Click **+** → **Apple Distribution** certificate
5. Xcode handles the CSR and download automatically

### App ID
1. Go to **Apple Developer Portal** → **Certificates, IDs & Profiles** → **Identifiers**
2. Click **+** → **App IDs** → **App**
3. Fill in:
   - **Description:** Habbah
   - **Bundle ID:** `com.sabbaha.app` (Explicit)
4. Enable capabilities: **Push Notifications** (for reminders)
5. Click **Register**

### Provisioning Profile
1. Go to **Profiles** → click **+**
2. Select **App Store Connect** (Distribution)
3. Select App ID: `com.sabbaha.app`
4. Select your Distribution Certificate
5. Name it: `Habbah App Store Distribution`
6. Download and double-click to install

> **Easier path:** Use Xcode's **Automatically manage signing** — it handles all of the above.

---

## Step 2: Configure Xcode Project

### In `ios/Sabbaha.xcodeproj` (or `.xcworkspace`):
1. Open in Xcode
2. Select the **Sabbaha** target
3. **General** tab:
   - **Display Name:** Habbah
   - **Bundle Identifier:** `com.sabbaha.app`
   - **Version:** 1.0.0
   - **Build:** 1
4. **Signing & Capabilities** tab:
   - Team: Your Apple Developer team
   - Enable **Automatically manage signing**
   - Or manually select the provisioning profile from Step 1

### Info.plist Required Keys
Ensure these are present (for app review):
```xml
<key>NSUserNotificationsUsageDescription</key>
<string>Habbah sends gentle reminders to help you maintain your daily dhikr practice.</string>
```

---

## Step 3: Build the Archive

```bash
# Install pods if not done
cd ios && pod install && cd ..

# Build archive via Xcode:
# Product → Archive (with "Any iOS Device" selected)
```

Or via command line:
```bash
xcodebuild -workspace ios/Sabbaha.xcworkspace \
  -scheme Sabbaha \
  -configuration Release \
  -archivePath build/Sabbaha.xcarchive \
  archive
```

---

## Step 4: Create App in App Store Connect

1. Go to **App Store Connect** → **My Apps** → click **+** → **New App**
2. Fill in:
   - **Platform:** iOS
   - **Name:** Habbah — Dhikr Counter
   - **Primary Language:** Arabic
   - **Bundle ID:** `com.sabbaha.app`
   - **SKU:** `habbah-ios-001`
   - **User Access:** Full Access
3. Click **Create**

---

## Step 5: App Store Listing

Use content from `store-listing/app-store-listing.md`.

### App Information
- **Subtitle:** Elegant Tasbih with Streaks
- **Category:** Lifestyle (Primary), Health & Fitness (Secondary)
- **Content Rights:** Does not contain third-party content
- **Age Rating:** 4+ (answer all "No" to content descriptors)

### Pricing
- **Price:** Free
- **Availability:** All territories

### App Privacy
Navigate to **App Privacy** tab:

| Data Type | Collected? |
|-----------|-----------|
| Contact Info | No |
| Health & Fitness | No |
| Financial Info | No |
| Location | No |
| Sensitive Info | No |
| Contacts | No |
| User Content | No |
| Browsing History | No |
| Search History | No |
| Identifiers | No |
| Purchases | No |
| Usage Data | No |
| Diagnostics | No |

**Select:** "Data Not Collected"

---

## Step 6: Screenshots & Media

Upload for each required device size:

### iPhone 6.7" Display (Required - iPhone 15 Pro Max)
Size: 1290 x 2796
Upload 3-10 screenshots from the mockups.

### iPhone 6.5" Display (Required - iPhone 14 Plus)
Size: 1284 x 2778

### iPhone 5.5" Display (Optional but recommended)
Size: 1242 x 2208

### iPad Pro 12.9" (Required if supporting iPad)
Size: 2048 x 2732

**Recommended screenshot order:**
1. Home screen with streak card
2. Session counter with progress ring
3. Summary screen
4. History with charts
5. Settings screen

### App Preview Video (Optional, up to 30 seconds)
Record a screen capture showing:
- Selecting a dhikr
- Tapping to count with haptic animation
- Completion glow and summary

---

## Step 7: Version Information

### What's New
```
Welcome to Habbah! Your mindful dhikr companion.
• 6 authentic adhkar with full tashkeel
• Fixed and free count modes
• Daily streak tracking
• Session history with interactive charts
• Haptic and sound feedback
• Arabic/English, Dark/Light themes
```

### Support URL
https://habbah.app/support (must be live before submission)

### Marketing URL
https://habbah.app (optional)

---

## Step 8: Upload Build

### From Xcode:
1. After archiving, the **Organizer** window opens
2. Select the archive → click **Distribute App**
3. Choose **App Store Connect** → **Upload**
4. Keep default options (bitcode, symbols)
5. Click **Upload**

### From CLI (using xcrun):
```bash
xcodebuild -exportArchive \
  -archivePath build/Sabbaha.xcarchive \
  -exportOptionsPlist exportOptions.plist \
  -exportPath build/export

xcrun altool --upload-app \
  -f build/export/Sabbaha.ipa \
  -t ios \
  -u your@appleid.com \
  -p @keychain:altool
```

Build processing takes 5-30 minutes in App Store Connect.

---

## Step 9: Submit for Review

1. In App Store Connect, select the build under **Build** section
2. Fill in **App Review Information**:
   - **Contact:** Your name, email, phone
   - **Notes:** "This is a dhikr (Islamic prayer bead) counter app. No login required. All data is stored locally. The app works offline."
   - **Sign-in required:** No
3. Click **Submit for Review**

---

## Step 10: Review Guidelines Compliance

### Key guidelines for Habbah:

| Guideline | Status |
|-----------|--------|
| 1.1 Objectionable Content | Compliant — religious content is allowed |
| 1.2 User Generated Content | N/A — custom dhikr is local only |
| 2.1 App Completeness | Ensure all features work on review device |
| 2.3 Accurate Metadata | Screenshots match actual app |
| 3.1.1 In-App Purchase | N/A — no purchases |
| 4.0 Design | Clean, native-feeling UI |
| 4.2 Minimum Functionality | Passes — counter + stats + charts + customization |
| 5.1.1 Data Collection | Compliant — no data collected |
| 5.1.2 Data Use | Compliant — all local |

### Common rejection reasons to avoid:
- **Broken links:** Ensure privacy policy and support URLs are live
- **Crashes:** Test on older iOS devices (iPhone SE, iOS 15+)
- **Incomplete features:** Ensure all buttons/screens work
- **Placeholder content:** Remove any "lorem ipsum" or test data

---

## Step 11: Review Timeline
- **First submission:** 1-7 days (often 24-48 hours)
- **Subsequent updates:** Usually 24 hours
- **Expedited review:** Available for critical fixes (request via App Store Connect)

---

## Checklist Before Submission

- [ ] Apple Developer account active
- [ ] Bundle ID registered
- [ ] Distribution certificate valid
- [ ] App icon (1024x1024 PNG, no alpha/transparency) uploaded
- [ ] Screenshots for all required device sizes
- [ ] App name, subtitle, description filled
- [ ] Keywords set (100 chars)
- [ ] Privacy policy URL live
- [ ] Support URL live
- [ ] App Privacy section completed ("Data Not Collected")
- [ ] Age rating completed (4+)
- [ ] Category selected (Lifestyle)
- [ ] Build uploaded and processed
- [ ] What's New text written
- [ ] Tested on physical device (not just simulator)
- [ ] Tested on minimum supported iOS version
- [ ] No private API usage
- [ ] No third-party SDK compliance issues
- [ ] NSUserNotificationsUsageDescription in Info.plist
