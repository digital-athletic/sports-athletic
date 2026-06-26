# Expo Router Navigation Structure

This directory contains the Expo Router-based navigation hierarchy for the Sports Athletic application. Routing is file-based: folders map to stacks, `(group)` folders are route groups that share a layout without adding a URL segment, and `_layout.tsx` files define the navigator for their folder.

## 📁 Directory Structure

```
app/
├── _layout.tsx                      # Root layout (auth/consent gating)
├── consent.tsx                      # GDPR consent screen
├── contact.tsx                      # Contact modal
├── demo.tsx                         # Dev navigation demo (links to every flow)
│
├── onboarding/                      # Onboarding flow
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── email-verification.tsx       # OTP verification
│   └── webview.tsx
│
├── (anamnesis)/                     # Profile setup flow (group)
│   ├── _layout.tsx
│   └── anamnesis.tsx                # Welcome
│
├── (anamnesis,more)/                # Routes shared by the anamnesis and (more) groups
│   └── anamnesis/
│       ├── anamnesis-questions.tsx
│       ├── sport.tsx
│       ├── userprofile.tsx
│       ├── training-days.tsx
│       ├── season-phase.tsx
│       └── generating.tsx
│
├── training/                        # Training session flow
│   ├── _layout.tsx
│   ├── index.tsx                    # Select training
│   ├── muscle-soreness.tsx
│   ├── training-overview.tsx
│   ├── training-active.tsx
│   ├── training-success.tsx
│   ├── manual-strength-test.tsx
│   └── exercise-information.tsx
│
├── (tabs)/                          # Main tab navigator
│   ├── _layout.tsx
│   │
│   ├── (home)/                      # Home tab (stack)
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── section-details.tsx
│   │
│   ├── statistics/                  # Statistics tab
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   │
│   └── (more)/                      # More tab (stack)
│       ├── _layout.tsx
│       ├── more.tsx                 # Menu
│       ├── settings.tsx
│       ├── exercises.tsx
│       ├── exercise-information.tsx
│       ├── tutorials.tsx
│       ├── equipment.tsx
│       ├── equipment-details.tsx
│       ├── join-team.tsx
│       ├── imprint.tsx
│       ├── privacy.tsx
│       ├── notifications.tsx
│       └── webview.tsx
│
├── webview/                         # Full-screen modal
│   ├── _layout.tsx
│   └── index.tsx
│
└── test/                            # Development/testing
    ├── _layout.tsx
    ├── index.tsx
    └── test-training.tsx
```

## 🔀 Route Groups

| Group              | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `(tabs)`           | Main tab navigator; guarded in `_layout.tsx` by signed-in auth + accepted consent |
| `(tabs)/(home)`    | Home tab stack (training entry point and section details)               |
| `(tabs)/(more)`    | "More" tab stack (menu, settings, exercises, tutorials, equipment, join team, legal) |
| `(anamnesis)`      | First-run profile setup welcome                                         |
| `(anamnesis,more)` | Anamnesis question screens reachable from both initial setup and "More" |
