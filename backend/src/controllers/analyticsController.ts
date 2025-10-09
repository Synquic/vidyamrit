import { Request, Response } from "express";
import { AnalyticsDashboard } from "../models/AnalyticsModel";
import { Student } from "../models/StudentModel";
import { User } from "../models/UserModel";
import { Attendance } from "../models/AttendanceModel";
import { EnhancedStudentProfile } from "../models/EnhancedStudentProfileModel";
import { MentorProfile } from "../models/MentorProfileModel";
import { Assessment } from "../models/AssessmentModel";
import mongoose from "mongoose";

// Generate comprehensive analytics dashboard
export const generateAnalyticsDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      dashboardType = "school_overview",
      dateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date(),
        period: "monthly",
      },
    } = req.body;

    let schoolId = req.body.schoolId;

    // For school admins, use their school
    if (req.user.role === "school_admin" && req.user.schoolId) {
      schoolId = req.user.schoolId._id;
    }

    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }

    // Generate comprehensive analytics data
    const analyticsData = await generateAnalyticsData(
      schoolId,
      dashboardType,
      dateRange
    );

    // Create dashboard document
    const dashboard = new AnalyticsDashboard({
      schoolId,
      dashboardType,
      dateRange: {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate),
        period: dateRange.period,
      },
      ...analyticsData,
      generatedBy: req.user.id,
    });

    // Calculate data quality and generate insights
    dashboard.calculateDataQuality();
    dashboard.generateInsights();

    await dashboard.save();

    res.status(201).json({
      message: "Analytics dashboard generated successfully",
      dashboard,
    });
  } catch (error) {
    console.error("Error generating analytics dashboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get analytics dashboard by ID
export const getAnalyticsDashboard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dashboard = await AnalyticsDashboard.findById(id)
      .populate("schoolId", "name address")
      .populate("generatedBy", "name email");

    if (!dashboard) {
      return res.status(404).json({ message: "Analytics dashboard not found" });
    }

    // Check access permissions
    if (req.user.role === "school_admin" && req.user.schoolId) {
      if (
        dashboard.schoolId._id.toString() !== req.user.schoolId._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json({ dashboard });
  } catch (error) {
    console.error("Error fetching analytics dashboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all analytics dashboards with filtering
export const getAnalyticsDashboards = async (req: Request, res: Response) => {
  try {
    const {
      schoolId,
      dashboardType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = "generatedAt",
      sortOrder = "desc",
    } = req.query;

    const filter: any = {};

    if (dashboardType) filter.dashboardType = dashboardType;
    if (dateFrom || dateTo) {
      filter.generatedAt = {};
      if (dateFrom) filter.generatedAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.generatedAt.$lte = new Date(dateTo as string);
    }

    // Role-based filtering
    if (req.user.role === "school_admin" && req.user.schoolId) {
      filter.schoolId = req.user.schoolId._id;
    } else if (schoolId && req.user.role === "super_admin") {
      filter.schoolId = schoolId;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [dashboards, total] = await Promise.all([
      AnalyticsDashboard.find(filter)
        .populate("schoolId", "name address")
        .populate("generatedBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      AnalyticsDashboard.countDocuments(filter),
    ]);

    res.json({
      dashboards,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics dashboards:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get real-time analytics
export const getRealTimeAnalytics = async (req: Request, res: Response) => {
  try {
    let schoolId = req.query.schoolId as string;

    // For school admins, use their school
    if (req.user.role === "school_admin" && req.user.schoolId) {
      schoolId = req.user.schoolId._id.toString();
    }

    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }

    const realTimeData = await generateRealTimeAnalytics(schoolId);

    res.json({
      realTimeAnalytics: realTimeData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error fetching real-time analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get performance insights
export const getPerformanceInsights = async (req: Request, res: Response) => {
  try {
    const { schoolId, studentId, timeframe = "30d" } = req.query;

    let targetSchoolId = schoolId as string;
    if (req.user.role === "school_admin" && req.user.schoolId) {
      targetSchoolId = req.user.schoolId._id.toString();
    }

    const insights = await generatePerformanceInsights(
      targetSchoolId,
      studentId as string,
      timeframe as string
    );

    res.json({ insights });
  } catch (error) {
    console.error("Error generating performance insights:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get predictive analytics
export const getPredictiveAnalytics = async (req: Request, res: Response) => {
  try {
    const { schoolId, predictionType = "academic_performance" } = req.query;

    let targetSchoolId = schoolId as string;
    if (req.user.role === "school_admin" && req.user.schoolId) {
      targetSchoolId = req.user.schoolId._id.toString();
    }

    const predictions = await generatePredictiveAnalytics(
      targetSchoolId,
      predictionType as string
    );

    res.json({ predictions });
  } catch (error) {
    console.error("Error generating predictive analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Export analytics data
export const exportAnalyticsData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = "json" } = req.query;

    const dashboard = await AnalyticsDashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({ message: "Analytics dashboard not found" });
    }

    const exportedData = dashboard.exportData(format as string);

    // Set appropriate headers for download
    const filename = `analytics_${dashboard.dashboardType}_${
      new Date().toISOString().split("T")[0]
    }.${format}`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      format === "json" ? "application/json" : "text/csv"
    );

    res.send(exportedData);
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get KPI trends
export const getKPITrends = async (req: Request, res: Response) => {
  try {
    const { schoolId, kpiName, timeframe = "90d" } = req.query;

    let targetSchoolId = schoolId as string;
    if (req.user.role === "school_admin" && req.user.schoolId) {
      targetSchoolId = req.user.schoolId._id.toString();
    }

    const trends = await getKPITrendsData(
      targetSchoolId,
      kpiName as string,
      timeframe as string
    );

    res.json({ trends });
  } catch (error) {
    console.error("Error fetching KPI trends:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update analytics dashboard
export const updateAnalyticsDashboard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dashboard = await AnalyticsDashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({ message: "Analytics dashboard not found" });
    }

    Object.assign(dashboard, updates);
    dashboard.lastUpdated = new Date();

    // Recalculate data quality and insights if data changed
    if (
      updates.studentPerformance ||
      updates.attendanceAnalytics ||
      updates.teacherEffectiveness
    ) {
      dashboard.calculateDataQuality();
      dashboard.generateInsights();
    }

    await dashboard.save();

    res.json({
      message: "Analytics dashboard updated successfully",
      dashboard,
    });
  } catch (error) {
    console.error("Error updating analytics dashboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete analytics dashboard
export const deleteAnalyticsDashboard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dashboard = await AnalyticsDashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({ message: "Analytics dashboard not found" });
    }

    // Only super admin or the creator can delete
    if (
      req.user.role !== "super_admin" &&
      dashboard.generatedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await AnalyticsDashboard.findByIdAndDelete(id);

    res.json({ message: "Analytics dashboard deleted successfully" });
  } catch (error) {
    console.error("Error deleting analytics dashboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to generate comprehensive analytics data
async function generateAnalyticsData(
  schoolId: string,
  dashboardType: string,
  dateRange: any
) {
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  // Get all students for the school
  const students = await Student.find({ school: schoolId });
  const studentIds = students.map((s) => s._id);

  // Generate student performance analytics
  const studentPerformance = await generateStudentPerformanceAnalytics(
    studentIds,
    startDate,
    endDate
  );

  // Generate attendance analytics
  const attendanceAnalytics = await generateAttendanceAnalytics(
    studentIds,
    startDate,
    endDate
  );

  // Generate teacher effectiveness analytics
  const teacherEffectiveness = await generateTeacherEffectivenessAnalytics(
    schoolId,
    startDate,
    endDate
  );

  // Generate behavioral insights
  const behavioralInsights = await generateBehavioralInsights(
    studentIds,
    startDate,
    endDate
  );

  // Generate academic trends
  const academicTrends = await generateAcademicTrends(
    studentIds,
    startDate,
    endDate
  );

  // Generate KPIs
  const kpis = await generateKPIs(
    schoolId,
    studentPerformance,
    attendanceAnalytics,
    teacherEffectiveness
  );

  return {
    studentPerformance,
    attendanceAnalytics,
    teacherEffectiveness,
    behavioralInsights,
    academicTrends,
    kpis,
  };
}

// Helper function to generate student performance analytics
async function generateStudentPerformanceAnalytics(
  studentIds: mongoose.Types.ObjectId[],
  startDate: Date,
  endDate: Date
) {
  const enhancedProfiles = await EnhancedStudentProfile.find({
    studentId: { $in: studentIds },
  }).populate("studentId");

  const totalStudents = enhancedProfiles.length;
  const activeStudents = enhancedProfiles.filter(
    (p) => p.status === "active"
  ).length;

  // Calculate average GPA
  const gpas = enhancedProfiles
    .map((p) => p.getCurrentGPA())
    .filter((gpa) => gpa > 0);
  const averageGPA =
    gpas.length > 0 ? gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length : 0;

  // Grade distribution
  const gradeDistribution = calculateGradeDistribution(enhancedProfiles);

  // Top performers
  const topPerformers = enhancedProfiles
    .sort((a, b) => b.getCurrentGPA() - a.getCurrentGPA())
    .slice(0, 10)
    .map((p) => ({
      studentId: p.studentId._id,
      name: p.studentId.name,
      gpa: p.getCurrentGPA(),
      trend: p.performanceMetrics.academicTrend,
    }));

  // At-risk students
  const atRiskStudents = enhancedProfiles
    .filter((p) => p.performanceMetrics.riskFactors.length > 0)
    .map((p) => ({
      studentId: p.studentId._id,
      name: p.studentId.name,
      riskFactors: p.performanceMetrics.riskFactors,
      riskLevel: determineRiskLevel(p.performanceMetrics.riskFactors),
      interventionSuggestions: p.performanceMetrics.recommendations,
    }));

  return {
    totalStudents,
    activeStudents,
    averageGPA: parseFloat(averageGPA.toFixed(2)),
    gradeDistribution,
    performanceTrends: [],
    topPerformers,
    atRiskStudents,
    subjectWisePerformance: [],
  };
}

// Helper function to generate attendance analytics
async function generateAttendanceAnalytics(
  studentIds: mongoose.Types.ObjectId[],
  startDate: Date,
  endDate: Date
) {
  const attendanceRecords = await Attendance.find({
    studentId: { $in: studentIds },
    date: { $gte: startDate, $lte: endDate },
  });

  const totalRecords = attendanceRecords.length;
  const presentRecords = attendanceRecords.filter(
    (r) => r.status === "present"
  ).length;
  const overallAttendanceRate =
    totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

  // Generate attendance trends
  const attendanceTrends = generateAttendanceTrends(
    attendanceRecords,
    startDate,
    endDate
  );

  return {
    overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(2)),
    attendanceTrends,
    classWiseAttendance: [],
    attendancePatterns: {
      dailyPatterns: [],
      monthlyPatterns: [],
      seasonalTrends: [],
    },
    absenteeismAnalysis: {
      frequentAbsentees: [],
      absenteeismTriggers: [],
      interventionSuccess: [],
    },
  };
}

// Helper function to generate teacher effectiveness analytics
async function generateTeacherEffectivenessAnalytics(
  schoolId: string,
  startDate: Date,
  endDate: Date
) {
  const mentorProfiles = await MentorProfile.find({ schoolId }).populate(
    "userId"
  );

  const teacherPerformance = mentorProfiles.map((profile) => ({
    teacherId: profile.userId._id,
    name: profile.userId.name,
    subjects: profile.subjectExpertise.map((s) => s.subject),
    studentOutcomes: {
      averageGPA: 0, // Would be calculated from actual student data
      passRate: 0,
      improvementRate: 0,
      studentSatisfaction: 0,
    },
    classManagement: {
      attendanceRate: 0,
      behavioralIncidents: 0,
      engagementLevel: 0,
    },
    professionalDevelopment: {
      certifications: profile.certifications.length,
      trainingsCompleted:
        profile.professionalDevelopment.completedTrainings.length,
      skillRating: profile.performanceMetrics.overallRating,
    },
    effectiveness: profile.performanceMetrics.effectivenessLevel,
    recommendations: profile.performanceMetrics.recommendationsReceived,
  }));

  return {
    teacherPerformance,
    subjectExpertise: [],
    professionalGrowth: [],
  };
}

// Helper function to generate behavioral insights
async function generateBehavioralInsights(
  studentIds: mongoose.Types.ObjectId[],
  startDate: Date,
  endDate: Date
) {
  const enhancedProfiles = await EnhancedStudentProfile.find({
    studentId: { $in: studentIds },
  });

  const behaviorRecords = enhancedProfiles.flatMap((p) => p.behavioralRecords);
  const recentRecords = behaviorRecords.filter(
    (r) => new Date(r.date) >= startDate && new Date(r.date) <= endDate
  );

  const positiveIncidents = recentRecords.filter(
    (r) => r.type === "positive"
  ).length;
  const negativeIncidents = recentRecords.filter(
    (r) => r.type === "negative"
  ).length;
  const totalIncidents = positiveIncidents + negativeIncidents;

  const overallBehaviorScore =
    totalIncidents > 0
      ? ((positiveIncidents - negativeIncidents) / totalIncidents) * 100 + 50
      : 50;

  return {
    overallBehaviorScore: parseFloat(overallBehaviorScore.toFixed(2)),
    behaviorTrends: [],
    incidentAnalysis: {
      totalIncidents,
      incidentTypes: [],
      commonTriggers: [],
      interventionEffectiveness: [],
    },
    studentBehaviorProfiles: [],
    environmentalFactors: [],
  };
}

// Helper function to generate academic trends
async function generateAcademicTrends(
  studentIds: mongoose.Types.ObjectId[],
  startDate: Date,
  endDate: Date
) {
  return {
    yearOverYearComparison: [],
    seasonalPatterns: [],
    predictiveInsights: [],
    curriculumEffectiveness: [],
  };
}

// Helper function to generate KPIs
async function generateKPIs(
  schoolId: string,
  studentPerformance: any,
  attendanceAnalytics: any,
  teacherEffectiveness: any
) {
  const kpis = [
    {
      name: "Average GPA",
      category: "Academic Performance",
      currentValue: studentPerformance.averageGPA,
      targetValue: 3.5,
      previousValue: 0, // Would come from historical data
      trend: "stable",
      status:
        studentPerformance.averageGPA >= 3.5
          ? "excellent"
          : studentPerformance.averageGPA >= 3.0
          ? "good"
          : studentPerformance.averageGPA >= 2.5
          ? "warning"
          : "critical",
      actionRequired: studentPerformance.averageGPA < 2.5,
      recommendations:
        studentPerformance.averageGPA < 3.0
          ? ["Implement tutoring programs", "Review curriculum effectiveness"]
          : [],
    },
    {
      name: "Attendance Rate",
      category: "Student Engagement",
      currentValue: attendanceAnalytics.overallAttendanceRate,
      targetValue: 90,
      previousValue: 0,
      trend: "stable",
      status:
        attendanceAnalytics.overallAttendanceRate >= 90
          ? "excellent"
          : attendanceAnalytics.overallAttendanceRate >= 80
          ? "good"
          : attendanceAnalytics.overallAttendanceRate >= 70
          ? "warning"
          : "critical",
      actionRequired: attendanceAnalytics.overallAttendanceRate < 80,
      recommendations:
        attendanceAnalytics.overallAttendanceRate < 85
          ? [
              "Implement attendance tracking system",
              "Contact parents of frequent absentees",
            ]
          : [],
    },
    {
      name: "Teacher Satisfaction",
      category: "Staff Performance",
      currentValue: 85, // Would be calculated from actual surveys
      targetValue: 90,
      previousValue: 0,
      trend: "stable",
      status: "good",
      actionRequired: false,
      recommendations: [],
    },
  ];

  return kpis;
}

// Helper functions
function calculateGradeDistribution(profiles: any[]) {
  const grades = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];
  return grades.map((grade) => ({
    grade,
    count: 0, // Would calculate based on actual grades
    percentage: 0,
  }));
}

function determineRiskLevel(riskFactors: string[]) {
  if (riskFactors.length >= 3) return "critical";
  if (riskFactors.length >= 2) return "high";
  if (riskFactors.length >= 1) return "medium";
  return "low";
}

function generateAttendanceTrends(
  records: any[],
  startDate: Date,
  endDate: Date
) {
  // Generate daily attendance trends
  const trends = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayRecords = records.filter(
      (r) => new Date(r.date).toDateString() === currentDate.toDateString()
    );

    const totalStudents = dayRecords.length;
    const presentStudents = dayRecords.filter(
      (r) => r.status === "present"
    ).length;
    const attendanceRate =
      totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;

    trends.push({
      date: new Date(currentDate),
      attendanceRate: parseFloat(attendanceRate.toFixed(2)),
      totalStudents,
      presentStudents,
      absentStudents: totalStudents - presentStudents,
      lateArrivals: dayRecords.filter((r) => r.status === "late").length,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends;
}

async function generateRealTimeAnalytics(schoolId: string) {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Get today's attendance
  const todayAttendance = await Attendance.find({
    date: { $gte: startOfDay, $lt: today },
    schoolId,
  });

  // Get active students count
  const activeStudents = await Student.countDocuments({
    school: schoolId,
    status: "active",
  });

  return {
    todayAttendance: {
      total: todayAttendance.length,
      present: todayAttendance.filter((a) => a.status === "present").length,
      absent: todayAttendance.filter((a) => a.status === "absent").length,
      late: todayAttendance.filter((a) => a.status === "late").length,
    },
    activeStudents,
    timestamp: new Date(),
  };
}

async function generatePerformanceInsights(
  schoolId: string,
  studentId?: string,
  timeframe?: string
) {
  // Generate performance insights based on historical data
  return {
    trends: [],
    predictions: [],
    recommendations: [],
  };
}

async function generatePredictiveAnalytics(
  schoolId: string,
  predictionType: string
) {
  // Generate predictive analytics using historical patterns
  return {
    predictions: [],
    confidence: 0,
    factors: [],
  };
}

async function getKPITrendsData(
  schoolId: string,
  kpiName?: string,
  timeframe?: string
) {
  // Get historical KPI data for trend analysis
  return {
    trends: [],
    forecast: [],
  };
}
