import { useTranslation } from "react-i18next";
import { Button } from "./Button";

interface CreateTeamCardProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
  isTrainer: boolean;
}

export function CreateTeamCard({
  onCreateClick,
  onJoinClick,
  isTrainer,
}: CreateTeamCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 transition-all hover:border-red-400 hover:shadow-md">
      {isTrainer ? (
        <button
          data-testid="team-selection-create"
          onClick={onCreateClick}
          className="group flex w-full flex-col items-center justify-center py-4"
        >
          <span className="mb-4 text-6xl text-gray-400 transition-colors group-hover:text-red-600">
            +
          </span>
          <span className="text-lg font-semibold text-gray-700">
            {t("teamSelection.createTeam")}
          </span>
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="mb-1 text-sm font-semibold text-gray-600">
            {t("teamSelection.notTrainerTitle")}
          </p>
          <p className="text-xs text-gray-500">
            {t("teamSelection.notTrainerMessage")}
          </p>
        </div>
      )}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <p className="mb-3 text-center text-sm text-gray-500">
          {t("teamSelection.or")}
        </p>
        <Button
          data-testid="team-selection-join"
          variant="secondary"
          onClick={onJoinClick}
          className="w-full bg-gray-50"
        >
          {t("teamSelection.joinTeam")}
        </Button>
      </div>
    </div>
  );
}
