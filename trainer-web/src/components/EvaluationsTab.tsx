import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTeamWorkouts } from "../hooks/useTeamWorkouts";
import type { TeamMember } from "../types/team";
import type { TimePeriod } from "../types/evaluations";
import {
  filterWorkoutsByPeriod,
  calculateSummaryStats,
} from "../utils/evaluations";
import { TabBar } from "./TabBar";
import { AthleteSelector, SummaryCards, WorkoutsTable } from "./evaluations";
import { LoadingSpinner } from "./LoadingSpinner";

interface EvaluationsTabProps {
  members: TeamMember[];
  ownerId: string | null;
}

export function EvaluationsTab({ members, ownerId }: EvaluationsTabProps) {
  const { t } = useTranslation();
  const { athletes, athleteWorkouts, loading, error } = useTeamWorkouts(
    members,
    ownerId,
  );

  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    null,
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("lastWeek");

  // Auto-select first athlete when data loads
  const effectiveSelectedId = selectedAthleteId ?? athletes[0]?.id ?? null;

  const timePeriodTabs = [
    { id: "lastWeek", label: t("evaluations.timePeriods.lastWeek") },
    { id: "lastMonth", label: t("evaluations.timePeriods.lastMonth") },
    { id: "lastYear", label: t("evaluations.timePeriods.lastYear") },
    { id: "total", label: t("evaluations.timePeriods.total") },
  ];

  const selectedAthlete = athletes.find((a) => a.id === effectiveSelectedId);
  const athleteData = effectiveSelectedId
    ? athleteWorkouts[effectiveSelectedId]
    : null;

  const filteredWorkouts = useMemo(() => {
    if (!athleteData) return [];
    return filterWorkoutsByPeriod(athleteData.workouts, timePeriod);
  }, [athleteData, timePeriod]);

  const summaryStats = useMemo(
    () => calculateSummaryStats(filteredWorkouts),
    [filteredWorkouts],
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-500">
        {t("common.error")}: {error}
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div
        data-testid="evaluations-empty"
        className="py-8 text-center text-sm text-gray-500"
      >
        {t("evaluations.noAthletes")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AthleteSelector
        athletes={athletes}
        selectedAthleteId={effectiveSelectedId}
        onAthleteSelect={setSelectedAthleteId}
      />

      <div className="min-w-0 flex-1">
        {selectedAthlete && athleteData ? (
          <>
            <div className="mb-6">
              <TabBar
                tabs={timePeriodTabs}
                activeTab={timePeriod}
                onTabChange={(tab) => setTimePeriod(tab as TimePeriod)}
              />
            </div>

            <SummaryCards stats={summaryStats} />

            <WorkoutsTable workouts={filteredWorkouts} />
          </>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            {t("evaluations.noAthleteSelected")}
          </div>
        )}
      </div>
    </div>
  );
}
