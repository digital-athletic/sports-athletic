import { useTranslation } from "react-i18next";
import type { SummaryStats } from "../../types/evaluations";

interface SummaryCardsProps {
  stats: SummaryStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-gray-200 p-4 text-center">
        <div className="mb-1 text-sm text-gray-500">
          {t("evaluations.summary.duration")}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {stats.totalDuration}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-4 text-center">
        <div className="mb-1 text-sm text-gray-500">
          {t("evaluations.summary.trainingCount")}
        </div>
        <div
          data-testid="summary-training-count"
          className="text-2xl font-bold text-gray-900"
        >
          {stats.trainingCount}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-4 text-center">
        <div className="mb-1 text-sm text-gray-500">
          {t("evaluations.summary.points")}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {stats.totalPoints}
        </div>
      </div>
    </div>
  );
}
