import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Program } from "../models/ProgramModel";
import { validateProgramImportData } from "../utils/validators";
import {
  validateSimpleProgramData,
  convertSimpleToFullProgram,
} from "../utils/simpleValidators";

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/programs");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `program-import-${uniqueSuffix}.json`);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype === "application/json" ||
    path.extname(file.originalname).toLowerCase() === ".json"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JSON files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Controller function to handle program import
const importProgramController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded. Please select a JSON file.",
      });
      return;
    }

    console.log("📁 Processing uploaded file:", req.file.filename);

    // Read and parse the uploaded JSON file
    const filePath = req.file.path;
    let programData: any;

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      programData = JSON.parse(fileContent);
    } catch (parseError) {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      res.status(400).json({
        success: false,
        message:
          "Invalid JSON file format. Please check your file and try again.",
      });
      return;
    }

    // Detect format and validate the program data
    let validation;
    let finalProgramData;

    // Check if it's the simple format (has questionSets) or full format (has levels)
    if (programData.questionSets && Array.isArray(programData.questionSets)) {
      console.log("🔍 Detected simple format with questionSets");

      // Validate simple format
      validation = validateSimpleProgramData(programData);
      if (!validation.isValid) {
        fs.unlinkSync(filePath);
        res.status(400).json({
          success: false,
          message: "Invalid simple program data format",
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return;
      }

      // Convert simple format to full program format
      finalProgramData = convertSimpleToFullProgram(programData);
      console.log("✅ Converted simple format to full program structure");
    } else if (programData.levels && Array.isArray(programData.levels)) {
      console.log("🔍 Detected full format with levels");

      // Validate full format
      validation = validateProgramImportData(programData);
      if (!validation.isValid) {
        fs.unlinkSync(filePath);
        res.status(400).json({
          success: false,
          message: "Invalid full program data format",
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return;
      }

      finalProgramData = programData;
    } else {
      fs.unlinkSync(filePath);
      res.status(400).json({
        success: false,
        message:
          'Invalid program format. Must contain either "questionSets" (simple format) or "levels" (full format)',
        errors: ["Missing questionSets or levels array"],
      });
      return;
    }

    // Check if program with same name already exists
    const existingProgram = await Program.findOne({
      name: finalProgramData.programName,
      createdBy: req.user?.id,
    });

    if (existingProgram) {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      res.status(409).json({
        success: false,
        message: `Program with name "${finalProgramData.programName}" already exists. Please use a different name or delete the existing program first.`,
      });
      return;
    }

    console.log("✅ Validation passed, creating program...");

    // Create the program in database
    const newProgram = new Program({
      name: finalProgramData.programName,
      subject: finalProgramData.subject,
      description: finalProgramData.description,
      totalLevels: finalProgramData.levels.length,
      levels: finalProgramData.levels.map((level: any) => ({
        levelNumber: level.levelNumber,
        title: level.title,
        description: level.description,
        timeframe: level.timeframe,
        timeframeUnit: level.timeframeUnit,
        prerequisites: level.prerequisites || [],
        objectives: level.objectives || [],
        resources: level.resources || [],
        assessmentCriteria: level.assessmentCriteria || "",
        assessmentQuestions: level.assessmentQuestions || [],
      })),
      isActive: true,
      createdBy: req.user?.id || "",
    });

    // Save to database
    const savedProgram = await newProgram.save();

    console.log("🎉 Program created successfully:", savedProgram.name);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    // Return success response
    res.status(201).json({
      success: true,
      message: `Program "${finalProgramData.programName}" imported successfully!`,
      data: {
        programId: (savedProgram as any)._id.toString(),
        programName: savedProgram.name,
        subject: savedProgram.subject,
        totalLevels: savedProgram.totalLevels,
        levelsImported: savedProgram.levels.length,
        totalQuestions: savedProgram.levels.reduce(
          (total, level) => total + (level.assessmentQuestions?.length || 0),
          0
        ),
      },
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error("❌ Error importing program:", error);

    // Clean up uploaded file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error cleaning up file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while importing program",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Server error",
    });
  }
};

// Export the middleware chain
export const importProgram = [upload.single("file"), importProgramController];
