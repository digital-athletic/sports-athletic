import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { FormInput } from "./FormInput";

interface CreateTeamFormProps {
  onSubmit: (name: string, description?: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateTeamForm({ onSubmit, onCancel }: CreateTeamFormProps) {
  const { t } = useTranslation();
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsSubmitting(true);
    try {
      // The caller translates the error code and renders the message above the
      // form, so repeating it here only duplicated it - with the raw code.
      await onSubmit(teamName.trim(), teamDescription.trim() || undefined);
    } catch {
      // handled by the caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t("teamManagement.createTeam.title")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          data-testid="create-team-name"
          label={t("teamManagement.createTeam.nameLabel")}
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={t("teamManagement.createTeam.namePlaceholder")}
          required
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("teamManagement.createTeam.descriptionLabel")}
          </label>
          <textarea
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            placeholder={t("teamManagement.createTeam.descriptionPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base placeholder:text-gray-400 focus:border-red-600 focus:outline-none"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <Button
            data-testid="create-team-submit"
            type="submit"
            disabled={!teamName.trim()}
            isLoading={isSubmitting}
            loadingText={t("common.loading")}
            className="flex-1 py-3"
          >
            {t("teamManagement.createTeam.submit")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="py-3"
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
