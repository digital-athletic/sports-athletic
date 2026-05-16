import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../services/supabase";
import { transformWorkout } from "../utils/evaluations";
import type { TeamMember } from "../types/team";
import type {
  Athlete,
  UserCompletedWorkout,
  WorkoutData,
} from "../types/evaluations";

interface TeamWorkoutsData {
  athletes: Athlete[];
  athleteWorkouts: Record<string, { workouts: WorkoutData[] }>;
}

export function useTeamWorkouts(members: TeamMember[], ownerId: string | null) {
  const { t } = useTranslation();
  const [data, setData] = useState<TeamWorkoutsData>({
    athletes: [],
    athleteWorkouts: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = useCallback(async () => {
    if (!ownerId) {
      setData({ athletes: [], athleteWorkouts: {} });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const athleteMembers = members.filter((m) => m.user_id !== ownerId);

      if (athleteMembers.length === 0) {
        setData({ athletes: [], athleteWorkouts: {} });
        setLoading(false);
        return;
      }

      const athletes: Athlete[] = athleteMembers.map((member) => ({
        id: member.user_id,
        displayName: t("evaluations.athletes.anonymous"),
      }));

      const userIds = athleteMembers.map((m) => m.user_id);
      const { data: workouts, error: workoutsError } = await supabase
        .from("user_completed_workouts")
        .select("*")
        .in("user_id", userIds)
        .order("workout_date", { ascending: false });

      if (workoutsError) {
        throw workoutsError;
      }

      // Group workouts by user_id
      const athleteWorkouts: Record<string, { workouts: WorkoutData[] }> = {};

      for (const athlete of athletes) {
        const userWorkouts = (workouts ?? [])
          .filter((w: UserCompletedWorkout) => w.user_id === athlete.id)
          .map(transformWorkout);
        athleteWorkouts[athlete.id] = { workouts: userWorkouts };
      }

      setData({ athletes, athleteWorkouts });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  }, [members, ownerId, t]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  return {
    ...data,
    loading,
    error,
    refresh: loadWorkouts,
  };
}
