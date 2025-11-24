import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Assessment from "../models/AssessmentModel";
import Student from "../models/StudentModel";
import Cohort from "../models/CohortModel";
import Program from "../models/ProgramModel";
import mongoose from "mongoose";

// Get all assessments
export const getAssessments = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Fetching all assessments");
    const assessments = await Assessment.find()
      .populate("student", "name roll_no")
      .populate("school", "name")
      .populate("mentor", "name")
      .sort({ date: -1 });
    console.log("Successfully fetched assessments:", assessments.length);
    res.json(assessments);
  } catch (error: any) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ error: "Error fetching assessments" });
  }
};

// Get single assessment
export const getAssessment = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Fetching assessment with ID:", req.params.id);
    const assessment = await Assessment.findById(req.params.id)
      .populate("student", "name roll_no")
      .populate("school", "name")
      .populate("mentor", "name");
    if (!assessment) {
      console.log("Assessment not found");
      return res.status(404).json({ error: "Assessment not found" });
    }
    console.log("Successfully fetched assessment:", assessment._id);
    res.json(assessment);
  } catch (error: any) {
    console.error("Error fetching assessment:", error);
    res.status(500).json({ error: "Error fetching assessment" });
  }
};

// Create assessment and update student level
export const createAssessment = async (req: AuthRequest, res: Response) => {
  try {
    console.log("=== ASSESSMENT CREATION DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request user:", JSON.stringify(req.user, null, 2));
    console.log("Request headers auth:", req.headers.authorization);
    console.log("===================================");

    const { student: studentId, school: schoolId, subject, level, program: programId } = req.body;
    let { mentor: mentorId } = req.body;

    // If mentor is not provided, use the authenticated user's MongoDB _id
    if (!mentorId && req.user) {
      mentorId = req.user._id;
      console.log("Using authenticated user MongoDB _id as mentor:", mentorId);
    }

    if (!mentorId) {
      console.error("Mentor ID is required but not provided");
      return res.status(400).json({ error: "Mentor ID is required" });
    }

    // Fetch program to get subject (programName)
    let program = null;
    let programSubject = subject; // Fallback to provided subject if program not found
    
    if (programId) {
      program = await Program.findById(programId);
      if (program) {
        programSubject = program.subject; // Use subject from program
        console.log("Found program:", program.name, "Subject:", programSubject);
      } else {
        console.warn("Program not found with ID:", programId, "Using provided subject:", subject);
      }
    } else {
      console.warn("Program ID not provided in request body");
    }

    // Create the assessment
    const assessment = new Assessment({
      student: studentId,
      school: schoolId,
      mentor: mentorId,
      subject: programSubject,
      level,
      date: new Date(),
    });

    await assessment.save();
    console.log("Assessment created successfully:", assessment._id);

    // Update student's knowledge level
    const student = await Student.findById(studentId);
    if (!student) {
      console.error("Student not found:", studentId);
      return res.status(404).json({ error: "Student not found" });
    }

    // Add the new knowledge level to the student with program information
    if (!programId) {
      return res.status(400).json({ 
        error: "Program ID is required to update student knowledge level" 
      });
    }

    student.knowledgeLevel.push({
      program: new mongoose.Types.ObjectId(programId),
      programName: programSubject, // Subject value from program
      subject: programSubject, // Same as programName for consistency
      level: level,
      date: new Date(),
    });

    await student.save();
    console.log("Updated student knowledge level:", studentId, "Program:", programId, "Level:", level);

    // No longer automatically creating cohorts - students will await cohort assignment

    // Populate the assessment before returning
    const populatedAssessment = await Assessment.findById(assessment._id);

    console.log("Assessment creation completed successfully");
    res.status(201).json({
      assessment: populatedAssessment,
      studentLevel: level,
      message: "Assessment created and student level updated successfully",
    });
  } catch (error: any) {
    console.error("Error creating assessment:", error);
    res.status(500).json({ error: "Error creating assessment" });
  }
};
