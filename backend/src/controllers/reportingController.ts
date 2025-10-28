import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Cohort from "../models/CohortModel";
import Program from "../models/ProgramModel";
import School from "../models/SchoolModel";
import Student from "../models/StudentModel";
import User from "../models/UserModel";
import logger from "../utils/logger";

// Generate comprehensive school report
export const generateSchoolReport = async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify access to school
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "Only super admins can generate school reports" });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    // Get all cohorts for this school
    const cohorts = await Cohort.find({ schoolId })
      .populate('students', 'name roll_no class')
      .populate('tutorId', 'name email')
      .populate('programId', 'name totalLevels');

    // Initialize report data
    let totalStudents = 0;
    let totalAttendanceRecords = 0;
    let totalPresentCount = 0;
    const progressDistribution = { green: 0, yellow: 0, orange: 0, red: 0 };
    const levelDistribution: { [key: number]: number } = {};
    const cohortReports = [];

    for (const cohort of cohorts) {
      const cohortStudents = cohort.students.length;
      totalStudents += cohortStudents;

      // Filter attendance by date range if provided
      let attendanceData = cohort.attendance;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        attendanceData = cohort.attendance.filter((att: any) => 
          att.date >= start && att.date <= end
        );
      }

      totalAttendanceRecords += attendanceData.length;
      const presentCount = attendanceData.filter((att: any) => att.status === 'present').length;
      totalPresentCount += presentCount;

      // Progress analysis
      const cohortProgressCounts = { green: 0, yellow: 0, orange: 0, red: 0 };
      const cohortLevelDistribution: { [key: number]: number } = {};

      cohort.progress.forEach((progress: any) => {
        cohortProgressCounts[progress.status as keyof typeof cohortProgressCounts]++;
        progressDistribution[progress.status as keyof typeof progressDistribution]++;
        
        const level = progress.currentLevel;
        cohortLevelDistribution[level] = (cohortLevelDistribution[level] || 0) + 1;
        levelDistribution[level] = (levelDistribution[level] || 0) + 1;
      });

      cohortReports.push({
        cohortId: cohort._id,
        cohortName: cohort.name,
        tutor: cohort.tutorId,
        program: (cohort as any).programId,
        totalStudents: cohortStudents,
        attendanceRate: attendanceData.length > 0 ? (presentCount / attendanceData.length) * 100 : 0,
        progressDistribution: cohortProgressCounts,
        levelDistribution: cohortLevelDistribution,
        studentsNeedingAttention: cohortProgressCounts.yellow + cohortProgressCounts.orange + cohortProgressCounts.red
      });
    }

    const overallAttendanceRate = totalAttendanceRecords > 0 ? (totalPresentCount / totalAttendanceRecords) * 100 : 0;

    const report = {
      school: {
        _id: school._id,
        name: school.name,
        address: school.address
      },
      reportPeriod: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
        generatedAt: new Date()
      },
      summary: {
        totalCohorts: cohorts.length,
        totalStudents,
        overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
        progressDistribution,
        levelDistribution,
        studentsNeedingAttention: progressDistribution.yellow + progressDistribution.orange + progressDistribution.red
      },
      cohorts: cohortReports
    };

    logger.info(`Generated school report for ${school.name}`);
    res.json(report);
  } catch (error: any) {
    logger.error("Error generating school report:", error);
    res.status(500).json({ error: "Error generating school report" });
  }
};

