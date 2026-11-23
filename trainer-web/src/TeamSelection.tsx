import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "./components/Button";
import { ConfirmModal } from "./components/ConfirmModal";
import { CreateTeamCard } from "./components/CreateTeamCard";
import { CreateTeamForm } from "./components/CreateTeamForm";
import { ErrorMessage } from "./components/ErrorMessage";
import { JoinTeamForm } from "./components/JoinTeamForm";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { MemberTeamCard } from "./components/MemberTeamCard";
import { PageLayout } from "./components/PageLayout";
import { TeamCard } from "./components/TeamCard";
import { useProfile } from "./hooks/useProfile";
import { useTeamSelection } from "./hooks/useTeamSelection";
import { isTeamStaff } from "./types/team";

export const TeamSelection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teams, loading, error, createTeam, joinTeam, leaveTeam } =
    useTeamSelection();
  const { profile, loading: profileLoading } = useProfile();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [teamToLeave, setTeamToLeave] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleSelectTeam = (teamId: string) => {
    navigate(`/dashboard?team=${teamId}`);
  };

  const handleCreateTeam = async (name: string, description?: string) => {
    const result = await createTeam(name, description);
    navigate(`/dashboard?team=${result.id}`);
  };

  // Joining makes the user a plain member, whose team has no dashboard. The
  // reloaded list shows the new team instead.
  const handleJoinTeam = async (code: string) => {
    await joinTeam(code);
    setShowJoinForm(false);
  };

  const handleLeaveTeam = async () => {
    if (!teamToLeave) return;
    setIsLeaving(true);
    try {
      await leaveTeam(teamToLeave);
    } catch {
      // useTeamSelection's `error` shows the failure.
    } finally {
      setIsLeaving(false);
      setTeamToLeave(null);
    }
  };

  return (
    <PageLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            data-testid="team-selection-title"
            className="text-2xl font-bold text-gray-900"
          >
            {t("teamSelection.title")}
          </h1>
          <p className="mt-1 text-gray-600">{t("teamSelection.description")}</p>
        </div>
        {profile?.adminGrantedAt && (
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="shrink-0 text-sm"
          >
            {t("admin.menuLabel")}
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading || profileLoading ? (
        <LoadingSpinner />
      ) : !showCreateForm && !showJoinForm ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.length === 0 && (
            <p
              data-testid="team-selection-empty"
              className="col-span-full text-gray-500"
            >
              {t("teamSelection.noTeam")}
            </p>
          )}
          {teams.map((team) =>
            isTeamStaff(team.role) ? (
              <TeamCard
                key={team.id}
                team={team}
                memberCount={team.member_count}
                onClick={() => handleSelectTeam(team.id)}
              />
            ) : (
              <MemberTeamCard
                key={team.id}
                team={team}
                onLeaveClick={() => setTeamToLeave(team.id)}
              />
            ),
          )}
          <CreateTeamCard
            onCreateClick={() => setShowCreateForm(true)}
            onJoinClick={() => setShowJoinForm(true)}
            isTrainer={profile?.trainerGrantedAt != null}
          />
        </div>
      ) : null}

      {!loading && showCreateForm && (
        <CreateTeamForm
          onSubmit={handleCreateTeam}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {!loading && showJoinForm && (
        <JoinTeamForm
          onSubmit={handleJoinTeam}
          onCancel={() => setShowJoinForm(false)}
        />
      )}

      {teamToLeave && (
        <ConfirmModal
          title={t("teamManagement.leaveTeam.confirmTitle")}
          message={t("teamManagement.leaveTeam.confirmMessage")}
          confirmLabel={t("teamManagement.leaveTeam.button")}
          confirmTestId="member-team-leave-confirm"
          isLoading={isLeaving}
          onConfirm={handleLeaveTeam}
          onCancel={() => setTeamToLeave(null)}
        />
      )}
    </PageLayout>
  );
};
