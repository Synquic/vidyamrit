export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    SCHOOL_ADMIN = 'SCHOOL_ADMIN',
    MENTOR = 'MENTOR',
    STUDENT = 'STUDENT'
}

export interface BaseUser {
    _id: string;
    uid: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface SchoolUser extends BaseUser {
    role: UserRole.SCHOOL_ADMIN | UserRole.MENTOR | UserRole.STUDENT;
    school: {
        _id: string;
        name: string;
    };
}

export interface SuperAdmin extends BaseUser {
    role: UserRole.SUPER_ADMIN;
}

export type User = SuperAdmin | SchoolUser;
