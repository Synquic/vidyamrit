import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/cohorts`;

// Types
export interface Cohort {
  _id: string;
  name: string;
  schoolId: string | { _id: string; name: string };
  tutorId: string | { _id: string; name: string };
  programId?: string;
  currentLevel?: number;
  startDate?: string;
  status?: 'active' | 'pending' | 'completed' | 'archived';
  students: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCohortDTO {
  name: string;
  schoolId: string;
  tutorId: string;
  students: string[];
  programId?: string;
  currentLevel?: number;
}

export interface UpdateCohortDTO {
  name?: string;
  tutorId?: string;
  students?: string[];
  programId?: string;
  currentLevel?: number;
  status?: 'active' | 'pending' | 'completed' | 'archived';
}

export interface GenerateCohortsResponse {
  message: string;
  cohorts: Cohort[];
  studentsAssigned: number;
  pendingStudents: Array<{
    program: string;
    level: number | string;
    students: number;
  }>;
  totalPendingStudents: number;
  strategy: 'high-first' | 'low-first';
  capacityLimit: number;
  programsProcessed: number;
  programResults: Array<{
    programName: string;
    programSubject: string;
    cohortsCreated: number;
    studentsAssigned: number;
    pendingStudents: number;
  }>;
}

// API Functions
export const getCohorts = async (schoolId?: string): Promise<Cohort[]> => {
  const params = schoolId ? { schoolId } : {};
  const response = await authAxios.get(baseUrl, { params });
  return response.data;
};

export const getCohort = async (id: string): Promise<Cohort> => {
  const response = await authAxios.get(`${baseUrl}/${id}`);
  return response.data;
};

export const createCohort = async (data: CreateCohortDTO): Promise<Cohort> => {
  const response = await authAxios.post(baseUrl, data);
  return response.data;
};

export const updateCohort = async (id: string, data: UpdateCohortDTO): Promise<Cohort> => {
  const response = await authAxios.put(`${baseUrl}/${id}`, data);
  return response.data;
};

export const deleteCohort = async (id: string): Promise<void> => {
  await authAxios.delete(`${baseUrl}/${id}`);
};

export const generateOptimalCohorts = async (data: {
  schoolId: string;
  strategy?: 'high-first' | 'low-first';
  capacityLimit?: number;
}): Promise<GenerateCohortsResponse> => {
  const response = await authAxios.post(`${baseUrl}/generate-optimal`, data);
  return response.data;
};

// Check if cohort is ready for level-up assessment
export const checkAssessmentReadiness = async (
  cohortId: string
): Promise<{
  cohortId: string;
  cohortName: string;
  currentLevel: number;
  levelTitle: string;
  isReadyForAssessment: boolean;
  weeksCompleted: number;
  weeksRequired: number;
  completionPercentage: number;
  daysRemaining?: number;
  nextLevel: {
    levelNumber: number;
    title: string;
    description: string;
  } | null;
  message: string;
}> => {
  const response = await authAxios.get(`${baseUrl}/${cohortId}/assessment-readiness`);
  return response.data;
};

// Toggle holiday for a cohort date
export const toggleCohortHoliday = async (
  cohortId: string,
  date: string
): Promise<{
  message: string;
  isHoliday: boolean;
  date: string;
}> => {
  const response = await authAxios.post(`${baseUrl}/${cohortId}/toggle-holiday`, { date });
  return response.data;
};
