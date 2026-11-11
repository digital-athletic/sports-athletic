import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  deleteTeamWorkout,
  getTeamWorkouts,
  saveTeamWorkout,
  setTeamWorkoutStatus,
} from "../services/teamWorkoutsApi";
import { ApiError } from "../services/teamsApi";
import type {
  AiwlTemplate,
  TeamWorkout,
  TeamWorkoutStatus,
} from "../types/team";

/**
 * The workout templates of a team, for the Workouts tab. Not to be confused
 * with useTeamWorkouts, which reads the workouts athletes completed.
 */
export function useTeamWorkoutTemplates(teamId: string | null) {
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<TeamWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translateError = useCallback(
    (err: unknown): string => {
      if (err instanceof ApiError) {
        const key = `errors.${err.code}`;
        const translated = t(key);
        if (translated !== key) return translated;
      }
      return t("common.error");
    },
    [t],
  );

  const load = useCallback(async () => {
    if (!teamId) {
      setWorkouts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setWorkouts(await getTeamWorkouts(teamId));
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, [teamId, translateError]);

  useEffect(() => {
    load();
  }, [load]);

  /** Throws an Error whose message is already translated. */
  const saveWorkout = async (
    template: AiwlTemplate,
    workoutId: string | null,
  ): Promise<void> => {
    if (!teamId) throw new Error(t("common.error"));
    try {
      const saved = await saveTeamWorkout(teamId, template, workoutId);
      setWorkouts((prev) =>
        workoutId === null
          ? [...prev, saved]
          : prev.map((workout) => (workout.id === saved.id ? saved : workout)),
      );
    } catch (err) {
      throw new Error(translateError(err));
    }
  };

  /** Throws an Error whose message is already translated. */
  const deleteWorkout = async (workoutId: string): Promise<void> => {
    if (!teamId) throw new Error(t("common.error"));
    try {
      await deleteTeamWorkout(teamId, workoutId);
      setWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId));
    } catch (err) {
      throw new Error(translateError(err));
    }
  };

  /** Throws an Error whose message is already translated. */
  const setWorkoutStatus = async (
    workoutId: string,
    status: TeamWorkoutStatus,
  ): Promise<void> => {
    if (!teamId) throw new Error(t("common.error"));
    try {
      const saved = await setTeamWorkoutStatus(teamId, workoutId, status);
      setWorkouts((prev) =>
        prev.map((workout) => (workout.id === saved.id ? saved : workout)),
      );
    } catch (err) {
      throw new Error(translateError(err));
    }
  };

  return {
    workouts,
    loading,
    error,
    saveWorkout,
    deleteWorkout,
    setWorkoutStatus,
  };
}
