import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TeamWithMemberCount } from "../types/team";
import {
  getUserTeams,
  createTeam as createTeamApi,
  acceptInvitation as acceptInvitationApi,
  ApiError,
} from "../services/teamsApi";

export function useTeamSelection() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translateError = useCallback(
    (err: unknown, fallbackKey: string): string => {
      if (err instanceof ApiError) {
        const translated = t(`errors.${err.code}`);
        if (translated !== `errors.${err.code}`) {
          return translated;
        }
      }
      return t(fallbackKey);
    },
    [t],
  );

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userTeams = await getUserTeams();
      setTeams(userTeams);
    } catch (err) {
      setError(translateError(err, "common.error"));
    } finally {
      setLoading(false);
    }
  }, [translateError]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const createTeam = async (name: string, description?: string) => {
    setError(null);
    try {
      const result = await createTeamApi(name, description);
      await loadTeams();
      return result;
    } catch (err) {
      const message = translateError(err, "teamManagement.createTeam.error");
      setError(message);
      throw err;
    }
  };

  const joinTeam = async (code: string) => {
    setError(null);
    try {
      const result = await acceptInvitationApi(code);
      await loadTeams();
      return result;
    } catch (err) {
      const message = translateError(err, "teamManagement.joinTeam.error");
      setError(message);
      throw err;
    }
  };

  return {
    teams,
    loading,
    error,
    createTeam,
    joinTeam,
    refresh: loadTeams,
  };
}
