import { Response } from "express";
import { AuthRequest } from "../types/auth";
import Cohort, { ICohort } from "../models/CohortModel";
import Program from "../models/ProgramModel";
import logger from "../utils/logger";

// Update student progress after baseline assessment
export const updateStudentProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, studentId, currentLevel, assessmentPassed, failureCount = 0 } = req.body;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId).populate('students');
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to update progress for this cohort" });
    }

    // Verify student is in this cohort
    const studentInCohort = cohort.students.some((student: any) => 
      student._id.toString() === studentId.toString()
    );
    
    if (!studentInCohort) {
      return res.status(400).json({ error: "Student not found in this cohort" });
    }

    // Find existing progress record
    const progressIndex = cohort.progress.findIndex(
      (record: any) => record.studentId.toString() === studentId.toString()
    );

    // Determine status based on assessment result and failure count
    let status = 'green'; // Default: successful progression
    if (!assessmentPassed) {
      if (failureCount === 0) {
        status = 'yellow'; // First failure
      } else if (failureCount === 1) {
        status = 'orange'; // Second failure
      } else {
        status = 'red'; // Third failure
      }
    }

    const progressData = {
      studentId,
      currentLevel: assessmentPassed ? currentLevel + 1 : currentLevel, // Progress only if passed
      status,
      lastUpdated: new Date(),
      failureCount: assessmentPassed ? 0 : failureCount + 1, // Reset on success, increment on failure
      lastAssessmentDate: new Date(),
      assessmentHistory: {
        date: new Date(),
        level: currentLevel,
        passed: assessmentPassed,
        status
      }
    };

    if (progressIndex >= 0) {
      // Update existing progress record
      Object.assign(cohort.progress[progressIndex], progressData);
      
      // Add to assessment history if it doesn't exist
      if (!cohort.progress[progressIndex].assessmentHistory) {
        cohort.progress[progressIndex].assessmentHistory = [];
      }
      cohort.progress[progressIndex].assessmentHistory.push(progressData.assessmentHistory);
    } else {
      // Create new progress record
      cohort.progress.push({
        ...progressData,
        assessmentHistory: [progressData.assessmentHistory]
      });
    }

    await cohort.save();

    logger.info(`Progress updated for student ${studentId} in cohort ${cohortId}: level ${progressData.currentLevel}, status ${status}`);
    
    res.json({ 
      message: "Progress updated successfully",
      progress: progressData
    });
  } catch (error: any) {
    logger.error("Error updating student progress:", error);
    res.status(500).json({ error: "Error updating student progress" });
  }
};

