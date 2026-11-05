# T Clan Welcome (native app)

Expo / React Native onboarding app for The T Clan Discord. Runs on iOS and Android from one codebase.

## Try it on your phone (2 minutes)
```bash
cd mobile
npm install
npx expo start
```
Install **Expo Go** on your phone and scan the QR code.

## Build real installable apps
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview   # installable .apk
npx eas-cli@latest build --platform all --profile production     # store builds
npx eas-cli@latest submit --platform all                         # App Store / Google Play
```
You need an Expo account (free), plus an Apple Developer account ($99/yr) for iOS and a Google Play account ($25 once) for stores.
The bundle ids in `app.json` (`com.tclan.welcome`) can be changed before your first build.

## Edit content
Rules, safety checklist, channel tour, intro template, parent guide and the invite link are all in `content.js`.

## Notes
- Audiences: 18+, 13–17 (extra safety), parent guide, and a stop screen for under-13s (Discord requires 13+).
- No accounts, analytics or network calls. Progress is stored on-device only.
- Both native bundles (`expo export --platform android|ios`) compile; the UI flow was tested in a browser build.
  It has not been run on a physical device or simulator yet.
