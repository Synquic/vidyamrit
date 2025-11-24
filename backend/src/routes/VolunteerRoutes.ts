import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";
import {
  createVolunteer,
  getVolunteersBySchool,
  getAllVolunteers,
  updateVolunteerStatus,
  extendVolunteerAccess,
  deleteVolunteer,
  checkVolunteerAccess,
} from "../controllers/volunteerController";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Super admin only routes
router.post(
  "/create",
  roleMiddleware(UserRole.SUPER_ADMIN),
  createVolunteer
);

router.get(
  "/all",
  roleMiddleware(UserRole.SUPER_ADMIN),
  getAllVolunteers
);

router.get(
  "/school/:schoolId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getVolunteersBySchool
);

router.patch(
  "/:volunteerId/status",
  roleMiddleware(UserRole.SUPER_ADMIN),
  updateVolunteerStatus
);

router.patch(
  "/:volunteerId/extend",
  roleMiddleware(UserRole.SUPER_ADMIN),
  extendVolunteerAccess
);

router.delete(
  "/:volunteerId",
  roleMiddleware(UserRole.SUPER_ADMIN),
  deleteVolunteer
);

// Volunteer can check their own access
router.get(
  "/access/check",
  roleMiddleware(UserRole.VOLUNTEER),
  checkVolunteerAccess
);

export default router;