// Get progress for all students in a cohort
export const getCohortProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('students', 'name roll_no class')
      .populate('schoolId', 'name')
      .populate('programId');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view progress for this cohort" });
    }

    // Combine student info with progress data
    const progressData = cohort.students.map((student: any) => {
      const progress = cohort.progress.find((p: any) => 
        p.studentId.toString() === student._id.toString()
      );
      
      return {
        student: {
          _id: student._id,
          name: student.name,
          roll_no: student.roll_no,
          class: student.class
        },
        progress: progress || {
          currentLevel: 1,
          status: 'green',
          lastUpdated: null,
          failureCount: 0,
          lastAssessmentDate: null
        }
      };
    });

    // Calculate time tracking if program is available
    let timeTracking = null;
    if ((cohort as any).programId) {
      const program = (cohort as any).programId;
      const cohortStartDate = cohort.startDate || cohort.createdAt;
      const currentDate = new Date();
      
      // Calculate elapsed time
      const elapsedMillis = currentDate.getTime() - cohortStartDate.getTime();
      const elapsedWeeks = Math.floor(elapsedMillis / (1000 * 60 * 60 * 24 * 7));
      
      // Calculate total program duration
      const totalDurationWeeks = program.getTotalTimeToComplete();
      const remainingWeeks = Math.max(0, totalDurationWeeks - elapsedWeeks);
      
      // Calculate next assessment due date
      const currentLevel = cohort.currentLevel || 1;
      const currentLevelInfo = program.getLevelByNumber(currentLevel);
      let daysUntilNextAssessment = 0;
      let nextAssessmentDue = new Date();
      
      if (currentLevelInfo) {
        // Convert timeframe to days
        let levelDurationDays = currentLevelInfo.timeframe;
        switch (currentLevelInfo.timeframeUnit) {
          case 'weeks':
            levelDurationDays *= 7;
            break;
          case 'months':
            levelDurationDays *= 30;
            break;
        }
        
        // Calculate when current level should be completed
        const levelStartDate = cohort.timeTracking?.currentLevelStartDate || cohortStartDate;
        nextAssessmentDue = new Date(levelStartDate.getTime() + (levelDurationDays * 24 * 60 * 60 * 1000));
        daysUntilNextAssessment = Math.ceil((nextAssessmentDue.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      timeTracking = {
        cohortStartDate,
        estimatedCompletionDate: new Date(cohortStartDate.getTime() + (totalDurationWeeks * 7 * 24 * 60 * 60 * 1000)),
        totalDurationWeeks,
        elapsedWeeks,
        remainingWeeks,
        nextAssessmentDue,
        daysUntilNextAssessment
      };
    }

    res.json({
      cohort: {
        _id: cohort._id,
        name: cohort.name,
        school: cohort.schoolId,
        program: (cohort as any).programId ? {
          _id: (cohort as any).programId._id,
          name: (cohort as any).programId.name,
          subject: (cohort as any).programId.subject,
          totalLevels: (cohort as any).programId.totalLevels,
          levels: (cohort as any).programId.levels
        } : null
      },
      studentsProgress: progressData,
      timeTracking
    });
  } catch (error: any) {
    logger.error("Error fetching cohort progress:", error);
    res.status(500).json({ error: "Error fetching cohort progress" });
  }
};

// Get progress summary for tutor's cohorts
export const getTutorProgressSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tutorId = req.user?._id;
    const { schoolId } = req.query;
    const UserRole = require("../configs/roles").UserRole;

    // Build query - only active cohorts
    const query: any = { status: 'active' };
    
    // For tutors, only show their cohorts. For super admins, show all (or filtered by schoolId)
    if (req.user?.role === UserRole.TUTOR) {
      query.tutorId = tutorId;
    }
    
    // If schoolId is provided, filter by school
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const cohorts = await Cohort.find(query)
      .populate('students', 'name roll_no class')
      .populate('schoolId', 'name')
      .populate('tutorId', 'name email')
      .populate('programId')
      .sort({ createdAt: -1 }); // Most recent first

    const summaryData = await Promise.all(cohorts.map(async (cohort: any) => {
      const totalStudents = cohort.students?.length || 0;
      const progressCounts = {
        green: 0,
        yellow: 0,
        orange: 0,
        red: 0
      };

      // Count students by progress status - if no progress records, assume all are green
      if (cohort.progress && cohort.progress.length > 0) {
        cohort.progress.forEach((progress: any) => {
          if (progressCounts.hasOwnProperty(progress.status)) {
            progressCounts[progress.status as keyof typeof progressCounts]++;
          }
        });
      } else {
        // No progress records yet - all students default to green
        progressCounts.green = totalStudents;
      }

      // Calculate level distribution
      const levelDistribution: { [key: number]: number } = {};
      if (cohort.progress && cohort.progress.length > 0) {
        cohort.progress.forEach((progress: any) => {
          const level = progress.currentLevel;
          levelDistribution[level] = (levelDistribution[level] || 0) + 1;
        });
      } else if (totalStudents > 0 && cohort.currentLevel) {
        // If no progress records but cohort has a currentLevel, use that
        levelDistribution[cohort.currentLevel] = totalStudents;
      }

      // Calculate time tracking if program is available
      let timeTracking = null;
      if (cohort.programId) {
        const program = cohort.programId;
        const cohortStartDate = cohort.startDate || cohort.createdAt;
        const currentDate = new Date();
        
        // Calculate elapsed time
        const elapsedMillis = currentDate.getTime() - cohortStartDate.getTime();
        const elapsedWeeks = Math.floor(elapsedMillis / (1000 * 60 * 60 * 24 * 7));
        
        // Calculate total program duration
        const totalDurationWeeks = program.getTotalTimeToComplete();
        const remainingWeeks = Math.max(0, totalDurationWeeks - elapsedWeeks);
        
        // Calculate next assessment due date
        const currentLevel = cohort.currentLevel || 1;
        const currentLevelInfo = program.getLevelByNumber(currentLevel);
        let daysUntilNextAssessment = 0;
        let nextAssessmentDue = new Date();
        
        if (currentLevelInfo) {
          // Convert timeframe to days
          let levelDurationDays = currentLevelInfo.timeframe;
          switch (currentLevelInfo.timeframeUnit) {
            case 'weeks':
              levelDurationDays *= 7;
              break;
            case 'months':
              levelDurationDays *= 30;
              break;
          }
          
          // Calculate when current level should be completed
          const levelStartDate = cohort.timeTracking?.currentLevelStartDate || cohortStartDate;
          nextAssessmentDue = new Date(levelStartDate.getTime() + (levelDurationDays * 24 * 60 * 60 * 1000));
          daysUntilNextAssessment = Math.ceil((nextAssessmentDue.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        
        timeTracking = {
          cohortStartDate,
          estimatedCompletionDate: new Date(cohortStartDate.getTime() + (totalDurationWeeks * 7 * 24 * 60 * 60 * 1000)),
          totalDurationWeeks,
          elapsedWeeks,
          remainingWeeks,
          nextAssessmentDue,
          daysUntilNextAssessment,
          currentLevelTimeframe: currentLevelInfo ? {
            level: currentLevel,
            durationWeeks: Math.ceil(currentLevelInfo.timeframe * 
              (currentLevelInfo.timeframeUnit === 'days' ? 1/7 : 
               currentLevelInfo.timeframeUnit === 'weeks' ? 1 : 
               currentLevelInfo.timeframeUnit === 'months' ? 4.33 : 1)),
            startDate: cohort.timeTracking?.currentLevelStartDate || cohortStartDate,
            endDate: nextAssessmentDue
          } : null
        };
      }

      // Calculate level progress based on attendance
      let levelProgress = null;
      if (cohort.programId) {
        const { calculateLevelProgress } = require("../lib/cohortProgressHelper");
        try {
          levelProgress = await calculateLevelProgress(cohort);
        } catch (error) {
          logger.error("Error calculating level progress:", error);
        }
      }

      return {
        cohort: {
          _id: cohort._id,
          name: cohort.name,
          school: cohort.schoolId,
          program: cohort.programId ? {
            _id: cohort.programId._id,
            name: cohort.programId.name,
            subject: cohort.programId.subject,
            totalLevels: cohort.programId.totalLevels
          } : null,
          currentLevel: cohort.currentLevel || 1
        },
        summary: {
          totalStudents,
          progressCounts,
          levelDistribution,
          studentsNeedingAttention: progressCounts.yellow + progressCounts.orange + progressCounts.red
        },
        timeTracking,
        levelProgress // Add level progress information
      };
    }));

    res.json(summaryData);
  } catch (error: any) {
    logger.error("Error fetching tutor progress summary:", error);
    res.status(500).json({ error: "Error fetching tutor progress summary" });
  }
};

// Get students ready for level transition assessment
export const getStudentsReadyForAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('students', 'name roll_no class')
      .populate('programId'); // Assuming cohort has programId

    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view this cohort" });
    }

    // Get program to check timeframes
    const program = await Program.findById((cohort as any).programId);
    if (!program) {
      return res.status(404).json({ error: "Program not found for this cohort" });
    }

    const studentsReady = [];
    const currentDate = new Date();

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

          // Check if enough time has passed for assessment
          if (daysDiff >= timeframeDays && progress.status === 'green') {
            studentsReady.push({
              student: student,
              progress: progress,
              daysInCurrentLevel: daysDiff,
              timeframeCompleted: true,
              nextLevel: currentLevel + 1
            });
          }
        }
      }
    }

    res.json({
      cohort: {
        _id: cohort._id,
        name: cohort.name
      },
      studentsReady,
      totalReady: studentsReady.length
    });
  } catch (error: any) {
    logger.error("Error fetching students ready for assessment:", error);
    res.status(500).json({ error: "Error fetching students ready for assessment" });
  }
};

