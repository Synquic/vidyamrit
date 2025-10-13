import express from "express";
import logger from "../utils/logger";
import userRoutes from "./UserRoutes";
import superAdminRouter from "./SuperAdminRoutes";
import schoolRouter from "./SchoolRoutes";
import studentRouter from "./StudentRoutes";
import cohortRouter from "./CohortRoutes";
import assessmentRouter from "./AssessmentRoutes";
import attendanceRouter from "./AttendanceRoutes";
import programRouter from "./ProgramRoutes";
import programAssessmentRouter from "./ProgramAssessmentRoutes";
import volunteerRouter from "./VolunteerRoutes";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("Accessed root route");
  res.json({ message: "Welcome to the API" });
});

router.use(authMiddleware);

router.use("/users", userRoutes);
router.use("/super-admin", superAdminRouter);
router.use("/schools", schoolRouter);
router.use("/students", studentRouter);
router.use("/cohorts", cohortRouter);
router.use("/assessments", assessmentRouter);
router.use("/attendance", attendanceRouter);
router.use("/programs", programRouter);
router.use("/program-assessments", programAssessmentRouter);
router.use("/volunteers", volunteerRouter);

export default router;
