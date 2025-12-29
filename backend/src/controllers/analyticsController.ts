import { Request, Response } from "express";
import School from "../models/SchoolModel";
import Student from "../models/StudentModel";
import Cohort from "../models/CohortModel";
import User from "../models/UserModel";
import ProgramAssessment from "../models/ProgramAssessmentModel";
import Assessment from "../models/AssessmentModel";
import Attendance from "../models/AttendanceModel";
import logger from "../utils/logger";
import mongoose from "mongoose";

/**
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Get filter based on user role
    const schoolFilter =
      user.role === "super_admin" ? {} : { school: user.schoolId };
    const cohortFilter =
      user.role === "super_admin" ? {} : { schoolId: user.schoolId };

    // Total Schools
    const totalSchools = await School.countDocuments();

    // Active schools - schools with students who have been assessed in last 30 days
    // OR schools created/updated in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get schools with recent baseline assessments (from Assessment model)
    const schoolsWithRecentAssessments = await Assessment.distinct("school", {
      date: { $gte: thirtyDaysAgo },
    });

    // Get schools with recent student knowledgeLevel entries
    const schoolsWithRecentKnowledge = await Student.distinct("school", {
      "knowledgeLevel.date": { $gte: thirtyDaysAgo },
    });

    // Combine and deduplicate
    const activeSchoolIds = new Set(
      [
        ...schoolsWithRecentAssessments.map((id) => id?.toString()),
        ...schoolsWithRecentKnowledge.map((id) => id?.toString()),
      ].filter(Boolean)
    );

    const activeSchools =
      activeSchoolIds.size ||
      (await School.countDocuments({
        updatedAt: { $gte: thirtyDaysAgo },
      }));

    // Schools with baseline assessments
    // Check students who have knowledgeLevel entries OR assessments in Assessment model
    const schoolsWithStudentBaseline = await Student.distinct("school", {
      $or: [
        { "knowledgeLevel.0": { $exists: true } },
        { lastAssessmentDate: { $exists: true } },
      ],
    });

    const schoolsWithAssessmentBaseline = await Assessment.distinct("school");

    const uniqueSchoolsWithBaseline = new Set(
      [
        ...schoolsWithStudentBaseline.map((id) => id?.toString()),
        ...schoolsWithAssessmentBaseline.map((id) => id?.toString()),
      ].filter(Boolean)
    );

    // Total Students
    const totalStudents = await Student.countDocuments(schoolFilter);

    // Active students - students who are not archived
    const activeStudents = await Student.countDocuments({
      ...schoolFilter,
      isArchived: { $ne: true },
    });

    const droppedStudents = await Student.countDocuments({
      ...schoolFilter,
      isArchived: true,
    });

    // Total Cohorts
    const totalCohorts = await Cohort.countDocuments(cohortFilter);
    const activeCohorts = await Cohort.countDocuments({
      ...cohortFilter,
      status: "active",
    });
    const completedCohorts = await Cohort.countDocuments({
      ...cohortFilter,
      status: "completed",
    });

    // Tutors/Mentors
    const totalTutors = await User.countDocuments({
      role: { $in: ["tutor", "mentor"] },
      ...(user.role !== "super_admin" && { schoolId: user.schoolId }),
    });
    const engagedTutors = await Cohort.distinct("tutorId", {
      ...cohortFilter,
      status: "active",
      tutorId: { $ne: null },
    });

    // Total Assessments - combine from multiple sources
    // 1. Legacy Assessment model (baseline assessments)
    const legacyAssessmentCount = await Assessment.countDocuments();

    // 2. ProgramAssessment model (new baseline system)
    const programAssessmentCount = await ProgramAssessment.countDocuments({
      status: "completed",
    });

    // 3. Count from Student.knowledgeLevel entries (each entry is an assessment)
    const studentKnowledgeLevelCount = await Student.aggregate([
      { $match: schoolFilter },
      {
        $project: {
          knowledgeLevelCount: { $size: { $ifNull: ["$knowledgeLevel", []] } },
        },
      },
      { $group: { _id: null, total: { $sum: "$knowledgeLevelCount" } } },
    ]);

    const knowledgeLevelTotal = studentKnowledgeLevelCount[0]?.total || 0;

    // Total assessments is the sum of all sources
    // Note: knowledgeLevel might overlap with Assessment model, so we take the max
    const totalAssessments =
      Math.max(legacyAssessmentCount, knowledgeLevelTotal) +
      programAssessmentCount;

    // Assessment Coverage Stats (replacing empty attendance data)
    // Students who have at least one knowledge level assessment
    const studentsWithAssessments = await Student.countDocuments({
      ...schoolFilter,
      "knowledgeLevel.0": { $exists: true },
    });

    // Calculate assessment coverage percentage
    const assessmentCoverage =
      totalStudents > 0
        ? ((studentsWithAssessments / totalStudents) * 100).toFixed(2)
        : "0";

    // Average level across all assessed students
    const avgLevelData = await Student.aggregate([
      { $match: { ...schoolFilter, "knowledgeLevel.0": { $exists: true } } },
      { $unwind: "$knowledgeLevel" },
      { $group: { _id: null, avgLevel: { $avg: "$knowledgeLevel.level" } } },
    ]);
    const averageStudentLevel = avgLevelData[0]?.avgLevel?.toFixed(1) || "0";

    // Students assessed in last 7 days (recent activity)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyAssessedStudents = await Student.countDocuments({
      ...schoolFilter,
      $or: [
        { "knowledgeLevel.date": { $gte: sevenDaysAgo } },
        { lastAssessmentDate: { $gte: sevenDaysAgo } },
      ],
    });

    // Fallback: Check Attendance data (may be empty)
    const attendanceFilter: any = {};
    if (user.role !== "super_admin" && user.schoolId) {
      attendanceFilter.school = new mongoose.Types.ObjectId(user.schoolId);
    }

    const attendanceStats = await Attendance.aggregate([
      ...(Object.keys(attendanceFilter).length > 0
        ? [{ $match: attendanceFilter }]
        : []),
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
        },
      },
    ]);

    const attendanceData = attendanceStats[0] || {
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
    };
    const attendanceRate =
      attendanceData.totalRecords > 0
        ? (
            (attendanceData.presentCount / attendanceData.totalRecords) *
            100
          ).toFixed(2)
        : "0";

    // Student progress distribution
    const progressDistribution = await Student.aggregate([
      { $match: schoolFilter },
      { $unwind: "$progressHistory" },
      {
        $group: {
          _id: "$progressHistory.flag",
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly trends - students enrollment
    const monthlyEnrollment = await Student.aggregate([
      { $match: schoolFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // Cohort performance
    const cohortPerformance = await Cohort.aggregate([
      { $match: cohortFilter },
      {
        $project: {
          name: 1,
          currentLevel: 1,
          totalStudents: { $size: "$students" },
          averageProgress: {
            $avg: "$progress.currentLevel",
          },
        },
      },
      { $limit: 10 },
    ]);

    // Assessment success rate from ProgramAssessment
    const assessmentFilter: any = { status: "completed" };
    if (user.role !== "super_admin" && user.schoolId) {
      assessmentFilter.school = new mongoose.Types.ObjectId(user.schoolId);
    }

    const assessmentSuccess = await ProgramAssessment.aggregate([
      { $match: assessmentFilter },
      {
        $group: {
          _id: null,
          totalAssessments: { $sum: 1 },
          totalQuestions: { $sum: "$totalQuestions" },
          totalCorrect: { $sum: "$totalCorrectAnswers" },
          avgAccuracy: { $avg: "$accuracy" },
        },
      },
    ]);

    const successData = assessmentSuccess[0] || {
      totalAssessments: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      avgAccuracy: 0,
    };

    // Calculate success rate
    // If we have ProgramAssessment data, use accuracy from that
    // Otherwise, calculate based on students who have improved or have assessments
    let successRate = "0";

    if (successData.totalQuestions > 0) {
      successRate = (
        (successData.totalCorrect / successData.totalQuestions) *
        100
      ).toFixed(2);
    } else if (totalAssessments > 0) {
      // Calculate based on students with knowledge levels
      // Success = students who have at least one assessment with level > 0
      const studentsWithProgress = await Student.countDocuments({
        ...schoolFilter,
        "knowledgeLevel.level": { $gt: 0 },
      });

      const totalStudentsWithAssessments = await Student.countDocuments({
        ...schoolFilter,
        "knowledgeLevel.0": { $exists: true },
      });

      if (totalStudentsWithAssessments > 0) {
        successRate = (
          (studentsWithProgress / totalStudentsWithAssessments) *
          100
        ).toFixed(2);
      }
    }

    // School type distribution
    const schoolTypeDistribution = await School.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent activities
    const recentActivityFilter: any = {};
    if (user.role !== "super_admin" && user.schoolId) {
      recentActivityFilter.school = new mongoose.Types.ObjectId(user.schoolId);
    }

    const recentActivities = await Attendance.find(recentActivityFilter)
      .sort({ date: -1 })
      .limit(10)
      .populate("student", "name")
      .populate("school", "name")
      .populate("mentor", "name");

    res.json({
      overview: {
        totalSchools,
        activeSchools:
          typeof activeSchools === "number"
            ? activeSchools
            : activeSchoolIds.size,
        schoolsWithBaseline: uniqueSchoolsWithBaseline.size,
        totalStudents,
        activeStudents,
        droppedStudents,
        totalCohorts,
        activeCohorts,
        completedCohorts,
        totalTutors,
        engagedTutors: engagedTutors.length,
        totalAssessments,
        attendanceRate: parseFloat(attendanceRate),
        assessmentSuccessRate: parseFloat(successRate),
        // New assessment-based metrics
        studentsWithAssessments,
        assessmentCoverage: parseFloat(assessmentCoverage),
        averageStudentLevel: parseFloat(averageStudentLevel),
        recentlyAssessedStudents,
      },
      charts: {
        progressDistribution,
        monthlyEnrollment,
        cohortPerformance,
        schoolTypeDistribution,
        attendanceData: {
          present: attendanceData.presentCount,
          absent: attendanceData.absentCount,
        },
      },
      recentActivities,
    });
  } catch (error: any) {
    logger.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      message: "Error fetching dashboard analytics",
      error: error.message,
    });
  }
};

/**
 * Get school-specific analytics
 */
