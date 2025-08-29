import { apiUrl, authAxios } from './index';

const baseUrl = `${apiUrl}/assessments/baseline`;

export interface BaselineAssessment {
    _id: string;
    studentId: {
        _id: string;
        name: string;
    };
    schoolId: {
        _id: string;
        name: string;
    };
    mentorId: {
        _id: string;
        name: string;
    };
    scores: {
        reading: number;
        writing: number;
        speaking: number;
        listening: number;
    };
    remarks: string;
    assessmentDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBaselineAssessmentDTO {
    studentId: string;
    scores: {
        reading: number;
        writing: number;
        speaking: number;
        listening: number;
    };
    remarks: string;
    assessmentDate: string;
}

export interface UpdateBaselineAssessmentDTO {
    scores?: {
        reading?: number;
        writing?: number;
        speaking?: number;
        listening?: number;
    };
    remarks?: string;
    assessmentDate?: string;
}

export const createBaselineAssessment = async (data: CreateBaselineAssessmentDTO): Promise<BaselineAssessment> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};

export const getBaselineAssessments = async (
    schoolId?: string,
    studentId?: string,
    mentorId?: string
): Promise<BaselineAssessment[]> => {
    const response = await authAxios.get(baseUrl, {
        params: { schoolId, studentId, mentorId }
    });
    return response.data;
};

export const getBaselineAssessment = async (id: string): Promise<BaselineAssessment> => {
    const response = await authAxios.get(`${baseUrl}/${id}`);
    return response.data;
};

export const updateBaselineAssessment = async (
    id: string,
    data: UpdateBaselineAssessmentDTO
): Promise<BaselineAssessment> => {
    const response = await authAxios.put(`${baseUrl}/${id}`, data);
    return response.data;
};

export const deleteBaselineAssessment = async (id: string): Promise<void> => {
    await authAxios.delete(`${baseUrl}/${id}`);
};
