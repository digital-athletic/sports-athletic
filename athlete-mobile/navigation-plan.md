# Navigation Structure Plan

## Overview

This document outlines the complete navigation hierarchy of the Sports Athletic application based on the legacy implementation. The app uses React Navigation with a combination of stack, tab, and switch navigators.

## Navigation Hierarchy

### Root Level: App Container
The root navigator is a **Stack Navigator** that wraps all navigation flows with no header.

### Top-Level Switch Navigator: AllStack
A **Switch Navigator** manages the main application flows, allowing transitions between major sections without maintaining history.

#### Switch Routes:
1. **OnboardingStack** - Initial user onboarding flow
2. **MainStack** - Primary app experience (Tab Navigator)
3. **AnamnesisStack** - User profile and health questionnaire flow
4. **TrainingStack** - Active training session flow
5. **WebViewStack** - Full-screen web content
6. **VideoPlayerViewStack** - Full-screen video playback
7. **TestStack** - Development/testing screens

---

## Detailed Navigation Structure

### 1. OnboardingStack (Stack Navigator)
**Purpose:** First-time user experience and app introduction

**Routes:**
- `Onboarding` (initial) - Main onboarding screens
- `OnboardingWebView` - Web content during onboarding

**Configuration:**
- Initial Route: `Onboarding`
- Tab Bar: Hidden

---

### 2. MainStack (Tab Navigator) - Primary App Interface
**Purpose:** Main navigation experience with bottom tabs

**Tabs Configuration:**
- Active Color: Primary brand color
- Inactive Color: #999999
- Tab Bar Style: White background
- Animations: Disabled
- Swipe: Disabled

#### Tab 1: HomeStack (Stack Navigator)
**Tab Label:** "Training" (TABS_TITLE_TRAINING)
**Tab Icon:** walk icon

**Routes:**
- `Home` (initial) - Training home/dashboard
- `SectionDetails` - Detailed view of training sections

**Configuration:**
- Tab Bar: Visible

#### Tab 2: TeamStack (Stack Navigator) - CURRENTLY DISABLED
**Tab Label:** "Team" (TABS_TITLE_TEAM)
**Tab Icon:** users icon
**Status:** Commented out - no team functionality right now

**Routes:**
- `Team` (initial) - Team overview
- `NewTeam` - Team creation flow
- `TeamInvite` - Send team invitations
- `TeamRanking` - Team leaderboard
- `TeamMessages` - Team communication
- `TeamWorkouts` - Team workout assignments
- `NewPost` - Create team posts
- `WorkoutDetails` - Individual workout details
- `Workouts` - Workout library

**Configuration:**
- Tab Bar: Visible

#### Tab 3: StatisticsStack (Stack Navigator)
**Tab Label:** "Statistics" (TABS_TITLE_STATISTICS)
**Tab Icon:** stats icon

**Routes:**
- `Statistics` (initial) - User statistics and progress

**Configuration:**
- Tab Bar: Visible

#### Tab 4: MoreStack (Stack Navigator)
**Tab Label:** "Profile" (TABS_TITLE_PROFILE)
**Tab Icon:** person icon

**Routes:**
- `More` (initial) - Main menu/profile hub
- `Profile` - User profile editing
- `Settings` - App settings
- `Exercises` - Exercise library
- `ExerciseInformationMore` - Exercise details (from More menu)
- `Tutorials` - Tutorial content
- `Equipment` - Equipment information
- `Imprint` - Legal imprint
- `Privacy` - Privacy policy
- `Notifications` - Notification settings
- `WebView` - In-app web browser
- `Subscribe` - Subscription purchase flow
- `SubscriptionStatus` - Current subscription details

**Configuration:**
- Tab Bar: Visible

---

### 3. AnamnesisStack (Stack Navigator)
**Purpose:** User onboarding and profile setup flow

**Routes:**
- `Welcome` - Welcome screen
- `Sport` (initial) - Sport selection
- `Userprofile` - User profile information
- `Anamnesis` - Health questionnaire
- `TrainingDays` - Training schedule setup
- `SeasonPhase` - Current season phase selection
- `Generating` - Training plan generation

**Configuration:**
- Initial Route: `Sport`
- Tab Bar: Hidden

---

### 4. TrainingStack (Stack Navigator)
**Purpose:** Active training session management

**Routes:**
- `SelectTraining` (initial) - Choose training session
- `MuscleSoreness` - Report muscle soreness
- `TrainingOverview` - Session preview
  - Gestures: Disabled (prevents back navigation)
- `Training` - Active training execution
  - Gestures: Disabled (prevents accidental exits)
- `TrainingSuccess` - Training completion summary
  - Gestures: Disabled (controlled flow)
- `ExerciseInformation` - Exercise details during training

**Configuration:**
- Initial Route: `SelectTraining`
- Tab Bar: Hidden
- Back gestures disabled on critical screens

---

### 5. WebViewStack (Stack Navigator)
**Purpose:** Full-screen web content viewing

**Routes:**
- `WebView` (initial) - Web browser component

**Configuration:**
- Tab Bar: Hidden

---

### 6. VideoPlayerViewStack (Stack Navigator)
**Purpose:** Full-screen video playback

**Routes:**
- `VideoPlayerView` (initial) - Video player interface

**Configuration:**
- Tab Bar: Hidden

---

### 7. TestStack (Stack Navigator)
**Purpose:** Development and testing screens

**Routes:**
- `Test` (initial) - Test menu/dashboard
- `TestTraining` - Training testing screens

**Configuration:**
- Initial Route: `Test`

---

### 8. Contact (Modal Route)
**Purpose:** Contact form/support
**Configuration:** Presented as a modal over other navigation

---

## Navigation Flow Patterns

### User Journey Flows

#### First-Time User
1. **OnboardingStack** → User sees app introduction
2. **AnamnesisStack** → User completes profile and health questionnaire
3. **MainStack (HomeStack)** → User lands on training home

#### Returning User
1. **MainStack (HomeStack)** → Direct to training home
2. User navigates between tabs freely

#### Training Session Flow
1. User starts from **HomeStack**
2. Navigation switches to **TrainingStack**
3. Flow: `SelectTraining` → `MuscleSoreness` → `TrainingOverview` → `Training` → `TrainingSuccess`
4. Returns to **MainStack** after completion

#### Full-Screen Experiences
- **WebViewStack** - For external content
- **VideoPlayerViewStack** - For exercise videos
- Back navigation returns to previous context

---

## Technical Notes

### Disabled Features
- **TeamStack** currently commented out (no team functionality)
- Can be re-enabled by uncommenting in TabNavigator configuration

---

## Migration Considerations for Expo Router

When migrating to Expo Router, consider:

1. **Switch Navigator** → Use conditional rendering or layout groups
2. **Tab Navigator** → Use `(tabs)` layout group
3. **Stack Navigator** → Use folder-based stack layouts or Stack.Navigator
4. **Modal Screens** → Use `presentation: 'modal'` in screen options
5. **Gesture Disabling** → Use `gestureEnabled: false` in screen options
6. **Global Navigation** → Use `useRouter()` and `router.push()` instead of global ref
