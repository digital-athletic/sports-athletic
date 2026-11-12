import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
  AMOUNT_RANGES,
  AMOUNT_UNITS,
  BUILDER_SKILLS,
  findBuilderSkill,
  sectionKind,
  tagGroupOf,
  type BuilderTag,
  type SectionDraft,
} from "../../utils/workoutBuilder";

interface WorkoutSectionEditorProps {
  section: SectionDraft;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onSkillChange: (skillId: string) => void;
  onAmountChange: (amount: number) => void;
  onTagToggle: (tag: BuilderTag) => void;
  onMove: (offset: number) => void;
  onRemove: () => void;
}

const iconButtonClass =
  "rounded px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40";

export function WorkoutSectionEditor({
  section,
  index,
  isFirst,
  isLast,
  onSkillChange,
  onAmountChange,
  onTagToggle,
  onMove,
  onRemove,
}: WorkoutSectionEditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const kind = sectionKind(section);
  const unit = AMOUNT_UNITS[kind];
  const range = AMOUNT_RANGES[kind];
  const skill = findBuilderSkill(section.skill);
  const tags = skill?.tags ?? [];

  return (
    <li
      data-testid="workout-section"
      className="rounded-lg border border-gray-200 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900">
          {t("workouts.builder.sectionNumber", { number: index + 1 })}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="section-move-up"
            className={iconButtonClass}
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label={t("workouts.builder.moveUp", { number: index + 1 })}
          >
            <span aria-hidden="true">↑</span>
          </button>
          <button
            type="button"
            data-testid="section-move-down"
            className={iconButtonClass}
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label={t("workouts.builder.moveDown", { number: index + 1 })}
          >
            <span aria-hidden="true">↓</span>
          </button>
          <button
            type="button"
            data-testid="section-remove"
            className="rounded px-2 py-1 text-sm text-red-600 transition-colors hover:bg-red-50"
            onClick={onRemove}
          >
            {t("workouts.builder.removeSection")}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-skill`}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t("workouts.builder.skill")}
          </label>
          <select
            id={`${id}-skill`}
            data-testid="section-skill"
            value={section.skill}
            onChange={(event) => onSkillChange(event.target.value)}
            className="w-full rounded-lg border border-gray-500 bg-white px-3 py-2.5 text-base focus:border-red-600 focus:outline-none"
          >
            {BUILDER_SKILLS.map((option) => (
              <option key={option.id} value={option.id}>
                {t(`workouts.skills.${option.id}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${id}-amount`}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t(`workouts.builder.${unit}`)}
          </label>
          <input
            id={`${id}-amount`}
            data-testid="section-amount"
            data-unit={unit}
            type="number"
            inputMode="numeric"
            min={range.min}
            max={range.max}
            step={1}
            value={Number.isNaN(section.amount) ? "" : section.amount}
            onChange={(event) =>
              onAmountChange(
                event.target.value === "" ? NaN : Number(event.target.value),
              )
            }
            aria-describedby={`${id}-range`}
            className="w-full rounded-lg border border-gray-500 px-3 py-2 text-base focus:border-red-600 focus:outline-none"
          />
          <p id={`${id}-range`} className="mt-1 text-xs text-gray-500">
            {t("workouts.builder.range", range)}
          </p>
        </div>
      </div>

      {skill && tags.length > 0 && (
        <fieldset className="mt-3">
          <legend className="mb-1 text-sm font-medium text-gray-700">
            {t(`workouts.builder.tagGroups.${tagGroupOf(skill)}`)}
          </legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const checked = section.tags.includes(tag);
              return (
                <label
                  key={tag}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                    checked
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    data-testid={`section-tag-${tag}`}
                    className="accent-red-600"
                    checked={checked}
                    onChange={() => onTagToggle(tag)}
                  />
                  {t(`workouts.tags.${tag}`)}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </li>
  );
}
