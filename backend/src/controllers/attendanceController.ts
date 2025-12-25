import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Attendance from "../models/AttendanceModel";
import Student from "../models/StudentModel";
import School from "../models/SchoolModel";
import logger from "../utils/logger";

// Get attendance records with filters
export const getAttendanceRecords = async (req: AuthRequest, res: Response) => {
  try {
    const {
      schoolId,
      studentId,
      mentorId,
      date,
      startDate,
      endDate,
      status,
      subject,
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (schoolId) filter.school = schoolId;
    if (studentId) filter.student = studentId;
    if (mentorId) filter.mentor = mentorId;
    if (status) filter.status = status;
    if (subject) filter.subject = subject;

    // Date filtering
    if (date) {
      const queryDate = new Date(date as string);
      filter.date = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999)),
      };
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const attendance = await Attendance.find(filter)
      .populate("student", "name roll_no class")
      .populate("school", "name")
      .populate("mentor", "name")
      .sort({ date: -1, "student.name": 1 });

    logger.info(`Fetched ${attendance.length} attendance records`);
    res.json(attendance);
  } catch (error: any) {
    logger.error("Error fetching attendance records:", error);
    res.status(500).json({ error: "Error fetching attendance records" });
  }
};

// Mark attendance for a student
export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, schoolId, date, status, subject, sessionType, notes } =
      req.body;
    const mentorId = req.user?._id;

    if (!studentId || !schoolId || !date || !status) {
      return res.status(400).json({
        error: "Student ID, School ID, date, and status are required",
      });
    }

    if (!["present", "absent", "exam"].includes(status)) {
      return res.status(400).json({
        error: "Status must be 'present', 'absent', or 'exam'",
      });
    }

    // Check if attendance already exists for this student, date, and subject
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: new Date(date),
      subject: subject || null,
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.sessionType = sessionType || "regular";
      existingAttendance.notes = notes || "";
      existingAttendance.updatedAt = new Date();

      await existingAttendance.save();

      const updatedAttendance = await Attendance.findById(
        existingAttendance._id
      )
        .populate("student", "name roll_no class")
        .populate("school", "name")
        .populate("mentor", "name");

      logger.info(`Updated attendance for student ${studentId}`);
      return res.json(updatedAttendance);
    } else {
      // Create new attendance record
      const attendance = new Attendance({
        student: studentId,
        school: schoolId,
        mentor: mentorId,
        date: new Date(date),
        status,
        subject: subject || null,
        sessionType: sessionType || "regular",
        notes: notes || "",
      });

      await attendance.save();

      const newAttendance = await Attendance.findById(attendance._id)
        .populate("student", "name roll_no class")
        .populate("school", "name")
        .populate("mentor", "name");

      logger.info(`Marked attendance for student ${studentId}: ${status}`);
      res.status(201).json(newAttendance);
    }
  } catch (error: any) {
    logger.error("Error marking attendance:", error);
    res.status(500).json({ error: "Error marking attendance" });
  }
};

// Bulk mark attendance for multiple students
export const bulkMarkAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { attendanceRecords, schoolId, date } = req.body;
    const mentorId = req.user?._id;

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        error: "Attendance records array is required",
      });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      try {
        const { studentId, status, subject, sessionType, notes } = record;

        // Check if attendance exists
        const existingAttendance = await Attendance.findOne({
          student: studentId,
          date: new Date(date),
          subject: subject || null,
        });

        if (existingAttendance) {
          existingAttendance.status = status;
          existingAttendance.sessionType = sessionType || "regular";
          existingAttendance.notes = notes || "";
          existingAttendance.updatedAt = new Date();
          await existingAttendance.save();
          results.push(existingAttendance);
        } else {
          const attendance = new Attendance({
            student: studentId,
            school: schoolId,
            mentor: mentorId,
            date: new Date(date),
            status,
            subject: subject || null,
            sessionType: sessionType || "regular",
            notes: notes || "",
          });
          await attendance.save();
          results.push(attendance);
        }
      } catch (recordError: any) {
        errors.push({
          studentId: record.studentId,
          error: recordError.message,
        });
      }
    }

    logger.info(
      `Bulk attendance marked: ${results.length} success, ${errors.length} errors`
    );
    res.json({
      success: results.length,
      errorCount: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    logger.error("Error in bulk marking attendance:", error);
    res.status(500).json({ error: "Error in bulk marking attendance" });
  }
};

