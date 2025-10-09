import { authAxios, apiUrl } from "./index";

// Analytics Dashboard Types
export interface AnalyticsDashboard {
  _id: string;
  schoolId: {
    _id: string;
    name: string;
    address: string;
  };
  dashboardType:
    | "school_overview"
    | "student_performance"
    | "teacher_effectiveness"
    | "attendance_analytics"
    | "behavioral_insights"
    | "academic_trends";
  dateRange: {
    startDate: Date;
    endDate: Date;
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  };
  studentPerformance: StudentPerformanceAnalytics;
  attendanceAnalytics: AttendanceAnalytics;
  teacherEffectiveness: TeacherEffectivenessAnalytics;
  behavioralInsights: BehavioralInsights;
  academicTrends: AcademicTrends;
  resourceUtilization: ResourceUtilization;
  kpis: KPI[];
  insights: AnalyticsInsight[];
  generatedAt: Date;
  generatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  lastUpdated: Date;
  refreshFrequency: "realtime" | "hourly" | "daily" | "weekly";
  dataQuality: DataQuality;
  sharing: SharingSettings;
}

export interface StudentPerformanceAnalytics {
  totalStudents: number;
  activeStudents: number;
  averageGPA: number;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
  performanceTrends: Array<{
    date: Date;
    averageScore: number;
    passRate: number;
    improvementRate: number;
  }>;
  topPerformers: Array<{
    studentId: string;
    name: string;
    gpa: number;
    trend: "improving" | "stable" | "declining";
  }>;
  atRiskStudents: Array<{
    studentId: string;
    name: string;
    riskFactors: string[];
    riskLevel: "low" | "medium" | "high" | "critical";
    interventionSuggestions: string[];
  }>;
  subjectWisePerformance: Array<{
    subject: string;
    averageScore: number;
    passRate: number;
    trend: "improving" | "stable" | "declining";
    weakAreas: string[];
    recommendations: string[];
  }>;
}

export interface AttendanceAnalytics {
  overallAttendanceRate: number;
  attendanceTrends: Array<{
    date: Date;
    attendanceRate: number;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    lateArrivals: number;
  }>;
  classWiseAttendance: Array<{
    className: string;
    attendanceRate: number;
    averageDailyAttendance: number;
    chronicallyAbsent: number;
  }>;
  attendancePatterns: {
    dailyPatterns: Array<{
      dayOfWeek: string;
      averageAttendance: number;
    }>;
    monthlyPatterns: Array<{
      month: string;
      averageAttendance: number;
    }>;
    seasonalTrends: Array<{
      season: string;
      averageAttendance: number;
      factors: string[];
    }>;
  };
  absenteeismAnalysis: {
    frequentAbsentees: Array<{
      studentId: string;
      name: string;
      absentDays: number;
      absenteeRate: number;
      reasons: string[];
    }>;
    absenteeismTriggers: string[];
    interventionSuccess: Array<{
      intervention: string;
      beforeRate: number;
      afterRate: number;
      improvement: number;
    }>;
  };
}

export interface TeacherEffectivenessAnalytics {
  teacherPerformance: Array<{
    teacherId: string;
    name: string;
    subjects: string[];
    studentOutcomes: {
      averageGPA: number;
      passRate: number;
      improvementRate: number;
      studentSatisfaction: number;
    };
    classManagement: {
      attendanceRate: number;
      behavioralIncidents: number;
      engagementLevel: number;
    };
    professionalDevelopment: {
      certifications: number;
      trainingsCompleted: number;
      skillRating: number;
    };
    effectiveness: "excellent" | "good" | "satisfactory" | "needs_improvement";
    recommendations: string[];
  }>;
  subjectExpertise: Array<{
    subject: string;
    expertsCount: number;
    averageExperience: number;
    studentOutcomes: number;
    trainingNeeds: string[];
  }>;
  professionalGrowth: Array<{
    metric: string;
    currentValue: number;
    targetValue: number;
    progress: number;
    timeline: string;
  }>;
}

