import { Router } from "express";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";
import TestReport from "../models/TestReportModel";
import { AuthRequest } from "../types/auth";
import { Response } from "express";
import logger from "../utils/logger";

const router = Router();

// Create a test report
router.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  async (req: AuthRequest, res: Response) => {
    try {
      const { student, school, program, subject, testType, level, score, passed, action, totalQuestions, correctAnswers } = req.body;
      const mentor = req.user?._id;

      if (!student || !school || !subject || !level || totalQuestions === undefined || correctAnswers === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const report = await new TestReport({
        student,
        school,
        program: program || null,
        subject,
        testType: testType || "baseline",
        level,
        score: score ?? (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0),
        passed: passed ?? null,
        action: action ?? null,
        totalQuestions,
        correctAnswers,
        mentor,
        date: new Date(),
      }).save();

      res.status(201).json(report);
    } catch (error) {
      logger.error("Error creating test report:", error);
      res.status(500).json({ error: "Failed to create test report" });
    }
  }
);

// Get test reports for a student
router.get(
  "/student/:studentId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  async (req: AuthRequest, res: Response) => {
    try {
      const { studentId } = req.params;
      const reports = await TestReport.find({ student: studentId })
        .populate("program", "name subject")
        .populate("mentor", "name")
        .populate("school", "name")
        .sort({ date: -1 });
      res.json(reports);
    } catch (error) {
      logger.error("Error fetching test reports:", error);
      res.status(500).json({ error: "Failed to fetch test reports" });
    }
  }
);

// Get test reports for a school (for view dashboard)
router.get(
  "/school/:schoolId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  async (req: AuthRequest, res: Response) => {
    try {
      const { schoolId } = req.params;
      const reports = await TestReport.find({ school: schoolId })
        .populate("student", "name roll_no class")
        .populate("program", "name subject")
        .populate("mentor", "name")
        .sort({ date: -1 });
      res.json(reports);
    } catch (error) {
      logger.error("Error fetching school test reports:", error);
      res.status(500).json({ error: "Failed to fetch test reports" });
    }
  }
);

export default router;