// Generate tutor performance report
export const generateTutorReport = async (req: AuthRequest, res: Response) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify access - tutors can only see their own reports, admins can see all
    if (req.user?.role !== 'super_admin' && req.user?._id?.toString() !== tutorId) {
      return res.status(403).json({ error: "You can only view your own tutor report" });
    }

    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found" });
    }

    // Get all cohorts for this tutor
    const cohorts = await Cohort.find({ tutorId })
      .populate('students', 'name roll_no class')
      .populate('schoolId', 'name')
      .populate('programId', 'name totalLevels');

    let totalStudents = 0;
    let totalAttendanceRecords = 0;
    let totalPresentCount = 0;
    const progressDistribution = { green: 0, yellow: 0, orange: 0, red: 0 };
    const cohortPerformance = [];

    for (const cohort of cohorts) {
      const cohortStudents = cohort.students.length;
      totalStudents += cohortStudents;

      // Filter attendance by date range if provided
      let attendanceData = cohort.attendance;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        attendanceData = cohort.attendance.filter((att: any) => 
          att.date >= start && att.date <= end
        );
      }

      totalAttendanceRecords += attendanceData.length;
      const presentCount = attendanceData.filter((att: any) => att.status === 'present').length;
      totalPresentCount += presentCount;

      // Progress analysis
      const cohortProgressCounts = { green: 0, yellow: 0, orange: 0, red: 0 };
      cohort.progress.forEach((progress: any) => {
        cohortProgressCounts[progress.status as keyof typeof cohortProgressCounts]++;
        progressDistribution[progress.status as keyof typeof progressDistribution]++;
      });

      cohortPerformance.push({
        cohort: {
          _id: cohort._id,
          name: cohort.name,
          school: cohort.schoolId,
          program: (cohort as any).programId
        },
        metrics: {
          totalStudents: cohortStudents,
          attendanceRate: attendanceData.length > 0 ? (presentCount / attendanceData.length) * 100 : 0,
          progressDistribution: cohortProgressCounts,
          studentsOnTrack: cohortProgressCounts.green,
          studentsNeedingSupport: cohortProgressCounts.yellow + cohortProgressCounts.orange + cohortProgressCounts.red
        }
      });
    }

    const overallAttendanceRate = totalAttendanceRecords > 0 ? (totalPresentCount / totalAttendanceRecords) * 100 : 0;

    const report = {
      tutor: {
        _id: tutor._id,
        name: tutor.name,
        email: tutor.email
      },
      reportPeriod: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
        generatedAt: new Date()
      },
      summary: {
        totalCohorts: cohorts.length,
        totalStudents,
        overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
        progressDistribution,
        studentsOnTrack: progressDistribution.green,
        studentsNeedingSupport: progressDistribution.yellow + progressDistribution.orange + progressDistribution.red
      },
      cohortPerformance
    };

    logger.info(`Generated tutor report for ${tutor.name}`);
    res.json(report);
  } catch (error: any) {
    logger.error("Error generating tutor report:", error);
    res.status(500).json({ error: "Error generating tutor report" });
  }
};

// Generate program effectiveness report
export const generateProgramReport = async (req: AuthRequest, res: Response) => {
  try {
    const { programId } = req.params;
    const { schoolId } = req.query;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ error: "Program not found" });
    }

    // Get cohorts using this program
    const filter: any = { programId };
    if (schoolId) {
      filter.schoolId = schoolId;
    }

    const cohorts = await Cohort.find(filter)
      .populate('students', 'name roll_no class')
      .populate('schoolId', 'name')
      .populate('tutorId', 'name');

    let totalStudents = 0;
    const levelProgressAnalysis: { [level: number]: { 
      totalStudents: number;
      avgTimeSpent: number;
      successRate: number;
      statusDistribution: { green: number; yellow: number; orange: number; red: number };
    }} = {};

    const schoolPerformance: { [schoolId: string]: {
      schoolName: string;
      totalStudents: number;
      avgProgressLevel: number;
      successRate: number;
    }} = {};

    for (const cohort of cohorts) {
      const schoolId = (cohort.schoolId as any)._id.toString();
      const schoolName = (cohort.schoolId as any).name;
      
      totalStudents += cohort.students.length;

      if (!schoolPerformance[schoolId]) {
        schoolPerformance[schoolId] = {
          schoolName,
          totalStudents: 0,
          avgProgressLevel: 0,
          successRate: 0
        };
      }

      schoolPerformance[schoolId].totalStudents += cohort.students.length;

      // Analyze progress by level
      let schoolTotalLevels = 0;
      let schoolSuccessCount = 0;

      cohort.progress.forEach((progress: any) => {
        const level = progress.currentLevel;
        schoolTotalLevels += level;
        
        if (progress.status === 'green') {
          schoolSuccessCount++;
        }

        // Level analysis
        if (!levelProgressAnalysis[level]) {
          levelProgressAnalysis[level] = {
            totalStudents: 0,
            avgTimeSpent: 0,
            successRate: 0,
            statusDistribution: { green: 0, yellow: 0, orange: 0, red: 0 }
          };
        }

        levelProgressAnalysis[level].totalStudents++;
        const statusKey = progress.status as 'green' | 'yellow' | 'orange' | 'red';
        levelProgressAnalysis[level].statusDistribution[statusKey]++;

        // Calculate time spent (days since last update)
        if (progress.lastUpdated) {
          const daysSinceUpdate = Math.floor((new Date().getTime() - progress.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
          levelProgressAnalysis[level].avgTimeSpent += daysSinceUpdate;
        }
      });

      schoolPerformance[schoolId].avgProgressLevel = schoolTotalLevels / cohort.students.length;
      schoolPerformance[schoolId].successRate = (schoolSuccessCount / cohort.students.length) * 100;
    }

    // Calculate averages for level analysis
    Object.keys(levelProgressAnalysis).forEach(levelStr => {
      const level = parseInt(levelStr);
      const analysis = levelProgressAnalysis[level];
      
      analysis.avgTimeSpent = analysis.avgTimeSpent / analysis.totalStudents;
      analysis.successRate = (analysis.statusDistribution.green / analysis.totalStudents) * 100;
    });

    const report = {
      program: {
        _id: program._id,
        name: program.name,
        subject: program.subject,
        totalLevels: program.totalLevels
      },
      reportGeneratedAt: new Date(),
      summary: {
        totalCohorts: cohorts.length,
        totalStudents,
        schoolsUsing: Object.keys(schoolPerformance).length
      },
      levelAnalysis: levelProgressAnalysis,
      schoolPerformance: Object.values(schoolPerformance)
    };

    logger.info(`Generated program effectiveness report for ${program.name}`);
    res.json(report);
  } catch (error: any) {
    logger.error("Error generating program report:", error);
    res.status(500).json({ error: "Error generating program report" });
  }
};

