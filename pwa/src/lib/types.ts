export enum UserRole {
  SUPER_ADMIN = "super_admin",
  SCHOOL_ADMIN = "school_admin",
  MENTOR = "mentor",
  STUDENT = "student",
}

export interface School {
  _id: string;
  name: string;
  type: "government" | "private";
  udise_code: string;
  address: string;
  level: "primary" | "middle";
  city: string;
  state: string;
  establishedYear: number;
  pinCode: string;
  principalName: string;
  phone: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  school?: string | null; // school ID for non-super-admin users
}
