import { useTranslation } from "react-i18next";
import { Button } from "./Button";

interface LeaveTeamSectionProps {
  onLeaveClick: () => void;
}

export function LeaveTeamSection({ onLeaveClick }: LeaveTeamSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <Button variant="danger" onClick={onLeaveClick}>
        {t("teamManagement.leaveTeam.button")}
      </Button>
    </div>
  );
}