export interface BehavioralInsights {
  overallBehaviorScore: number;
  behaviorTrends: Array<{
    date: Date;
    positiveIncidents: number;
    negativeIncidents: number;
    behaviorScore: number;
  }>;
  incidentAnalysis: {
    totalIncidents: number;
    incidentTypes: Array<{
      type: string;
      count: number;
      severity: string;
      trend: "increasing" | "stable" | "decreasing";
    }>;
    commonTriggers: string[];
    interventionEffectiveness: Array<{
      intervention: string;
      successRate: number;
      averageResolutionTime: number;
    }>;
  };
  studentBehaviorProfiles: Array<{
    studentId: string;
    name: string;
    behaviorRating: number;
    improvements: string[];
    concerns: string[];
    recommendedSupport: string[];
  }>;
  environmentalFactors: Array<{
    factor: string;
    impact: number;
    correlation: number;
    recommendations: string[];
  }>;
}

export interface AcademicTrends {
  yearOverYearComparison: Array<{
    metric: string;
    currentYear: number;
    previousYear: number;
    changePercentage: number;
    trend: "improving" | "stable" | "declining";
  }>;
  seasonalPatterns: Array<{
    period: string;
    expectedPerformance: number;
    actualPerformance: number;
    variance: number;
    factors: string[];
  }>;
  predictiveInsights: Array<{
    prediction: string;
    confidence: number;
    timeframe: string;
    factors: string[];
    recommendations: string[];
  }>;
  curriculumEffectiveness: Array<{
    subject: string;
    curriculum: string;
    effectiveness: number;
    studentFeedback: number;
    learningOutcomes: Array<{
      outcome: string;
      achievement: number;
      benchmark: number;
    }>;
  }>;
}

export interface ResourceUtilization {
  facilityUsage: Array<{
    facility: string;
    utilizationRate: number;
    peakHours: string[];
    maintenanceNeeds: string[];
  }>;
  technologyAdoption: Array<{
    tool: string;
    adoptionRate: number;
    effectiveness: number;
    userSatisfaction: number;
    trainingNeeds: string[];
  }>;
  budgetAllocation: Array<{
    category: string;
    allocated: number;
    spent: number;
    efficiency: number;
    roi: number;
  }>;
}

export interface KPI {
  name: string;
  category: string;
  currentValue: number;
  targetValue: number;
  previousValue: number;
  trend: "improving" | "stable" | "declining";
  status: "excellent" | "good" | "warning" | "critical";
  actionRequired: boolean;
  recommendations: string[];
}

export interface AnalyticsInsight {
  type: "alert" | "opportunity" | "recommendation" | "achievement";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  dataPoints: Array<{
    metric: string;
    value: number;
    context: string;
  }>;
  suggestedActions: Array<{
    action: string;
    impact: string;
    effort: "low" | "medium" | "high";
    timeline: string;
  }>;
  category: string;
  confidence: number;
  stakeholders: string[];
}

export interface DataQuality {
  completeness: number;
  accuracy: number;
  timeliness: number;
  issues: string[];
}

export interface SharingSettings {
  isPublic: boolean;
  sharedWith: Array<{
    userId: string;
    role: string;
    permissions: string[];
  }>;
  exportFormats: string[];
  scheduledReports: Array<{
    frequency: string;
    recipients: string[];
    format: string;
    nextDelivery: Date;
  }>;
}

export interface RealTimeAnalytics {
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
  };
  activeStudents: number;
  timestamp: Date;
}

export interface PerformanceInsights {
  trends: Array<{
    metric: string;
    direction: "up" | "down" | "stable";
    change: number;
    period: string;
  }>;
  predictions: Array<{
    metric: string;
    predictedValue: number;
    confidence: number;
    timeframe: string;
  }>;
  recommendations: Array<{
    area: string;
    recommendation: string;
    impact: string;
    priority: "low" | "medium" | "high";
  }>;
}

export interface PredictiveAnalytics {
  predictions: Array<{
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeframe: string;
    factors: string[];
  }>;
  confidence: number;
  factors: string[];
}

