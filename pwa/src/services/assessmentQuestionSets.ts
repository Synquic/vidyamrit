import { apiUrl, authAxios } from './index';

const baseUrl = `${apiUrl}/question-sets`;

export interface AssessmentQuestionSet {
    _id: string;
    subject: string;
    version: number;
    levels: Array<{
        level: number;
        title: string;
        instructions: string;
        questions: Array<{
            question: string;
            options?: string[];
            correct_answer?: string;
        }>;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAssessmentQuestionSetDTO {
    subject: string;
    version?: number;
    levels: Array<{
        level: number;
        title: string;
        instructions: string;
        questions: Array<{
            question: string;
            options?: string[];
            correct_answer?: string;
        }>;
    }>;
}

export interface UpdateAssessmentQuestionSetDTO {
    subject?: string;
    version?: number;
    levels?: Array<{
        level: number;
        title: string;
        instructions: string;
        questions: Array<{
            question: string;
            options?: string[];
            correct_answer?: string;
        }>;
    }>;
}

export const createAssessmentQuestionSet = async (data: CreateAssessmentQuestionSetDTO): Promise<AssessmentQuestionSet> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};

export const getAssessmentQuestionSets = async (): Promise<AssessmentQuestionSet[]> => {
    const response = await authAxios.get(baseUrl);
    return response.data;
};

export const getAssessmentQuestionSet = async (id: string): Promise<AssessmentQuestionSet> => {
    const response = await authAxios.get(`${baseUrl}/${id}`);
    return response.data;
};

export const updateAssessmentQuestionSet = async (id: string, data: UpdateAssessmentQuestionSetDTO): Promise<AssessmentQuestionSet> => {
    const response = await authAxios.put(`${baseUrl}/${id}`, data);
    return response.data;
};

export const deleteAssessmentQuestionSet = async (id: string): Promise<void> => {
    await authAxios.delete(`${baseUrl}/${id}`);
};
