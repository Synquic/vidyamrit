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

    const attendanceDate = date ? new Date(date) : new Date();
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

        // Remove existing attendance for today for this student
        cohort.attendance = cohort.attendance.filter(
          (att: any) => 
            !(att.studentId.toString() === studentId.toString() && 
              att.date.toDateString() === attendanceDate.toDateString())
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

    // Update time tracking for progress bars (same logic from recordAttendanceProgress)
    if ((cohort as any).programId) {
      const programId = (cohort as any).programId._id || (cohort as any).programId;
      
      // Get the actual program document to access methods (populated documents lose methods)
      const Program = require("../models/ProgramModel").default;
      const program = await Program.findById(programId);
      
      if (program) {
        const currentLevel = cohort.currentLevel || 1;
        const currentLevelInfo = program.getLevelByNumber(currentLevel);
        
        if (currentLevelInfo) {
          // Count students who attended
          const presentStudents = attendanceRecords.filter((r: any) => r.status === 'present').length;
          
          if (presentStudents > 0) {
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

            // Check if this is a new day (avoid double counting if called multiple times same day)
            const today = attendanceDate.toDateString();
            const lastAttendanceDay = cohort.attendance
              .filter((att: any) => att.status === 'present' && att.date.toDateString() !== today)
              .map((att: any) => att.date.toDateString());
            
            const isNewTeachingDay = !lastAttendanceDay.includes(today);
            
            // Count actual unique teaching days (more accurate than incrementing)
            const presentDays = new Set();
            cohort.attendance.forEach((att: any) => {
              if (att.status === 'present') {
                presentDays.add(att.date.toDateString());
              }
            });
            
            const actualAttendanceDays = presentDays.size;
            cohort.timeTracking.attendanceDays = actualAttendanceDays;
            
            // Mark timeTracking as modified so Mongoose saves nested object changes
            cohort.markModified('timeTracking');
            
            // Check if current level is complete based on attendance
            if (cohort.timeTracking.attendanceDays >= cohort.timeTracking.expectedDaysForCurrentLevel) {
              // Level timeframe completed - students may be ready for assessment
              logger.info(`Cohort ${cohortId} completed timeframe for level ${currentLevel}. Students may be ready for assessment.`);
            }
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

    // Apply date filters
    if (date) {
      const queryDate = new Date(date as string);
      attendanceFilter = cohort.attendance.filter((att: any) => 
        att.date.toDateString() === queryDate.toDateString()
      );
    } else if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      attendanceFilter = cohort.attendance.filter((att: any) => 
        att.date >= start && att.date <= end
      );
    }

    // Group attendance by date and student
    const attendanceData = attendanceFilter.reduce((acc: any, record: any) => {
      const dateKey = record.date.toISOString().split('T')[0];
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
        students: cohort.students
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
    const { date } = req.query;

    const Cohort = require("../models/CohortModel").default;
    
    const cohorts = await Cohort.find({ tutorId })
      .populate('students', 'name roll_no')
      .populate('schoolId', 'name');

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

      const totalStudents = cohort.students.length;
      const presentCount = attendanceForDate.filter((att: any) => att.status === 'present').length;
      const absentCount = attendanceForDate.filter((att: any) => att.status === 'absent').length;
      const markedCount = attendanceForDate.length;

      summaryData.push({
        cohort: {
          _id: cohort._id,
          name: cohort.name,
          school: cohort.schoolId
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
