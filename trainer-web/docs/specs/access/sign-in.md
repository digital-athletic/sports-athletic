# Sign-In

## Why & What

Trainers sign in to the dashboard with the same **account** they use in the athlete app. The dashboard sends a **sign-in code** by email and never creates accounts. This spec defines the two-step sign-in, its error messages, and which pages a session unlocks.

## Problem

The dashboard has no password and no signup of its own. Without a written rule, readers cannot tell which accounts may enter, why an unknown email still reaches the code step, or which page opens after sign-in.

## Solution

Sign-in runs in two steps: email, then a six-digit code. Any existing account may sign in; trainer access and admin status decide what the user can do afterwards, not whether they enter. The email step answers the same way for known and unknown addresses, so nobody can probe which emails have accounts.

Rejected: password login, because the athlete app already uses email codes and one method keeps both apps aligned.

## Out of Scope

- Creating and deleting accounts: the athlete app owns both
- What trainer access and admin status unlock: [Trainer Access and Admin](./trainer-access-and-admin.md)

## Rules

### Email step

1. The user enters an email address and requests a code. The dashboard asks for a code without creating an account.
2. The dashboard treats "unknown user" and "code login disabled" responses as success and shows the code step.
3. A rate-limit response shows "Too many requests". Every other failure shows a generic error.

### Code step

1. The input accepts digits only, up to six. Verify stays disabled below six digits.
2. A wrong or expired code shows "Invalid or expired code" and clears the input.
3. A valid code starts a session and opens the team selection.
4. Resend waits 60 seconds after every successful send and counts the seconds down on the button.
5. Back returns to the email step and clears code, error and countdown.

### Page access

| Page | Requires |
|---|---|
| Login | nothing; an existing session redirects to team selection |
| Team selection, team dashboard | a session |
| Admin | a session and admin status; others go to team selection |
| Third-party licences | nothing |

Pages without a session redirect to login. Logout ends the session and opens login.

## Structure

The dashboard and the athlete app share one account store. The session persists in the browser and refreshes on its own; protected pages show a loading state until the session resolves.

## Open Questions

None.
