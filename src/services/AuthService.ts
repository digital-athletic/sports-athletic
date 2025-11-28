import type { AuthType } from "../store/authStore";

/**
 * Authentication Service
 *
 * Handles user authentication operations.
 * Currently contains dummy implementations for testing UI flow.
 * TODO: Replace with actual Firebase Authentication integration.
 */

const REGISTERED_EMAIL = "registered@example.com";
const MOCK_PASSWORD = "12345678";

/**
 * Check if an email address is already registered
 * TODO: Firebase - Use Firebase Auth to check if email exists
 * firebase.auth().fetchSignInMethodsForEmail(email)
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock: Only registered@example.com exists
  return email.toLowerCase() === REGISTERED_EMAIL;
};

/**
 * Sign in with email and password
 * TODO: Firebase - Replace with actual Firebase Auth
 * firebase.auth().signInWithEmailAndPassword(email, password)
 */
export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<AuthType> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mock: Check if user exists
  if (email.toLowerCase() !== REGISTERED_EMAIL) {
    const error: any = new Error("User not found");
    error.code = "auth/user-not-found";
    throw error;
  }

  // Mock: Check password
  if (password !== MOCK_PASSWORD) {
    const error: any = new Error("Wrong password");
    error.code = "auth/wrong-password";
    throw error;
  }

  // Mock: Return successful auth
  return {
    userId: email,
    token: `mock-token-${Date.now()}`,
  };
};

/**
 * Register a new user with email and password
 * TODO: Firebase - Replace with actual Firebase Auth
 * firebase.auth().createUserWithEmailAndPassword(email, password)
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  anonymisedDataUse: boolean,
): Promise<AuthType> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock: Check if email already exists
  if (email.toLowerCase() === REGISTERED_EMAIL) {
    const error: any = new Error("Email already in use");
    error.code = "auth/email-already-in-use";
    throw error;
  }

  // Mock: Validate password strength
  if (password.length < 6) {
    const error: any = new Error("Weak password");
    error.code = "auth/weak-password";
    throw error;
  }

  // TODO: Store anonymisedDataUse preference in user settings

  // Mock: Return successful registration
  return {
    userId: email,
    token: `mock-token-${Date.now()}`,
  };
};

/**
 * Send password reset email
 * TODO: Firebase - Replace with actual Firebase Auth
 * firebase.auth().sendPasswordResetEmail(email)
 */
export const resetPassword = async (email: string): Promise<void> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Mock: Check if user exists
  if (email.toLowerCase() !== REGISTERED_EMAIL) {
    const error: any = new Error("User not found");
    error.code = "auth/user-not-found";
    throw error;
  }

  // Mock: Email validation (basic check)
  if (!email.includes("@")) {
    const error: any = new Error("Invalid email");
    error.code = "auth/invalid-email";
    throw error;
  }

  // Mock: Success - password reset email sent
  // In real implementation, Firebase sends the email
};

/**
 * Sign out the current user
 * TODO: Firebase - Replace with actual Firebase Auth
 * firebase.auth().signOut()
 */
export const logout = async (): Promise<void> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // TODO: Firebase - Sign out user
  // TODO: Clear any local user data
};
