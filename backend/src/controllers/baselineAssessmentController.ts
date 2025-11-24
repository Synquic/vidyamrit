import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Cohort from "../models/CohortModel";
import Program from "../models/ProgramModel";
import Student from "../models/StudentModel";
import logger from "../utils/logger";

// Schedule baseline assessment for students ready for level transition
export const scheduleBaselineAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('students')
      .populate('programId');

    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId && cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to schedule assessments for this cohort" });
    }

    const program = await Program.findById((cohort as any).programId);
    if (!program) {
      return res.status(404).json({ error: "Program not found for this cohort" });
    }

    const studentsReadyForAssessment = [];
    const currentDate = new Date();

    // Check which students are ready for assessment based on timeframes
    for (const student of cohort.students) {
      const progress = cohort.progress.find((p: any) => 
        p.studentId.toString() === (student as any)._id.toString()
      );

      if (progress && progress.status === 'green') {
        const currentLevel = progress.currentLevel;
        const level = program.getLevelByNumber(currentLevel);
        
        if (level && progress.lastUpdated) {
          // Calculate time since last update
          const timeDiff = currentDate.getTime() - progress.lastUpdated.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          
          // Convert level timeframe to days
          let timeframeDays = level.timeframe;
          switch (level.timeframeUnit) {
            case 'weeks':
              timeframeDays *= 7;
              break;
            case 'months':
              timeframeDays *= 30;
              break;
          }

          // Check if enough time has passed for assessment
          if (daysDiff >= timeframeDays) {
            const nextLevel = program.getNextLevel(currentLevel);
            if (nextLevel) {
              studentsReadyForAssessment.push({
                studentId: (student as any)._id,
                studentName: (student as any).name,
                currentLevel,
                nextLevel: nextLevel.levelNumber,
                daysInCurrentLevel: daysDiff,
                assessmentQuestions: nextLevel.assessmentQuestions || []
              });
            }
          }
        }
      }
    }

    logger.info(`Found ${studentsReadyForAssessment.length} students ready for assessment in cohort ${cohortId}`);
    
    res.json({
      cohortId,
      cohortName: cohort.name,
      programName: program.name,
      studentsReady: studentsReadyForAssessment,
      totalReady: studentsReadyForAssessment.length
    });
  } catch (error: any) {
    logger.error("Error scheduling baseline assessment:", error);
    res.status(500).json({ error: "Error scheduling baseline assessment" });
  }
};

// Conduct baseline assessment for a student
export const conductBaselineAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, studentId, responses, totalQuestions, correctAnswers } = req.body;
    const tutorId = req.user?._id;

    if (!cohortId || !studentId || !responses || totalQuestions === undefined || correctAnswers === undefined) {
      return res.status(400).json({ 
        error: "Cohort ID, student ID, responses, total questions, and correct answers are required" 
      });
    }

    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId && cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to conduct assessments for this cohort" });
    }

    // Find student's current progress
    const progressIndex = cohort.progress.findIndex(
      (record: any) => record.studentId.toString() === studentId.toString()
    );

    if (progressIndex === -1) {
      return res.status(404).json({ error: "Student progress record not found" });
    }

    const currentProgress = cohort.progress[progressIndex];
    const currentLevel = currentProgress.currentLevel;
    
    // Calculate assessment result
    const score = (correctAnswers / totalQuestions) * 100;
    const passingScore = 75; // 75% passing threshold
    const passed = score >= passingScore;

    // Update progress based on assessment result
    if (passed) {
      // Student passed - move to next level
      currentProgress.currentLevel = currentLevel + 1;
      currentProgress.status = 'green';
      currentProgress.failureCount = 0; // Reset failure count
    } else {
      // Student failed - update failure count and status
      const newFailureCount = (currentProgress.failureCount || 0) + 1;
      currentProgress.failureCount = newFailureCount;
      
      // Set status based on failure count
      if (newFailureCount === 1) {
        currentProgress.status = 'yellow';
      } else if (newFailureCount === 2) {
        currentProgress.status = 'orange';
      } else {
        currentProgress.status = 'red';
      }
    }

    currentProgress.lastUpdated = new Date();
    currentProgress.lastAssessmentDate = new Date();

    // Add to assessment history
    if (!currentProgress.assessmentHistory) {
      currentProgress.assessmentHistory = [];
    }
    
    currentProgress.assessmentHistory.push({
      date: new Date(),
      level: currentLevel,
      passed,
      status: currentProgress.status,
      score,
      responses: responses // Store the assessment responses
    });

    await cohort.save();

    logger.info(`Baseline assessment conducted for student ${studentId}: ${passed ? 'PASSED' : 'FAILED'} (${score}%)`);
    
    res.json({
      message: "Baseline assessment completed successfully",
      result: {
        passed,
        score,
        previousLevel: currentLevel,
        newLevel: currentProgress.currentLevel,
        status: currentProgress.status,
        failureCount: currentProgress.failureCount
      }
    });
  } catch (error: any) {
    logger.error("Error conducting baseline assessment:", error);
    res.status(500).json({ error: "Error conducting baseline assessment" });
  }
};

// Get assessment questions for a specific level
export const getAssessmentQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { programId, levelNumber } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ error: "Program not found" });
    }

    const level = program.getLevelByNumber(parseInt(levelNumber));
    if (!level) {
      return res.status(404).json({ error: "Level not found" });
    }

    const questions = level.assessmentQuestions || [];
    
    // Remove correct answers from the response to prevent cheating
    const sanitizedQuestions = questions.map(question => ({
      _id: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options, // For multiple choice
      points: question.points,
      isRequired: question.isRequired
      // Don't include correctOptionIndex or acceptedAnswers
    }));

    res.json({
      levelNumber: level.levelNumber,
      levelTitle: level.title,
      questions: sanitizedQuestions,
      totalQuestions: questions.length,
      totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0)
    });
  } catch (error: any) {
    logger.error("Error fetching assessment questions:", error);
    res.status(500).json({ error: "Error fetching assessment questions" });
  }
};

// Get assessment history for a student
export const getStudentAssessmentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, studentId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('students', 'name roll_no class');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId && cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view assessments for this cohort" });
    }

    const student = cohort.students.find((s: any) => s._id.toString() === studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found in this cohort" });
    }

    const progress = cohort.progress.find((p: any) => 
      p.studentId.toString() === studentId
    );

    if (!progress) {
      return res.status(404).json({ error: "No progress record found for this student" });
    }

    res.json({
      student: student,
      currentLevel: progress.currentLevel,
      currentStatus: progress.status,
      failureCount: progress.failureCount || 0,
      assessmentHistory: progress.assessmentHistory || []
    });
  } catch (error: any) {
    logger.error("Error fetching student assessment history:", error);
    res.status(500).json({ error: "Error fetching student assessment history" });
  }
};