// Get detailed progress history for a student
export const getStudentProgressHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId, studentId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('students', 'name roll_no class');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view this cohort" });
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
      currentProgress: {
        currentLevel: progress.currentLevel,
        status: progress.status,
        failureCount: progress.failureCount || 0,
        lastUpdated: progress.lastUpdated,
        lastAssessmentDate: progress.lastAssessmentDate
      },
      assessmentHistory: progress.assessmentHistory || []
    });
  } catch (error: any) {
    logger.error("Error fetching student progress history:", error);
    res.status(500).json({ error: "Error fetching student progress history" });
  }
};

// Record daily attendance and update time-based progress
export const recordAttendanceProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const { date, attendanceRecords } = req.body; // attendanceRecords: [{ studentId, status }]
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('programId');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to record attendance for this cohort" });
    }

    const attendanceDate = new Date(date);
    
    // Record attendance for each student
    for (const record of attendanceRecords) {
      // Remove any existing attendance for this date and student
      cohort.attendance = cohort.attendance.filter((att: any) => 
        !(att.date.toDateString() === attendanceDate.toDateString() && 
          att.studentId.toString() === record.studentId.toString())
      );

      // Add new attendance record
      cohort.attendance.push({
        date: attendanceDate,
        studentId: record.studentId,
        status: record.status
      });
    }

    // Update time tracking if program exists and students attended
    if ((cohort as any).programId) {
      const programId = (cohort as any).programId._id || (cohort as any).programId;
      
      // Get the actual program document to access methods (populated documents lose methods)
      const Program = require("../models/ProgramModel").default;
      const program = await Program.findById(programId);
      
      if (program) {
        const currentLevel = cohort.currentLevel || 1;
        const currentLevelInfo = program.getLevelByNumber(currentLevel);
        
        if (currentLevelInfo) {
          // Count students who attended
          const presentStudents = attendanceRecords.filter((r: any) => r.status === 'present').length;
          
          if (presentStudents > 0) {
            // Initialize time tracking if it doesn't exist
            if (!cohort.timeTracking) {
              const cohortStartDate = cohort.startDate || cohort.createdAt;
              
              // Convert current level timeframe to days
              let expectedDaysForCurrentLevel = currentLevelInfo.timeframe || 14;
              switch (currentLevelInfo.timeframeUnit) {
                case 'weeks':
                  expectedDaysForCurrentLevel *= 7;
                  break;
                case 'months':
                  expectedDaysForCurrentLevel *= 30;
                  break;
              }

              // Calculate total expected days for entire program
              const totalExpectedDays = program.getTotalTimeToComplete(1, undefined, 'days') || 140;

              cohort.timeTracking = {
                cohortStartDate,
                currentLevelStartDate: cohortStartDate,
                attendanceDays: 0,
                expectedDaysForCurrentLevel,
                totalExpectedDays
              };
            }

            // Increment attendance days (only if teaching happened)
            cohort.timeTracking.attendanceDays += 1;
            
            // Check if current level is complete based on attendance
            if (cohort.timeTracking.attendanceDays >= cohort.timeTracking.expectedDaysForCurrentLevel) {
              // Level timeframe completed - students may be ready for assessment
              logger.info(`Cohort ${cohortId} completed timeframe for level ${currentLevel}. Students may be ready for assessment.`);
            }
          }
        }
      }
    }

    await cohort.save();

    logger.info(`Attendance recorded for cohort ${cohortId} on ${attendanceDate.toDateString()}`);
    
    res.json({ 
      message: "Attendance and progress updated successfully",
      attendanceDate: attendanceDate,
      recordsUpdated: attendanceRecords.length,
      timeTracking: cohort.timeTracking
    });
  } catch (error: any) {
    logger.error("Error recording attendance progress:", error);
    res.status(500).json({ error: "Error recording attendance progress" });
  }
};

