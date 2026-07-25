import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "./components/Button";
import { CreateTeamCard } from "./components/CreateTeamCard";
import { CreateTeamForm } from "./components/CreateTeamForm";
import { ErrorMessage } from "./components/ErrorMessage";
import { JoinTeamForm } from "./components/JoinTeamForm";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { PageLayout } from "./components/PageLayout";
import { TeamCard } from "./components/TeamCard";
import { useProfile } from "./hooks/useProfile";
import { useTeamSelection } from "./hooks/useTeamSelection";

export const TeamSelection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teams, loading, error, createTeam, joinTeam } = useTeamSelection();
  const { profile, loading: profileLoading } = useProfile();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleSelectTeam = (teamId: string) => {
    navigate(`/dashboard?team=${teamId}`);
  };

  const handleCreateTeam = async (name: string, description?: string) => {
    const result = await createTeam(name, description);
    navigate(`/dashboard?team=${result.id}`);
  };

  const handleJoinTeam = async (code: string) => {
    const result = await joinTeam(code);
    navigate(`/dashboard?team=${result.team_id}`);
  };

  return (
    <PageLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
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
            <p className="col-span-full text-gray-500">
              {t("teamSelection.noTeam")}
            </p>
          )}
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              memberCount={team.member_count}
              onClick={() => handleSelectTeam(team.id)}
            />
          ))}
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
    </PageLayout>
  );
};
