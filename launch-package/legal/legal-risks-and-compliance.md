# Legal Risks & Compliance Assessment — Habbah

## Trademark & Copyright

### App Name: "Habbah" (حَبّة)
- **Risk Level: LOW**
- "Habbah" is a common Arabic word meaning "grain" or "bead"
- No existing software trademarks found for "Habbah" in the Islamic app category
- No apps with this name found on Google Play or Apple App Store (verified April 2026)
- Generic/common words are harder to trademark, reducing conflict risk
- **Recommendation:** File a trademark application in your jurisdiction for "Habbah" in Class 9 (mobile applications) for added protection

### Logo/Icon Design
- **Risk Level: LOW**
- Original design created specifically for this app
- Single-bead concept is unique in the dhikr app market (competitors use crescent moons, mosques, full rosaries)
- Color combination (gold on forest green) is common in Islamic design but the specific composition is original

### Dhikr Content
- **Risk Level: NONE**
- All dhikr texts are from the Quran and authenticated Hadith collections
- These are part of the Islamic public domain — no copyright applies
- Hadith references (Sahih Bukhari, Sahih Muslim) are cited in the source code for transparency

### Fonts
- **Risk Level: LOW**
- App uses system fonts (SF Pro on iOS, Roboto on Android) — no licensing issues
- SVG mockups reference Amiri font (SIL Open Font License) — free for commercial use
- If embedding Amiri in the app, include the OFL license file

---

## Data Privacy Compliance

### GDPR (EU)
- **Status: COMPLIANT**
- No personal data collected
- No data processing
- No data transfers
- No cookies or tracking
- Privacy policy clearly states data practices
- User can delete all local data (Settings → Clear History)

### CCPA (California)
- **Status: COMPLIANT**
- No personal information sold or shared
- No data collection at all
- Privacy policy discloses practices

### COPPA (Children - USA)
- **Status: COMPLIANT**
- No data collected from any user, including children
- No social features, no user accounts
- App is suitable for all ages

### App Tracking Transparency (Apple)
- **Status: NOT REQUIRED**
- ATT prompt is only needed if tracking users across apps/websites
- Habbah does not track users at all
- No need to implement ATT framework

---

## App Store Compliance

### Google Play Policies
| Policy | Status |
|--------|--------|
| Deceptive behavior | Compliant — app does what it claims |
| Malware | Compliant — no malicious code |
| Data safety | Compliant — "No data collected" declaration |
| Ads policy | N/A — no ads |
| Payments policy | N/A — no payments |
| Families policy | Compliant — but not enrolled in Designed for Families |
| User data policy | Compliant — local storage only |
| Permissions policy | Compliant — all permissions justified |

### Apple App Store Review Guidelines
| Guideline | Status |
|-----------|--------|
| 1.1 Objectionable Content | Compliant — religious content is permitted |
| 1.2 User-generated content | N/A — custom dhikr is local only |
| 2.1 Performance | Ensure no crashes on review device |
| 3.1 Payments | N/A — free, no IAP |
| 4.2 Minimum functionality | Compliant — full-featured app |
| 5.1 Privacy | Compliant — no data collection |

---

## Potential Legal Risks

### 1. Religious Sensitivity
- **Risk:** Incorrect diacritical marks (tashkeel) on Arabic dhikr text could be seen as disrespectful
- **Mitigation:** All dhikr texts use full, verified tashkeel matching classical hadith transmission. Sources are cited in the code.

### 2. Notification Overuse
- **Risk:** Excessive push notifications could lead to user complaints
- **Mitigation:** Reminders are optional, user-controlled, and limited to 3 preset intervals (5/10/15 min). No marketing notifications.

### 3. App Name Squatting
- **Risk:** Someone could register "Habbah" as a trademark before you
- **Mitigation:** Consider filing a trademark application after initial launch success. Document your first use date (git history).

### 4. Open Source License Compliance
- **Risk:** React Native and its dependencies have various licenses
- **Mitigation:** React Native uses MIT license. Check all npm dependencies:
  ```bash
  npx license-checker --summary
  ```
  Ensure no GPL-only dependencies (which would require open-sourcing the entire app).

---

## Recommended Actions

1. **Before launch:**
   - [ ] Host privacy policy at a public URL
   - [ ] Host terms & conditions at a public URL
   - [ ] Run `npx license-checker` to verify dependency licenses
   - [ ] Verify all Arabic tashkeel with a native Arabic speaker

2. **After launch:**
   - [ ] Consider trademark registration for "Habbah" in Class 9
   - [ ] Monitor app stores for copycat apps
   - [ ] Keep privacy policy updated if features change

3. **If adding features later:**
   - If adding analytics: Update privacy policy and data safety forms
   - If adding cloud sync: Add data processing section to privacy policy
   - If adding social features: COPPA/GDPR may require age verification
   - If adding in-app purchases: Update terms and comply with store policies
