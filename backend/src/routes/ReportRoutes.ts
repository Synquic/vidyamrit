import { Router, Response } from "express";
import { AuthRequest } from "../types/auth";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";
import Student from "../models/StudentModel";
import Attendance from "../models/AttendanceModel";
import mongoose from "mongoose";
import logger from "../utils/logger";

const router = Router();

// GET /api/reports/overview?schoolId=X&classFilter=Y
router.get(
  "/overview",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  async (req: AuthRequest, res: Response) => {
    try {
      let schoolId = req.query.schoolId as string;
      const classFilter = req.query.classFilter as string;

      // For tutor, force their school
      if (req.user?.role === UserRole.TUTOR && req.user.schoolId) {
        schoolId = (req.user.schoolId as any)?._id?.toString() || req.user.schoolId.toString();
      }

      if (!schoolId) {
        return res.status(400).json({ error: "schoolId is required" });
      }

      const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

      // Build student query
      const studentQuery: any = { school: schoolObjectId };
      if (classFilter && classFilter !== "all") {
        studentQuery.class = classFilter;
      }

      // Get all students matching filter
      const students = await Student.find(studentQuery)
        .select("name class isArchived fln roll_no")
        .sort({ name: 1 })
        .lean();

      // Calculate counts
      const activeCount = students.filter((s: any) => !s.isArchived).length;
      const inactiveCount = students.filter((s: any) => s.isArchived).length;
      const proficientCount = students.filter(
        (s: any) => s.fln && Array.isArray(s.fln) && s.fln.some((f: any) => f.source === "level_test")
      ).length;

      // Calculate avg attendance (all time)
      const studentIds = students.map((s: any) => s._id);
      let avgAttendance = 0;

      if (studentIds.length > 0) {
        const attendanceStats = await Attendance.aggregate([
          {
            $match: {
              student: { $in: studentIds },
              status: { $in: ["present", "absent"] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
            },
          },
        ]);

        if (attendanceStats.length > 0 && attendanceStats[0].total > 0) {
          avgAttendance = Math.round(
            (attendanceStats[0].present / attendanceStats[0].total) * 100
          );
        }
      }

      // Get available classes for this school
      const availableClasses = await Student.distinct("class", {
        school: schoolObjectId,
      });

      res.json({
        avgAttendance,
        proficientCount,
        activeCount,
        inactiveCount,
        totalStudents: students.length,
        availableClasses: availableClasses.sort(),
        students: students.map((s: any) => ({
          _id: s._id,
          name: s.name,
          class: s.class,
          roll_no: s.roll_no,
          isArchived: s.isArchived,
          isProficient: s.fln && Array.isArray(s.fln) && s.fln.some((f: any) => f.source === "level_test"),
          fln: (s.fln || []).map((f: any) => ({
            subject: f.subject,
            source: f.source || "baseline",
          })),
        })),
      });
    } catch (error) {
      logger.error("Error generating report overview:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  }
);

export default router;
