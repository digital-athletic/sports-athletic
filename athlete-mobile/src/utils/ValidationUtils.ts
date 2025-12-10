/**
 * Validation Utilities
 *
 * Email and password validation functions
 * Migrated from legacy/constants/SharedFunctions.js
 */

/**
 * Validate email address format
 * Uses the same regex pattern as legacy code
 */
export const validateEmail = (address: string): boolean => {
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(address);
};

/**
 * Validate password strength
 * Requires minimum 6 characters (same as legacy)
 */
export const validatePassword = (password: string): boolean => {
  return password.length > 5;
};
