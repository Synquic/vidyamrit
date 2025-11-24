import express from "express";
import {
  createView,
  getViews,
  getView,
  getMyView,
  updateView,
  deleteView,
  getViewData,
  getMyViewData,
  activateView,
} from "../controllers/viewController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const viewRouter = express.Router();

// All view routes require authentication
viewRouter.use(authMiddleware);

// Create view - only super_admin
viewRouter.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN),
  createView
);

// Get all views - only super_admin
viewRouter.get(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN),
  getViews
);

// Get my view (for view users) - MUST come before /:id routes
viewRouter.get("/me/view", getMyView);

// Get my view data (for view users) - MUST come before /:id routes
viewRouter.get("/me/data", getMyViewData);

// Get single view - super_admin or view user (their own view)
viewRouter.get("/:id", getView);

// Update view - only super_admin
viewRouter.put(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN),
  updateView
);

// Delete view - only super_admin
viewRouter.delete(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN),
  deleteView
);

// Get view data - super_admin or view user (their own view)
viewRouter.get("/:id/data", getViewData);

// Activate/Deactivate view - only super_admin
viewRouter.put(
  "/:id/activate",
  roleMiddleware(UserRole.SUPER_ADMIN),
  activateView
);

export default viewRouter;

