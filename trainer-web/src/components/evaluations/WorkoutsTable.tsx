import { useTranslation } from "react-i18next";
import type { WorkoutData } from "../../types/evaluations";

interface WorkoutsTableProps {
  workouts: WorkoutData[];
}

export function WorkoutsTable({ workouts }: WorkoutsTableProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        {t("evaluations.workouts.title")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.workouts.timestamp")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.workouts.duration")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.workouts.exerciseCount")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.workouts.points")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.workouts.movedWeight")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.workouts.trainingPhase")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.workouts.focus")}
              </th>
            </tr>
          </thead>
          <tbody>
            {workouts.length > 0 ? (
              workouts.map((workout) => (
                <tr
                  key={workout.id}
                  className="border-b border-gray-100 odd:bg-gray-50 transition-colors hover:cursor-pointer hover:bg-gray-200"
                >
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {workout.timestamp}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {workout.duration}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {workout.exerciseCount}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {workout.points}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {workout.movedWeight}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {workout.trainingPhase}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {workout.focus}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-sm text-gray-500"
                >
                  {t("evaluations.workouts.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
