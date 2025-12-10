import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { ManagementTab } from "./components/ManagementTab";
import { PageLayout } from "./components/PageLayout";
import { PlayersTab } from "./components/PlayersTab";
import { TabBar } from "./components/TabBar";
import { useTeam } from "./hooks/useTeam";

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("team");
  const [activeTab, setActiveTab] = useState("team");
  const {
    team,
    members,
    inviteCodes,
    loading,
    isOwner,
    currentUserId,
    regenerateInviteCode,
    leaveCurrentTeam,
    removeMember,
  } = useTeam(teamId);

  useEffect(() => {
    if (!loading && !teamId) {
      navigate("/teams");
    }
  }, [loading, teamId, navigate]);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const tabs = [
    { id: "team", label: t("dashboard.tabs.team") },
    { id: "management", label: t("dashboard.tabs.management") },
    { id: "evaluations", label: t("dashboard.tabs.evaluations") },
    { id: "settings", label: t("dashboard.tabs.settings") },
  ];

  const handleRegenerateCode = async () => {
    setActionError(null);
    try {
      await regenerateInviteCode();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const handleLeaveTeam = async () => {
    setIsLeaving(true);
    setActionError(null);
    try {
      await leaveCurrentTeam();
      navigate("/teams");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("common.error"));
      setShowLeaveConfirm(false);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    setActionError(null);
    try {
      await removeMember(memberToRemove);
      setMemberToRemove(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex gap-6">
        <div className="flex-1 overflow-hidden rounded-lg bg-white shadow-sm">
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="p-6">
            {activeTab === "team" && <PlayersTab />}

            {activeTab === "management" && (
              <ManagementTab
                team={team}
                members={members}
                inviteCodes={inviteCodes}
                loading={loading}
                isOwner={isOwner}
                currentUserId={currentUserId}
                actionError={actionError}
                showLeaveConfirm={showLeaveConfirm}
                isLeaving={isLeaving}
                memberToRemove={memberToRemove}
                isRemoving={isRemoving}
                onRegenerateCode={handleRegenerateCode}
                onLeaveClick={() => setShowLeaveConfirm(true)}
                onLeaveConfirm={handleLeaveTeam}
                onLeaveCancel={() => setShowLeaveConfirm(false)}
                onRemoveMember={setMemberToRemove}
                onRemoveConfirm={handleRemoveMember}
                onRemoveCancel={() => setMemberToRemove(null)}
              />
            )}

            {activeTab === "evaluations" && (
              <div className="text-sm text-gray-400">
                {t("dashboard.tabs.evaluations")} content
              </div>
            )}

            {activeTab === "settings" && (
              <div className="text-sm text-gray-400">
                {t("dashboard.tabs.settings")} content
              </div>
            )}
          </div>
        </div>

        <DashboardSidebar
          team={team}
          inviteCodes={inviteCodes}
          isOwner={isOwner}
        />
      </div>
    </PageLayout>
  );
};
