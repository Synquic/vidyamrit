import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Assessment from "../models/AssessmentModel";
import Student from "../models/StudentModel";
import Cohort from "../models/CohortModel";
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

    const { student: studentId, school: schoolId, subject, level } = req.body;
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

    // Create the assessment
    const assessment = new Assessment({
      student: studentId,
      school: schoolId,
      mentor: mentorId,
      subject,
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

    // Add the new knowledge level to the student
    student.knowledgeLevel.push({
      level: level,
      date: new Date(),
    });

    await student.save();
    console.log("Updated student knowledge level:", studentId, "Level:", level);

    // Find or create default cohort for the student's school and add student to it
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

    // Check if student is already in the cohort
    const isStudentInCohort = cohort.students.some(
      (id) => id.toString() === studentId
    );

    if (!isStudentInCohort) {
      // Add student to the cohort
      cohort.students.push(studentId);
      cohort.updatedAt = new Date();
      await cohort.save();
      console.log("Added student to cohort:", studentId, "Cohort:", cohort._id);

      // Add cohort reference to student if not already present
      const isCohortInStudent = student.cohort.some(
        (c) =>
          c.cohortId.toString() ===
          (cohort._id as mongoose.Types.ObjectId).toString()
      );
      if (!isCohortInStudent) {
        student.cohort.push({
          cohortId: cohort._id as mongoose.Types.ObjectId,
          dateJoined: new Date(),
        });
        await student.save();
        console.log("Updated student cohort membership:", studentId);
      }
    } else {
      console.log("Student already in cohort:", studentId);
    }

    // Populate the assessment before returning
    const populatedAssessment = await Assessment.findById(assessment._id);
    // .populate("student", "name roll_no")
    // .populate("school", "name")
    // .populate("mentor", "name");

    console.log("Assessment creation completed successfully");
    res.status(201).json({
      assessment: populatedAssessment,
      studentLevel: level,
      cohortId: cohort._id,
      message:
        "Assessment created, student level updated, and student added to cohort successfully",
    });
  } catch (error: any) {
    console.error("Error creating assessment:", error);
    res.status(500).json({ error: "Error creating assessment" });
  }
};
