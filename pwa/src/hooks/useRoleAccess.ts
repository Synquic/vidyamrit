import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { UserRoleType } from "../types/user";

const roleHierarchy: Record<UserRoleType, UserRoleType[]> = {
  super_admin: ["super_admin", "tutor"],
  tutor: ["tutor"],
};

export const useRoleAccess = () => {
  const { user } = useContext(AuthContext) || {};

  const hasAccess = (requiredRole: UserRoleType): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role]?.includes(requiredRole) || false;
  };

  const canAccessRoles = (): UserRoleType[] => {
    if (!user) return [];
    return roleHierarchy[user.role] || [];
  };

  return {
    hasAccess,
    canAccessRoles,
    currentRole: user?.role,
  };
};
