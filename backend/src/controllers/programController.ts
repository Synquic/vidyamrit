import { Request, Response } from "express";
import {
  Program,
  IProgram,
  IProgramLevel,
  TimeframeUnit,
} from "../models/ProgramModel";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";
import mongoose from "mongoose";

// Get all programs
export const getPrograms = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      subject,
      isActive = "true",
      includeInactive = "false",
      page = "1",
      limit = "10",
    } = req.query;

    const filter: any = {};

    if (subject) {
      filter.subject = subject;
    }

    if (includeInactive !== "true") {
      filter.isActive = isActive === "true";
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const programs = await Program.find(filter)
      .populate("createdBy", "name email")
      .sort({ subject: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Program.countDocuments(filter);

    res.json({
      programs,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get program by ID
export const getProgramById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    const program = await Program.findById(id)
      .populate("createdBy", "name email")
      .lean();

    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    res.json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new program
export const createProgram = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, subject, description, totalLevels, levels } = req.body;

    // Validate required fields
    if (!name || !subject || !totalLevels || !levels) {
      res.status(400).json({
        message: "Missing required fields: name, subject, totalLevels, levels",
      });
      return;
    }

    // Validate levels array
    if (!Array.isArray(levels) || levels.length !== totalLevels) {
      res.status(400).json({
        message: `Levels array must contain exactly ${totalLevels} levels`,
      });
      return;
    }

    // Check if program with same name already exists
    const existingProgram = await Program.findOne({ name: name.trim() });
    if (existingProgram) {
      res
        .status(400)
        .json({ message: "Program with this name already exists" });
      return;
    }

    const programData = {
      name: name.trim(),
      subject,
      description: description?.trim() || "",
      totalLevels,
      levels,
      createdBy: req.user!._id,
    };

    const program = await Program.create(programData);

    // Populate the created program
    const populatedProgram = await Program.findById(program._id).populate(
      "createdBy",
      "name email"
    );

    res.status(201).json(populatedProgram);
  } catch (error: any) {
    console.error("Error creating program:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ message: "Validation error", errors });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

// Update program
export const updateProgram = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    // Check if user has permission to update
    if (
      (program.createdBy as mongoose.Types.ObjectId).toString() !==
        req.user!._id.toString() &&
      req.user!.role !== UserRole.SUPER_ADMIN
    ) {
      res
        .status(403)
        .json({ message: "Not authorized to update this program" });
      return;
    }

    // If updating levels, validate the structure
    if (updates.levels) {
      if (!Array.isArray(updates.levels)) {
        res.status(400).json({ message: "Levels must be an array" });
        return;
      }

      if (
        updates.totalLevels &&
        updates.levels.length !== updates.totalLevels
      ) {
        res.status(400).json({
          message: `Levels array must contain exactly ${updates.totalLevels} levels`,
        });
        return;
      }
    }

    const updatedProgram = await Program.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.json(updatedProgram);
  } catch (error: any) {
    console.error("Error updating program:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ message: "Validation error", errors });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete program
export const deleteProgram = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    // Check if user has permission to delete
    if (
      (program.createdBy as mongoose.Types.ObjectId).toString() !==
        req.user!._id.toString() &&
      req.user!.role !== UserRole.SUPER_ADMIN
    ) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this program" });
      return;
    }

    await Program.findByIdAndDelete(id);
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle program active status
export const toggleProgramStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    // Check if user has permission to update
    if (
      (program.createdBy as mongoose.Types.ObjectId).toString() !==
        req.user!._id.toString() &&
      req.user!.role !== UserRole.SUPER_ADMIN
    ) {
      res
        .status(403)
        .json({ message: "Not authorized to update this program" });
      return;
    }

    program.isActive = !program.isActive;
    await program.save();

    res.json({
      message: `Program ${
        program.isActive ? "activated" : "deactivated"
      } successfully`,
      isActive: program.isActive,
    });
  } catch (error) {
    console.error("Error toggling program status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get program time lapse matrix
export const getProgramTimeLapseMatrix = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { unit = "weeks" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    // Validate timeframe unit
    if (!Object.values(TimeframeUnit).includes(unit as TimeframeUnit)) {
      res.status(400).json({
        message:
          "Invalid unit. Must be one of: " +
          Object.values(TimeframeUnit).join(", "),
      });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    const matrix = program.getTimeLapseMatrix(unit as TimeframeUnit);

    res.json({
      programId: id,
      programName: program.name,
      subject: program.subject,
      unit,
      totalLevels: program.totalLevels,
      timeLapseMatrix: matrix,
      levelTitles: program.levels.map((level) => ({
        levelNumber: level.levelNumber,
        title: level.title,
      })),
    });
  } catch (error) {
    console.error("Error generating time lapse matrix:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get time to complete between specific levels
export const getTimeToComplete = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { fromLevel = "1", toLevel, unit = "weeks" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    // Validate timeframe unit
    if (!Object.values(TimeframeUnit).includes(unit as TimeframeUnit)) {
      res.status(400).json({
        message:
          "Invalid unit. Must be one of: " +
          Object.values(TimeframeUnit).join(", "),
      });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    const from = parseInt(fromLevel as string);
    const to = toLevel ? parseInt(toLevel as string) : program.totalLevels;

    try {
      const totalTime = program.getTotalTimeToComplete(
        from,
        to,
        unit as TimeframeUnit
      );

      res.json({
        programId: id,
        programName: program.name,
        fromLevel: from,
        toLevel: to,
        totalTime,
        unit,
        breakdown: program.levels
          .filter(
            (level) => level.levelNumber >= from && level.levelNumber <= to
          )
          .map((level) => ({
            levelNumber: level.levelNumber,
            title: level.title,
            timeframe: level.timeframe,
            timeframeUnit: level.timeframeUnit,
          })),
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error("Error calculating time to complete:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get level details
export const getLevelDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, levelNumber } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    const levelNum = parseInt(levelNumber);
    if (isNaN(levelNum) || levelNum < 1) {
      res.status(400).json({ message: "Invalid level number" });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    const level = program.getLevelByNumber(levelNum);
    if (!level) {
      res.status(404).json({ message: "Level not found" });
      return;
    }

    const nextLevel = program.getNextLevel(levelNum);
    const previousLevel = program.getPreviousLevel(levelNum);

    res.json({
      programId: id,
      programName: program.name,
      level,
      navigation: {
        nextLevel: nextLevel
          ? {
              levelNumber: nextLevel.levelNumber,
              title: nextLevel.title,
            }
          : null,
        previousLevel: previousLevel
          ? {
              levelNumber: previousLevel.levelNumber,
              title: previousLevel.title,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching level details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create sample Hindi program (utility endpoint)
export const createSampleHindiProgram = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if Hindi program already exists
    const existingProgram = await Program.findOne({
      subject: "hindi",
      name: "Hindi Language Program",
    });

    if (existingProgram) {
      res.status(400).json({
        message: "Sample Hindi program already exists",
        programId: existingProgram._id,
      });
      return;
    }

    const hindiProgram = await (Program as any).createHindiProgram(
      req.user!._id
    );

    const populatedProgram = await Program.findById(hindiProgram._id).populate(
      "createdBy",
      "name email"
    );

    res.status(201).json({
      message: "Sample Hindi program created successfully",
      program: populatedProgram,
    });
  } catch (error) {
    console.error("Error creating sample Hindi program:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Validate level progression
export const validateLevelProgression = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { fromLevel, toLevel } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid program ID" });
      return;
    }

    if (!fromLevel || !toLevel) {
      res
        .status(400)
        .json({ message: "Both fromLevel and toLevel are required" });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ message: "Program not found" });
      return;
    }

    const isValid = program.validateLevelProgression(fromLevel, toLevel);

    res.json({
      programId: id,
      fromLevel,
      toLevel,
      isValid,
      message: isValid
        ? "Level progression is valid"
        : "Level progression is not allowed",
    });
  } catch (error) {
    console.error("Error validating level progression:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
