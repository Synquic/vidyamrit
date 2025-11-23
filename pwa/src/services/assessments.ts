import { apiUrl, authAxios } from './index';

const baseUrl = `${apiUrl}/assessments`;

export interface Assessment {
    _id: string;
    student: string;
    school: string;
    mentor: string;
    subject: 'hindi' | 'math' | 'english';
    level: number;
    date: string;
}

export interface CreateAssessmentDTO {
    student: string;
    school: string;
    mentor: string;
    subject: string;
    level: number;
    program: string; // Program ID
    date?: string;
}

export const getAssessments = async (): Promise<Assessment[]> => {
    const response = await authAxios.get(baseUrl);
    return response.data;
};

export const getAssessment = async (id: string): Promise<Assessment> => {
    const response = await authAxios.get(`${baseUrl}/${id}`);
    return response.data;
};

export const createAssessment = async (data: CreateAssessmentDTO): Promise<Assessment> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};