// Get attendance statistics
export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, studentId, startDate, endDate } = req.query;

    const filter: any = {};
    if (schoolId) filter.school = schoolId;
    if (studentId) filter.student = studentId;

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Get attendance statistics
    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get attendance by student
    const studentStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            student: "$student",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id.student",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      {
        $group: {
          _id: "$_id.student",
          studentInfo: { $first: { $arrayElemAt: ["$studentInfo", 0] } },
          present: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "present"] }, "$count", 0],
            },
          },
          absent: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "absent"] }, "$count", 0],
            },
          },
          exam: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "exam"] }, "$count", 0],
            },
          },
        },
      },
      {
        $addFields: {
          totalDays: { $add: ["$present", "$absent", "$exam"] },
          attendancePercentage: {
            $multiply: [
              {
                $divide: [
                  "$present",
                  { $add: ["$present", "$absent", "$exam"] },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    res.json({
      overallStats: stats,
      studentStats,
    });
  } catch (error: any) {
    logger.error("Error fetching attendance statistics:", error);
    res.status(500).json({ error: "Error fetching attendance statistics" });
  }
};

// Get attendance for a specific date and school
export const getDailyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, date, subject } = req.query;

    if (!schoolId || !date) {
      return res.status(400).json({
        error: "School ID and date are required",
      });
    }

    const queryDate = new Date(date as string);
    const filter: any = {
      school: schoolId,
      date: {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999)),
      },
    };

    if (subject) {
      filter.subject = subject;
    }

    // Get all students in the school
    const students = await Student.find({ school: schoolId }).select(
      "name roll_no class"
    );

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find(filter).populate(
      "student",
      "name roll_no class"
    );

    // Create a map of student attendance
    const attendanceMap = new Map();
    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.student._id.toString(), record);
    });

    // Combine students with their attendance status
    const dailyAttendance = students.map((student) => {
      const attendance = attendanceMap.get((student as any)._id.toString());
      return {
        student,
        attendance: attendance || null,
        status: attendance ? attendance.status : null,
      };
    });

    res.json(dailyAttendance);
  } catch (error: any) {
    logger.error("Error fetching daily attendance:", error);
    res.status(500).json({ error: "Error fetching daily attendance" });
  }
};

// Record attendance for a cohort
/**
 * Check if a date is Sunday
 */
