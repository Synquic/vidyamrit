import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { UserRoleType } from "../types/user";

const roleHierarchy: Record<UserRoleType, UserRoleType[]> = {
  super_admin: ["super_admin", "tutor", "volunteer"],
  tutor: ["tutor"],
  volunteer: ["volunteer"],
  view_user: ["view_user"],
};

export const useRoleAccess = () => {
  const { user } = useContext(AuthContext) || {};

  const hasAccess = (requiredRole: UserRoleType | UserRoleType[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => 
        roleHierarchy[user.role]?.includes(role) || false
      );
    }
    
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
