import { apiUrl, authAxios } from './index';

const baseUrl = `${apiUrl}/students`;

export interface Student {
    uid: string;
    _id: string;
    name: string;
    email: string;
    role: string;
    rollNo: string;
    schoolId: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

export interface CreateStudentDTO {
    name: string;
    email: string;
    uid: string;  // This will be used as roll number
    schoolId: string;
}

export interface UpdateStudentDTO {
    name?: string;
    email?: string;
    uid?: string;  // Allow updating roll number
    schoolId?: string;
}

export const createStudent = async (data: CreateStudentDTO): Promise<Student> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};

export const getStudents = async (schoolId?: string): Promise<Student[]> => {
    const response = await authAxios.get(baseUrl, {
        params: { schoolId }
    });
    return response.data;
};

export const getStudent = async (id: string): Promise<Student> => {
    const response = await authAxios.get(`${baseUrl}/${id}`);
    return response.data;
};

export const updateStudent = async (id: string, data: UpdateStudentDTO): Promise<Student> => {
    const response = await authAxios.put(`${baseUrl}/${id}`, data);
    return response.data;
};

export const deleteStudent = async (id: string): Promise<void> => {
    await authAxios.delete(`${baseUrl}/${id}`);
};
