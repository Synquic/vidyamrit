import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Cohort from "../models/CohortModel";
import Program from "../models/ProgramModel";
import logger from "../utils/logger";

// Auto-promote students who have completed their level timeframe successfully
export const processLevelTransitions = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const { dryRun = false } = req.query; // If true, only return what would be changed
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('students', 'name roll_no')
      .populate('programId');

    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to process transitions for this cohort" });
    }

    const program = await Program.findById((cohort as any).programId);
    if (!program) {
      return res.status(404).json({ error: "Program not found for this cohort" });
    }

    const currentDate = new Date();
    const transitionResults = [];

    for (const student of cohort.students) {
      const progress = cohort.progress.find((p: any) => 
        p.studentId.toString() === (student as any)._id.toString()
      );

      if (progress) {
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

          const nextLevel = program.getNextLevel(currentLevel);
          
          // Determine if student is ready for transition
          const transitionReason = determineTransitionReason(
            progress.status,
            daysDiff,
            timeframeDays,
            progress.failureCount || 0,
            !!nextLevel
          );

          if (transitionReason.shouldTransition) {
            const transitionResult = {
              studentId: (student as any)._id,
              studentName: (student as any).name,
              currentLevel,
              action: transitionReason.action,
              reason: transitionReason.reason,
              newLevel: transitionReason.newLevel,
              newStatus: transitionReason.newStatus,
              daysInCurrentLevel: daysDiff,
              requiresAssessment: transitionReason.requiresAssessment
            };

            transitionResults.push(transitionResult);

            // Apply changes if not dry run
            if (!dryRun && transitionReason.action !== 'ASSESSMENT_REQUIRED') {
              progress.currentLevel = transitionReason.newLevel!;
              progress.status = transitionReason.newStatus!;
              progress.lastUpdated = new Date();
              
              // Add transition record to history
              if (!progress.assessmentHistory) {
                progress.assessmentHistory = [];
              }
              
              progress.assessmentHistory.push({
                date: new Date(),
                level: currentLevel,
                passed: transitionReason.action === 'PROMOTE',
                status: transitionReason.newStatus!,
                score: undefined, // Auto transitions don't have scores
                responses: undefined
              });
            }
          }
        }
      }
    }

    // Save changes if not dry run
    if (!dryRun && transitionResults.some(r => r.action !== 'ASSESSMENT_REQUIRED')) {
      await cohort.save();
    }

    logger.info(`Processed level transitions for cohort ${cohortId}: ${transitionResults.length} transitions ${dryRun ? '(dry run)' : 'applied'}`);
    
    res.json({
      cohortId,
      cohortName: cohort.name,
      totalTransitions: transitionResults.length,
      dryRun: !!dryRun,
      transitions: transitionResults
    });
  } catch (error: any) {
    logger.error("Error processing level transitions:", error);
    res.status(500).json({ error: "Error processing level transitions" });
  }
};

// Get transition recommendations for a specific student
export const getStudentTransitionRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, studentId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('students', 'name roll_no')
      .populate('programId');

    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view transitions for this cohort" });
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

    const program = await Program.findById((cohort as any).programId);
    if (!program) {
      return res.status(404).json({ error: "Program not found for this cohort" });
    }

    const currentLevel = progress.currentLevel;
    const level = program.getLevelByNumber(currentLevel);
    
    if (!level) {
      return res.status(404).json({ error: "Current level not found in program" });
    }

    const currentDate = new Date();
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

    const nextLevel = program.getNextLevel(currentLevel);
    const recommendation = determineTransitionReason(
      progress.status,
      daysDiff,
      timeframeDays,
      progress.failureCount || 0,
      !!nextLevel
    );

    res.json({
      student: {
        _id: (student as any)._id,
        name: (student as any).name,
        roll_no: (student as any).roll_no
      },
      currentLevel,
      currentStatus: progress.status,
      daysInCurrentLevel: daysDiff,
      requiredDays: timeframeDays,
      failureCount: progress.failureCount || 0,
      nextLevel: nextLevel?.levelNumber,
      recommendation
    });
  } catch (error: any) {
    logger.error("Error getting student transition recommendation:", error);
    res.status(500).json({ error: "Error getting student transition recommendation" });
  }
};

