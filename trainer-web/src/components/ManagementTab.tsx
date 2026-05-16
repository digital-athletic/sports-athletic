import { useTranslation } from "react-i18next";
import { type Team, type TeamMember } from "../types/team";
import { ConfirmModal } from "./ConfirmModal";
import { ErrorMessage } from "./ErrorMessage";
import { InviteCodeSection } from "./InviteCodeSection";
import { LeaveTeamSection } from "./LeaveTeamSection";
import { LoadingSpinner } from "./LoadingSpinner";
import { TeamInfoCard } from "./TeamInfoCard";
import { TeamMemberList } from "./TeamMemberList";

interface ManagementTabProps {
  team: Team | null;
  members: TeamMember[];
  inviteCodes: string[];
  loading: boolean;
  isOwner: boolean;
  currentUserId: string | null;
  actionError: string | null;
  showLeaveConfirm: boolean;
  isLeaving: boolean;
  memberToRemove: string | null;
  isRemoving: boolean;
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  onRegenerateCode: () => void;
  onLeaveClick: () => void;
  onLeaveConfirm: () => void;
  onLeaveCancel: () => void;
  onRemoveMember: (memberId: string) => void;
  onRemoveConfirm: () => void;
  onRemoveCancel: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function ManagementTab({
  team,
  members,
  inviteCodes,
  loading,
  isOwner,
  currentUserId,
  actionError,
  showLeaveConfirm,
  isLeaving,
  memberToRemove,
  isRemoving,
  showDeleteConfirm,
  isDeleting,
  onRegenerateCode,
  onLeaveClick,
  onLeaveConfirm,
  onLeaveCancel,
  onRemoveMember,
  onRemoveConfirm,
  onRemoveCancel,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: ManagementTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {actionError && <ErrorMessage message={actionError} />}

      {loading ? (
        <LoadingSpinner />
      ) : !team ? (
        <div className="text-center text-gray-500">
          {t("teamSelection.noTeam")}
        </div>
      ) : (
        <>
          <TeamInfoCard team={team} memberCount={members.length} />

          {isOwner && (
            <InviteCodeSection
              inviteCodes={inviteCodes}
              onRegenerateCode={onRegenerateCode}
            />
          )}

          <TeamMemberList
            members={members}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onRemoveMember={onRemoveMember}
          />

          <LeaveTeamSection
            isOwner={isOwner}
            onLeaveClick={onLeaveClick}
            onDeleteClick={onDeleteClick}
          />

          {showLeaveConfirm && (
            <ConfirmModal
              title={t("teamManagement.leaveTeam.confirmTitle")}
              message={t("teamManagement.leaveTeam.confirmMessage")}
              confirmLabel={t("teamManagement.leaveTeam.button")}
              isLoading={isLeaving}
              onConfirm={onLeaveConfirm}
              onCancel={onLeaveCancel}
            />
          )}

          {memberToRemove && (
            <ConfirmModal
              title={t("teamManagement.members.removeConfirmTitle")}
              message={t("teamManagement.members.removeConfirmMessage")}
              confirmLabel={t("teamManagement.members.remove")}
              isLoading={isRemoving}
              onConfirm={onRemoveConfirm}
              onCancel={onRemoveCancel}
            />
          )}

          {showDeleteConfirm && (
            <ConfirmModal
              title={t("teamManagement.deleteTeam.confirmTitle")}
              message={t("teamManagement.deleteTeam.confirmMessage")}
              confirmLabel={t("teamManagement.deleteTeam.button")}
              isLoading={isDeleting}
              onConfirm={onDeleteConfirm}
              onCancel={onDeleteCancel}
            />
          )}
        </>
      )}
    </div>
  );
}
