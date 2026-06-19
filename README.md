# InternSync (React Native · Expo)

The native iOS + Android app for **InternSync** — a swipe-to-discover app for internships,
scholarships, and extracurriculars. Built with **Expo (SDK 56)**, **Expo Router**, and TypeScript.

> This is the production app codebase (rebuilt from the original HTML design prototype).

## Requirements

- Node 20+ and npm
- For native builds: Xcode (iOS) and/or Android Studio (Android)
- The [Expo Go](https://expo.dev/go) app on your phone for the fastest preview

## Run it

```bash
npm install            # uses .npmrc (legacy-peer-deps) due to RN/react-dom peer ranges
npx expo start         # press i (iOS sim), a (Android), or scan the QR with Expo Go
```

To produce store builds, use **EAS Build** (cloud) — no local Xcode/Android setup needed:

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build -p ios        # → .ipa for App Store / TestFlight
eas build -p android    # → .aab for Play Store
eas submit -p ios       # upload to App Store Connect
eas submit -p android   # upload to Play Console
```

## Project structure

```
app/                       # Expo Router screens (file = route)
  _layout.tsx              # root stack, font loading, providers
  index.tsx                # Welcome
  login.tsx                # Log in (Apple / Google / username)
  signup.tsx               # Multi-step onboarding + plan + Stripe/Apple Pay payment + done
  home.tsx                 # Internships swipe feed
  scholarships.tsx         # Scholarships feed (blue accent)
  extracurriculars.tsx     # Extracurriculars feed (orange accent)
  saved.tsx                # Saved list + search + detail
  tracker.tsx              # Application tracker (status circles + expand detail + confirm)
  profile.tsx              # Editable profile + account settings
  application.tsx          # Common Application form
src/
  theme/                   # colors, radii, font tokens
  components/
    Feed.tsx               # reusable swipe deck (used by the 3 feeds)
    Menu.tsx               # slide-in navigation menu
    ui.tsx                 # GlassButton, Chip, Tag
  data/feed.ts             # mock listings / applications / saved / notifications
assets/img/                # logo + photos
```

## What's implemented

- Full navigation + dark design system (Hanken Grotesk via `@expo-google-fonts`)
- **Swipe gestures** (right = save, left = pass) with the action buttons, on all three feeds
- Filters, info sheets, notifications panel, blurred modals
- **Editable profile photo** and **CV upload** via `expo-image-picker`
- Multi-step **sign-up** with plan selection and a **payment flow** (Apple Pay + card)

## What still needs a backend (handoff notes)

These are wired as front-end mocks and need real services before launch:

- **Auth** (Apple / Google / email) — e.g. Expo `expo-auth-session` or a provider like Firebase/Supabase/Clerk
- **Payments** — integrate the **Stripe** React Native SDK (`@stripe/stripe-react-native`) + a backend
  PaymentIntent endpoint; use **Apple Pay / Google Pay** via Stripe. In-app subscriptions for the stores
  may require StoreKit / Play Billing depending on what's being sold (review store policies).
- **Data** — replace `src/data/feed.ts` with API calls; persist saved/applications/profile.
- **Push notifications** — `expo-notifications`.
- App icons / splash in `assets/` should be replaced with final brand art before submitting.

Bundle IDs are set in `app.json` (`com.internsync.app`) — change to your own before building.