// Get analytics dashboard data
export const getAnalyticsDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, days = 30 } = req.query;

    // Build filter based on user role and school
    const filter: any = {};
    if (req.user?.role !== 'super_admin') {
      if (schoolId) {
        filter.schoolId = schoolId;
      } else {
        return res.status(400).json({ error: "School ID is required for non-admin users" });
      }
    } else if (schoolId) {
      filter.schoolId = schoolId;
    }

    const cohorts = await Cohort.find(filter)
      .populate('students', 'name')
      .populate('schoolId', 'name')
      .populate('tutorId', 'name');

    const daysNum = parseInt(days as string);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysNum);

    // Calculate metrics
    let totalStudents = 0;
    let totalCohorts = cohorts.length;
    let recentAttendanceRecords = 0;
    let recentPresentCount = 0;
    const progressDistribution = { green: 0, yellow: 0, orange: 0, red: 0 };
    const levelDistribution: { [key: number]: number } = {};
    const dailyAttendance: { [date: string]: { present: number; absent: number; total: number } } = {};

    for (const cohort of cohorts) {
      totalStudents += cohort.students.length;

      // Recent attendance analysis
      const recentAttendance = cohort.attendance.filter((att: any) => 
        att.date >= fromDate
      );
      
      recentAttendanceRecords += recentAttendance.length;
      recentPresentCount += recentAttendance.filter((att: any) => att.status === 'present').length;

      // Daily attendance breakdown
      recentAttendance.forEach((att: any) => {
        const dateStr = att.date.toISOString().split('T')[0];
        if (!dailyAttendance[dateStr]) {
          dailyAttendance[dateStr] = { present: 0, absent: 0, total: 0 };
        }
        
        dailyAttendance[dateStr].total++;
        if (att.status === 'present') {
          dailyAttendance[dateStr].present++;
        } else {
          dailyAttendance[dateStr].absent++;
        }
      });

      // Progress analysis
      cohort.progress.forEach((progress: any) => {
        progressDistribution[progress.status as keyof typeof progressDistribution]++;
        
        const level = progress.currentLevel;
        levelDistribution[level] = (levelDistribution[level] || 0) + 1;
      });
    }

    const recentAttendanceRate = recentAttendanceRecords > 0 ? (recentPresentCount / recentAttendanceRecords) * 100 : 0;

    const analytics = {
      summary: {
        totalCohorts,
        totalStudents,
        recentAttendanceRate: Math.round(recentAttendanceRate * 100) / 100,
        studentsOnTrack: progressDistribution.green,
        studentsNeedingAttention: progressDistribution.yellow + progressDistribution.orange + progressDistribution.red
      },
      progressDistribution,
      levelDistribution,
      dailyAttendanceTrend: Object.entries(dailyAttendance)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date,
          attendanceRate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
          ...stats
        })),
      periodAnalyzed: {
        days: daysNum,
        fromDate,
        toDate: new Date()
      }
    };

    res.json(analytics);
  } catch (error: any) {
    logger.error("Error generating analytics dashboard:", error);
    res.status(500).json({ error: "Error generating analytics dashboard" });
  }
};