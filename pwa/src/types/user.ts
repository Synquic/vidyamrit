export enum UserRole {
  SUPER_ADMIN = "super_admin",
  TUTOR = "tutor",
  VOLUNTEER = "volunteer",
  VIEW_USER = "view_user",
}
export type UserRoleType = "super_admin" | "tutor" | "volunteer" | "view_user";

// Base user interface that matches the API response
export interface BaseUser {
  id: string; // MongoDB _id returned as 'id' from API
  name: string;
  email: string;
  role: UserRole;
  schoolId?: {
    _id: string;
    name: string;
  };
  phoneNo?: string;
  createdAt: string;
  updatedAt: string;
}

// Type guards for different user roles
export const isSuperAdmin = (user: BaseUser): user is SuperAdmin =>
  user.role === UserRole.SUPER_ADMIN;

export const isTutor = (user: BaseUser): user is Tutor =>
  user.role === UserRole.TUTOR;

export const isVolunteer = (user: BaseUser): user is Volunteer =>
  user.role === UserRole.VOLUNTEER;

// Role-specific interfaces extending BaseUser
export interface SuperAdmin extends BaseUser {
  role: UserRole.SUPER_ADMIN;
  schoolId?: never; // Super admin doesn't have a school
}

export interface Tutor extends BaseUser {
  role: UserRole.TUTOR;
  schoolId: {
    // Tutor must have a school
    _id: string;
    name: string;
  };
}

export interface Volunteer extends BaseUser {
  role: UserRole.VOLUNTEER;
  schoolId: {
    // Volunteer must have a school
    _id: string;
    name: string;
  };
  expiresAt?: string; // ISO date string when volunteer access expires
  isActive?: boolean; // Whether volunteer account is active
}

// DTOs for creating/updating users
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  phoneNo?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  schoolId?: string;
  phoneNo?: string;
}

// Type for API responses
export type User = SuperAdmin | Tutor | Volunteer;

// Helper to narrow user type based on role
export function getUserByRole(user: BaseUser): User {
  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      return user as SuperAdmin;
    case UserRole.TUTOR:
      return user as Tutor;
    case UserRole.VOLUNTEER:
      return user as Volunteer;
    default:
      throw new Error(`Unknown user role: ${user.role}`);
  }
}
