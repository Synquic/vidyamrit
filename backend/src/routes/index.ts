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
import progressRouter from "./ProgressRoutes";
import baselineAssessmentRouter from "./BaselineAssessmentRoutes";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("Accessed root route");
  res.json({ message: "Welcome to the API" });
});

router.use(authMiddleware);

router.use("/assessments", assessmentRouter);
router.use("/attendance", attendanceRouter);
router.use("/users", userRoutes);
router.use("/baseline-assessments", baselineAssessmentRouter);
router.use("/cohorts", cohortRouter);
router.use("/programs", programRouter);
router.use("/progress", progressRouter);
router.use("/schools", schoolRouter);
router.use("/students", studentRouter);
router.use("/volunteers", volunteerRouter);
// router.use("/super-admin", superAdminRouter);
// router.use("/program-assessments", programAssessmentRouter);
// router.use("/level-transitions", levelTransitionRouter);
// router.use("/reports", reportingRouter);

export default router;
