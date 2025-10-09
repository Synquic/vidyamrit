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
    const students = await Student.find({ schoolId }).select(
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
