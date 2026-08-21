import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { EvaluationsTab } from "./components/EvaluationsTab";
import { ManagementTab } from "./components/ManagementTab";
import { SettingsTab } from "./components/SettingsTab";
import { PageLayout } from "./components/PageLayout";
import { TabBar } from "./components/TabBar";
import { useTeam } from "./hooks/useTeam";
import type { AssignableTeamRole } from "./types/team";

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("team");
  const [activeTab, setActiveTab] = useState("management");
  const {
    team,
    members,
    inviteCodes,
    loading,
    error,
    isOwner,
    currentUserId,
    currentUserDisplayName,
    regenerateInviteCode,
    leaveCurrentTeam,
    deleteCurrentTeam,
    removeMember,
    setMemberRole,
  } = useTeam(teamId);

  useEffect(() => {
    if (!loading && !teamId) {
      navigate("/teams");
    }
  }, [loading, teamId, navigate]);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const settingsEnabled =
    import.meta.env.VITE_FEATURE_FLAG_DEBUG_SETTINGS_TAB_ENABLED === "true";

  const tabs = [
    { id: "management", label: t("dashboard.tabs.management") },
    { id: "evaluations", label: t("dashboard.tabs.evaluations") },
    ...(settingsEnabled
      ? [{ id: "settings", label: t("dashboard.tabs.settings") }]
      : []),
  ];

  const handleRegenerateCode = async () => {
    try {
      await regenerateInviteCode();
    } catch {
      // Reported through useTeam's `error`, which holds the translated message.
    }
  };

  const handleLeaveTeam = async () => {
    setIsLeaving(true);
    try {
      await leaveCurrentTeam();
      navigate("/teams");
    } catch {
      setShowLeaveConfirm(false);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    try {
      await deleteCurrentTeam();
      navigate("/teams");
    } catch {
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetMemberRole = async (
    memberUserId: string,
    role: AssignableTeamRole,
  ) => {
    try {
      await setMemberRole(memberUserId, role);
    } catch {
      // See handleRegenerateCode.
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await removeMember(memberToRemove);
      setMemberToRemove(null);
    } catch {
      // See handleRegenerateCode.
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <PageLayout>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/teams")}
          className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          ← {t("common.backToTeams")}
        </button>
      </div>
      <div className="rounded-lg bg-white shadow-sm">
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-4 sm:p-6">
          {activeTab === "management" && (
            <ManagementTab
              team={team}
              members={members}
              inviteCodes={inviteCodes}
              loading={loading}
              isOwner={isOwner}
              currentUserId={currentUserId}
              currentUserDisplayName={currentUserDisplayName}
              error={error}
              showLeaveConfirm={showLeaveConfirm}
              isLeaving={isLeaving}
              memberToRemove={memberToRemove}
              isRemoving={isRemoving}
              showDeleteConfirm={showDeleteConfirm}
              isDeleting={isDeleting}
              onRegenerateCode={handleRegenerateCode}
              onLeaveClick={() => setShowLeaveConfirm(true)}
              onLeaveConfirm={handleLeaveTeam}
              onLeaveCancel={() => setShowLeaveConfirm(false)}
              onRemoveMember={setMemberToRemove}
              onRemoveConfirm={handleRemoveMember}
              onRemoveCancel={() => setMemberToRemove(null)}
              onSetMemberRole={handleSetMemberRole}
              onDeleteClick={() => setShowDeleteConfirm(true)}
              onDeleteConfirm={handleDeleteTeam}
              onDeleteCancel={() => setShowDeleteConfirm(false)}
            />
          )}

          {activeTab === "evaluations" && <EvaluationsTab members={members} />}

          {activeTab === "settings" && settingsEnabled && <SettingsTab />}
        </div>
      </div>
    </PageLayout>
  );
};
