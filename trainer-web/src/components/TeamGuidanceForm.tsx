import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../services/teamsApi";
import type { UpdateTeamGuidanceResponse } from "../types/team";
import { Button } from "./Button";
import { ErrorMessage } from "./ErrorMessage";
import { FormInput } from "./FormInput";

/** Same limits as update_team_guidance, checked here to spare a round trip. */
export const GUIDANCE_MAX_LENGTH = 1000;
const WEEKLY_TARGET_MIN = 1;
const WEEKLY_TARGET_MAX = 7;

interface TeamGuidanceFormProps {
  guidance: string | null;
  weeklyTrainingDays: number | null;
  onSave: (
    guidance: string | null,
    weeklyTrainingDays: number | null,
  ) => Promise<UpdateTeamGuidanceResponse>;
}

type ParsedInput =
  | { ok: true; guidance: string | null; weeklyTrainingDays: number | null }
  | { ok: false; code: "GUIDANCE_TOO_LONG" | "WEEKLY_TARGET_OUT_OF_RANGE" };

/** Counts code points like Postgres char_length, so an emoji is one character. */
function characterCount(text: string): number {
  return Array.from(text).length;
}

/** Empty fields become null, which clears the stored value. */
function parseInput(guidance: string, weeklyTarget: string): ParsedInput {
  const trimmed = guidance.trim();
  if (characterCount(trimmed) > GUIDANCE_MAX_LENGTH) {
    return { ok: false, code: "GUIDANCE_TOO_LONG" };
  }

  const target = weeklyTarget.trim();
  const days = target === "" ? null : Number(target);
  if (
    days !== null &&
    (!Number.isInteger(days) ||
      days < WEEKLY_TARGET_MIN ||
      days > WEEKLY_TARGET_MAX)
  ) {
    return { ok: false, code: "WEEKLY_TARGET_OUT_OF_RANGE" };
  }

  return { ok: true, guidance: trimmed || null, weeklyTrainingDays: days };
}

export function TeamGuidanceForm({
  guidance: savedGuidance,
  weeklyTrainingDays: savedDays,
  onSave,
}: TeamGuidanceFormProps) {
  const { t } = useTranslation();
  const [guidance, setGuidance] = useState(savedGuidance ?? "");
  const [weeklyTarget, setWeeklyTarget] = useState(
    savedDays === null ? "" : String(savedDays),
  );
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const errorText = (code: string) => {
    const key = `errors.${code}`;
    const translated = t(key);
    return translated === key ? t("teamManagement.guidance.error") : translated;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);

    const parsed = parseInput(guidance, weeklyTarget);
    if (!parsed.ok) {
      setErrorCode(parsed.code);
      return;
    }

    setErrorCode(null);
    setIsSaving(true);
    try {
      const stored = await onSave(parsed.guidance, parsed.weeklyTrainingDays);
      setGuidance(stored.guidance ?? "");
      setWeeklyTarget(
        stored.weekly_training_days === null
          ? ""
          : String(stored.weekly_training_days),
      );
      setSaved(true);
    } catch (err) {
      setErrorCode(err instanceof ApiError ? err.code : "INTERNAL_ERROR");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-2 font-semibold text-gray-900">
        {t("teamManagement.guidance.title")}
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        {t("teamManagement.guidance.description")}
      </p>
      <form
        data-testid="team-guidance-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="team-guidance-text"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t("teamManagement.guidance.guidanceLabel")}
          </label>
          <textarea
            id="team-guidance-text"
            data-testid="team-guidance-text"
            value={guidance}
            onChange={(e) => {
              setGuidance(e.target.value);
              setSaved(false);
            }}
            placeholder={t("teamManagement.guidance.guidancePlaceholder")}
            aria-describedby="team-guidance-count"
            className="w-full rounded-lg border border-gray-500 px-4 py-3 text-base placeholder:text-gray-600 focus:border-red-600 focus:outline-none"
            rows={4}
          />
          <p id="team-guidance-count" className="mt-1 text-xs text-gray-600">
            {t("teamManagement.guidance.characterCount", {
              count: characterCount(guidance.trim()),
              max: GUIDANCE_MAX_LENGTH,
            })}
          </p>
        </div>
        <div className="max-w-xs">
          <FormInput
            id="team-guidance-weekly-target"
            data-testid="team-guidance-weekly-target"
            label={t("teamManagement.guidance.weeklyTargetLabel")}
            type="number"
            inputMode="numeric"
            min={WEEKLY_TARGET_MIN}
            max={WEEKLY_TARGET_MAX}
            step={1}
            value={weeklyTarget}
            onChange={(e) => {
              setWeeklyTarget(e.target.value);
              setSaved(false);
            }}
            aria-describedby="team-guidance-weekly-target-hint"
          />
          <p
            id="team-guidance-weekly-target-hint"
            className="mt-1 text-xs text-gray-600"
          >
            {t("teamManagement.guidance.weeklyTargetHint")}
          </p>
        </div>

        {errorCode && <ErrorMessage message={errorText(errorCode)} />}

        <div className="flex items-center gap-3">
          <Button
            data-testid="team-guidance-save"
            type="submit"
            isLoading={isSaving}
            loadingText={t("common.loading")}
          >
            {t("common.save")}
          </Button>
          {saved && (
            <p
              data-testid="team-guidance-saved"
              role="status"
              className="text-sm text-green-700"
            >
              {t("teamManagement.guidance.saved")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
