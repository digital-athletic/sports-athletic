## ADDED Requirements

### Requirement: Email/Password Sign Up
The system SHALL allow users to register with email and password using Supabase Auth.

#### Scenario: Successful registration
- **WHEN** user provides a valid email and password (min 6 characters)
- **AND** user accepts privacy policy
- **THEN** the system creates a new Supabase Auth user
- **AND** stores the session in authStore
- **AND** navigates to the anamnesis flow

#### Scenario: Email already registered
- **WHEN** user attempts to register with an email that exists
- **THEN** the system returns error code `auth/email-already-in-use`
- **AND** displays appropriate error message

#### Scenario: Weak password
- **WHEN** user provides a password shorter than 6 characters
- **THEN** the system returns error code `auth/weak-password`
- **AND** displays appropriate error message

#### Scenario: Invalid email format
- **WHEN** user provides an invalid email format
- **THEN** the system returns error code `auth/invalid-email`
- **AND** displays appropriate error message

### Requirement: Email/Password Sign In
The system SHALL allow users to sign in with email and password using Supabase Auth.

#### Scenario: Successful sign in
- **WHEN** user provides valid email and correct password
- **THEN** the system authenticates via `supabase.auth.signInWithPassword`
- **AND** stores the session in authStore
- **AND** navigates to the main app

#### Scenario: Wrong password
- **WHEN** user provides incorrect password
- **THEN** the system returns error code `auth/wrong-password`
- **AND** displays appropriate error message

#### Scenario: User not found
- **WHEN** user provides email that is not registered
- **THEN** the system returns error code `auth/user-not-found`
- **AND** displays appropriate error message

### Requirement: Password Reset
The system SHALL allow users to reset their password via email using Supabase Auth.

#### Scenario: Successful password reset request
- **WHEN** user requests password reset for a registered email
- **THEN** the system calls `supabase.auth.resetPasswordForEmail`
- **AND** displays confirmation that email was sent

#### Scenario: Reset for non-existent email
- **WHEN** user requests password reset for unregistered email
- **THEN** the system returns error code `auth/user-not-found`
- **AND** displays appropriate error message

### Requirement: Sign Out
The system SHALL allow authenticated users to sign out using Supabase Auth.

#### Scenario: Successful sign out
- **WHEN** authenticated user initiates sign out
- **THEN** the system calls `supabase.auth.signOut`
- **AND** clears the authStore session
- **AND** navigates to onboarding screen

### Requirement: Session Persistence
The system SHALL persist authentication sessions across app restarts using AsyncStorage.

#### Scenario: Session restored on app launch
- **WHEN** app launches with valid stored session
- **THEN** the system restores the session from AsyncStorage
- **AND** user remains authenticated

#### Scenario: Session expired
- **WHEN** app launches with expired session
- **THEN** the system attempts token refresh
- **AND** if refresh fails, clears auth and redirects to onboarding

### Requirement: Auth State Listener
The system SHALL subscribe to Supabase auth state changes to handle session events.

#### Scenario: Token refresh
- **WHEN** Supabase automatically refreshes the access token
- **THEN** the system updates authStore with new token
- **AND** session continues without interruption

#### Scenario: Session expired during use
- **WHEN** session expires while user is in app
- **AND** refresh token is invalid
- **THEN** the system clears auth state
- **AND** redirects user to onboarding

### Requirement: Error Code Mapping
The system SHALL map Supabase auth errors to standardized error codes for UI compatibility.

#### Scenario: Map Supabase error to app error code
- **WHEN** Supabase returns an auth error
- **THEN** the system maps it to a code matching `auth/*` format
- **AND** existing UI error handling continues to work

| Supabase Error | Mapped Code |
|----------------|-------------|
| `invalid_credentials` | `auth/wrong-password` |
| `user_not_found` | `auth/user-not-found` |
| `email_exists` | `auth/email-already-in-use` |
| `weak_password` | `auth/weak-password` |
| `invalid_email` | `auth/invalid-email` |
| Network errors | `auth/network-request-failed` |
