import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import logo from "./assets/SA_dark.png";

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/teams");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-10 shadow-lg">
        <div className="mb-8 flex justify-center">
          <img
            src={logo}
            className="h-[120px] w-[120px] object-contain"
            alt={t("common.logoAlt")}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="mb-2 flex items-center">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-base font-medium text-gray-800">
              {t("login.title")}
            </span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="w-full">
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3.5 text-base transition-colors placeholder:text-gray-400 focus:border-red-600 focus:outline-none"
              placeholder={t("login.email")}
            />
          </div>

          <div className="w-full">
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3.5 text-base transition-colors placeholder:text-gray-400 focus:border-red-600 focus:outline-none"
              placeholder={t("login.password")}
            />
          </div>

          <div className="w-full">
            <button
              className="w-full rounded-lg bg-red-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-red-700"
              onClick={handleLogin}
            >
              {t("login.submit")}
            </button>
          </div>

          <div className="text-center">
            <span className="cursor-pointer text-sm text-gray-500 transition-colors hover:text-gray-800">
              {t("login.resetPassword")}
            </span>
          </div>

          <div className="mt-2 text-center">
            <span className="text-sm text-gray-500">
              {t("login.noAccount")}{" "}
            </span>
            <span className="cursor-pointer text-sm font-semibold text-red-600 transition-colors hover:text-red-700">
              {t("login.register")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
