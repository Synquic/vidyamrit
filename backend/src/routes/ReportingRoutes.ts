import { Router } from "express";
import {
  generateSchoolReport,
  generateTutorReport,
  generateProgramReport,
  getAnalyticsDashboard,
} from "../controllers/reportingController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const reportingRouter = Router();

// Generate comprehensive school report (Super Admin only)
reportingRouter.get(
  "/school/:schoolId",
  roleMiddleware(UserRole.SUPER_ADMIN),
  generateSchoolReport
);

// Generate tutor performance report
reportingRouter.get(
  "/tutor/:tutorId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  generateTutorReport
);

// Generate program effectiveness report
reportingRouter.get(
  "/program/:programId",
  roleMiddleware(UserRole.SUPER_ADMIN),
  generateProgramReport
);

// Get analytics dashboard data
reportingRouter.get(
  "/analytics",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getAnalyticsDashboard
);

export default reportingRouter;