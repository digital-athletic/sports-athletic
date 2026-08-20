import { useTranslation } from "react-i18next";
import type { AssignableTeamRole, TeamMember, TeamRole } from "../types/team";

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId: string | null;
  currentUserDisplayName?: string | null;
  isOwner: boolean;
  onRemoveMember?: (userId: string) => void;
  onSetMemberRole?: (userId: string, role: AssignableTeamRole) => void;
}

const ROLE_BADGE_CLASS: Record<TeamRole, string> = {
  owner: "bg-red-100 text-red-700",
  co_owner: "bg-amber-100 text-amber-700",
  member: "bg-gray-100 text-gray-600",
};

const ROLE_LABEL_KEY: Record<TeamRole, string> = {
  owner: "teamManagement.members.owner",
  co_owner: "teamManagement.members.coOwner",
  member: "teamManagement.members.member",
};

export function TeamMemberList({
  members,
  currentUserId,
  currentUserDisplayName,
  isOwner,
  onRemoveMember,
  onSetMemberRole,
}: TeamMemberListProps) {
  const { t } = useTranslation();

  const resolveDisplayName = (member: TeamMember): string => {
    if (member.display_name) return member.display_name;
    if (member.user_id === currentUserId && currentUserDisplayName)
      return currentUserDisplayName;
    return t("evaluations.athletes.anonymous");
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">
        {t("teamManagement.members.title")}
      </h3>

      {members.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t("teamManagement.members.noMembers")}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {resolveDisplayName(member)}
                  {member.user_id === currentUserId &&
                    ` ${t("teamManagement.members.you")}`}
                </span>
                <span
                  className={`ml-2 inline-block rounded px-2 py-0.5 text-xs ${ROLE_BADGE_CLASS[member.role]}`}
                >
                  {t(ROLE_LABEL_KEY[member.role])}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {t("teamManagement.members.joined")}{" "}
                  {new Date(member.joined_at).toLocaleDateString()}
                </span>
                {/* The owner's own row is never editable: ownership lives in
                    teams.owner_id, and set_member_role refuses it anyway. */}
                {isOwner && member.role !== "owner" && onSetMemberRole && (
                  <button
                    onClick={() =>
                      onSetMemberRole(
                        member.user_id,
                        member.role === "co_owner" ? "member" : "co_owner",
                      )
                    }
                    className="rounded px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    {member.role === "co_owner"
                      ? t("teamManagement.members.demote")
                      : t("teamManagement.members.promote")}
                  </button>
                )}
                {isOwner &&
                  member.user_id !== currentUserId &&
                  onRemoveMember && (
                    <button
                      onClick={() => onRemoveMember(member.user_id)}
                      className="rounded px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50"
                    >
                      {t("teamManagement.members.remove")}
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
