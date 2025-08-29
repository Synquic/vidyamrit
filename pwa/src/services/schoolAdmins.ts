import { apiUrl, authAxios } from './index';

const baseUrl = `${apiUrl}/school-admins`;

export interface SchoolAdmin {
    _id: string;
    uid: string;
    name: string;
    email: string;
    role: string;
    schoolId: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

export interface CreateSchoolAdminDTO {
    name: string;
    email: string;
    password: string;
    schoolId: string;
}

export const createSchoolAdmin = async (data: CreateSchoolAdminDTO): Promise<SchoolAdmin> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};

export const getSchoolAdmins = async (): Promise<SchoolAdmin[]> => {
    const response = await authAxios.get(baseUrl);
    return response.data;
};

export const getSchoolAdmin = async (uid: string): Promise<SchoolAdmin> => {
    const response = await authAxios.get(`${baseUrl}/${uid}`);
    return response.data;
};

export interface UpdateSchoolAdminDTO {
    name?: string;
    email?: string;
    schoolId?: string;
}

export const updateSchoolAdmin = async (uid: string, data: UpdateSchoolAdminDTO): Promise<SchoolAdmin> => {
    const response = await authAxios.put(`${baseUrl}/${uid}`, data);
    return response.data;
};

export const deleteSchoolAdmin = async (uid: string): Promise<void> => {
    await authAxios.delete(`${baseUrl}/${uid}`);
};
