import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import logger from "../utils/logger";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "question-images");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `question-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WebP images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const uploadQuestionImageController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = `/uploads/question-images/${req.file.filename}`;
    logger.info(`Question image uploaded: ${imageUrl}`);

    res.json({ imageUrl });
  } catch (error: any) {
    logger.error(`Error uploading question image: ${error.message}`);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

const deleteQuestionImageController = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    // Extract filename from URL and validate path
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Security: ensure file is within upload directory
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ message: "Invalid image path" });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Question image deleted: ${imageUrl}`);
    }

    res.json({ message: "Image deleted" });
  } catch (error: any) {
    logger.error(`Error deleting question image: ${error.message}`);
    res.status(500).json({ message: "Failed to delete image" });
  }
};

export const uploadQuestionImage = [
  upload.single("image"),
  uploadQuestionImageController,
];

export const deleteQuestionImage = deleteQuestionImageController;
