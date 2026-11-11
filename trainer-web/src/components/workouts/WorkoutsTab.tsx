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
  readTemplateName,
  sectionKind,
  templateToDraft,
  type SectionDraft,
  type WorkoutDraft,
} from "../../utils/workoutBuilder";
import { downloadWorkoutFile } from "../../utils/workoutFile";
import { Button } from "../Button";
import { ConfirmModal } from "../ConfirmModal";
import { ErrorMessage } from "../ErrorMessage";
import { LoadingSpinner } from "../LoadingSpinner";
import { WorkoutBuilder } from "./WorkoutBuilder";

interface WorkoutsTabProps {
  teamId: string | null;
  /** Only the owner writes and changes the status. */
  isOwner: boolean;
  /** True for the owner and co-owners; members only see the list. */
  canDownload: boolean;
}

type Editing = { workoutId: string | null; draft: WorkoutDraft };

const EMPTY_DRAFT: WorkoutDraft = { name: "", sections: [] };

/** Section keys that stay the same across renders, e.g. "<id>-0", "<id>-1". */
const keysFor = (workoutId: string): (() => string) => {
  let next = 0;
  return () => `${workoutId}-${next++}`;
};

export function WorkoutsTab({
  teamId,
  isOwner,
  canDownload,
}: WorkoutsTabProps) {
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
    setActionError(null);
    try {
      await deleteWorkout(toDelete.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const handleStatusChange = async (
    workoutId: string,
    status: TeamWorkoutStatus,
  ) => {
    setStatusChanging(workoutId);
    setActionError(null);
    try {
      await setWorkoutStatus(workoutId, status);
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
              setActionError(null);
              setEditing({ workoutId: null, draft: EMPTY_DRAFT });
            }}
          >
            + {t("workouts.new")}
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
      {actionError && <ErrorMessage message={actionError} />}

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
                      {draft.sections.map((section) => (
                        <li
                          key={section.key}
                          data-testid="workout-section"
                          data-tags={section.tags.join(" ")}
                        >
                          {sectionLabel(section)}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                {canDownload && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      data-testid="workout-download"
                      onClick={() => downloadWorkoutFile(workout.template)}
                    >
                      {t("workouts.download")}
                    </Button>
                    {isOwner && (
                      <Button
                        variant="secondary"
                        data-testid={
                          isDraft ? "workout-publish" : "workout-unpublish"
                        }
                        isLoading={statusChanging === workout.id}
                        onClick={() =>
                          handleStatusChange(
                            workout.id,
                            isDraft ? "published" : "draft",
                          )
                        }
                      >
                        {isDraft
                          ? t("workouts.publish")
                          : t("workouts.moveToDraft")}
                      </Button>
                    )}
                    {isOwner && draft && (
                      <Button
                        variant="secondary"
                        data-testid="workout-edit"
                        onClick={() => {
                          setActionError(null);
                          setEditing({ workoutId: workout.id, draft });
                        }}
                      >
                        {t("workouts.edit")}
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        variant="danger"
                        data-testid="workout-delete"
                        onClick={() => setToDelete(workout)}
                      >
                        {t("common.delete")}
                      </Button>
                    )}
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
