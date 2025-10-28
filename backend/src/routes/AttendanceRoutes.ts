import { Router } from "express";
import {
  getAttendanceRecords,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceStats,
  getDailyAttendance,
  recordCohortAttendance,
  getCohortAttendance,
  getTutorAttendanceSummary,
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

// Record attendance for a cohort
attendanceRouter.post(
  "/cohort",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  recordCohortAttendance
);

// Get attendance for a specific cohort
attendanceRouter.get(
  "/cohort/:cohortId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getCohortAttendance
);

// Get attendance summary for tutor's cohorts
attendanceRouter.get(
  "/tutor/summary",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getTutorAttendanceSummary
);

export default attendanceRouter;
