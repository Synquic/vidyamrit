import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types/auth";
import Cohort from "../models/CohortModel";
import Program from "../models/ProgramModel";
import Student from "../models/StudentModel";
import School from "../models/SchoolModel";
import TestReport from "../models/TestReportModel";
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
    if (cohort.tutorId && cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view this cohort" });
    }

    if (!cohort.programId) {
      return res.status(400).json({ error: "Cohort does not have an associated program" });
    }

    // Get program (if not already populated, fetch it)
    let program: any = cohort.programId;
    if (typeof (program as any)?.toObject === 'function') {
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
      isRequired: question.isRequired !== false,
      questionImage: question.questionImage
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
    res.status(500).json({ error: "Failed to load level assessment questions. Please try again." });
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

    const cohort = await Cohort.findById(cohortId).populate('programId');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId && cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to conduct assessments for this cohort" });
    }

    // Verify student is in this cohort
    logger.info(`[LevelTest] Checking student ${studentId} in cohort ${cohortId}. Students count: ${cohort.students.length}`);
    logger.info(`[LevelTest] Student IDs in cohort: ${cohort.students.map((s: any) => s._id?.toString() || s.toString()).join(', ')}`);
    const studentInCohort = cohort.students.some((student: any) => {
      const sid = student._id?.toString() || student.toString();
      return sid === studentId.toString();
    });

    if (!studentInCohort) {
      logger.warn(`[LevelTest] Student ${studentId} NOT found in cohort. Available: ${cohort.students.map((s: any) => s._id?.toString() || s.toString()).join(', ')}`);
      return res.status(400).json({ error: "Student not found in this group" });
    }

    if (!cohort.programId) {
      return res.status(400).json({ error: "Cohort does not have an associated program" });
    }

    // Get program
    let program: any = cohort.programId;
    if (typeof (program as any)?.toObject === 'function') {
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
    const nextLevel = currentLevel < program.totalLevels ? currentLevel + 1 : currentLevel;

    if (passed) {
      // Student passed - move to next level
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

      // Group ka currentLevel fixed rehta hai - group hamesha same level padhata hai
      // Student pass kare toh auto move se next level group me chala jayega

      logger.info(`Student ${studentId} passed Level ${currentLevel} assessment with ${score.toFixed(1)}%. Moving to Level ${nextLevel}.`);

      // Check FLN: if student passed the last level of the program
      if (currentLevel >= program.totalLevels) {
        try {
          const studentDoc = await Student.findById(studentId);
          if (studentDoc) {
            const programId = cohort.programId._id || cohort.programId;
            const alreadyFLN = studentDoc.fln?.some(
              (f: any) => f.program.toString() === programId.toString()
            );
            if (!alreadyFLN) {
              studentDoc.fln = studentDoc.fln || [];
              studentDoc.fln.push({
                program: new mongoose.Types.ObjectId(programId.toString()),
                subject: program.subject || "",
                source: "level_test",
                clearedAt: assessmentDate,
              });
              await studentDoc.save();
              logger.info(`FLN set for student ${studentId} via level test - Program: ${programId}`);
            }
          }
        } catch (flnError) {
          logger.warn(`Failed to set FLN for student ${studentId}:`, flnError);
        }
      }

      // Update student's knowledgeLevel with new level
      try {
        const programId = cohort.programId._id || cohort.programId;
        const studentForKL = await Student.findById(studentId);
        if (studentForKL) {
          studentForKL.knowledgeLevel = studentForKL.knowledgeLevel || [];
          studentForKL.knowledgeLevel.push({
            program: new mongoose.Types.ObjectId(programId.toString()),
            programName: program.subject || "",
            subject: program.subject || "",
            level: nextLevel,
            date: assessmentDate,
          });
          await studentForKL.save();
          logger.info(`Updated knowledgeLevel for student ${studentId}: Level ${nextLevel}`);
        }
      } catch (klError) {
        logger.warn(`Failed to update knowledgeLevel for student ${studentId}:`, klError);
      }

      // Auto move will happen after response is sent (below)
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

    // Save to TestReport model
    try {
      const studentDoc = await Student.findById(studentId).select("school");
      if (studentDoc) {
        await new TestReport({
          student: studentId,
          school: studentDoc.school,
          program: cohort.programId,
          subject: (program.subject || "").toLowerCase(),
          testType: "level_test",
          level: currentLevel,
          score,
          passed,
          totalQuestions,
          correctAnswers,
          mentor: tutorId,
          date: assessmentDate,
        }).save();
        logger.info(`TestReport saved for level assessment - student: ${studentId}, level: ${currentLevel}, score: ${score.toFixed(1)}%`);
      }
    } catch (testReportError) {
      logger.warn(`Failed to save TestReport for student ${studentId}:`, testReportError);
    }

    // Update student's progressHistory for individual report tracking
    try {
      const subject = (program.subject || "").toLowerCase();
      let flag: string;
      let reason: string;

      if (passed) {
        flag = "improving";
        reason = `Passed Level ${currentLevel} test with ${score.toFixed(1)}% score`;
      } else {
        const failCount = cohort.progress[progressIndex].failureCount || 1;
        if (failCount >= 3) {
          flag = "needs_attention";
          reason = `Failed Level ${currentLevel} test (attempt ${failCount}) with ${score.toFixed(1)}% score - urgent attention needed`;
        } else if (failCount >= 2) {
          flag = "struggling";
          reason = `Failed Level ${currentLevel} test (attempt ${failCount}) with ${score.toFixed(1)}% score`;
        } else {
          flag = "average";
          reason = `Failed Level ${currentLevel} test (attempt ${failCount}) with ${score.toFixed(1)}% score`;
        }
      }

      await Student.findByIdAndUpdate(studentId, {
        $push: {
          progressHistory: {
            flag,
            subject: subject || "hindi",
            reason,
            date: assessmentDate,
            mentorId: tutorId,
          },
        },
      });
    } catch (progressError) {
      logger.warn(`Failed to update student progressHistory for ${studentId}:`, progressError);
    }

    // Save response data before auto-move
    const responseData = {
      message: passed
        ? `Student passed Level ${currentLevel} assessment with ${score.toFixed(1)}%`
        : `Student failed Level ${currentLevel} assessment with ${score.toFixed(1)}%`,
      studentId,
      cohortId: cohort._id,
      currentLevel: cohort.progress[progressIndex]?.currentLevel || currentLevel,
      status: cohort.progress[progressIndex]?.status || "green",
      score: score.toFixed(1),
      passed,
      failureCount: cohort.progress[progressIndex]?.failureCount || 0,
      nextLevel: passed && currentLevel < program.totalLevels
        ? {
            levelNumber: currentLevel + 1,
            title: program.getNextLevel(currentLevel)?.title
          }
        : null
    };

    res.json(responseData);

    // If passed last level (FLN) - remove student from group (proficient, no more teaching needed)
    if (passed && currentLevel >= program.totalLevels) {
      try {
        const freshCohort = await Cohort.findById(cohortId);
        if (freshCohort) {
          freshCohort.students = freshCohort.students.filter(
            (s: any) => (s._id?.toString() || s.toString()) !== studentId
          );
          freshCohort.progress = freshCohort.progress.filter(
            (p: any) => p.studentId?.toString() !== studentId
          );
          await freshCohort.save();
          logger.info(`Student ${studentId} completed all levels (FLN) - removed from group "${cohort.name}"`);
        }
      } catch (removeError) {
        logger.warn(`Failed to remove FLN student ${studentId} from group:`, removeError);
      }
    }

    // Auto move student to next level group AFTER response (if passed and not last level)
    if (passed && currentLevel < program.totalLevels) {
      try {
        const programId = cohort.programId._id || cohort.programId;
        const school = await School.findById(cohort.schoolId).lean();
        const currentYear = new Date().getFullYear();
        const isClassWise = (school as any)?.groupFormat === "class_wise";
        const studentDocForMove = await Student.findById(studentId);
        const studentClass = (studentDocForMove as any)?.class || "";

        const groupName = isClassWise
          ? `${program.subject} Class ${studentClass} Level ${nextLevel} ${currentYear}`
          : `${program.subject} Level ${nextLevel} ${currentYear}`;

        let nextGroup = await Cohort.findOne({
          schoolId: cohort.schoolId,
          name: groupName,
          status: { $in: ["active", "pending"] },
        });

        if (!nextGroup) {
          const timeframeDays = program.levels?.[nextLevel - 1]?.timeframe
            ? program.levels[nextLevel - 1].timeframe * 6
            : 12;
          nextGroup = new Cohort({
            name: groupName,
            schoolId: cohort.schoolId,
            programId: programId,
            currentLevel: nextLevel,
            status: "pending",
            students: [],
            timeTracking: {
              attendanceDays: 0,
              expectedDaysForCurrentLevel: timeframeDays,
              totalExpectedDays: timeframeDays,
            },
          });
        }

        const alreadyInNext = nextGroup.students.some(
          (s: any) => (s._id?.toString() || s.toString()) === studentId
        );
        if (!alreadyInNext) {
          nextGroup.students.push(studentId as any);
          await nextGroup.save();

          // Remove from current group - re-fetch to avoid stale data
          const freshCohort = await Cohort.findById(cohortId);
          if (freshCohort) {
            freshCohort.students = freshCohort.students.filter(
              (s: any) => (s._id?.toString() || s.toString()) !== studentId
            );
            freshCohort.progress = freshCohort.progress.filter(
              (p: any) => p.studentId?.toString() !== studentId
            );
            await freshCohort.save();
          }

          logger.info(`Auto-moved student ${studentId} from "${cohort.name}" to "${groupName}"`);
        }
      } catch (moveError) {
        logger.warn(`Failed to auto-move student ${studentId}:`, moveError);
      }
    }
  } catch (error: any) {
    logger.error("Error conducting level assessment:", error);
    res.status(500).json({ error: "Failed to conduct level assessment. Please try again." });
  }
};

