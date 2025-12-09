import { useState } from "react";
import { useTranslation } from "react-i18next";

interface InviteCodeSectionProps {
  inviteCodes: string[];
  onRegenerateCode: () => void | Promise<void>;
}

export function InviteCodeSection({
  inviteCodes,
  onRegenerateCode,
}: InviteCodeSectionProps) {
  const { t } = useTranslation();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateCode();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-2 font-semibold text-gray-900">
        {t("teamManagement.inviteCode.title")}
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        {t("teamManagement.inviteCode.description")}
      </p>

      {inviteCodes.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2">
          {inviteCodes.map((code) => (
            <div key={code} className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest text-gray-900">
                {code}
              </div>
              <button
                onClick={() => handleCopyCode(code)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                {copiedCode === code ? t("common.copied") : t("common.copy")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-500">
          {t("teamManagement.inviteCode.noCode")}
        </p>
      )}

      <button
        onClick={handleRegenerateCode}
        disabled={isRegenerating}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isRegenerating
          ? t("teamManagement.inviteCode.regenerating")
          : t("teamManagement.inviteCode.regenerate")}
      </button>
    </div>
  );
}
