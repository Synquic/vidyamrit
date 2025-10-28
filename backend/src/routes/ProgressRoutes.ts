import express from "express";
import { 
  updateStudentProgress,
  getCohortProgress,
  getTutorProgressSummary,
  getStudentsReadyForAssessment,
  getStudentProgressHistory,
  recordAttendanceProgress,
  getCohortTimeline
} from "../controllers/progressController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = express.Router();

// Route to update student progress after assessment
router.post("/update", 
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  updateStudentProgress
);

// Get progress for all students in a cohort
router.get("/cohort/:cohortId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getCohortProgress
);

// Get progress summary for tutor's cohorts
router.get("/tutor/summary",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getTutorProgressSummary
);

// Get students ready for level transition assessment
router.get("/cohort/:cohortId/ready-for-assessment",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudentsReadyForAssessment
);

// Get detailed progress history for a student
router.get("/cohort/:cohortId/student/:studentId/history",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudentProgressHistory
);

// Record daily attendance and update time-based progress
router.post("/cohort/:cohortId/attendance",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  recordAttendanceProgress
);

// Get cohort timeline and progress bar data
router.get("/cohort/:cohortId/timeline",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getCohortTimeline
);

export default router;