import { useTranslation } from "react-i18next";
import type { TeamMember } from "../types/team";

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId: string | null;
  isOwner: boolean;
  onRemoveMember?: (userId: string) => void;
}

export function TeamMemberList({
  members,
  currentUserId,
  isOwner,
  onRemoveMember,
}: TeamMemberListProps) {
  const { t } = useTranslation();

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
                  {t("evaluations.athletes.anonymous")}
                  {member.user_id === currentUserId &&
                    ` ${t("teamManagement.members.you")}`}
                </span>
                <span
                  className={`ml-2 inline-block rounded px-2 py-0.5 text-xs ${
                    member.role === "owner"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {member.role === "owner"
                    ? t("teamManagement.members.owner")
                    : t("teamManagement.members.member")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {t("teamManagement.members.joined")}{" "}
                  {new Date(member.joined_at).toLocaleDateString()}
                </span>
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
