import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebaseConfig";

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        await signOut(auth);
        navigate("/login");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };

    logout();
  }, [navigate]);

  return <div>Logging out...</div>;
};

export default LogoutPage;
