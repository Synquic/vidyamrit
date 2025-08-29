export const UserRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    MENTOR: 'MENTOR',
    STUDENT: 'STUDENT'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
