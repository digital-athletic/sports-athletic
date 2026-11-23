import { useTranslation } from "react-i18next";
import type { Team } from "../types/team";
import { Button } from "./Button";

interface MemberTeamCardProps {
  team: Team;
  onLeaveClick: () => void;
}

/**
 * A team the user is a plain member of. It does not open the dashboard: a
 * member sees nobody else in the team, so leaving is the only action here.
 */
export function MemberTeamCard({ team, onLeaveClick }: MemberTeamCardProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="member-team-card"
      className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm"
    >
      <h2 className="mb-1 text-lg font-semibold text-gray-900">{team.name}</h2>
      <span className="mb-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        {t("teamManagement.members.member")}
      </span>
      {team.description && (
        <p className="mb-2 text-sm text-gray-400">{team.description}</p>
      )}
      <p className="mb-4 text-sm text-gray-500">
        {t("teamSelection.memberHint")}
      </p>
      <Button
        variant="secondary"
        onClick={onLeaveClick}
        data-testid="member-team-leave"
        className="px-4 py-2 text-sm"
      >
        {t("teamManagement.leaveTeam.button")}
      </Button>
    </div>
  );
}
