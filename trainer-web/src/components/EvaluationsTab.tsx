import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TabBar } from "./TabBar";
import { AthleteSelector, SummaryCards, WorkoutsTable } from "./evaluations";
import type { TimePeriod } from "../types/evaluations";
import {
  getAthletes,
  getAthleteWorkouts,
  filterWorkoutsByPeriod,
  calculateSummaryStats,
} from "../utils/evaluations";

const athletes = getAthletes();
const athleteWorkouts = getAthleteWorkouts();

export function EvaluationsTab() {
  const { t } = useTranslation();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    athletes[0]?.id || null
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("lastWeek");

  const timePeriodTabs = [
    { id: "lastWeek", label: t("evaluations.timePeriods.lastWeek") },
    { id: "lastMonth", label: t("evaluations.timePeriods.lastMonth") },
    { id: "lastYear", label: t("evaluations.timePeriods.lastYear") },
    { id: "total", label: t("evaluations.timePeriods.total") },
  ];

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);
  const athleteData = selectedAthleteId
    ? athleteWorkouts[selectedAthleteId]
    : null;

  const filteredWorkouts = useMemo(() => {
    if (!athleteData) return [];
    return filterWorkoutsByPeriod(athleteData.workouts, timePeriod);
  }, [athleteData, timePeriod]);

  const summaryStats = useMemo(
    () => calculateSummaryStats(filteredWorkouts),
    [filteredWorkouts]
  );

  return (
    <div className="flex flex-col gap-4">
      <AthleteSelector
        athletes={athletes}
        selectedAthleteId={selectedAthleteId}
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
