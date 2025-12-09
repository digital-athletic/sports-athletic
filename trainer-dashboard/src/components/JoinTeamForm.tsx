import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { ErrorMessage } from "./ErrorMessage";
import { FormInput } from "./FormInput";

interface JoinTeamFormProps {
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
}

export function JoinTeamForm({ onSubmit, onCancel }: JoinTeamFormProps) {
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(inviteCode.trim().toUpperCase());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("teamManagement.joinTeam.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t("teamManagement.joinTeam.title")}
      </h2>
      {formError && <ErrorMessage message={formError} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label={t("teamManagement.joinTeam.codeLabel")}
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder={t("teamManagement.joinTeam.codePlaceholder")}
          className="font-mono uppercase tracking-wider"
          maxLength={6}
          required
        />
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={inviteCode.length !== 6}
            isLoading={isSubmitting}
            loadingText={t("common.loading")}
            className="flex-1 py-3"
          >
            {t("teamManagement.joinTeam.submit")}
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
