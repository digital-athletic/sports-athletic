# Expo Router Navigation Structure

This directory contains the complete Expo Router-based navigation hierarchy for the Sports Athletic application, recreated from the legacy React Navigation implementation.

## 📁 Directory Structure

```
app/
├── _layout.tsx                 # Root layout with SafeAreaView
├── index.tsx                   # Entry point with navigation demo
├── contact.tsx                 # Contact modal screen
│
├── onboarding/                 # Onboarding flow (2 screens)
│   ├── _layout.tsx
│   ├── index.tsx
│   └── webview.tsx
│
├── anamnesis/                  # Profile setup flow (7 screens)
│   ├── _layout.tsx
│   ├── index.tsx              # Welcome
│   ├── sport.tsx
│   ├── userprofile.tsx
│   ├── anamnesis.tsx
│   ├── training-days.tsx
│   ├── season-phase.tsx
│   └── generating.tsx
│
├── training/                   # Training session flow (6 screens)
│   ├── _layout.tsx
│   ├── index.tsx              # Select training
│   ├── muscle-soreness.tsx
│   ├── training-overview.tsx  # Gestures disabled
│   ├── training.tsx           # Gestures disabled
│   ├── training-success.tsx   # Gestures disabled
│   └── exercise-information.tsx
│
├── (tabs)/                     # Main tab navigator
│   ├── _layout.tsx
│   ├── index.tsx              # Home/Training tab
│   │
│   ├── home/                  # Home stack (nested)
│   │   ├── _layout.tsx
│   │   └── section-details.tsx
│   │
│   ├── statistics/            # Statistics tab
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   │
│   └── profile/               # Profile/More tab (13 screens)
│       ├── _layout.tsx
│       ├── index.tsx          # Menu
│       ├── profile.tsx
│       ├── settings.tsx
│       ├── exercises.tsx
│       ├── exercise-information.tsx
│       ├── tutorials.tsx
│       ├── equipment.tsx
│       ├── imprint.tsx
│       ├── privacy.tsx
│       ├── notifications.tsx
│       ├── webview.tsx
│       ├── subscribe.tsx
│       └── subscription-status.tsx
│
├── webview/                   # Full-screen modal
│   ├── _layout.tsx
│   └── index.tsx
│
├── video-player/              # Full-screen modal
│   ├── _layout.tsx
│   └── index.tsx
│
└── test/                      # Development/testing
    ├── _layout.tsx
    ├── index.tsx
    └── test-training.tsx
```

## 🔄 Navigation Flow Mappings

### Legacy React Navigation → Expo Router

| Legacy Navigator | Expo Router Equivalent | Location |
|-----------------|------------------------|----------|
| `AllStack` (Switch) | Conditional rendering in root | `app/_layout.tsx` + `app/index.tsx` |
| `OnboardingStack` | Folder-based stack | `app/onboarding/` |
| `AnamnesisStack` | Folder-based stack | `app/anamnesis/` |
| `TrainingStack` | Folder-based stack | `app/training/` |
| `TabNavigator` (Tabs) | `(tabs)` group | `app/(tabs)/` |
| `HomeStack` | Nested stack in tabs | `app/(tabs)/home/` |
| `StatisticsStack` | Nested stack in tabs | `app/(tabs)/statistics/` |
| `MoreStack` | Nested stack in tabs | `app/(tabs)/profile/` |
| `WebViewStack` | Full-screen modal | `app/webview/` |
| `VideoPlayerViewStack` | Full-screen modal | `app/video-player/` |
| `TestStack` | Folder-based stack | `app/test/` |
| `Contact` (Modal) | Modal presentation | `app/contact.tsx` |
