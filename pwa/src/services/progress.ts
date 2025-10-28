import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/progress`;

export type ProgressStatus = "green" | "yellow" | "orange" | "red";

export interface StudentProgress {
  studentId: string;
  currentLevel: number;
  status: ProgressStatus;
  lastUpdated: string;
  failureCount: number;
  lastAssessmentDate: string;
  assessmentHistory: Array<{
    date: string;
    level: number;
    passed: boolean;
    status: ProgressStatus;
  }>;
}

export interface StudentProgressData {
  student: {
    _id: string;
    name: string;
    roll_no: string;
    class: string;
  };
  progress: StudentProgress;
}

export interface CohortProgressData {
  cohort: {
    _id: string;
    name: string;
    school: {
      _id: string;
      name: string;
    };
    program: {
      _id: string;
      name: string;
      subject: string;
      totalLevels: number;
      levels: Array<{
        levelNumber: number;
        title: string;
        timeframe: number;
        timeframeUnit: string;
      }>;
    };
  };
  studentsProgress: StudentProgressData[];
  timeTracking: {
    cohortStartDate: string;
    estimatedCompletionDate: string;
    totalDurationWeeks: number;
    elapsedWeeks: number;
    remainingWeeks: number;
    nextAssessmentDue: string;
    daysUntilNextAssessment: number;
  };
}

export interface TutorProgressSummary {
  cohort: {
    _id: string;
    name: string;
    school: {
      _id: string;
      name: string;
    };
    program: {
      _id: string;
      name: string;
      subject: string;
      totalLevels: number;
    };
  };
  summary: {
    totalStudents: number;
    progressCounts: {
      green: number;
      yellow: number;
      orange: number;
      red: number;
    };
    levelDistribution: { [level: number]: number };
    studentsNeedingAttention: number;
  };
  timeTracking: {
    cohortStartDate: string;
    estimatedCompletionDate: string;
    totalDurationWeeks: number;
    elapsedWeeks: number;
    remainingWeeks: number;
    nextAssessmentDue: string;
    daysUntilNextAssessment: number;
    currentLevelTimeframe: {
      level: number;
      durationWeeks: number;
      startDate: string;
      endDate: string;
    };
  };
}

export interface StudentReadyForAssessment {
  student: {
    _id: string;
    name: string;
    roll_no: string;
    class: string;
  };
  progress: StudentProgress;
  daysInCurrentLevel: number;
  timeframeCompleted: boolean;
  nextLevel: number;
}

export interface StudentsReadyData {
  cohort: {
    _id: string;
    name: string;
  };
  studentsReady: StudentReadyForAssessment[];
  totalReady: number;
}

export interface UpdateProgressDTO {
  cohortId: string;
  studentId: string;
  currentLevel: number;
  assessmentPassed: boolean;
  failureCount?: number;
}

export interface StudentProgressHistory {
  student: {
    _id: string;
    name: string;
    roll_no: string;
    class: string;
  };
  currentProgress: {
    currentLevel: number;
    status: ProgressStatus;
    failureCount: number;
    lastUpdated: string;
    lastAssessmentDate: string;
  };
  assessmentHistory: Array<{
    date: string;
    level: number;
    passed: boolean;
    status: ProgressStatus;
  }>;
}

// Update student progress after assessment
export const updateStudentProgress = async (
  data: UpdateProgressDTO
): Promise<{
  message: string;
  progress: StudentProgress;
}> => {
  const response = await authAxios.post(`${baseUrl}/update`, data);
  return response.data;
};

// Get progress for all students in a cohort
export const getCohortProgress = async (
  cohortId: string
): Promise<CohortProgressData> => {
  const response = await authAxios.get(`${baseUrl}/cohort/${cohortId}`);
  return response.data;
};

// Get progress summary for tutor's cohorts
export const getTutorProgressSummary = async (): Promise<TutorProgressSummary[]> => {
  const response = await authAxios.get(`${baseUrl}/tutor/summary`);
  return response.data;
};

// Get students ready for level transition assessment
export const getStudentsReadyForAssessment = async (
  cohortId: string
): Promise<StudentsReadyData> => {
  const response = await authAxios.get(`${baseUrl}/cohort/${cohortId}/ready-for-assessment`);
  return response.data;
};

// Get detailed progress history for a student
export const getStudentProgressHistory = async (
  cohortId: string,
  studentId: string
): Promise<StudentProgressHistory> => {
  const response = await authAxios.get(`${baseUrl}/cohort/${cohortId}/student/${studentId}/history`);
  return response.data;
};

// Helper function to get status color
export const getProgressStatusColor = (status: ProgressStatus): string => {
  const colors = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    red: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

// Helper function to get status description
export const getProgressStatusDescription = (status: ProgressStatus): string => {
  const descriptions = {
    green: "On track - progressing well",
    yellow: "First assessment failure - needs support",
    orange: "Second assessment failure - requires attention",
    red: "Third assessment failure - urgent intervention needed",
  };
  return descriptions[status] || "Unknown status";
};