// Manual level transition (override automatic logic)
export const manualLevelTransition = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, studentId, action, reason, newLevel } = req.body;
    const tutorId = req.user?._id;

    if (!['PROMOTE', 'DEMOTE', 'HOLD', 'REASSESS'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be PROMOTE, DEMOTE, HOLD, or REASSESS" });
    }

    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to make transitions for this cohort" });
    }

    const progressIndex = cohort.progress.findIndex(
      (record: any) => record.studentId.toString() === studentId.toString()
    );

    if (progressIndex === -1) {
      return res.status(404).json({ error: "Student progress record not found" });
    }

    const currentProgress = cohort.progress[progressIndex];
    const previousLevel = currentProgress.currentLevel;
    const previousStatus = currentProgress.status;

    // Apply manual transition
    switch (action) {
      case 'PROMOTE':
        currentProgress.currentLevel = newLevel || (previousLevel + 1);
        currentProgress.status = 'green';
        currentProgress.failureCount = 0;
        break;
      case 'DEMOTE':
        currentProgress.currentLevel = newLevel || Math.max(1, previousLevel - 1);
        currentProgress.status = 'yellow';
        break;
      case 'HOLD':
        // Keep same level but reset status
        currentProgress.status = 'green';
        currentProgress.failureCount = 0;
        break;
      case 'REASSESS':
        // Mark for reassessment
        currentProgress.status = 'yellow';
        break;
    }

    currentProgress.lastUpdated = new Date();
    
    // Add manual transition to history
    if (!currentProgress.assessmentHistory) {
      currentProgress.assessmentHistory = [];
    }
    
    currentProgress.assessmentHistory.push({
      date: new Date(),
      level: previousLevel,
      passed: action === 'PROMOTE',
      status: currentProgress.status,
      score: undefined, // Manual transitions don't have scores
      responses: { manualTransition: true, reason }
    });

    await cohort.save();

    logger.info(`Manual transition applied for student ${studentId}: ${action} from level ${previousLevel} to ${currentProgress.currentLevel}`);
    
    res.json({
      message: "Manual transition applied successfully",
      transition: {
        action,
        reason,
        previousLevel,
        newLevel: currentProgress.currentLevel,
        previousStatus,
        newStatus: currentProgress.status
      }
    });
  } catch (error: any) {
    logger.error("Error applying manual level transition:", error);
    res.status(500).json({ error: "Error applying manual level transition" });
  }
};

// Helper function to determine transition logic
function determineTransitionReason(
  currentStatus: string,
  daysDiff: number,
  requiredDays: number,
  failureCount: number,
  hasNextLevel: boolean
) {
  const timeCompleted = daysDiff >= requiredDays;
  
  // Students with red status (3+ failures) need manual intervention
  if (currentStatus === 'red') {
    return {
      shouldTransition: true,
      action: 'MANUAL_REVIEW_REQUIRED',
      reason: 'Student has failed 3+ assessments and requires manual review',
      requiresAssessment: false,
      newLevel: undefined,
      newStatus: undefined
    };
  }
  
  // Students with green status who completed timeframe can be promoted
  if (currentStatus === 'green' && timeCompleted && hasNextLevel) {
    return {
      shouldTransition: true,
      action: 'ASSESSMENT_REQUIRED',
      reason: 'Student has completed level timeframe and is ready for assessment',
      requiresAssessment: true,
      newLevel: undefined,
      newStatus: undefined
    };
  }
  
  // Students with yellow/orange status who completed timeframe get reassessment
  if ((currentStatus === 'yellow' || currentStatus === 'orange') && timeCompleted) {
    return {
      shouldTransition: true,
      action: 'REASSESSMENT_REQUIRED',
      reason: `Student has completed timeframe but needs reassessment (${failureCount} previous failure${failureCount > 1 ? 's' : ''})`,
      requiresAssessment: true,
      newLevel: undefined,
      newStatus: undefined
    };
  }
  
  // Students who have exceeded timeframe significantly (2x) may need review
  if (daysDiff >= (requiredDays * 2)) {
    return {
      shouldTransition: true,
      action: 'EXTENDED_TIME_REVIEW',
      reason: `Student has been at current level for ${daysDiff} days (${Math.round(daysDiff/requiredDays)}x expected time)`,
      requiresAssessment: false,
      newLevel: undefined,
      newStatus: undefined
    };
  }
  
  return {
    shouldTransition: false,
    action: 'NO_ACTION',
    reason: 'Student is progressing normally within expected timeframe',
    requiresAssessment: false,
    newLevel: undefined,
    newStatus: undefined
  };
}