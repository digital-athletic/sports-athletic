import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Team, TeamMember } from "../types/team";
import {
  getTeamById,
  getTeamMembers,
  getTeamInviteCodes,
  createTeam as createTeamApi,
  generateInviteCode as generateInviteCodeApi,
  acceptInvitation as acceptInvitationApi,
  leaveTeam as leaveTeamApi,
  removeMember as removeMemberApi,
  ApiError,
} from "../services/teamsApi";
import { supabase } from "../services/supabase";

export function useTeam(teamId: string | null) {
  const { t } = useTranslation();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteCodes, setInviteCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const translateError = useCallback(
    (err: unknown, fallbackKey: string): string => {
      if (err instanceof ApiError) {
        const translated = t(`errors.${err.code}`);
        // If translation key doesn't exist, i18next returns the key itself
        if (translated !== `errors.${err.code}`) {
          return translated;
        }
      }
      return t(fallbackKey);
    },
    [t],
  );

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      if (!teamId) {
        setTeam(null);
        setMembers([]);
        setInviteCodes([]);
        return;
      }

      const currentTeam = await getTeamById(teamId);
      setTeam(currentTeam);

      if (currentTeam) {
        const [teamMembers, codes] = await Promise.all([
          getTeamMembers(currentTeam.id),
          getTeamInviteCodes(currentTeam.id),
        ]);
        setMembers(teamMembers);
        setInviteCodes(codes);
      } else {
        setMembers([]);
        setInviteCodes([]);
      }
    } catch (err) {
      setError(translateError(err, "common.error"));
    } finally {
      setLoading(false);
    }
  }, [teamId, translateError]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const createTeam = async (name: string, description?: string) => {
    setError(null);
    try {
      const result = await createTeamApi(name, description);
      setTeam({
        id: result.id,
        name: result.name,
        description: result.description,
        owner_id: result.owner_id,
        created_at: result.created_at,
      });
      setInviteCodes([result.invite_code]);
      await loadTeam();
      return result;
    } catch (err) {
      const message = translateError(err, "teamManagement.createTeam.error");
      setError(message);
      throw err;
    }
  };

  const regenerateInviteCode = async () => {
    if (!team) throw new Error("No team selected");
    setError(null);
    try {
      const result = await generateInviteCodeApi(team.id, {
        deactivate_existing: true,
      });
      setInviteCodes([result.code]);
      return result.code;
    } catch (err) {
      const message = translateError(err, "common.error");
      setError(message);
      throw err;
    }
  };

  const joinTeam = async (code: string) => {
    setError(null);
    try {
      const result = await acceptInvitationApi(code);
      await loadTeam();
      return result;
    } catch (err) {
      const message = translateError(err, "teamManagement.joinTeam.error");
      setError(message);
      throw err;
    }
  };

  const leaveCurrentTeam = async () => {
    if (!team) throw new Error("No team to leave");
    setError(null);
    try {
      const result = await leaveTeamApi(team.id);
      setTeam(null);
      setMembers([]);
      setInviteCodes([]);
      return result;
    } catch (err) {
      const message = translateError(err, "common.error");
      setError(message);
      throw err;
    }
  };

  const removeMember = async (memberUserId: string) => {
    if (!team) throw new Error("No team selected");
    setError(null);
    try {
      const result = await removeMemberApi(team.id, memberUserId);
      setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId));
      return result;
    } catch (err) {
      const message = translateError(err, "common.error");
      setError(message);
      throw err;
    }
  };

  const isOwner = team?.owner_id === currentUserId;

  return {
    team,
    members,
    inviteCodes,
    loading,
    error,
    isOwner,
    currentUserId,
    createTeam,
    regenerateInviteCode,
    joinTeam,
    leaveCurrentTeam,
    removeMember,
    refresh: loadTeam,
  };
}