export interface KPITrends {
  trends: Array<{
    date: Date;
    value: number;
    target: number;
    variance: number;
  }>;
  forecast: Array<{
    date: Date;
    predictedValue: number;
    confidence: number;
  }>;
}

// Request interfaces
export interface CreateDashboardRequest {
  schoolId?: string;
  dashboardType: AnalyticsDashboard["dashboardType"];
  dateRange: {
    startDate: string;
    endDate: string;
    period: AnalyticsDashboard["dateRange"]["period"];
  };
}

export interface DashboardFilters {
  schoolId?: string;
  dashboardType?: AnalyticsDashboard["dashboardType"];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class AnalyticsService {
  private baseUrl = `${apiUrl}/analytics`;

  // Dashboard Management
  async generateDashboard(
    data: CreateDashboardRequest
  ): Promise<AnalyticsDashboard> {
    const response = await authAxios.post(`${this.baseUrl}/dashboard`, data);
    return response.data.dashboard;
  }

  async getDashboards(filters: DashboardFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await authAxios.get(
      `${this.baseUrl}/dashboards?${params.toString()}`
    );
    return response.data;
  }

  async getDashboardById(id: string): Promise<AnalyticsDashboard> {
    const response = await authAxios.get(`${this.baseUrl}/dashboard/${id}`);
    return response.data.dashboard;
  }

  async updateDashboard(
    id: string,
    updates: Partial<AnalyticsDashboard>
  ): Promise<AnalyticsDashboard> {
    const response = await authAxios.put(
      `${this.baseUrl}/dashboard/${id}`,
      updates
    );
    return response.data.dashboard;
  }

  async deleteDashboard(id: string): Promise<void> {
    await authAxios.delete(`${this.baseUrl}/dashboard/${id}`);
  }

  // Real-time Analytics
  async getRealTimeAnalytics(schoolId?: string): Promise<RealTimeAnalytics> {
    const params = schoolId ? `?schoolId=${schoolId}` : "";
    const response = await authAxios.get(`${this.baseUrl}/realtime${params}`);
    return response.data.realTimeAnalytics;
  }

  // Performance Insights
  async getPerformanceInsights(
    schoolId?: string,
    studentId?: string,
    timeframe?: string
  ): Promise<PerformanceInsights> {
    const params = new URLSearchParams();
    if (schoolId) params.append("schoolId", schoolId);
    if (studentId) params.append("studentId", studentId);
    if (timeframe) params.append("timeframe", timeframe);

    const response = await authAxios.get(
      `${this.baseUrl}/performance-insights?${params.toString()}`
    );
    return response.data.insights;
  }

  // Predictive Analytics
  async getPredictiveAnalytics(
    schoolId?: string,
    predictionType?: string
  ): Promise<PredictiveAnalytics> {
    const params = new URLSearchParams();
    if (schoolId) params.append("schoolId", schoolId);
    if (predictionType) params.append("predictionType", predictionType);

    const response = await authAxios.get(
      `${this.baseUrl}/predictive?${params.toString()}`
    );
    return response.data.predictions;
  }

  // KPI Trends
  async getKPITrends(
    schoolId?: string,
    kpiName?: string,
    timeframe?: string
  ): Promise<KPITrends> {
    const params = new URLSearchParams();
    if (schoolId) params.append("schoolId", schoolId);
    if (kpiName) params.append("kpiName", kpiName);
    if (timeframe) params.append("timeframe", timeframe);

    const response = await authAxios.get(
      `${this.baseUrl}/kpi-trends?${params.toString()}`
    );
    return response.data.trends;
  }

  // Export Data
  async exportDashboard(
    id: string,
    format: "json" | "csv" | "pdf" = "json"
  ): Promise<Blob> {
    const response = await authAxios.get(
      `${this.baseUrl}/export/${id}?format=${format}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  // Utility Methods for UI Components
  async getSchoolOverview(schoolId?: string) {
    const realTime = await this.getRealTimeAnalytics(schoolId);
    const insights = await this.getPerformanceInsights(schoolId);

    return {
      realTimeData: realTime,
      performanceInsights: insights,
      lastUpdated: new Date(),
    };
  }

  async getDashboardSummary(id: string) {
    const dashboard = await this.getDashboardById(id);

    return {
      overview: {
        totalStudents: dashboard.studentPerformance.totalStudents,
        averageGPA: dashboard.studentPerformance.averageGPA,
        attendanceRate: dashboard.attendanceAnalytics.overallAttendanceRate,
        behaviorScore: dashboard.behavioralInsights.overallBehaviorScore,
      },
      criticalInsights: dashboard.insights.filter(
        (i) => i.priority === "critical"
      ),
      keyTrends: {
        academic: dashboard.studentPerformance.performanceTrends.slice(-7),
        attendance: dashboard.attendanceAnalytics.attendanceTrends.slice(-7),
        behavior: dashboard.behavioralInsights.behaviorTrends.slice(-7),
      },
      actionItems: dashboard.insights
        .filter((i) => i.suggestedActions.length > 0)
        .map((i) => i.suggestedActions)
        .flat()
        .slice(0, 5),
    };
  }

  async generateQuickReport(
    schoolId?: string,
    type: "weekly" | "monthly" = "weekly"
  ) {
    const endDate = new Date();
    const startDate = new Date();

    if (type === "weekly") {
      startDate.setDate(endDate.getDate() - 7);
    } else {
      startDate.setMonth(endDate.getMonth() - 1);
    }

    const dashboard = await this.generateDashboard({
      schoolId,
      dashboardType: "school_overview",
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: type === "weekly" ? "weekly" : "monthly",
      },
    });

    return dashboard;
  }

  // Data Validation and Helper Methods
  validateDashboardData(data: CreateDashboardRequest): string[] {
    const errors: string[] = [];

    if (!data.dashboardType) {
      errors.push("Dashboard type is required");
    }

    if (!data.dateRange.startDate || !data.dateRange.endDate) {
      errors.push("Date range is required");
    }

    if (
      new Date(data.dateRange.startDate) >= new Date(data.dateRange.endDate)
    ) {
      errors.push("Start date must be before end date");
    }

    return errors;
  }

  formatAnalyticsData(dashboard: AnalyticsDashboard) {
    return {
      ...dashboard,
      formattedDateRange: {
        start: new Date(dashboard.dateRange.startDate).toLocaleDateString(),
        end: new Date(dashboard.dateRange.endDate).toLocaleDateString(),
        period: dashboard.dateRange.period,
      },
      criticalKPIs: dashboard.kpis.filter((kpi) => kpi.status === "critical"),
      excellentKPIs: dashboard.kpis.filter((kpi) => kpi.status === "excellent"),
      priorityInsights: dashboard.insights
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 5),
      dataQualityScore: Math.round(
        (dashboard.dataQuality.completeness +
          dashboard.dataQuality.accuracy +
          dashboard.dataQuality.timeliness) /
          3
      ),
    };
  }

  // Chart data formatters for common visualizations
  getChartData(dashboard: AnalyticsDashboard, chartType: string) {
    switch (chartType) {
      case "attendance_trends":
        return dashboard.attendanceAnalytics.attendanceTrends.map((trend) => ({
          date: new Date(trend.date).toLocaleDateString(),
          attendance: trend.attendanceRate,
          target: 90,
        }));

      case "performance_trends":
        return dashboard.studentPerformance.performanceTrends.map((trend) => ({
          date: new Date(trend.date).toLocaleDateString(),
          averageScore: trend.averageScore,
          passRate: trend.passRate,
        }));

      case "grade_distribution":
        return dashboard.studentPerformance.gradeDistribution.map((grade) => ({
          grade: grade.grade,
          count: grade.count,
          percentage: grade.percentage,
        }));

      case "kpi_status": {
        const statusCounts = dashboard.kpis.reduce((acc, kpi) => {
          acc[kpi.status] = (acc[kpi.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: (count / dashboard.kpis.length) * 100,
        }));
      }

      default:
        return [];
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
