interface BaseUser {
    _id: string;
    uid: string;
    name: string;
    email: string;
    role: string;
}

interface School {
    _id: string;
    name: string;
}

interface SchoolUser extends BaseUser {
    school: School;
}

type User = BaseUser | SchoolUser;

/**
 * Check if the user is a super admin
 */
export const isSuperAdmin = (user: User | null): boolean => {
    return user?.role === 'SUPER_ADMIN';
};

/**
 * Check if the user belongs to a specific school
 */
export const isFromSchool = (user: User | null, schoolId: string): boolean => {
    if (!user || isSuperAdmin(user)) return false;
    return (user as SchoolUser).school._id === schoolId;
};

/**
 * Check if the user has one of the specified roles
 */
export const hasRole = (user: User | null, roles: string[]): boolean => {
    return Boolean(user?.role && roles.includes(user.role));
};

/**
 * Check if the user can access a specific school's data
 * Super admins can access any school, other users can only access their assigned school
 */
export const canAccessSchool = (user: User | null, schoolId: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin(user)) return true;
    return isFromSchool(user, schoolId);
};

/**
 * Check if the user can modify a specific school's data
 * Super admins can modify any school, school admins can only modify their own school
 */
export const canModifySchool = (user: User | null, schoolId: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin(user)) return true;
    return hasRole(user, ['SCHOOL_ADMIN']) && isFromSchool(user, schoolId);
};

/**
 * Get the user's school ID if they have one
 */
export const getUserSchoolId = (user: User | null): string | null => {
    if (!user || isSuperAdmin(user)) return null;
    return (user as SchoolUser).school._id;
};

/**
 * Get the user's school name if they have one
 */
export const getUserSchoolName = (user: User | null): string | null => {
    if (!user || isSuperAdmin(user)) return null;
    return (user as SchoolUser).school.name;
};