function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export const recordCohortAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, attendanceRecords, date } = req.body; // attendanceRecords: [{ studentId, status }]
    const tutorId = req.user?._id;

    if (!cohortId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ 
        error: "Cohort ID and attendance records array are required" 
      });
    }

    // Import Cohort model if not already imported
    const Cohort = require("../models/CohortModel").default;
    
    const cohort = await Cohort.findById(cohortId).populate('students schoolId');
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to mark attendance for this cohort" });
    }

    // Parse and normalize date to midnight UTC to avoid timezone issues
    let attendanceDate: Date;
    if (date) {
      // If date is provided as string (YYYY-MM-DD), parse it and set to UTC midnight
      const dateStr = date.toString();
      const [year, month, day] = dateStr.split('-').map(Number);
      attendanceDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      // If no date provided, use today at UTC midnight
      const today = new Date();
      attendanceDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    }
    
    // Prevent recording attendance on Sundays
    if (isSunday(attendanceDate)) {
      return res.status(400).json({ 
        error: "Cannot record attendance on Sunday. Sunday is a holiday. Please select a teaching day (Monday-Saturday)." 
      });
    }
    
    const results = [];
    const errors = [];

    // Update cohort attendance embedded records
    for (const record of attendanceRecords) {
      try {
        const { studentId, status } = record;

        // Verify student is in this cohort
        const studentInCohort = cohort.students.some((student: any) => 
          student._id.toString() === studentId.toString()
        );
        
        if (!studentInCohort) {
          errors.push({
            studentId,
            error: "Student not found in this cohort"
          });
          continue;
        }

        // Remove existing attendance for this date (compare by UTC date string)
        const attendanceDateStr = attendanceDate.toISOString().split('T')[0];
        cohort.attendance = cohort.attendance.filter(
          (att: any) => {
            const attDate = new Date(att.date);
            const attDateStr = attDate.toISOString().split('T')[0];
            return !(att.studentId.toString() === studentId.toString() && 
              attDateStr === attendanceDateStr);
          }
        );

        // Add new attendance record
        cohort.attendance.push({
          date: attendanceDate,
          studentId,
          status
        });

        results.push({ studentId, status, date: attendanceDate });
      } catch (recordError: any) {
        errors.push({
          studentId: record.studentId,
          error: recordError.message,
        });
      }
    }

    // Update level progress based on attendance using helper functions
    if ((cohort as any).programId) {
      const programId = (cohort as any).programId._id || (cohort as any).programId;
      
      // Get the actual program document to access methods (populated documents lose methods)
      const Program = require("../models/ProgramModel").default;
      const program = await Program.findById(programId);
      
      if (program) {
        const currentLevel = cohort.currentLevel || 1;
        const currentLevelInfo = program.getLevelByNumber(currentLevel);
        
        if (currentLevelInfo) {
          // Initialize time tracking if it doesn't exist
          if (!cohort.timeTracking) {
            const cohortStartDate = cohort.startDate || cohort.createdAt;
            
            // Convert current level timeframe to days
            let expectedDaysForCurrentLevel = currentLevelInfo.timeframe || 14;
            switch (currentLevelInfo.timeframeUnit) {
              case 'weeks':
                expectedDaysForCurrentLevel *= 7;
                break;
              case 'months':
                expectedDaysForCurrentLevel *= 30;
                break;
            }

            // Calculate total expected days for entire program
            const totalExpectedDays = program.getTotalTimeToComplete(1, undefined, 'days') || 140;

            cohort.timeTracking = {
              cohortStartDate,
              currentLevelStartDate: cohortStartDate,
              attendanceDays: 0,
              expectedDaysForCurrentLevel,
              totalExpectedDays
            };
          }

          // Auto-mark day as completed when attendance is recorded
          // Initialize levelProgress if needed
          if (!cohort.levelProgress) {
            cohort.levelProgress = new Map();
          }

          const levelKey = currentLevel.toString();
          let levelProgress = cohort.levelProgress.get?.(levelKey) || 
                            (cohort.levelProgress[currentLevel] ? { ...cohort.levelProgress[currentLevel] } : null);

          if (!levelProgress) {
            // Initialize level progress
            const { convertToDays } = require("../lib/cohortProgressHelper");
            const { TimeframeUnit } = require("../models/ProgramModel");
            const originalDays = convertToDays(currentLevelInfo.timeframe, currentLevelInfo.timeframeUnit);
            
            levelProgress = {
              originalDaysRequired: originalDays,
              adjustedDaysRequired: originalDays,
              completedDays: 0,
              completedDates: [],
              isCompleted: false,
              lastUpdated: new Date(),
            };
          }

          // Mark attendance date as completed (if not already marked)
          const attendanceDate = new Date(date);
          attendanceDate.setHours(0, 0, 0, 0);
          const dateStr = attendanceDate.toISOString().split('T')[0];
          
          const isAlreadyMarked = levelProgress.completedDates.some((d: Date) => {
            const dStr = new Date(d).toISOString().split('T')[0];
            return dStr === dateStr;
          });

          if (!isAlreadyMarked) {
            levelProgress.completedDates.push(attendanceDate);
            levelProgress.completedDays += 1;
            levelProgress.lastUpdated = new Date();

            // Store back
            if (cohort.levelProgress instanceof Map) {
              cohort.levelProgress.set(levelKey, levelProgress);
            } else {
              cohort.levelProgress[currentLevel] = levelProgress;
            }
          }

          // Use helper to calculate level progress
          const { calculateLevelProgress } = require("../lib/cohortProgressHelper");
          const calculatedProgress = await calculateLevelProgress(cohort);
          
          // Update attendance days count (unique present dates)
          const presentDays = new Set();
          cohort.attendance.forEach((att: any) => {
            if (att.status === 'present') {
              presentDays.add(att.date.toDateString());
            }
          });
          
          cohort.timeTracking.attendanceDays = presentDays.size;
          
          // Mark timeTracking and levelProgress as modified so Mongoose saves nested object changes
          cohort.markModified('timeTracking');
          cohort.markModified('levelProgress');
          
          // Log if ready for assessment
          if (calculatedProgress.isReadyForAssessment) {
            logger.info(`Cohort ${cohortId} completed ${calculatedProgress.weeksCompleted}/${calculatedProgress.weeksRequired} weeks for level ${currentLevel}. Ready for assessment.`);
          }
        }
      }
    }

    await cohort.save();

    logger.info(
      `Cohort attendance recorded: ${results.length} success, ${errors.length} errors for cohort ${cohortId}`
    );
    
    res.json({
      message: "Cohort attendance recorded successfully",
      success: results.length,
      errorCount: errors.length,
      results,
      errors,
      timeTracking: cohort.timeTracking // Include timeTracking in response for frontend
    });
  } catch (error: any) {
    logger.error("Error recording cohort attendance:", error);
    res.status(500).json({ error: "Error recording cohort attendance" });
  }
};

