export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  MENTOR = 'mentor',
  STUDENT = 'student'
}

export interface School {
  _id: string;
  name: string;
  type: string;
  logo?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  school?: string | null; // school ID for non-super-admin users
}
