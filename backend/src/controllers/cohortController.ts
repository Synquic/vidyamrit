import { Request, Response } from "express";
import Cohort from "../models/CohortModel";
import Student from "../models/StudentModel";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";
import { generateCohortPlan, LevelInput } from "../lib/CohortGenerationAlgo";

// Get all cohorts
export const getCohorts = async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.query;
    let cohorts;

    // Super admin can see all cohorts or filter by school
    if (req.user?.role === UserRole.SUPER_ADMIN) {
      const filter: any = {};
      
      // If schoolId is provided, filter by that school
      if (schoolId) {
        filter.schoolId = schoolId;
      }
      
      cohorts = await Cohort.find(filter)
        .populate("schoolId", "name")
        .populate("tutorId", "name email")
        .sort({ createdAt: -1 });
    }
    // Tutors can only see cohorts they're assigned to or from their school
    else if (req.user?.role === UserRole.TUTOR) {
      const filter: any = {};

      // Filter by tutor ID or school ID
      if (req.user.schoolId) {
        filter.$or = [
          { tutorId: req.user._id },
          { schoolId: req.user.schoolId },
        ];
      } else {
        filter.tutorId = req.user._id;
      }

      cohorts = await Cohort.find(filter)
        .populate("schoolId", "name")
        .populate("tutorId", "name email")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(cohorts);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cohorts" });
  }
};

// Get single cohort
export const getCohort = async (req: AuthRequest, res: Response) => {
  try {
    let cohort;

    // Super admin can see any cohort
    if (req.user?.role === UserRole.SUPER_ADMIN) {
      cohort = await Cohort.findById(req.params.id)
        .populate("schoolId", "name")
        .populate("tutorId", "name email");
    }
    // Tutors can only see cohorts they're assigned to or from their school
    else if (req.user?.role === UserRole.TUTOR) {
      const filter: any = { _id: req.params.id };

      // Add access control filter
      if (req.user.schoolId) {
        filter.$or = [
          { tutorId: req.user._id },
          { schoolId: req.user.schoolId },
        ];
      } else {
        filter.tutorId = req.user._id;
      }

      cohort = await Cohort.findOne(filter)
        .populate("schoolId", "name")
        .populate("tutorId", "name email");
    }

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

// Generate optimal cohorts using the algorithm
export const generateOptimalCohorts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { schoolId, programId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID is required" });
    }

    if (!programId) {
      return res.status(400).json({ error: "Program ID is required" });
    }

    // Check if user has permission to generate cohorts for this school
    if (req.user?.role === UserRole.TUTOR && req.user.schoolId !== schoolId) {
      return res.status(403).json({
        error: "You can only generate cohorts for your assigned school",
      });
    }

    // Verify the program exists
    const Program = require("../models/ProgramModel").default;
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ error: "Program not found" });
    }

    console.log("Generating optimal cohorts for school:", schoolId, "with program:", program.name);

    // Get all students from the school who have completed assessments
    const students: Array<{ _id: any; knowledgeLevel: Array<{ level: number }> }> = await Student.find({
      school: schoolId,
      knowledgeLevel: { $exists: true, $not: { $size: 0 } },
    });

    if (students.length === 0) {
      return res.status(400).json({
        error: "No students with assessment data found for this school",
      });
    }

    // Group students by their latest knowledge level
    const levelGroups: { [key: number]: string[] } = {};

    students.forEach((student) => {
      if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
        const latestLevel =
          student.knowledgeLevel[student.knowledgeLevel.length - 1].level;
        if (!levelGroups[latestLevel]) {
          levelGroups[latestLevel] = [];
        }
        levelGroups[latestLevel].push(student._id.toString());
      }
    });

    // Convert to format expected by algorithm
    const levelInputs: LevelInput[] = Object.entries(levelGroups).map(
      ([level, studentIds]) => ({
        level: parseInt(level),
        students: studentIds.length,
      })
    );

    console.log("Level distribution:", levelInputs);

    // Generate optimal cohort plan
    const cohortPlans = generateCohortPlan(levelInputs);
    console.log("Generated cohort plans:", cohortPlans);

    // Delete existing cohorts for this school (optional - you might want to keep them)
    await Cohort.deleteMany({ schoolId: schoolId });

    // Create cohorts based on the plan
    const createdCohorts = [];

    for (const plan of cohortPlans) {
      const levelStudents = levelGroups[plan.level as number];
      let studentIndex = 0;

      for (let i = 0; i < plan.cohorts.length; i++) {
        const cohortSize = plan.cohorts[i];
        const cohortStudents = levelStudents.slice(
          studentIndex,
          studentIndex + cohortSize
        );
        studentIndex += cohortSize;

        const cohort = new Cohort({
          name: `Level ${plan.level} - Cohort ${i + 1}`,
          schoolId: schoolId,
          tutorId: req.user?._id, // Assign to the user generating the cohorts
          programId: programId, // Set the program ID
          currentLevel: plan.level as number, // Set current level based on student levels
          students: cohortStudents,
          // Initialize time tracking
          timeTracking: {
            cohortStartDate: new Date(),
            currentLevelStartDate: new Date(),
            attendanceDays: 0,
            expectedDaysForCurrentLevel: 14, // Default 2 weeks, will be updated based on program
            totalExpectedDays: program.levels ? program.levels.reduce((total: number, level: any) => {
              let days = level.timeframe || 14;
              if (level.timeframeUnit === 'weeks') {
                days *= 7;
              } else if (level.timeframeUnit === 'months') {
                days *= 30;
              }
              return total + days;
            }, 0) : 140 // Default 20 weeks if no levels
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const savedCohort = await cohort.save();

        // Update students with cohort information
        await Student.updateMany(
          { _id: { $in: cohortStudents } },
          {
            $push: {
              cohort: {
                cohortId: savedCohort._id,
                dateJoined: new Date(),
              },
            },
          }
        );

        createdCohorts.push(savedCohort);
      }
    }

    console.log(`Successfully created ${createdCohorts.length} cohorts`);

    // Return the created cohorts with populated data
    const populatedCohorts = await Cohort.find({ schoolId: schoolId })
      .populate("schoolId", "name")
      .populate("tutorId", "name email")
      .sort({ createdAt: -1 });

    res.status(201).json({
      message: `Successfully generated ${createdCohorts.length} optimal cohorts`,
      cohorts: populatedCohorts,
      studentsAssigned: students.length,
      levelDistribution: levelInputs,
    });
  } catch (error: any) {
    console.error("Error generating optimal cohorts:", error);
    res.status(500).json({ error: "Error generating optimal cohorts" });
  }
};