export const getSchoolAnalytics = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    const students = await Student.countDocuments({
      school: new mongoose.Types.ObjectId(schoolId),
    });
    const cohorts = await Cohort.countDocuments({
      schoolId: new mongoose.Types.ObjectId(schoolId),
    });
    const activeCohorts = await Cohort.countDocuments({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      status: "active",
    });

    const attendance = await Attendance.aggregate([
      { $match: { school: new mongoose.Types.ObjectId(schoolId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        },
      },
    ]);

    const attendanceRate = attendance[0]
      ? ((attendance[0].present / attendance[0].total) * 100).toFixed(2)
      : "0";

    res.json({
      schoolId,
      totalStudents: students,
      totalCohorts: cohorts,
      activeCohorts,
      attendanceRate: parseFloat(attendanceRate),
    });
  } catch (error: any) {
    logger.error("Error fetching school analytics:", error);
    res.status(500).json({
      message: "Error fetching school analytics",
      error: error.message,
    });
  }
};

/**
 * Get performance trends over time
 */
export const getPerformanceTrends = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { period = "month" } = req.query; // day, week, month, year

    const attendanceFilter: any = {};
    if (user.role !== "super_admin" && user.schoolId) {
      attendanceFilter.school = new mongoose.Types.ObjectId(user.schoolId);
    }

    let groupBy: any;
    switch (period) {
      case "day":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        };
        break;
      case "week":
        groupBy = {
          year: { $year: "$date" },
          week: { $week: "$date" },
        };
        break;
      case "year":
        groupBy = {
          year: { $year: "$date" },
        };
        break;
      default: // month
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
        };
    }

    const attendanceTrends = await Attendance.aggregate([
      ...(Object.keys(attendanceFilter).length > 0
        ? [{ $match: attendanceFilter }]
        : []),
      {
        $group: {
          _id: groupBy,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
      { $limit: 30 },
    ]);

    res.json({
      period,
      trends: attendanceTrends,
    });
  } catch (error: any) {
    logger.error("Error fetching performance trends:", error);
    res.status(500).json({
      message: "Error fetching performance trends",
      error: error.message,
    });
  }
};
