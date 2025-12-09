import { useTranslation } from "react-i18next";
import { type Team } from "../types/team";
import { Button } from "./Button";

interface DashboardSidebarProps {
  team: Team | null;
  inviteCodes: string[];
  isOwner: boolean;
}

export function DashboardSidebar({
  team,
  inviteCodes,
  isOwner,
}: DashboardSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-80 flex-col gap-6">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {t("dashboard.info.title")}
          </span>
          <span className="text-xs text-gray-500">
            {t("dashboard.info.availableCodes")}
          </span>
        </div>
        <div className="mb-3 min-h-[80px] rounded border border-gray-200 bg-gray-50 p-3">
          {team && (
            <div className="text-sm">
              <p className="font-medium text-gray-900">{team.name}</p>
              {inviteCodes.length > 0 && isOwner && (
                <div className="mt-1 space-y-1">
                  {inviteCodes.map((code) => (
                    <p key={code} className="font-mono text-gray-600">
                      Code: {code}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Button variant="secondary" disabled className="w-full py-2.5">
          {t("dashboard.players.removePlayer")}
        </Button>
      </div>
    </div>
  );
}
