import express from "express";
import { uploadQuestionImage, deleteQuestionImage } from "../controllers/uploadController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = express.Router();

// Only SUPER_ADMIN can upload/delete question images
router.post(
  "/question-image",
  roleMiddleware(UserRole.SUPER_ADMIN),
  uploadQuestionImage as any
);

router.delete(
  "/question-image",
  roleMiddleware(UserRole.SUPER_ADMIN),
  deleteQuestionImage
);

export default router;
