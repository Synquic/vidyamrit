import { authAxios, apiUrl } from "./index";

export interface DashboardAnalytics {
  overview: {
    totalSchools: number;
    activeSchools: number;
    schoolsWithBaseline: number;
    totalStudents: number;
    activeStudents: number;
    droppedStudents: number;
    totalCohorts: number;
    activeCohorts: number;
    completedCohorts: number;
    totalTutors: number;
    engagedTutors: number;
    totalAssessments: number;
    attendanceRate: number;
    assessmentSuccessRate: number;
  };
  charts: {
    progressDistribution: Array<{ _id: string; count: number }>;
    monthlyEnrollment: Array<{ _id: { year: number; month: number }; count: number }>;
    cohortPerformance: Array<{
      name: string;
      currentLevel: number;
      totalStudents: number;
      averageProgress: number;
    }>;
    schoolTypeDistribution: Array<{ _id: string; count: number }>;
    attendanceData: {
      present: number;
      absent: number;
    };
  };
  recentActivities: any[];
}

export interface PerformanceTrends {
  period: string;
  trends: Array<{
    _id: any;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
  }>;
}

/**
 * Get dashboard analytics
 */
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const response = await authAxios.get(`${apiUrl}/analytics/dashboard`);
  return response.data;
};

/**
 * Get school-specific analytics
 */
export const getSchoolAnalytics = async (schoolId: string) => {
  const response = await authAxios.get(`${apiUrl}/analytics/school/${schoolId}`);
  return response.data;
};

/**
 * Get performance trends
 */
export const getPerformanceTrends = async (period: string = "month"): Promise<PerformanceTrends> => {
  const response = await authAxios.get(`${apiUrl}/analytics/trends`, {
    params: { period }
  });
  return response.data;
};
