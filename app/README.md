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

## 🎯 Key Features Implemented

### 1. Navigation Buttons
All training flow screens include navigation buttons to demonstrate the hierarchy:
- **Select Training** → Navigate to Muscle Soreness
- **Muscle Soreness** → Navigate to Training Overview
- **Training Overview** → Navigate to Training or Exercise Info
- **Training** → Navigate to Training Success or Exercise Info
- **Training Success** → Return to Home

### 2. Gesture Controls
Screens with `gestureEnabled: false` in legacy:
- `training/training-overview.tsx`
- `training/training.tsx`
- `training/success.tsx`

### 3. Modal Presentations
- **Contact**: Presented as modal with header
- **WebView**: Full-screen modal
- **Video Player**: Full-screen modal

### 4. Tab Navigation
Three active tabs (Team tab disabled as in legacy):
1. **Training** (Home) - walk icon
2. **Statistics** - stats icon
3. **Profile** (More) - person icon

## 🚀 Testing the Navigation

### Run the App
```bash
npm start
# or
npx expo start
```

### Navigate Through Flows

1. **Start from Index**: The root screen provides buttons to navigate to all major flows
2. **Onboarding Flow**: `onboarding` → `onboarding/webview` → `anamnesis`
3. **Anamnesis Flow**: Complete profile setup through 7 screens
4. **Training Flow**: Full training session with navigation buttons
5. **Main App**: Tab-based interface with nested stacks
6. **Modals**: Test full-screen WebView, Video Player, and Contact modal

## 📝 Screen Inventory

**Total Screens Created**: 47 screens across all flows

- Onboarding Stack: 2 screens
- Anamnesis Stack: 7 screens
- Training Stack: 6 screens
- Home Stack: 2 screens (+ tab root)
- Statistics Stack: 1 screen
- Profile Stack: 13 screens
- WebView Stack: 1 screen
- Video Player Stack: 1 screen
- Test Stack: 2 screens
- Contact: 1 modal screen
- Index: 1 entry screen

## 🔧 Configuration Notes

### Screen Options Applied
- Headers hidden on most stacks (matches legacy)
- Gestures disabled on training flow screens
- Modal presentation for Contact
- Full-screen modals for WebView and Video Player
- SafeAreaView wrapper at root level

### Tab Bar Styling
- Active color: `#007AFF` (PRIMARY)
- Inactive color: `#999999`
- Background: White
- Label font size: 11
- Platform-specific bottom margins

## 🎨 Design Patterns

### Empty Screens
All screens are implemented with:
- Clear title and description
- Navigation buttons to test hierarchy
- Consistent styling
- Comments indicating legacy source

### Button Types
1. **Primary Button**: Blue background for main actions
2. **Secondary Button**: White background with blue border
3. **Quick Action Button**: Light gray background
4. **Link Button**: Text-only navigation

## 📚 Next Steps

To complete the migration:

1. **Add Redux Integration**: Wrap root layout with Provider and PersistGate
2. **Add Theme System**: Implement Shopify Restyle
3. **Connect to Firebase**: Integrate authentication and data
4. **Implement Real Content**: Replace placeholder screens with actual UI
5. **Add State Management**: Connect screens to Redux store
6. **Testing**: Add React Native Testing Library tests

## 🗺️ Navigation Plan Reference

For detailed navigation hierarchy documentation, see:
- `navigation-plan.md` - Comprehensive documentation
- `navigation-plan.json` - JSON structure representation

---

**Note**: This structure exactly mirrors the legacy React Navigation implementation while following Expo Router's file-based routing conventions and modern React Native best practices.
