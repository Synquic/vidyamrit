import { apiUrl, authAxios } from './index';

const baseUrl = `${apiUrl}/mentors`;

export interface Mentor {
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

export interface CreateMentorDTO {
    name: string;
    email: string;
    password: string;
    schoolId: string;
}

export interface UpdateMentorDTO {
    name?: string;
    email?: string;
    schoolId?: string | null;
}

export const createMentor = async (data: CreateMentorDTO): Promise<Mentor> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};

export const getMentors = async (schoolId?: string): Promise<Mentor[]> => {
    const response = await authAxios.get(baseUrl, {
        params: { schoolId }
    });
    return response.data;
};

export const getMentor = async (uid: string): Promise<Mentor> => {
    const response = await authAxios.get(`${baseUrl}/${uid}`);
    return response.data;
};

export const updateMentor = async (uid: string, data: UpdateMentorDTO): Promise<Mentor> => {
    const response = await authAxios.put(`${baseUrl}/${uid}`, data);
    return response.data;
};

export const deleteMentor = async (uid: string): Promise<void> => {
    await authAxios.delete(`${baseUrl}/${uid}`);
};
