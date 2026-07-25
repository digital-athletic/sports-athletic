import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { EvaluationsTab } from "./components/EvaluationsTab";
import { ManagementTab } from "./components/ManagementTab";
import { SettingsTab } from "./components/SettingsTab";
import { PageLayout } from "./components/PageLayout";
import { TabBar } from "./components/TabBar";
import { useTeam } from "./hooks/useTeam";

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
    isOwner,
    currentUserId,
    currentUserDisplayName,
    regenerateInviteCode,
    leaveCurrentTeam,
    deleteCurrentTeam,
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

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteCurrentTeam();
      navigate("/teams");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("common.error"));
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
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
              actionError={actionError}
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
              onDeleteClick={() => setShowDeleteConfirm(true)}
              onDeleteConfirm={handleDeleteTeam}
              onDeleteCancel={() => setShowDeleteConfirm(false)}
            />
          )}

          {activeTab === "evaluations" && (
            <EvaluationsTab
              members={members}
              ownerId={team?.owner_id ?? null}
            />
          )}

          {activeTab === "settings" && settingsEnabled && <SettingsTab />}
        </div>
      </div>
    </PageLayout>
  );
};
