# Project Context

## Purpose
Sports Athletic is a fitness training mobile application designed for athletic training and workout management. The app provides personalized training plans, exercise tracking, skill-based progression, and workout scheduling for athletes and fitness enthusiasts.

**Core Features:**
- Training plan generation based on user profile, equipment, and goals
- Exercise tracking with XP-based progression system
- Skill tree exploration for structured training advancement
- Workout completion history and progress tracking
- Health questionnaire (anamnesis) for personalized recommendations
- Multi-language support with device language detection
- Push notifications for training reminders

## Tech Stack
- **Framework**: React Native 0.81.5 + Expo 54.0.23
- **Language**: TypeScript 5.9.2 (strict mode)
- **State Management**: Zustand 5.0.8 with AsyncStorage persistence
- **Routing**: Expo Router 6.0.14 (file-based, typed routes)
- **UI/Styling**: Shopify Restyle 2.4.5 (design system)
- **Localization**: i18next 25.6.2 + react-i18next
- **Animations**: React Native Reanimated 4.1.5
- **Testing**: Jest 29.7.0 + @testing-library/react-native
- **Package Manager**: pnpm 10.22.0
- **Platforms**: iOS, Android, Web

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled with full type coverage
- **Linting**: ESLint with `eslint-config-expo` (zero-warning policy)
- **Formatting**: Prettier with default configuration
- **Path Aliases**: `@/*` maps to `./src/*`
- **File Naming**: Platform-specific suffixes (`.ios`, `.android`, `.web`, `.native`)

### Architecture Patterns
```
src/
├── auth/              # Authentication hooks
├── common/            # Shared UI components
├── constants/         # App-wide constants
├── features/          # Feature modules (anamnesis, training, subscription, etc.)
├── form/              # Form components and validation
├── i18n/              # Localization setup
├── services/          # Business logic services
├── store/             # Zustand stores (9 focused stores)
├── theme/             # Design system (colors, typography)
├── utils/             # Utility functions
└── video/             # Video player integration

app/                   # Expo Router file-based routing
├── (tabs)/            # Tab-based navigation
├── anamnesis/         # Anamnesis screens
├── onboarding/        # Onboarding flow
├── training/          # Training screens
└── ...
```

**State Management**: 9 Zustand stores replacing legacy Redux:
- `authStore`, `userProfileStore`, `userWorkoutStore`, `userSettingsStore`
- `anamnesisStore`, `trainingScheduleStore`, `exercisesStore`
- `skillTreesStore`, `exerciseProgressStore`, `completedWorkoutsStore`, `trainingStore`

### Testing Strategy
- **Framework**: Jest with React Native Testing Library
- **Test Location**: Colocated with source (`.spec.ts`, `.spec.tsx` files)
- **Setup**: `src/utils/jestSetup.ts`
- **Coverage**: Unit and integration tests for stores, generators, components, and utilities

### Git Workflow
- **Branch Naming**: `feature/` prefix for features, `Feature/` for larger features
- **Issue References**: Include issue numbers (e.g., `#44`, `#108`)
- **Commit Style**: Conventional commits with scope (e.g., `feature(#44): description`)
- **CI Pipeline**: GitHub Actions running type-check, lint, format, and test on PRs

## Domain Context

### Training Domain
- **Skill Trees**: Hierarchical progression system for exercises
- **Branches**: Categories of exercises (prevention, pain management, equipment-based)
- **XP/Levels**: Gamified progression tracking
- **Power Tests**: Assessment types (bench press, rowing, shoulder press, squat)
- **Body Parts**: Anatomical targeting for exercises

### User Journey
1. **Onboarding**: Sport selection, equipment setup, schedule configuration
2. **Anamnesis**: Health questionnaire for personalized recommendations
3. **Plan Generation**: Algorithmic training plan based on profile
4. **Training**: Guided workout execution with progression tracking
5. **Progress**: XP accumulation, level advancement, skill tree unlocking

## Important Constraints
- **Zero-Warning Policy**: ESLint must pass with `--max-warnings 0`
- **Type Safety**: Full TypeScript strict mode compliance required
- **CI Required**: All PRs must pass type-check, lint, format, and test jobs
- **Frozen Lockfile**: pnpm lockfile must not change unexpectedly
- **Platform Parity**: Features should work across iOS, Android, and Web when applicable

## External Dependencies

### Current Backend (Migration in Progress)
- **Firebase → Supabase Migration**: Active migration on `firebase-migration` branch
  - Auth: Email/password, OAuth providers
  - Database: Realtime data sync
  - Storage: File/asset storage
  - Analytics: Usage tracking

### Services
- **Push Notifications**: `PushNotificationService.ts` for training reminders
- **Local Storage**: AsyncStorage for offline persistence
- **Localization**: Device language auto-detection

### Migration Documentation
- `supabase/plan/firebase_migration.md` - Migration guide
- `supabase/plan/firebase_usage.md` - Current Firebase endpoints
- `supabase/plan/firebase_migration_supabase.md` - Supabase mapping
- `supabase/plan/firebase_migration_analytics.md` - Analytics migration
