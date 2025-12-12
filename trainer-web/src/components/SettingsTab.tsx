import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../services/supabase";
import { Button } from "./Button";
import { ErrorMessage } from "./ErrorMessage";

export function SettingsTab() {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const generateExampleWorkouts = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(t("settings.exampleData.notLoggedIn"));
      }

      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;

      const exampleWorkouts = [
        {
          user_id: user.id,
          workout_id: `example-workout-${now}-1`,
          workout_date: now - 2 * dayInMs,
          duration: 1800,
          exercise_count: 8,
          points: 150,
          moved_weight: 1250.5,
          exercises: JSON.stringify([
            { exerciseId: 101, repetition: 12, weight: 20, duration: 45 },
            { exerciseId: 102, repetition: 10, weight: 25, duration: 50 },
            { exerciseId: 103, repetition: 15, weight: 15, duration: 40 },
          ]),
          training_type: "PLAN",
          training_focus: "STABILITY",
        },
        {
          user_id: user.id,
          workout_id: `example-workout-${now}-2`,
          workout_date: now - dayInMs,
          duration: 2400,
          exercise_count: 10,
          points: 200,
          moved_weight: 1800.0,
          exercises: JSON.stringify([
            { exerciseId: 201, repetition: 8, weight: 30, duration: 60 },
            { exerciseId: 202, repetition: 12, weight: 20, duration: 45 },
            { exerciseId: 203, repetition: 10, weight: 25, duration: 55 },
          ]),
          training_type: "QUICK",
          training_focus: "GKS",
        },
        {
          user_id: user.id,
          workout_id: `example-workout-${now}-3`,
          workout_date: now,
          duration: 1500,
          exercise_count: 6,
          points: 120,
          moved_weight: 950.25,
          exercises: JSON.stringify([
            { exerciseId: 301, repetition: 20, weight: 10, duration: 30 },
            { exerciseId: 302, repetition: 15, weight: 12, duration: 35 },
          ]),
          training_type: "PREV",
          training_focus: "PREVSHOULDER",
        },
      ];

      const { error: insertError } = await supabase
        .from("user_completed_workouts")
        .insert(exampleWorkouts);

      if (insertError) {
        throw insertError;
      }

      setSuccessMessage(t("settings.exampleData.success"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t("settings.exampleData.title")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t("settings.exampleData.description")}
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <Button
        onClick={generateExampleWorkouts}
        isLoading={isGenerating}
        loadingText={t("settings.exampleData.generating")}
      >
        {t("settings.exampleData.button")}
      </Button>
    </div>
  );
}
