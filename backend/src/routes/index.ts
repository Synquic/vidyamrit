import express from "express";
import logger from "../utils/logger";
import userRoutes from "./UserRoutes";
import schoolRouter from "./SchoolRoutes";
import studentRouter from "./StudentRoutes";
import cohortRouter from "./CohortRoutes";
import assessmentRouter from "./AssessmentRoutes";
import attendanceRouter from "./AttendanceRoutes";
import programRouter from "./ProgramRoutes";
import volunteerRouter from "./VolunteerRoutes";
import volunteerRequestRouter from "./VolunteerRequestRoutes";
import progressRouter from "./ProgressRoutes";
import baselineAssessmentRouter from "./BaselineAssessmentRoutes";
import levelAssessmentRouter from "./LevelAssessmentRoutes";
import viewRouter from "./ViewRoutes";
import analyticsRouter from "./AnalyticsRoutes";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("Accessed root route");
  res.json({ message: "Welcome to the API" });
});

// Public routes (no auth required)
router.use("/volunteer-requests", volunteerRequestRouter);

router.use(authMiddleware);

router.use("/assessments", assessmentRouter);
router.use("/attendance", attendanceRouter);
router.use("/users", userRoutes);
router.use("/baseline-assessments", baselineAssessmentRouter);
router.use("/level-assessments", levelAssessmentRouter);
router.use("/cohorts", cohortRouter);
router.use("/programs", programRouter);
router.use("/progress", progressRouter);
router.use("/schools", schoolRouter);
router.use("/students", studentRouter);
router.use("/volunteers", volunteerRouter);
router.use("/views", viewRouter);
router.use("/analytics", analyticsRouter);
// router.use("/super-admin", superAdminRouter);
// router.use("/program-assessments", programAssessmentRouter);
// router.use("/level-transitions", levelTransitionRouter);
// router.use("/reports", reportingRouter);

export default router;
