import { apiUrl, authAxios } from './index';

const baseUrl = `${apiUrl}/cohorts`;

export interface Cohort {
    _id: string;
    name: string;
    schoolId: {
        _id: string;
        name: string;
    };
    mentorId: {
        _id: string;
        name: string;
    };
    students: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateCohortDTO {
    name: string;
    schoolId: string;
    mentorId: string;
    students: string[];
}

export interface UpdateCohortDTO {
    name?: string;
    mentorId?: string;
    students?: string[];
}

export const createCohort = async (data: CreateCohortDTO): Promise<Cohort> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};

export const getCohorts = async (): Promise<Cohort[]> => {
    const response = await authAxios.get(baseUrl);
    return response.data;
};

export const getCohort = async (id: string): Promise<Cohort> => {
    const response = await authAxios.get(`${baseUrl}/${id}`);
    return response.data;
};

export const updateCohort = async (id: string, data: UpdateCohortDTO): Promise<Cohort> => {
    const response = await authAxios.put(`${baseUrl}/${id}`, data);
    return response.data;
};

export const deleteCohort = async (id: string): Promise<void> => {
    await authAxios.delete(`${baseUrl}/${id}`);
};