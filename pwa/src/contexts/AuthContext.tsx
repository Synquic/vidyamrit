import { createContext } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "../types/user";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
