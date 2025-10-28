import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/cohorts`;

export interface Cohort {
  _id: string;
  name: string;
  schoolId: {
    _id: string;
    name: string;
  };
  tutorId: {
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
  tutorId: string;
  students: string[];
}

export interface UpdateCohortDTO {
  name?: string;
  tutorId?: string;
  students?: string[];
}

export const createCohort = async (data: CreateCohortDTO): Promise<Cohort> => {
  const response = await authAxios.post(baseUrl, data);
  return response.data;
};

export const getCohorts = async (schoolId?: string): Promise<Cohort[]> => {
  const response = await authAxios.get(baseUrl, {
    params: schoolId ? { schoolId } : {},
  });
  return response.data;
};

export const getCohort = async (id: string): Promise<Cohort> => {
  const response = await authAxios.get(`${baseUrl}/${id}`);
  return response.data;
};

export const updateCohort = async (
  id: string,
  data: UpdateCohortDTO
): Promise<Cohort> => {
  const response = await authAxios.put(`${baseUrl}/${id}`, data);
  return response.data;
};

export const deleteCohort = async (id: string): Promise<void> => {
  await authAxios.delete(`${baseUrl}/${id}`);
};

export const addStudentToDefaultCohort = async (data: {
  studentId: string;
  schoolId: string;
  tutorId: string;
}): Promise<Cohort> => {
  const response = await authAxios.post(`${baseUrl}/add-to-default`, data);
  return response.data;
};

export interface GenerateCohortsResponse {
  message: string;
  cohorts: Cohort[];
  studentsAssigned: number;
  levelDistribution: Array<{
    level: number | string;
    students: number;
  }>;
}

export const generateOptimalCohorts = async (data: {
  schoolId: string;
  programId: string;
}): Promise<GenerateCohortsResponse> => {
  const response = await authAxios.post(`${baseUrl}/generate-optimal`, data);
  return response.data;
};
