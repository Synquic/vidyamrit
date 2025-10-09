export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  TUTOR = "TUTOR",
  STUDENT = "STUDENT",
}

export interface BaseUser {
  _id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SchoolUser extends BaseUser {
  role: UserRole.SUPER_ADMIN | UserRole.TUTOR | UserRole.STUDENT;
  school: {
    _id: string;
    name: string;
  };
}

export interface SuperAdmin extends BaseUser {
  role: UserRole.SUPER_ADMIN;
}

export type User = SuperAdmin | SchoolUser;