// Get cohort timeline and progress bar data
export const getCohortTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const tutorId = req.user?._id;

    const cohort = await Cohort.findById(cohortId)
      .populate('programId');
    
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Verify tutor has access to this cohort
    if (cohort.tutorId.toString() !== tutorId?.toString() && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "You are not authorized to view this cohort timeline" });
    }

    if (!(cohort as any).programId) {
      return res.status(400).json({ error: "Cohort does not have an associated program" });
    }

    const program = (cohort as any).programId;
    const cohortStartDate = cohort.startDate || cohort.createdAt;
    const currentDate = new Date();
    const currentLevel = cohort.currentLevel || 1;

    // Calculate overall progress percentage based on attendance
    let overallProgressPercentage = 0;
    if (cohort.timeTracking) {
      overallProgressPercentage = Math.min(100, 
        (cohort.timeTracking.attendanceDays / cohort.timeTracking.totalExpectedDays) * 100
      );
    }

    // Calculate current level progress percentage
    let currentLevelProgressPercentage = 0;
    if (cohort.timeTracking) {
      currentLevelProgressPercentage = Math.min(100,
        (cohort.timeTracking.attendanceDays % cohort.timeTracking.expectedDaysForCurrentLevel) / 
        cohort.timeTracking.expectedDaysForCurrentLevel * 100
      );
    }

    // Generate level timeline
    const levelTimeline = program.levels.map((level: any, index: number) => {
      let levelDurationDays = level.timeframe;
      switch (level.timeframeUnit) {
        case 'weeks':
          levelDurationDays *= 7;
          break;
        case 'months':
          levelDurationDays *= 30;
          break;
      }

      // Calculate start and end dates for each level
      let levelStartDate = new Date(cohortStartDate);
      if (index > 0) {
        // Add duration of all previous levels
        const previousLevelsDuration = program.levels.slice(0, index).reduce((total: number, prevLevel: any) => {
          let duration = prevLevel.timeframe;
          switch (prevLevel.timeframeUnit) {
            case 'weeks':
              duration *= 7;
              break;
            case 'months':
              duration *= 30;
              break;
          }
          return total + duration;
        }, 0);
        levelStartDate = new Date(cohortStartDate.getTime() + (previousLevelsDuration * 24 * 60 * 60 * 1000));
      }

      const levelEndDate = new Date(levelStartDate.getTime() + (levelDurationDays * 24 * 60 * 60 * 1000));

      return {
        levelNumber: level.levelNumber,
        title: level.title,
        duration: levelDurationDays,
        startDate: levelStartDate,
        endDate: levelEndDate,
        isCurrent: level.levelNumber === currentLevel,
        isCompleted: level.levelNumber < currentLevel,
        progressPercentage: level.levelNumber === currentLevel ? currentLevelProgressPercentage : 
                           level.levelNumber < currentLevel ? 100 : 0
      };
    });

    res.json({
      cohort: {
        _id: cohort._id,
        name: cohort.name,
        startDate: cohortStartDate,
        currentLevel
      },
      program: {
        _id: program._id,
        name: program.name,
        subject: program.subject,
        totalLevels: program.totalLevels
      },
      timeTracking: cohort.timeTracking,
      overallProgress: {
        percentage: overallProgressPercentage,
        totalExpectedDays: cohort.timeTracking?.totalExpectedDays || 0,
        attendanceDays: cohort.timeTracking?.attendanceDays || 0
      },
      currentLevelProgress: {
        percentage: currentLevelProgressPercentage,
        expectedDays: cohort.timeTracking?.expectedDaysForCurrentLevel || 0,
        attendanceDays: cohort.timeTracking ? (cohort.timeTracking.attendanceDays % cohort.timeTracking.expectedDaysForCurrentLevel) : 0
      },
      levelTimeline
    });
  } catch (error: any) {
    logger.error("Error fetching cohort timeline:", error);
    res.status(500).json({ error: "Error fetching cohort timeline" });
  }
};