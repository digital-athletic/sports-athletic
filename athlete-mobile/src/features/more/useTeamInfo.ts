import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { type TeamInfo, getTeamInfo } from "@/services/TeamService";

export type TeamInfoState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "notMember" }
  | { status: "loaded"; team: TeamInfo };

/** Loads the team on every focus, so changes by the trainer show without a restart. */
export function useTeamInfo(teamId: string) {
  const [state, setState] = useState<TeamInfoState>({ status: "loading" });
  // Each load gets a number, so a slow earlier answer cannot overwrite a newer one.
  const latestLoad = useRef(0);

  const load = useCallback(() => {
    const loadId = ++latestLoad.current;
    const isCurrent = () => loadId === latestLoad.current;
    setState({ status: "loading" });
    getTeamInfo(teamId)
      .then((team) => {
        if (!isCurrent()) return;
        setState(team ? { status: "loaded", team } : { status: "notMember" });
      })
      .catch(() => {
        if (isCurrent()) setState({ status: "error" });
      });
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        latestLoad.current += 1;
      };
    }, [load]),
  );

  return { state, reload: load };
}
