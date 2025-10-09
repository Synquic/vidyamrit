export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TUTOR: "TUTOR",
  STUDENT: "STUDENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
