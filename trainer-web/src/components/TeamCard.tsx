import { useTranslation } from "react-i18next";
import type { Team } from "../types/team";

interface TeamCardProps {
  team: Team;
  memberCount: number;
  onClick: () => void;
}

export function TeamCard({ team, memberCount, onClick }: TeamCardProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:border-red-500 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">{team.name}</h2>
      <p className="mb-2 text-sm text-gray-500">
        {t("teamSelection.players", { count: memberCount })}
      </p>
      {team.description && (
        <p className="text-sm text-gray-400">{team.description}</p>
      )}
    </button>
  );
}
