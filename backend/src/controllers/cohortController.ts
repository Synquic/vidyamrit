import { Request, Response } from "express";
import Cohort from "../models/CohortModel";

// Get all cohorts
export const getCohorts = async (req: Request, res: Response) => {
  try {
    const cohorts = await Cohort.find().sort({ createdAt: -1 });
    res.json(cohorts);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cohorts" });
  }
};

// Get single cohort
export const getCohort = async (req: Request, res: Response) => {
  try {
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }
    res.json(cohort);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cohort" });
  }
};

// Create cohort (School Admin, Super Admin only)
export const createCohort = async (req: Request, res: Response) => {
  try {
    const cohort = new Cohort(req.body);
    await cohort.save();
    res.status(201).json(cohort);
  } catch (error: any) {
    res.status(500).json({ error: "Error creating cohort" });
  }
};

// Update cohort (School Admin, Super Admin only)
export const updateCohort = async (req: Request, res: Response) => {
  try {
    const cohort = await Cohort.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }
    res.json(cohort);
  } catch (error: any) {
    res.status(500).json({ error: "Error updating cohort" });
  }
};

// Delete cohort (School Admin, Super Admin only)
export const deleteCohort = async (req: Request, res: Response) => {
  try {
    const cohort = await Cohort.findByIdAndDelete(req.params.id);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }
    res.json({ message: "Cohort deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting cohort" });
  }
};

// Mentor can add students to cohort
export const addStudentToCohort = async (req: Request, res: Response) => {
  try {
    console.log("Adding student to cohort:", req.params.id, req.body);
    const { studentId } = req.body;
    const cohort = await Cohort.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { students: studentId }, updatedAt: new Date() },
      { new: true }
    )
      .populate("schoolId", "name")
      .populate("mentorId", "name")
      .populate("students", "name roll_no");
    if (!cohort) {
      console.log("Cohort not found:", req.params.id);
      return res.status(404).json({ error: "Cohort not found" });
    }
    console.log("Successfully added student to cohort");
    res.json(cohort);
  } catch (error: any) {
    console.error("Error adding student to cohort:", error);
    res.status(500).json({ error: "Error adding student to cohort" });
  }
};

// Find or create default cohort for a school and add student to it
export const addStudentToDefaultCohort = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("Adding student to default cohort with data:", req.body);
    const { studentId, schoolId, mentorId } = req.body;

    // First, try to find an existing default cohort for the school
    let cohort = await Cohort.findOne({
      schoolId: schoolId,
      name: /^default/i, // Find cohort with name starting with "default" (case insensitive)
    });

    // If no default cohort exists, create one
    if (!cohort) {
      console.log("No default cohort found, creating new one");
      cohort = new Cohort({
        name: `Default Cohort - ${new Date().getFullYear()}`,
        schoolId: schoolId,
        mentorId: mentorId,
        students: [],
      });
      await cohort.save();
      console.log("Created new default cohort:", cohort._id);
    }

    // Add student to the cohort if not already added
    const updatedCohort = await Cohort.findByIdAndUpdate(
      cohort._id,
      {
        $addToSet: { students: studentId },
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate("schoolId", "name")
      .populate("mentorId", "name")
      .populate("students", "name roll_no");

    console.log("Updated cohort with student:", updatedCohort);
    res.json(updatedCohort);
  } catch (error: any) {
    console.error("Error adding student to default cohort:", error);
    res.status(500).json({ error: "Error adding student to default cohort" });
  }
};
