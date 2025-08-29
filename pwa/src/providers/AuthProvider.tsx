import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { AuthContext } from "../contexts/AuthContext";
import { User } from "../types/user";
import { getCurrentUser } from "../services/auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        try {
          const userDetails = await getCurrentUser();
          setUser(userDetails);
        } catch (error) {
          console.error("Error fetching user details:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