// Get attendance for a specific cohort
export const getCohortAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const { date, startDate, endDate } = req.query;
    const tutorId = req.user?._id;

    const Cohort = require("../models/CohortModel").default;
    
    const cohort = await Cohort.findById(cohortId)
      .populate('students', 'name roll_no class')
      .populate('schoolId', 'name')
      .populate('tutorId', 'name');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId._id.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view attendance for this cohort" });
    }

    let attendanceFilter = cohort.attendance;

    // Apply date filters - normalize dates to UTC midnight for consistent comparison
    if (date) {
      const dateStr = date as string;
      const [year, month, day] = dateStr.split('-').map(Number);
      const queryDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const queryDateStr = queryDate.toISOString().split('T')[0];
      
      attendanceFilter = cohort.attendance.filter((att: any) => {
        const attDate = new Date(att.date);
        const attDateStr = attDate.toISOString().split('T')[0];
        return attDateStr === queryDateStr;
      });
    } else if (startDate && endDate) {
      const startStr = startDate as string;
      const endStr = endDate as string;
      const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
      const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
      const start = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
      const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
      
      attendanceFilter = cohort.attendance.filter((att: any) => {
        const attDate = new Date(att.date);
        return attDate >= start && attDate <= end;
      });
    }

    // Group attendance by date and student - use UTC date string for consistent grouping
    const attendanceData = attendanceFilter.reduce((acc: any, record: any) => {
      const attDate = new Date(record.date);
      const dateKey = attDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      const studentInfo = cohort.students.find((student: any) => 
        student._id.toString() === record.studentId.toString()
      );
      
      acc[dateKey].push({
        student: studentInfo,
        status: record.status,
        date: record.date
      });
      return acc;
    }, {});

    res.json({
      cohort: {
        _id: cohort._id,
        name: cohort.name,
        school: cohort.schoolId,
        tutor: cohort.tutorId,
        students: cohort.students,
        holidays: cohort.holidays || [] // Include holidays array
      },
      attendance: attendanceData
    });
  } catch (error: any) {
    logger.error("Error fetching cohort attendance:", error);
    res.status(500).json({ error: "Error fetching cohort attendance" });
  }
};

// Get attendance summary for tutor's cohorts
export const getTutorAttendanceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tutorId = req.user?._id;
    const { date, schoolId } = req.query;
    const UserRole = require("../configs/roles").UserRole;

    const Cohort = require("../models/CohortModel").default;
    
    // Build query - only active cohorts
    const query: any = { status: 'active' };
    
    // For tutors, only show their cohorts. For super admins, show all (or filtered by schoolId)
    if (req.user?.role === UserRole.TUTOR) {
      query.tutorId = tutorId;
    }
    
    // If schoolId is provided, filter by school
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const cohorts = await Cohort.find(query)
      .populate('students', 'name roll_no class')
      .populate('schoolId', 'name')
      .populate('tutorId', 'name email')
      .sort({ createdAt: -1 }); // Most recent first

    const summaryData = [];

    for (const cohort of cohorts) {
      let attendanceForDate = [];
      
      if (date) {
        const queryDate = new Date(date as string);
        attendanceForDate = cohort.attendance.filter((att: any) => 
          att.date.toDateString() === queryDate.toDateString()
        );
      } else {
        // Get today's attendance
        const today = new Date();
        attendanceForDate = cohort.attendance.filter((att: any) => 
          att.date.toDateString() === today.toDateString()
        );
      }

      const totalStudents = cohort.students?.length || 0;
      const presentCount = attendanceForDate.filter((att: any) => att.status === 'present').length;
      const absentCount = attendanceForDate.filter((att: any) => att.status === 'absent').length;
      const markedCount = attendanceForDate.length;

      summaryData.push({
        cohort: {
          _id: cohort._id,
          name: cohort.name,
          school: cohort.schoolId,
          tutor: cohort.tutorId
        },
        attendance: {
          totalStudents,
          presentCount,
          absentCount,
          markedCount,
          unmarkedCount: totalStudents - markedCount,
          attendanceRate: markedCount > 0 ? (presentCount / markedCount) * 100 : 0
        }
      });
    }

    res.json(summaryData);
  } catch (error: any) {
    logger.error("Error fetching tutor attendance summary:", error);
    res.status(500).json({ error: "Error fetching tutor attendance summary" });
  }
};
