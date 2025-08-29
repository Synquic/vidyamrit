export interface School {
    _id: string;
    name: string;
}

export interface UserBase {
    _id: string;
    uid: string;
    name: string;
    email: string;
}

export interface SuperAdmin extends UserBase {
    role: 'SUPER_ADMIN';
}

export interface SchoolUser extends UserBase {
    role: 'SCHOOL_ADMIN' | 'MENTOR' | 'STUDENT';
    school: School;
}

export type User = SuperAdmin | SchoolUser;

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: Error | null;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}
