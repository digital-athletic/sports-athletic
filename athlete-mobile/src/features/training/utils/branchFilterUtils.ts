/**
 * Branch filtering utilities for training generation.
 * These functions filter exercise branches based on various criteria.
 */

import { WorkoutConstants } from "@/constants/workoutConstants";
import type {
  Branch,
  FilterResult,
} from "@/features/training/models/BranchFilter";
import { getTagValues } from "../../../utils/tagUtils";
import { TemporalDataType } from "../models/TemporalData";
import { areaToRegion, getAreasFor } from "./exerciseUtils";

/**
 * Filter branches by age group (child vs adult).
 *
 * @param branches - Object with branch IDs as keys
 * @param ageGroup - Age group string (e.g., "CHILD" or "ADULT")
 * @returns FilterResult with kept and replaced branches
 */
export function filterByAge<T extends Branch>(
  branches: Record<string, T>,
  ageGroup: string,
): FilterResult<T> {
  const keep: Record<string, T> = {};
  const replace: string[] = [];
  const userAgeTag = ageGroup === "CHILD" ? "CHILD" : "ADULT";

  for (const id in branches) {
    const ageTags = getTagValues(branches[id].tags ?? [], "AGE");
    if (ageTags.length === 0 || ageTags.includes(userAgeTag)) {
      keep[id] = branches[id];
    }
  }

  return { keep, replace };
}

/**
 * Filter branches by gender.
 *
 * @param branches - Object with branch IDs as keys
 * @param gender - Gender string (e.g., "MALE" or "FEMALE")
 * @returns FilterResult with kept and replaced branches
 */
export function filterByGender<T extends Branch>(
  branches: Record<string, T>,
  gender: string,
): FilterResult<T> {
  const keep: Record<string, T> = {};
  const replace: string[] = [];

  for (const id in branches) {
    const genderTags = getTagValues(branches[id].tags ?? [], "GENDER");
    if (genderTags.length === 0 || genderTags.includes(gender)) {
      keep[id] = branches[id];
    }
  }

  return { keep, replace };
}

/**
 * Filter branches by body region.
 *
 * @param branches - Object with branch IDs as keys
 * @param regions - Array of region strings to filter by
 * @returns FilterResult with kept and replaced branches
 */
export function filterByRegion<T extends Branch>(
  branches: Record<string, T>,
  regions: string[],
): FilterResult<T> {
  const keep: Record<string, T> = {};
  const replace: string[] = [];

  for (const id in branches) {
    const regionTags = getTagValues(branches[id].tags ?? [], "REGION");
    if (
      regionTags.length === 0 ||
      regions.length === 0 ||
      regionTags.some((tag) => regions.includes(tag))
    ) {
      keep[id] = branches[id];
    }
  }

  return { keep, replace };
}

/**
 * Filter branches by prevention region.
 *
 * @param branches - Object with branch IDs as keys
 * @param prevRegions - Array of prevention region strings to filter by
 * @returns FilterResult with kept and replaced branches
 */
export function filterByPrevention<T extends Branch>(
  branches: Record<string, T>,
  prevRegions: string[] | null,
): FilterResult<T> {
  if (prevRegions && prevRegions.length > 0) {
    const keep: Record<string, T> = {};
    const replace: string[] = [];

    for (const id in branches) {
      const branchPreventionRegions = getTagValues(
        branches[id].tags ?? [],
        "PREVENTION",
      );
      if (
        branchPreventionRegions.some((element) => prevRegions.includes(element))
      ) {
        keep[id] = branches[id];
      }
    }

    return { keep, replace };
  }

  return { keep: branches, replace: [] };
}

/**
 * Filter branches by muscle soreness.
 * Excludes branches that target sore muscle areas.
 *
 * @param branches - Object with branch IDs as keys
 * @param temporalData - Array of temporal muscle soreness data
 * @param skill - Training skill being generated; warm-up, speed warm-up,
 *   cool-down, mobility and foam roller ignore soreness
 * @returns FilterResult with kept and replaced branches
 * @throws Error if there's too much soreness for the workout type
 */
export function filterBySoreness<T extends Branch>(
  branches: Record<string, T>,
  temporalData: TemporalDataType[] | null,
  skill: string,
): FilterResult<T> {
  if (
    temporalData &&
    !WorkoutConstants.IGNORE_SORENESS_SKILLS.includes(skill)
  ) {
    const tempTags = temporalData.map((element) => element.tag);
    const areas = getAreasFor(tempTags);

    if (areas.length > 1) {
      throw {
        type: "TOO_MUCH_SORENESS",
        subtype: "MULTIPLE_REGIONS",
        params: areas.map(areaToRegion),
      };
    }

    if (skill.includes("CARDIO") && areas.includes("lowerBody")) {
      return {
        keep: {},
        replace: ["LOWER_BODY"],
      };
    }

    const replace: string[] = [];
    const keep: Record<string, T> = {};

    for (const id in branches) {
      const branchRegions = getTagValues(branches[id].tags ?? [], "REGION");
      if (areas.some((area) => branchRegions.includes(areaToRegion(area)))) {
        // one replacement request per removed branch
        replace.push(...branchRegions.slice(0, 1));
      } else {
        keep[id] = branches[id];
      }
    }

    return { keep, replace };
  }

  return { keep: branches, replace: [] };
}
