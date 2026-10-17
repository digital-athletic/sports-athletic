import { useTranslation } from "react-i18next";
import { Button } from "./Button";

interface LeaveTeamSectionProps {
  isOwner: boolean;
  onLeaveClick: () => void;
  onDeleteClick: () => void;
}

export function LeaveTeamSection({
  isOwner,
  onLeaveClick,
  onDeleteClick,
}: LeaveTeamSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex flex-wrap gap-3">
        {isOwner ? (
          <Button
            variant="danger"
            onClick={onDeleteClick}
            data-testid="delete-team-open"
          >
            {t("teamManagement.deleteTeam.button")}
          </Button>
        ) : (
          <Button variant="danger" onClick={onLeaveClick}>
            {t("teamManagement.leaveTeam.button")}
          </Button>
        )}
      </div>
    </div>
  );
}
