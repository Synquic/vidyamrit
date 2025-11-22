export interface CreateUserRequest {
    name: string;
    email: string;
    password?: string; // Optional for students
    uid: string;     // Required for students (used as roll number)
    schoolId: string;
    phoneNo?: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    uid?: string;     // Allow updating roll number
    schoolId?: string;
    phoneNo?: string;
}

// Add params types
export interface UserParams {
    id?: string;   // MongoDB _id
    uid?: string;  // Firebase UID
}
