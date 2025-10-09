import { Router } from "express";
import {
  getAttendanceRecords,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceStats,
  getDailyAttendance,
} from "../controllers/attendanceController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const attendanceRouter = Router();

// Get attendance records with filters
attendanceRouter.get(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  getAttendanceRecords
);

// Mark attendance for a single student
attendanceRouter.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  markAttendance
);

// Bulk mark attendance for multiple students
attendanceRouter.post(
  "/bulk",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  bulkMarkAttendance
);

// Get attendance statistics
attendanceRouter.get(
  "/stats",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  getAttendanceStats
);

// Get daily attendance for a school
attendanceRouter.get(
  "/daily",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  getDailyAttendance
);

export default attendanceRouter;
