/**
 * User Progress Utilities
 *
 * Handles XP and level calculations for user progression system.
 * Legacy: helpers/UserProgressHelper.js
 */

// Constants from legacy UserProgressConstants
const LEVEL_STEP_1 = 150; // XP needed for level 1 -> 2
const LEVEL_STEP_2 = 200; // XP needed for level 2 -> 3
const LEVEL_STEP = 5; // Increase in XP needed for next level
const BIG_LEVEL_STEP = 150; // Increase in XP for "big levels"
const BIG_LEVEL_FREQUENCE = 15; // Frequency of big level steps

interface LevelData {
  level: number;
  xpInLevel: number;
  xpNeeded: number;
}

/**
 * Internal calculation function for level data
 */
function calcLevelData(xp: number): LevelData {
  let xpNeeded = 0;
  let nextXpStep = 0;
  let lastLevelXpNeeded = 0;
  let level = 0;

  do {
    lastLevelXpNeeded = xpNeeded;
    level++;

    // Special rules for levels 1 and 2
    if (level === 1) {
      nextXpStep += LEVEL_STEP_1;
    } else if (level === 2) {
      nextXpStep += LEVEL_STEP_2;
    }
    // Big level steps at intervals
    else if (level % BIG_LEVEL_FREQUENCE === 0) {
      nextXpStep += BIG_LEVEL_STEP;
    }
    // Default XP increase
    else {
      nextXpStep += LEVEL_STEP;
    }

    xpNeeded += nextXpStep;
  } while (xpNeeded < xp);

  return {
    level,
    xpInLevel: xp - lastLevelXpNeeded,
    xpNeeded: xpNeeded - lastLevelXpNeeded,
  };
}

/**
 * Calculate user level from total XP
 */
export function calculateUserLevel(xp: number): number {
  return calcLevelData(xp).level;
}

/**
 * Get XP progress within current level
 */
export function getXpInLevel(xp: number): number {
  return calcLevelData(xp).xpInLevel;
}

/**
 * Get total XP needed to reach next level
 */
export function getXpForNextLevel(xp: number): number {
  return calcLevelData(xp).xpNeeded;
}
