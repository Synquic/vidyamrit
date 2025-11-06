import { Request, Response } from "express";
import Cohort from "../models/CohortModel";
import Student from "../models/StudentModel";
import User from "../models/UserModel";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";
import { generateCohortPlan, LevelInput, GenerationStrategy, GenerationResult } from "../lib/CohortGenerationAlgo";

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
// Check if cohort is ready for level-up assessment
// Mark/unmark a date as holiday for a cohort
export const toggleCohortHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Route uses :id
    const { date } = req.body; // Date string in YYYY-MM-DD format
    const tutorId = req.user?._id;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const cohort = await Cohort.findById(id);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to modify this cohort" });
    }

    const holidayDate = new Date(date);
    holidayDate.setHours(0, 0, 0, 0);

    // Check if it's Sunday
    if (holidayDate.getDay() === 0) {
      return res.status(400).json({ error: "Sunday is already a holiday. You cannot mark it separately." });
    }

    // Initialize holidays array if it doesn't exist
    if (!cohort.holidays) {
      cohort.holidays = [];
    }

    // Check if date is already a holiday
    const dateStr = holidayDate.toDateString();
    const existingHolidayIndex = cohort.holidays.findIndex((h: Date) => {
      const hDate = new Date(h);
      hDate.setHours(0, 0, 0, 0);
      return hDate.toDateString() === dateStr;
    });

    if (existingHolidayIndex >= 0) {
      // Remove holiday (unmark)
      cohort.holidays.splice(existingHolidayIndex, 1);
      await cohort.save();
      return res.json({ 
        message: "Holiday removed successfully",
        isHoliday: false,
        date: date
      });
    } else {
      // Add holiday (mark)
      cohort.holidays.push(holidayDate);
      await cohort.save();
      return res.json({ 
        message: "Date marked as holiday successfully",
        isHoliday: true,
        date: date
      });
    }
  } catch (error: any) {
    console.error("Error toggling holiday:", error);
    res.status(500).json({ error: "Error toggling holiday" });
  }
};

export const checkAssessmentReadiness = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Route uses :id
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(id).populate('programId');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view this cohort" });
    }

    if (!cohort.programId) {
      return res.status(400).json({ 
        error: "Cohort does not have an associated program",
        isReadyForAssessment: false 
      });
    }

    // Calculate level progress
    const { calculateLevelProgress } = require("../lib/cohortProgressHelper");
    const levelProgress = await calculateLevelProgress(cohort);

    // Get current level info
    const Program = require("../models/ProgramModel").default;
    const program = await Program.findById(cohort.programId._id || cohort.programId);
    const currentLevel = cohort.currentLevel || 1;
    const levelInfo = program?.getLevelByNumber(currentLevel);

    res.json({
      cohortId: cohort._id,
      cohortName: cohort.name,
      currentLevel,
      levelTitle: levelInfo?.title || `Level ${currentLevel}`,
      isReadyForAssessment: levelProgress.isReadyForAssessment,
      weeksCompleted: levelProgress.weeksCompleted,
      weeksRequired: levelProgress.weeksRequired,
      completionPercentage: levelProgress.completionPercentage,
      daysRemaining: levelProgress.daysRemaining,
      nextLevel: program?.getNextLevel(currentLevel) ? {
        levelNumber: currentLevel + 1,
        title: program.getNextLevel(currentLevel)?.title,
        description: program.getNextLevel(currentLevel)?.description
      } : null,
      message: levelProgress.isReadyForAssessment 
        ? `Cohort has completed ${levelProgress.weeksCompleted}/${levelProgress.weeksRequired} weeks for Level ${currentLevel}. Ready for level-specific assessment.`
        : `Cohort has completed ${levelProgress.weeksCompleted}/${levelProgress.weeksRequired} weeks for Level ${currentLevel}. ${levelProgress.daysRemaining ? `${levelProgress.daysRemaining} teaching days remaining.` : ''}`
    });
  } catch (error: any) {
    console.error("Error checking assessment readiness:", error);
    res.status(500).json({ error: "Error checking assessment readiness" });
  }
};

