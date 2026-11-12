import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTeamWorkoutTemplates } from "../../hooks/useTeamWorkoutTemplates";
import type {
  AiwlTemplate,
  TeamWorkout,
  TeamWorkoutStatus,
} from "../../types/team";
import {
  AMOUNT_UNITS,
  createEmptyDraft,
  readTemplateName,
  sectionKind,
  templateToDraft,
  type SectionDraft,
  type WorkoutDraft,
} from "../../utils/workoutBuilder";
import { Button } from "../Button";
import { ConfirmModal } from "../ConfirmModal";
import { ErrorMessage } from "../ErrorMessage";
import { LoadingSpinner } from "../LoadingSpinner";
import { WorkoutBuilder } from "./WorkoutBuilder";

interface WorkoutsTabProps {
  teamId: string | null;
  /** Only the owner writes and changes the status. */
  isOwner: boolean;
}

type Editing = { workoutId: string | null; draft: WorkoutDraft };

/** Section keys that stay the same across renders, e.g. "<id>-0", "<id>-1". */
const keysFor = (workoutId: string): (() => string) => {
  let next = 0;
  return () => `${workoutId}-${next++}`;
};

export function WorkoutsTab({ teamId, isOwner }: WorkoutsTabProps) {
  const { t } = useTranslation();
  const {
    workouts,
    loading,
    error,
    saveWorkout,
    deleteWorkout,
    setWorkoutStatus,
  } = useTeamWorkoutTemplates(teamId);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [toDelete, setToDelete] = useState<TeamWorkout | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);
  // The team id ties the notice to its team, so a team switch hides it.
  const [published, setPublished] = useState<{
    teamId: string | null;
    name: string;
  } | null>(null);

  /** Hides the error and the publish notice of the previous action. */
  const clearNotices = () => {
    setActionError(null);
    setPublished(null);
  };

  const sectionLabel = (section: SectionDraft): string => {
    const skill = t(`workouts.skills.${section.skill}`);
    const tags = section.tags.map((tag) => t(`workouts.tags.${tag}`));
    const skillWithTags =
      tags.length > 0 ? `${skill} (${tags.join(", ")})` : skill;
    const amount = t(`workouts.list.${AMOUNT_UNITS[sectionKind(section)]}`, {
      count: section.amount,
    });
    return `${skillWithTags} · ${amount}`;
  };

  const handleSave = async (
    template: AiwlTemplate,
    workoutId: string | null,
  ) => {
    await saveWorkout(template, workoutId);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    clearNotices();
    try {
      await deleteWorkout(toDelete.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const bookendLabel = (part: "warmUp" | "coolDown", count: number): string =>
    `${t(`workouts.builder.${part}`)} · ${t("workouts.list.exercises", { count })}`;

  const handleStatusChange = async (
    workout: TeamWorkout,
    status: TeamWorkoutStatus,
  ) => {
    setStatusChanging(workout.id);
    clearNotices();
    try {
      await setWorkoutStatus(workout.id, status);
      if (status === "published") {
        setPublished({ teamId, name: readTemplateName(workout.template) });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setStatusChanging(null);
    }
  };

  if (editing) {
    return (
      <WorkoutBuilder
        initialDraft={editing.draft}
        workoutId={editing.workoutId}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("workouts.title")}
          </h3>
          <p className="text-sm text-gray-500">{t("workouts.description")}</p>
        </div>
        {isOwner && (
          <Button
            data-testid="workout-new"
            onClick={() => {
              clearNotices();
              setEditing({ workoutId: null, draft: createEmptyDraft() });
            }}
          >
            + {t("workouts.new")}
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
      {actionError && <ErrorMessage message={actionError} />}
      {published?.teamId === teamId && (
        <p
          role="status"
          data-testid="workout-published-notice"
          className="rounded bg-green-50 p-3 text-sm text-green-800"
        >
          {t("workouts.publishedNotice", { name: published.name })}
        </p>
      )}

      {workouts.length === 0 ? (
        <p
          data-testid="workouts-empty"
          className="py-8 text-center text-sm text-gray-500"
        >
          {isOwner ? t("workouts.emptyOwner") : t("workouts.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {workouts.map((workout) => {
            const draft = templateToDraft(
              workout.template,
              keysFor(workout.id),
            );
            const isDraft = workout.status === "draft";
            return (
              <li
                key={workout.id}
                data-testid="workout-item"
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold break-words text-gray-900">
                      {readTemplateName(workout.template)}
                    </h4>
                    {isDraft && (
                      <span
                        data-testid="workout-draft-badge"
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                      >
                        {t("workouts.status.draft")}
                      </span>
                    )}
                  </div>
                  {draft && (
                    <ol className="mt-1 text-sm text-gray-600">
                      {draft.warmUp.enabled && (
                        <li data-testid="workout-warm-up-line">
                          {bookendLabel("warmUp", draft.warmUp.amount)}
                        </li>
                      )}
                      {draft.sections.map((section) => (
                        <li
                          key={section.key}
                          data-testid="workout-section"
                          data-tags={section.tags.join(" ")}
                        >
                          {sectionLabel(section)}
                        </li>
                      ))}
                      {draft.coolDown.enabled && (
                        <li data-testid="workout-cool-down-line">
                          {bookendLabel("coolDown", draft.coolDown.amount)}
                        </li>
                      )}
                    </ol>
                  )}
                </div>
                {isOwner && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      data-testid={
                        isDraft ? "workout-publish" : "workout-unpublish"
                      }
                      isLoading={statusChanging === workout.id}
                      onClick={() =>
                        handleStatusChange(
                          workout,
                          isDraft ? "published" : "draft",
                        )
                      }
                    >
                      {isDraft
                        ? t("workouts.publish")
                        : t("workouts.moveToDraft")}
                    </Button>
                    {draft && (
                      <Button
                        variant="secondary"
                        data-testid="workout-edit"
                        onClick={() => {
                          clearNotices();
                          setEditing({ workoutId: workout.id, draft });
                        }}
                      >
                        {t("workouts.edit")}
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      data-testid="workout-delete"
                      onClick={() => setToDelete(workout)}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toDelete && (
        <ConfirmModal
          title={t("workouts.deleteConfirmTitle")}
          message={t("workouts.deleteConfirmMessage", {
            name: readTemplateName(toDelete.template),
          })}
          confirmLabel={t("common.delete")}
          confirmTestId="workout-delete-confirm"
          isLoading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
