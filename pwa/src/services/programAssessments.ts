import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/program-assessments`;

export interface ProgramAssessment {
  _id: string;
  program: {
    _id: string;
    name: string;
    levels: any[];
  };
  student: {
    _id: string;
    name: string;
  };
  tutor: {
    _id: string;
    name: string;
  };
  school: {
    _id: string;
    name: string;
  };
  status: "in-progress" | "completed" | "paused";
  currentLevel: number;
  algorithmState: {
    oscillationCount: number;
    consecutiveCorrect: number;
    consecutiveIncorrect: number;
    levelHistory: number[];
    hasOscillated: boolean;
    finalLevel?: number;
  };
  questions: Array<{
    questionText: string;
    level: number;
    answer: boolean | null;
    timestamp: Date;
  }>;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProgramAssessmentDTO {
  programId: string;
  studentId: string;
  schoolId: string;
}

export interface SubmitAnswerDTO {
  assessmentId: string;
  questionId: string;
  userAnswer: string | boolean | number;
  timeSpent: number;
}

export interface CurrentQuestion {
  questionText: string;
  level: number;
  isComplete: boolean;
  finalLevel?: number;
}

export interface AssessmentStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentLevel: number;
  finalLevel?: number;
  oscillationCount: number;
  hasOscillated: boolean;
}

/**
 * Create a new program-based assessment for a student
 */
export const createProgramAssessment = async (
  data: CreateProgramAssessmentDTO
): Promise<ProgramAssessment> => {
  console.log("=== API CALL DEBUG ===");
  console.log("Data sent to API:", data);
  console.log("Data keys:", Object.keys(data));
  console.log("Data values:", Object.values(data));
  console.log("Data JSON:", JSON.stringify(data));
  console.log("=======================");

  try {
    const response = await authAxios.post(baseUrl, data);
    console.log("API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    console.error("API error response:", (error as any).response?.data);
    throw error;
  }
};

/**
 * Get all program assessments with optional filtering
 */
export const getProgramAssessments = async (
  schoolId?: string,
  studentId?: string,
  tutorId?: string,
  programId?: string,
  status?: "in-progress" | "completed" | "paused"
): Promise<ProgramAssessment[]> => {
  const response = await authAxios.get(baseUrl, {
    params: { schoolId, studentId, tutorId, programId, status },
  });
  return response.data;
};

/**
 * Get a specific program assessment by ID
 */
export const getProgramAssessment = async (
  id: string
): Promise<ProgramAssessment> => {
  const response = await authAxios.get(`${baseUrl}/${id}`);
  return response.data;
};

/**
 * Get the current question for an active assessment
 */
export const getCurrentQuestion = async (
  assessmentId: string
): Promise<CurrentQuestion> => {
  const response = await authAxios.get(
    `${baseUrl}/${assessmentId}/current-question`
  );
  return response.data;
};

/**
 * Submit an answer for the current question
 */
export const submitAnswer = async (
  data: SubmitAnswerDTO
): Promise<CurrentQuestion> => {
  const response = await authAxios.post(`${baseUrl}/submit-answer`, data);
  return response.data;
};

/**
 * Get assessment statistics and progress
 */
export const getAssessmentStats = async (
  assessmentId: string
): Promise<AssessmentStats> => {
  const response = await authAxios.get(`${baseUrl}/${assessmentId}/stats`);
  return response.data;
};

/**
 * Pause an active assessment
 */
export const pauseAssessment = async (
  assessmentId: string
): Promise<ProgramAssessment> => {
  const response = await authAxios.put(`${baseUrl}/${assessmentId}/pause`);
  return response.data;
};

/**
 * Resume a paused assessment
 */
export const resumeAssessment = async (
  assessmentId: string
): Promise<ProgramAssessment> => {
  const response = await authAxios.put(`${baseUrl}/${assessmentId}/resume`);
  return response.data;
};

/**
 * Complete an assessment manually (admin/tutor action)
 */
export const completeAssessment = async (
  assessmentId: string
): Promise<ProgramAssessment> => {
  const response = await authAxios.put(`${baseUrl}/${assessmentId}/complete`);
  return response.data;
};

/**
 * Delete an assessment (admin action)
 */
export const deleteAssessment = async (assessmentId: string): Promise<void> => {
  await authAxios.delete(`${baseUrl}/${assessmentId}`);
};

/**
 * Get assessment history for a student across all programs
 */
export const getStudentAssessmentHistory = async (
  studentId: string
): Promise<ProgramAssessment[]> => {
  const response = await authAxios.get(
    `${baseUrl}/student/${studentId}/history`
  );
  return response.data;
};

/**
 * Get assessment analytics for a program
 */
export const getProgramAssessmentAnalytics = async (programId: string) => {
  const response = await authAxios.get(
    `${baseUrl}/program/${programId}/analytics`
  );
  return response.data;
};

/**
 * Export assessment data for reporting
 */
export const exportAssessmentData = async (filters: {
  schoolId?: string;
  programId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Blob> => {
  const response = await authAxios.get(`${baseUrl}/export`, {
    params: filters,
    responseType: "blob",
  });
  return response.data;
};
