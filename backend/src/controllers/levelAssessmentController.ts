import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Cohort from "../models/CohortModel";
import Program from "../models/ProgramModel";
import logger from "../utils/logger";

/**
 * Get level-specific assessment questions for a cohort's current level
 * This is different from baseline assessment - it only tests the current level
 */
export const getLevelAssessmentQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId).populate('programId');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view this cohort" });
    }

    if (!cohort.programId) {
      return res.status(400).json({ error: "Cohort does not have an associated program" });
    }

    // Get program (if not already populated, fetch it)
    let program = cohort.programId;
    if (typeof program.toObject === 'function') {
      // It's already a Mongoose document
    } else {
      program = await Program.findById(cohort.programId);
    }

    if (!program) {
      return res.status(404).json({ error: "Program not found" });
    }

    const currentLevel = cohort.currentLevel || 1;
    const level = program.getLevelByNumber(currentLevel);
    
    if (!level) {
      return res.status(404).json({ error: `Level ${currentLevel} not found in program` });
    }

    const questions = level.assessmentQuestions || [];
    
    if (questions.length === 0) {
      return res.status(400).json({ 
        error: `No assessment questions found for Level ${currentLevel}`,
        message: "Please add assessment questions to this level before conducting assessment."
      });
    }
    
    // Remove correct answers from the response to prevent cheating
    const sanitizedQuestions = questions.map((question: any) => ({
      _id: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options, // For multiple choice
      points: question.points || 1,
      isRequired: question.isRequired !== false
      // Don't include correctOptionIndex or acceptedAnswers
    }));

    res.json({
      cohortId: cohort._id,
      cohortName: cohort.name,
      levelNumber: level.levelNumber,
      levelTitle: level.title,
      levelDescription: level.description,
      questions: sanitizedQuestions,
      totalQuestions: questions.length,
      totalPoints: questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0),
      assessmentType: "level-specific" // Distinguish from baseline assessment
    });
  } catch (error: any) {
    logger.error("Error fetching level assessment questions:", error);
    res.status(500).json({ error: "Error fetching level assessment questions" });
  }
};

/**
 * Conduct level-specific assessment for a student
 * This assesses only the current level (not baseline)
 */
export const conductLevelAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, studentId, responses, totalQuestions, correctAnswers } = req.body;
    const tutorId = req.user?._id;

    if (!cohortId || !studentId || !responses || totalQuestions === undefined || correctAnswers === undefined) {
      return res.status(400).json({ 
        error: "Cohort ID, student ID, responses, total questions, and correct answers are required" 
      });
    }

    const cohort = await Cohort.findById(cohortId).populate('programId students');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to conduct assessments for this cohort" });
    }

    // Verify student is in this cohort
    const studentInCohort = cohort.students.some((student: any) => 
      student._id.toString() === studentId.toString()
    );
    
    if (!studentInCohort) {
      return res.status(400).json({ error: "Student not found in this cohort" });
    }

    if (!cohort.programId) {
      return res.status(400).json({ error: "Cohort does not have an associated program" });
    }

    // Get program
    let program = cohort.programId;
    if (typeof program.toObject === 'function') {
      // It's already a Mongoose document
    } else {
      program = await Program.findById(cohort.programId);
    }

    if (!program) {
      return res.status(404).json({ error: "Program not found" });
    }

    const currentLevel = cohort.currentLevel || 1;
    const level = program.getLevelByNumber(currentLevel);
    
    if (!level) {
      return res.status(404).json({ error: `Level ${currentLevel} not found in program` });
    }

    // Find student's current progress
    const progressIndex = cohort.progress.findIndex(
      (record: any) => record.studentId.toString() === studentId.toString()
    );

    if (progressIndex === -1) {
      return res.status(404).json({ error: "Student progress record not found" });
    }

    const currentProgress = cohort.progress[progressIndex];
    
    // Calculate assessment result
    const score = (correctAnswers / totalQuestions) * 100;
    const passingScore = 75; // 75% passing threshold
    const passed = score >= passingScore;

    // Update progress based on assessment result
    const assessmentDate = new Date();
    
    if (passed) {
      // Student passed - move to next level
      const nextLevel = currentLevel < program.totalLevels ? currentLevel + 1 : currentLevel;
      
      cohort.progress[progressIndex].currentLevel = nextLevel;
      cohort.progress[progressIndex].status = "green";
      cohort.progress[progressIndex].failureCount = 0; // Reset failure count on passing
      cohort.progress[progressIndex].lastUpdated = assessmentDate;
      cohort.progress[progressIndex].lastAssessmentDate = assessmentDate;
      
      // Add to assessment history
      cohort.progress[progressIndex].assessmentHistory.push({
        date: assessmentDate,
        level: currentLevel,
        passed: true,
        status: "green",
        score: score,
        responses: responses
      });

      // Update cohort's current level if all students have progressed
      // (This is a simple check - you might want more sophisticated logic)
      const allStudentsAtNextLevel = cohort.progress.every((p: any) => 
        p.currentLevel >= nextLevel
      );
      
      if (allStudentsAtNextLevel && currentLevel < program.totalLevels) {
        cohort.currentLevel = nextLevel;
        
        // Update timeTracking for new level
        if (cohort.timeTracking) {
          cohort.timeTracking.currentLevelStartDate = assessmentDate;
        }
      }

      logger.info(`Student ${studentId} passed Level ${currentLevel} assessment with ${score.toFixed(1)}%. Moving to Level ${nextLevel}.`);
    } else {
      // Student failed - increment failure count
      const newFailureCount = (currentProgress.failureCount || 0) + 1;
      
      // Determine status based on failure count
      let status: "yellow" | "orange" | "red" = "yellow";
      if (newFailureCount >= 3) {
        status = "red";
      } else if (newFailureCount >= 2) {
        status = "orange";
      }

      cohort.progress[progressIndex].status = status;
      cohort.progress[progressIndex].failureCount = newFailureCount;
      cohort.progress[progressIndex].lastUpdated = assessmentDate;
      cohort.progress[progressIndex].lastAssessmentDate = assessmentDate;
      
      // Add to assessment history
      cohort.progress[progressIndex].assessmentHistory.push({
        date: assessmentDate,
        level: currentLevel,
        passed: false,
        status: status,
        score: score,
        responses: responses
      });

      logger.info(`Student ${studentId} failed Level ${currentLevel} assessment with ${score.toFixed(1)}%. Failure count: ${newFailureCount}.`);
    }

    await cohort.save();

    res.json({
      message: passed 
        ? `Student passed Level ${currentLevel} assessment with ${score.toFixed(1)}%`
        : `Student failed Level ${currentLevel} assessment with ${score.toFixed(1)}%`,
      studentId,
      cohortId: cohort._id,
      currentLevel: cohort.progress[progressIndex].currentLevel,
      status: cohort.progress[progressIndex].status,
      score: score.toFixed(1),
      passed,
      failureCount: cohort.progress[progressIndex].failureCount || 0,
      nextLevel: passed && currentLevel < program.totalLevels 
        ? {
            levelNumber: currentLevel + 1,
            title: program.getNextLevel(currentLevel)?.title
          }
        : null
    });
  } catch (error: any) {
    logger.error("Error conducting level assessment:", error);
    res.status(500).json({ error: "Error conducting level assessment" });
  }
};

