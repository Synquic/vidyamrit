import { apiUrl, authAxios } from '@/services/index';

const baseUrl = apiUrl + '/schools';

export interface School {
    _id?: string;
    name: string;
    address: string;
    udise_code: string;
    type: 'government' | 'private';
    level: 'primary' | 'middle';
    city: string;
    state: string;
    pinCode: string;
    establishedYear: number;
    school_admin: string;
    contact_details: {
        designation: string;
        name: string;
        email: string;
        phone_no: string;
    }[];
    evaluationChecklist?: {
        minEligibleStudents?: {
            eligibleCount?: number;
            meetsCriteria?: boolean;
            notes?: string;
        };
        dedicatedRoom?: {
            images?: string[];
            notes?: string;
            submittedAt?: string;
        };
        supportDocuments?: {
            documents?: { name: string; url: string }[];
            submittedAt?: string;
        };
        ngoHistory?: Array<{ image?: string; text?: string; date?: string }>;
        infrastructureAdequacy?: {
            rating?: number;
            notes?: string;
        };
        systemOutput?: 'include' | 'followup' | 'reject';
        status?: 'active' | 'inactive' | 'rejected' | 'followup';
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export const getSchools = async (): Promise<School[]> => {
    const response = await authAxios.get(baseUrl);
    return response.data;
};

export const getSchool = async (id: string): Promise<School> => {
    const response = await authAxios.get(`${baseUrl}/${id}`);
    return response.data;
};

export const createSchool = async (data: Omit<School, '_id' | 'createdAt' | 'updatedAt'>): Promise<School> => {
    const response = await authAxios.post(baseUrl, data);
    return response.data;
};

export const updateSchool = async (id: string, data: Partial<School>): Promise<School> => {
    const response = await authAxios.put(`${baseUrl}/${id}`, data);
    return response.data;
};

export const deleteSchool = async (id: string): Promise<void> => {
    const response = await authAxios.delete(`${baseUrl}/${id}`);
    return response.data;
};
