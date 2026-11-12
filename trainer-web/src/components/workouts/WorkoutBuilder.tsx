import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiwlTemplate } from "../../types/team";
import {
  AMOUNT_RANGES,
  AMOUNT_UNITS,
  changeSectionSkill,
  countBlocks,
  createSection,
  draftToTemplate,
  MAX_NAME_LENGTH,
  MAX_SECTIONS,
  moveSection,
  sectionKind,
  toggleSectionTag,
  validateDraft,
  type BookendDraft,
  type DraftError,
  type SectionDraft,
  type WorkoutDraft,
} from "../../utils/workoutBuilder";
import { Button } from "../Button";
import { ErrorMessage } from "../ErrorMessage";
import { FormInput } from "../FormInput";
import { WorkoutSectionEditor } from "./WorkoutSectionEditor";

interface WorkoutBuilderProps {
  /** The draft to start from; a new workout starts empty. */
  initialDraft: WorkoutDraft;
  /** The id of the workout being edited, or null for a new one. */
  workoutId: string | null;
  /** Saves the template; rejects with a translated message. */
  onSave: (template: AiwlTemplate, workoutId: string | null) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_SKILL = "MOB";

const BOOKENDS = [
  { part: "warmUp", testId: "workout-warm-up" },
  { part: "coolDown", testId: "workout-cool-down" },
] as const;

interface BookendFieldProps {
  testId: string;
  label: string;
  amountLabel: string;
  bookend: BookendDraft;
  onChange: (bookend: BookendDraft) => void;
}

/** The checkbox of the warm-up or the cool-down, with its exercise count. */
function BookendField({
  testId,
  label,
  amountLabel,
  bookend,
  onChange,
}: BookendFieldProps) {
  const range = AMOUNT_RANGES.picks;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
      <label className="flex min-w-40 flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-gray-900">
        <input
          type="checkbox"
          data-testid={testId}
          className="h-4 w-4 accent-red-600"
          checked={bookend.enabled}
          onChange={(event) =>
            onChange({ ...bookend, enabled: event.target.checked })
          }
        />
        {label}
      </label>
      {bookend.enabled && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          {amountLabel}
          <input
            type="number"
            inputMode="numeric"
            data-testid={`${testId}-amount`}
            min={range.min}
            max={range.max}
            step={1}
            value={Number.isNaN(bookend.amount) ? "" : bookend.amount}
            onChange={(event) =>
              onChange({
                ...bookend,
                amount:
                  event.target.value === "" ? NaN : Number(event.target.value),
              })
            }
            className="w-20 rounded-lg border border-gray-500 px-3 py-1.5 text-base focus:border-red-600 focus:outline-none"
          />
        </label>
      )}
    </div>
  );
}

export function WorkoutBuilder({
  initialDraft,
  workoutId,
  onSave,
  onCancel,
}: WorkoutBuilderProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<WorkoutDraft>(initialDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const errors = validateDraft(draft);

  const setSections = (update: (sections: SectionDraft[]) => SectionDraft[]) =>
    setDraft((prev) => ({ ...prev, sections: update(prev.sections) }));

  const updateSection = (
    key: string,
    update: (section: SectionDraft) => SectionDraft,
  ) =>
    setSections((sections) =>
      sections.map((section) =>
        section.key === key ? update(section) : section,
      ),
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(
        draftToTemplate(draft, workoutId ?? crypto.randomUUID()),
        workoutId,
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("common.error"));
      setSaving(false);
    }
  };

  const describeError = (
    error: DraftError,
  ): { testId: string; message: string } => {
    const key = `workouts.errors.${error.code}`;
    if (!("sectionKey" in error)) {
      return {
        testId: `workout-error-${error.code}`,
        message: t(key, {
          ...AMOUNT_RANGES.picks,
          ...(error.code === "NAME_TOO_LONG" && { max: MAX_NAME_LENGTH }),
          ...(error.code === "TOO_MANY_SECTIONS" && { max: MAX_SECTIONS }),
        }),
      };
    }
    const index = draft.sections.findIndex((s) => s.key === error.sectionKey);
    const section = draft.sections[index];
    const kind = section ? sectionKind(section) : "picks";
    return {
      testId: `workout-error-${error.code}-${index}`,
      message: t(key, {
        number: index + 1,
        ...AMOUNT_RANGES[kind],
        unit: t(`workouts.builder.${AMOUNT_UNITS[kind]}`),
      }),
    };
  };

  return (
    <form
      data-testid="workout-builder"
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {workoutId
          ? t("workouts.builder.titleEdit")
          : t("workouts.builder.titleNew")}
      </h3>

      <FormInput
        name="workout-name"
        data-testid="workout-name"
        label={t("workouts.builder.name")}
        placeholder={t("workouts.builder.namePlaceholder")}
        value={draft.name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(event) =>
          setDraft((prev) => ({ ...prev, name: event.target.value }))
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {BOOKENDS.map(({ part, testId }) => (
          <BookendField
            key={part}
            testId={testId}
            label={t(`workouts.builder.${part}`)}
            amountLabel={t("workouts.builder.exercises")}
            bookend={draft[part]}
            onChange={(bookend) =>
              setDraft((prev) => ({ ...prev, [part]: bookend }))
            }
          />
        ))}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">
          {t("workouts.builder.sections")}
        </h4>
        {draft.sections.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t("workouts.builder.noSections")}
          </p>
        ) : (
          <ol className="space-y-3">
            {draft.sections.map((section, index) => (
              <WorkoutSectionEditor
                key={section.key}
                section={section}
                index={index}
                isFirst={index === 0}
                isLast={index === draft.sections.length - 1}
                onSkillChange={(skill) =>
                  updateSection(section.key, (s) =>
                    changeSectionSkill(s, skill),
                  )
                }
                onAmountChange={(amount) =>
                  updateSection(section.key, (s) => ({ ...s, amount }))
                }
                onTagToggle={(tag) =>
                  updateSection(section.key, (s) => toggleSectionTag(s, tag))
                }
                onMove={(offset) =>
                  setSections((sections) =>
                    moveSection(sections, index, offset),
                  )
                }
                onRemove={() =>
                  setSections((sections) =>
                    sections.filter((s) => s.key !== section.key),
                  )
                }
              />
            ))}
          </ol>
        )}
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          data-testid="workout-add-section"
          disabled={countBlocks(draft) >= MAX_SECTIONS}
          onClick={() =>
            setSections((sections) => [
              ...sections,
              createSection(crypto.randomUUID(), DEFAULT_SKILL),
            ])
          }
        >
          + {t("workouts.builder.addSection")}
        </Button>
      </div>

      <div aria-live="polite">
        {showErrors && errors.length > 0 && (
          <ul className="space-y-1 rounded bg-red-50 p-3 text-sm text-red-600">
            {errors.map(describeError).map(({ testId, message }) => (
              <li key={testId} data-testid={testId}>
                {message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {saveError && <ErrorMessage message={saveError} />}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          data-testid="workout-cancel"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          data-testid="workout-save"
          isLoading={saving}
          loadingText={t("common.loading")}
        >
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