export const deleteCohort = async (req: Request, res: Response) => {
  try {
    // Find the cohort first
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Update all students in this cohort to mark their cohort membership as ended
    if (cohort.students && cohort.students.length > 0) {
      await Student.updateMany(
        { _id: { $in: cohort.students } },
        {
          $set: {
            "cohort.$[elem].dateLeaved": new Date(),
          },
        },
        {
          arrayFilters: [{ "elem.cohortId": cohort._id }],
        }
      );
    }

    // Now delete the cohort
    await Cohort.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Cohort deleted successfully" });
  } catch (error) {
    console.error("Error deleting cohort:", error);
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
    const { schoolId, strategy = 'low-first', capacityLimit = 5 } = req.body;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID is required" });
    }

    // Validate strategy
    if (strategy !== 'high-first' && strategy !== 'low-first') {
      return res.status(400).json({ error: "Strategy must be 'high-first' or 'low-first'" });
    }

    // Validate capacity limit
    const capacity = parseInt(capacityLimit);
    if (isNaN(capacity) || capacity < 1 || capacity > 50) {
      return res.status(400).json({ error: "Capacity limit must be a number between 1 and 50" });
    }

    // Check if user has permission to generate cohorts for this school
    if (req.user?.role === UserRole.TUTOR && req.user.schoolId !== schoolId) {
      return res.status(403).json({
        error: "You can only generate cohorts for your assigned school",
      });
    }

    // Get all active programs
    const Program = require("../models/ProgramModel").default;
    const allPrograms = await Program.find({ isActive: true });
    
    if (allPrograms.length === 0) {
      return res.status(400).json({ error: "No active programs found. Please create at least one active program." });
    }

    console.log(`Generating optimal cohorts for school: ${schoolId} for ${allPrograms.length} active programs`);

    // Get all students from the school who have completed assessments
    const students: Array<{ 
      _id: any; 
      knowledgeLevel: Array<{ level: number }>;
      hindi_level?: number;
      math_level?: number;
      english_level?: number;
    }> = await Student.find({
      school: schoolId,
    });

    if (students.length === 0) {
      return res.status(400).json({
        error: "No students found for this school",
      });
    }

    // Get all tutors for the school
    const tutors = await User.find({
      schoolId: schoolId,
      role: UserRole.TUTOR,
    });

    if (tutors.length === 0) {
      return res.status(400).json({
        error: "No tutors found for this school. Please add tutors before generating cohorts.",
      });
    }

    console.log(`Found ${tutors.length} tutors for the school`);

    // Get students who are already in active cohorts (to exclude them)
    const studentsInActiveCohorts = await Student.find({
      school: schoolId,
      cohort: {
        $elemMatch: {
          dateLeaved: { $exists: false },
        },
      },
    });
    const activeCohortStudentIds = new Set(
      studentsInActiveCohorts.map((s) => s._id.toString())
    );

    // Aggregate results across all programs
    const allCreatedCohorts: any[] = [];
    const allPendingStudents: Array<{
      program: string;
      level: number | string;
      students: number;
    }> = [];
    let totalStudentsAssigned = 0;
    let globalTutorIndex = 0;
    let globalCohortNumber = 1;
    const programResults: Array<{
      programName: string;
      programSubject: string;
      cohortsCreated: number;
      studentsAssigned: number;
      pendingStudents: number;
    }> = [];

    // Process each program
    for (const program of allPrograms) {
      console.log(`Processing program: ${program.name} (${program.subject})`);

      // Get students with assessment data for this program's subject
      // Use subject-specific level field if available, otherwise use knowledgeLevel
      const studentsForProgram = students.filter((student) => {
        // Check if student has level data for this subject
        const subjectLower = program.subject.toLowerCase();
        if (subjectLower === 'hindi' && student.hindi_level) return true;
        if (subjectLower === 'math' && student.math_level) return true;
        if (subjectLower === 'english' && student.english_level) return true;
        // Fallback to knowledgeLevel if subject-specific not available
        return student.knowledgeLevel && student.knowledgeLevel.length > 0;
      });

      if (studentsForProgram.length === 0) {
        console.log(`No students with assessment data for ${program.subject}`);
        continue;
      }

      // Filter to only awaiting students
      const awaitingStudents = studentsForProgram.filter(
        (s) => !activeCohortStudentIds.has(s._id.toString())
      );

      if (awaitingStudents.length === 0) {
        console.log(`All students for ${program.subject} are already in cohorts`);
        continue;
      }

      // Group students by their level for this subject
      const levelGroups: { [key: number]: string[] } = {};
      awaitingStudents.forEach((student) => {
        const subjectLower = program.subject.toLowerCase();
        let studentLevel: number | undefined;

        // Get level from subject-specific field
        if (subjectLower === 'hindi' && student.hindi_level) {
          studentLevel = student.hindi_level;
        } else if (subjectLower === 'math' && student.math_level) {
          studentLevel = student.math_level;
        } else if (subjectLower === 'english' && student.english_level) {
          studentLevel = student.english_level;
        } else if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
          // Fallback to knowledgeLevel
          studentLevel = student.knowledgeLevel[student.knowledgeLevel.length - 1].level;
        }

        if (studentLevel !== undefined) {
          if (!levelGroups[studentLevel]) {
            levelGroups[studentLevel] = [];
          }
          levelGroups[studentLevel].push(student._id.toString());
        }
      });

      if (Object.keys(levelGroups).length === 0) {
        console.log(`No valid level data found for ${program.subject}`);
        continue;
      }

      // Convert to format expected by algorithm
      const levelInputs: LevelInput[] = Object.entries(levelGroups).map(
        ([level, studentIds]) => ({
          level: parseInt(level),
          students: studentIds.length,
        })
      );

      console.log(`${program.subject} level distribution:`, levelInputs);

      // Generate optimal cohort plan with strategy and capacity
      const generationResult: GenerationResult = generateCohortPlan(
        levelInputs,
        strategy as GenerationStrategy,
        capacity
      );

      // Create active cohorts for this program
      const programCohorts: any[] = [];

      for (const plan of generationResult.activeCohorts) {
        const level = plan.level as number;
        const levelStudents = levelGroups[level] || [];
        let studentIndex = 0;

        for (let i = 0; i < plan.cohorts.length; i++) {
          const cohortSize = plan.cohorts[i];
          const cohortStudents = levelStudents.slice(
            studentIndex,
            studentIndex + cohortSize
          );
          studentIndex += cohortSize;

          if (cohortStudents.length === 0) {
            console.warn(`No students available for ${program.subject} Level ${level} Cohort ${i + 1}`);
            continue;
          }

          // Assign tutor in round-robin fashion
          const assignedTutor = tutors[globalTutorIndex % tutors.length];
          globalTutorIndex++;

          const cohort = new Cohort({
            name: `${program.subject.toUpperCase()} Level ${level} - Cohort ${globalCohortNumber}${strategy === 'high-first' ? ' (High Priority)' : ''}`,
            schoolId: schoolId,
            tutorId: assignedTutor._id,
            programId: program._id,
            currentLevel: level,
            status: 'active',
            students: cohortStudents,
            timeTracking: {
              cohortStartDate: new Date(),
              currentLevelStartDate: new Date(),
              attendanceDays: 0,
              expectedDaysForCurrentLevel: 14,
              totalExpectedDays: program.levels ? program.levels.reduce((total: number, level: any) => {
                let days = level.timeframe || 14;
                if (level.timeframeUnit === 'weeks') {
                  days *= 7;
                } else if (level.timeframeUnit === 'months') {
                  days *= 30;
                }
                return total + days;
              }, 0) : 140
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

          programCohorts.push(savedCohort);
          allCreatedCohorts.push(savedCohort);
          globalCohortNumber++;
        }
      }

      // Track pending students for this program
      const programPendingCount = generationResult.pendingStudents.reduce(
        (sum, p) => sum + p.students,
        0
      );

      generationResult.pendingStudents.forEach((pending) => {
        allPendingStudents.push({
          program: program.name,
          level: pending.level,
          students: pending.students,
        });
      });

      const programStudentsAssigned = programCohorts.reduce(
        (sum, c) => sum + (c.students?.length || 0),
        0
      );
      totalStudentsAssigned += programStudentsAssigned;

      programResults.push({
        programName: program.name,
        programSubject: program.subject,
        cohortsCreated: programCohorts.length,
        studentsAssigned: programStudentsAssigned,
        pendingStudents: programPendingCount,
      });

      console.log(`${program.subject}: Created ${programCohorts.length} cohorts, ${programStudentsAssigned} students assigned, ${programPendingCount} pending`);
    }

    console.log(`Successfully created ${allCreatedCohorts.length} active cohorts across ${allPrograms.length} programs`);
    console.log(`Total pending students: ${allPendingStudents.reduce((sum, p) => sum + p.students, 0)}`);

    // Return the created cohorts with populated data
    const populatedCohorts = await Cohort.find({ 
      schoolId: schoolId,
      status: 'active'
    })
      .populate("schoolId", "name")
      .populate("tutorId", "name email")
      .populate("programId", "name subject")
      .sort({ createdAt: -1 });

    // Calculate total pending students
    const totalPendingStudents = allPendingStudents.reduce(
      (sum, p) => sum + p.students,
      0
    );

    res.status(201).json({
      message: `Successfully generated ${allCreatedCohorts.length} active cohorts across ${programResults.length} programs${totalPendingStudents > 0 ? ` with ${totalPendingStudents} students pending` : ''}`,
      cohorts: populatedCohorts,
      studentsAssigned: totalStudentsAssigned,
      pendingStudents: allPendingStudents,
      totalPendingStudents,
      strategy,
      capacityLimit: capacity,
      programsProcessed: programResults.length,
      programResults, // Breakdown by program
    });
  } catch (error: any) {
    console.error("Error generating optimal cohorts:", error);
    res.status(500).json({ error: "Error generating optimal cohorts" });
  }
};
