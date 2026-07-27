import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import LoadingScreen from "@/components/LoadingScreen";

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const logout = async () => {
      try {
        await signOut(auth);
        // replace: don't leave /logout in history, otherwise back re-triggers it.
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };

    logout();
  }, [navigate]);

  return <LoadingScreen message={t("Logging out...")} />;
};

export default LogoutPage;
