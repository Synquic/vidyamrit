import { authAxios } from "./index";

export type ProgressFlag =
  | "improving"
  | "struggling"
  | "excelling"
  | "average"
  | "needs_attention";
export type Subject = "hindi" | "math" | "english";

export interface ProgressHistory {
  flag: ProgressFlag;
  subject: Subject;
  reason: string;
  date: string;
  mentorId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface StudentProgress {
  studentId: string;
  name: string;
  class: string;
  school: {
    _id: string;
    name: string;
  };
  currentProgressFlags: {
    hindi?: ProgressFlag;
    math?: ProgressFlag;
    english?: ProgressFlag;
  };
  lastAssessmentDate?: string;
  totalAssessments: number;
  averagePerformance: number;
  levels: {
    hindi?: number;
    math?: number;
    english?: number;
  };
  progressHistory?: ProgressHistory[];
}

export interface ProgressStatistics {
  statistics: {
    totalStudents: number;
    bySubject: {
      hindi: Record<ProgressFlag, number>;
      math: Record<ProgressFlag, number>;
      english: Record<ProgressFlag, number>;
    };
    overall: Record<ProgressFlag, number>;
  };
  students?: Array<{
    _id: string;
    name: string;
    class: string;
    school: string;
    hindiFlag?: ProgressFlag;
    mathFlag?: ProgressFlag;
    englishFlag?: ProgressFlag;
    levels: {
      hindi?: number;
      math?: number;
      english?: number;
    };
  }>;
}

export interface UpdateProgressRequest {
  subject: Subject;
  flag: ProgressFlag;
  reason: string;
}

export interface BulkUpdateRequest {
  updates: Array<{
    studentId: string;
    subject: Subject;
    flag: ProgressFlag;
    reason: string;
  }>;
}

export interface ProgressTrends {
  studentId: string;
  subject: string;
  period: string;
  currentFlags: {
    hindi?: ProgressFlag;
    math?: ProgressFlag;
    english?: ProgressFlag;
  };
  trends: ProgressHistory[];
}

// Update progress flag for a single student
export const updateProgressFlag = async (
  studentId: string,
  data: UpdateProgressRequest
): Promise<{ message: string; student: StudentProgress }> => {
  const response = await authAxios.put(`/progress/student/${studentId}`, data);
  return response.data;
};

// Get student progress information
export const getStudentProgress = async (
  studentId: string,
  includeHistory: boolean = false
): Promise<StudentProgress> => {
  const searchParams = new URLSearchParams();
  if (includeHistory) searchParams.append("includeHistory", "true");

  const queryString = searchParams.toString();
  const url = `/progress/student/${studentId}${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await authAxios.get(url);
  return response.data;
};

// Get progress statistics
export const getProgressStatistics = async (
  schoolId?: string,
  subject?: Subject,
  flag?: ProgressFlag
): Promise<ProgressStatistics> => {
  const searchParams = new URLSearchParams();

  if (schoolId) searchParams.append("schoolId", schoolId);
  if (subject) searchParams.append("subject", subject);
  if (flag) searchParams.append("flag", flag);

  const queryString = searchParams.toString();
  const url = `/progress/statistics${queryString ? `?${queryString}` : ""}`;

  const response = await authAxios.get(url);
  return response.data;
};

// Bulk update progress flags
export const bulkUpdateProgressFlags = async (
  data: BulkUpdateRequest
): Promise<{
  message: string;
  results: { successful: number; failed: number; errors: string[] };
}> => {
  const response = await authAxios.post("/progress/bulk-update", data);
  return response.data;
};

// Get progress trends for a student
export const getProgressTrends = async (
  studentId: string,
  subject?: Subject,
  days: number = 30
): Promise<ProgressTrends> => {
  const searchParams = new URLSearchParams();
  searchParams.append("studentId", studentId);
  if (subject) searchParams.append("subject", subject);
  searchParams.append("days", days.toString());

  const queryString = searchParams.toString();
  const url = `/progress/trends?${queryString}`;

  const response = await authAxios.get(url);
  return response.data;
};

// Helper function to get flag color
export const getProgressFlagColor = (flag: ProgressFlag): string => {
  const colors = {
    excelling: "bg-green-100 text-green-800",
    improving: "bg-blue-100 text-blue-800",
    average: "bg-gray-100 text-gray-800",
    struggling: "bg-yellow-100 text-yellow-800",
    needs_attention: "bg-red-100 text-red-800",
  };
  return colors[flag] || "bg-gray-100 text-gray-800";
};

// Helper function to get flag icon
export const getProgressFlagIcon = (flag: ProgressFlag): string => {
  const icons = {
    excelling: "🌟",
    improving: "📈",
    average: "➖",
    struggling: "⚠️",
    needs_attention: "🚨",
  };
  return icons[flag] || "➖";
};

// Helper function to get flag description
export const getProgressFlagDescription = (flag: ProgressFlag): string => {
  const descriptions = {
    excelling: "Performing exceptionally well, exceeding expectations",
    improving: "Showing consistent improvement and progress",
    average: "Meeting expected performance standards",
    struggling: "Facing challenges but can improve with support",
    needs_attention: "Requires immediate attention and intervention",
  };
  return descriptions[flag] || "No description available";
};
