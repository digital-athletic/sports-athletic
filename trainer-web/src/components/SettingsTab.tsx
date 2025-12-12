import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../services/supabase";
import { generateExampleWorkoutData } from "../utils/generation/workouts";
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

      const exampleWorkouts = generateExampleWorkoutData(user.id);

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
