import { useTranslation } from "react-i18next";
import type { Team } from "../types/team";

interface TeamInfoCardProps {
  team: Team;
  memberCount: number;
}

export function TeamInfoCard({ team, memberCount }: TeamInfoCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-2 font-semibold text-gray-900">{team.name}</h3>
      {team.description && (
        <p className="text-sm text-gray-600">{team.description}</p>
      )}
      <p className="mt-2 text-sm text-gray-500">
        {t("dashboard.info.memberCount", { count: memberCount })}
      </p>
    </div>
  );
}
