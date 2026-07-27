// Full-screen branded loading state used by the auth gates (login, logout,
// protected routes). Shares the login page's gradient so resolving into the
// login form doesn't flash white.
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";

interface LoadingScreenProps {
  /** Overrides the default "Loading..." caption. */
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <img
        src="/vidyamrit-logo.png"
        alt=""
        aria-hidden="true"
        className="h-20 w-20 rounded-full object-contain bg-white/70 border border-orange-100 shadow-sm"
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          {t("Vidyamrit")}
        </h1>
        <p className="text-sm text-gray-600">
          {t("Literacy. Learning. Livelihood.")}
        </p>
      </div>

      <Spinner size="medium" />

      <p className="text-sm text-gray-500">{message ?? t("Loading...")}</p>
    </div>
  );
}
