import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "./components/Button";
import { ErrorMessage } from "./components/ErrorMessage";
import { FormInput } from "./components/FormInput";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { PageLayout } from "./components/PageLayout";
import {
  lookupUserByEmail,
  setTrainerStatus,
  type LookupUserResponse,
} from "./services/adminApi";
import { ApiError } from "./services/teamsApi";

export function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [user, setUser] = useState<LookupUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translateError = (err: unknown): string => {
    if (err instanceof ApiError) {
      const key = `errors.${err.code}`;
      const translated = t(key);
      if (translated !== key) return translated;
    }
    return t("common.error");
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setUser(null);
    try {
      setUser(await lookupUserByEmail(email.trim()));
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSearching(false);
    }
  };

  const handleToggleTrainer = async () => {
    if (!user) return;
    setToggling(true);
    setError(null);
    try {
      const result = await setTrainerStatus(
        user.user_id,
        !user.trainer_granted_at,
      );
      setUser({ ...user, trainer_granted_at: result.trainer_granted_at });
    } catch (err) {
      setError(translateError(err));
    } finally {
      setToggling(false);
    }
  };

  return (
    <PageLayout>
      <button
        onClick={() => navigate("/teams")}
        className="mb-6 text-sm text-gray-500 hover:text-gray-700"
      >
        ← {t("common.backToTeams")}
      </button>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {t("admin.title")}
      </h1>
      <p className="mb-8 text-gray-600">{t("admin.description")}</p>

      <div className="max-w-lg">
        <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3">
          <FormInput
            label={t("admin.emailLabel")}
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("admin.emailPlaceholder")}
            required
          />
          <Button
            type="submit"
            isLoading={searching}
            loadingText={t("common.loading")}
            disabled={!email.trim()}
          >
            {t("admin.search")}
          </Button>
        </form>

        {error && <ErrorMessage message={error} className="mb-4" />}

        {searching && <LoadingSpinner />}

        {!searching && user && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("admin.emailLabel")}
              </p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div className="mb-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("admin.trainerStatus")}
              </p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                  user.trainer_granted_at
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {user.trainer_granted_at
                  ? t("admin.trainerSince", {
                      date: new Date(user.trainer_granted_at).toLocaleString(),
                    })
                  : t("admin.notTrainer")}
              </span>
            </div>
            <Button
              onClick={handleToggleTrainer}
              isLoading={toggling}
              loadingText={t("common.loading")}
              variant={user.trainer_granted_at ? "danger" : "primary"}
              className="w-full"
            >
              {user.trainer_granted_at
                ? t("admin.revokeTrainer")
                : t("admin.grantTrainer")}
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
