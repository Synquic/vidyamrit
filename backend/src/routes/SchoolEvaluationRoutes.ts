import express from "express";
import {
  createSchoolEvaluation,
  getSchoolEvaluations,
  getSchoolEvaluationById,
  updateSchoolEvaluation,
  addEvaluationCategory,
  addActionItem,
  completeActionItem,
  scheduleEvaluationVisit,
  submitEvaluationDocument,
  verifyEvaluationDocument,
  finalizeEvaluationDecision,
  getEvaluationStatistics,
  generateEvaluationReport,
  deleteSchoolEvaluation,
} from "../controllers/schoolEvaluationController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Public routes (authenticated users)
router.get("/statistics", getEvaluationStatistics);

// Create school evaluation (Super Admin and authorized evaluators)
router.post("/", roleMiddleware(["super_admin"]), createSchoolEvaluation);

// Get all school evaluations (with role-based filtering)
router.get("/", getSchoolEvaluations);

// Get specific school evaluation by ID
router.get("/:id", getSchoolEvaluationById);

// Update school evaluation (Evaluators and Super Admin)
router.put("/:id", updateSchoolEvaluation);

// Add evaluation category and criteria
router.post(
  "/:id/categories",
  roleMiddleware(["super_admin"]),
  addEvaluationCategory
);

// Add action item
router.post("/:id/action-items", addActionItem);

// Complete action item
router.put("/:id/action-items/:actionItemId/complete", completeActionItem);

// Schedule evaluation visit
router.post(
  "/:id/visits",
  roleMiddleware(["super_admin"]),
  scheduleEvaluationVisit
);

// Submit document for evaluation
router.post("/:id/documents", submitEvaluationDocument);

// Verify submitted document
router.put(
  "/:id/documents/:documentId/verify",
  roleMiddleware(["super_admin"]),
  verifyEvaluationDocument
);

// Finalize evaluation decision
router.put(
  "/:id/finalize",
  roleMiddleware(["super_admin"]),
  finalizeEvaluationDecision
);

// Generate evaluation report
router.get("/:id/report", generateEvaluationReport);

// Delete school evaluation (Super Admin only)
router.delete("/:id", roleMiddleware(["super_admin"]), deleteSchoolEvaluation);

export default router;
