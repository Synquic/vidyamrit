import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentLevel,
  getStudentCohortStatus,
} from "../controllers/studentController";

const studentRouter = Router();

// Students are database records, no auth required for them
studentRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  createStudent
); // Create a student record
studentRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudents
); // Get all students (with optional schoolId filter)
studentRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudent
); // Get a single student by MongoDB _id
studentRouter.get(
  "/:id/level",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudentLevel
); // Get student's current level
studentRouter.get(
  "/cohort-status/:schoolId",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudentCohortStatus
); // Get cohort assignment status for a school
studentRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  updateStudent
); // Update student by MongoDB _id
studentRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN),
  deleteStudent
); // Delete student by MongoDB _id

export default studentRouter;
