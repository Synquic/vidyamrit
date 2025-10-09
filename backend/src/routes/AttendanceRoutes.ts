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
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getAttendanceRecords
);

// Mark attendance for a single student
attendanceRouter.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  markAttendance
);

// Bulk mark attendance for multiple students
attendanceRouter.post(
  "/bulk",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  bulkMarkAttendance
);

// Get attendance statistics
attendanceRouter.get(
  "/stats",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getAttendanceStats
);

// Get daily attendance for a school
attendanceRouter.get(
  "/daily",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getDailyAttendance
);

export default attendanceRouter;
