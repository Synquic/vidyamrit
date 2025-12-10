import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";
import {
  submitVolunteerRequest,
  getAllVolunteerRequests,
  getPendingVolunteerRequests,
  approveVolunteerRequest,
  rejectVolunteerRequest,
} from "../controllers/volunteerRequestController";

const router = Router();

// Public route - Submit volunteer request (no auth required)
router.post("/submit", submitVolunteerRequest);

// Protected routes - Super Admin only
router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN),
  getAllVolunteerRequests
);

router.get(
  "/pending",
  roleMiddleware(UserRole.SUPER_ADMIN),
  getPendingVolunteerRequests
);

router.patch(
  "/:requestId/approve",
  roleMiddleware(UserRole.SUPER_ADMIN),
  approveVolunteerRequest
);

router.patch(
  "/:requestId/reject",
  roleMiddleware(UserRole.SUPER_ADMIN),
  rejectVolunteerRequest
);

export default router;

