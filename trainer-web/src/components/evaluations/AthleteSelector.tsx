import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Athlete } from "../../types/evaluations";

interface AthleteSelectorProps {
  athletes: Athlete[];
  selectedAthleteId: string | null;
  onAthleteSelect: (athleteId: string) => void;
}

export function AthleteSelector({
  athletes,
  selectedAthleteId,
  onAthleteSelect,
}: AthleteSelectorProps) {
  const { t } = useTranslation();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  const handleAthleteSelect = (athleteId: string) => {
    onAthleteSelect(athleteId);
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
    summaryRef.current?.focus();
  };

  return (
    <details
      data-testid="athlete-selector"
      ref={detailsRef}
      className="group rounded-lg border border-gray-200 bg-white"
    >
      <summary
        ref={summaryRef}
        className="flex list-none items-center px-4 py-3
                   transition-colors
                   [&::-webkit-details-marker]:hidden"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span
            className="inline-block h-2 w-2 border-b-2 border-r-2 border-gray-500
                       rotate-45 transition-transform duration-200 group-open:-rotate-[135deg]"
            aria-hidden="true"
          />
          {selectedAthlete && (
            <span aria-hidden="true" className="grayscale">
              👤
            </span>
          )}
          <span>
            {selectedAthlete
              ? selectedAthlete.displayName
              : t("evaluations.sidebar.expand")}
          </span>
        </div>
      </summary>
      <div className="w-full border-t border-gray-200 p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-left text-xs font-medium text-gray-500">
                {t("evaluations.athletes.name")}
              </th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr
                key={athlete.id}
                data-testid="athlete-option"
                className={`border-b border-gray-100 transition-colors hover:bg-gray-200 ${
                  selectedAthleteId === athlete.id
                    ? "bg-gray-200"
                    : "odd:bg-gray-50"
                }`}
              >
                <td className="text-sm text-gray-900">
                  <button
                    type="button"
                    aria-pressed={selectedAthleteId === athlete.id}
                    onClick={() => handleAthleteSelect(athlete.id)}
                    className="flex w-full items-center gap-2 py-2 text-left hover:cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-600"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block w-4 font-bold"
                    >
                      {selectedAthleteId === athlete.id ? "✓" : ""}
                    </span>
                    {athlete.displayName}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
