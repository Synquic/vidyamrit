import express from "express";
import logger from "../utils/logger";
import userRoutes from "./UserRoutes";
import superAdminRouter from "./SuperAdminRoutes";
import schoolRouter from "./SchoolRoutes";
import schoolAdminRouter from "./SchoolAdminRoutes";
import mentorRouter from "./MentorRoutes";
import studentRouter from "./StudentRoutes";
import cohortRouter from "./CohortRoutes";
import assessmentRouter from "./AssessmentRoutes";
import questionSetRouter from "./QuestionSetRoutes";
import attendanceRouter from "./AttendanceRoutes";
import groupRouter from "./GroupRoutes";
import progressRouter from "./ProgressRoutes";
import mentorProfileRouter from "./MentorProfileRoutes";
import schoolEvaluationRouter from "./SchoolEvaluationRoutes";
import schoolOnboardingRouter from "./SchoolOnboardingRoutes";
import enhancedStudentRouter from "./EnhancedStudentRoutes";
import analyticsRouter from "./AnalyticsRoutes";
import programRouter from "./ProgramRoutes";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("Accessed root route");
  res.json({ message: "Welcome to the API" });
});

router.use(authMiddleware);

router.use("/users", userRoutes);
router.use("/super-admin", superAdminRouter);
router.use("/school-admins", schoolAdminRouter);
router.use("/schools", schoolRouter);
router.use("/mentors", mentorRouter);
router.use("/students", studentRouter);
router.use("/cohorts", cohortRouter);
router.use("/assessments", assessmentRouter);
router.use("/attendance", attendanceRouter);
router.use("/groups", groupRouter);
router.use("/progress", progressRouter);
router.use("/mentor-profiles", mentorProfileRouter);
router.use("/school-evaluations", schoolEvaluationRouter);
router.use("/school-onboardings", schoolOnboardingRouter);
router.use("/enhanced-students", enhancedStudentRouter);
router.use("/analytics", analyticsRouter);
router.use("/question-sets", questionSetRouter);
router.use("/programs", programRouter);

export default router;
