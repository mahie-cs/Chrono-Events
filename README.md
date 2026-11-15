# Momentum (Android)

Native Kotlin + Jetpack Compose version of the Momentum website, in the same minimalist design (light/dark).

- **Home:** vertical Exams / Assignments / Events rail (top-left), flip cards, "Show more" sheet, pull to refresh.
- **Updates:** checks the GitHub Releases of `mahie-cs/Chrono-Events`, downloads the APK and installs it in-app.
- **About:** credits, plus notification and background-activity permissions.
- **Background sync:** WorkManager checks `events.json` about every 15 min and posts a pop-up notification per new/changed entry.
- Data: `https://raw.githubusercontent.com/mahie-cs/Chrono-Events/main/events.json`, cached for offline use.

## Build
Open this folder in Android Studio (Koala or newer), let Gradle sync, then Run or Build > Generate App Bundles or APKs > Generate APKs.

## Publishing an update
1. Raise `versionCode` and `versionName` in `app/build.gradle.kts` (e.g. 3 / "1.2").
2. Build the APK (always on the same PC / same keystore, or phones will refuse the update).
3. On GitHub: Releases → Draft a new release → tag `v1.2` (must match `versionName`) → attach the `.apk` → Publish.
