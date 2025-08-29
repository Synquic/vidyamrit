export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    SCHOOL_ADMIN = 'school_admin',
    MENTOR = 'mentor'
}
export type UserRoleType = 'super_admin' | 'school_admin' | 'mentor';

// Base user interface that matches MongoDB model
export interface BaseUser {
    _id: string;
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId?: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Type guards for different user roles
export const isSuperAdmin = (user: BaseUser): user is SuperAdmin => 
    user.role === UserRole.SUPER_ADMIN;

export const isSchoolAdmin = (user: BaseUser): user is SchoolAdmin => 
    user.role === UserRole.SCHOOL_ADMIN;

export const isMentor = (user: BaseUser): user is Mentor => 
    user.role === UserRole.MENTOR;

// Role-specific interfaces extending BaseUser
export interface SuperAdmin extends BaseUser {
    role: UserRole.SUPER_ADMIN;
    schoolId?: never; // Super admin doesn't have a school
}

export interface SchoolAdmin extends BaseUser {
    role: UserRole.SCHOOL_ADMIN;
    schoolId: {  // School admin must have a school
        _id: string;
        name: string;
    };
}

export interface Mentor extends BaseUser {
    role: UserRole.MENTOR;
    schoolId: {  // Mentor must have a school
        _id: string;
        name: string;
    };
}

// DTOs for creating/updating users
export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    schoolId?: string;
}

export interface UpdateUserDTO {
    name?: string;
    email?: string;
    schoolId?: string;
}

// Type for API responses
export type User = SuperAdmin | SchoolAdmin | Mentor;

// Helper to narrow user type based on role
export function getUserByRole(user: BaseUser): User {
    switch (user.role) {
        case UserRole.SUPER_ADMIN:
            return user as SuperAdmin;
        case UserRole.SCHOOL_ADMIN:
            return user as SchoolAdmin;
        case UserRole.MENTOR:
            return user as Mentor;
        default:
            throw new Error(`Unknown user role: ${user.role}`);
    }
}
