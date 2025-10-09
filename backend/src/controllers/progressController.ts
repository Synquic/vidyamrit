import { Request, Response } from "express";
import Student, {
  IStudent,
  ProgressFlag,
  Subject,
} from "../models/StudentModel";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";
import mongoose from "mongoose";

export const updateProgressFlag = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { subject, flag, reason } = req.body;

    if (!subject || !flag || !reason) {
      res
        .status(400)
        .json({ message: "Subject, flag, and reason are required" });
      return;
    }

    if (!["hindi", "math", "english"].includes(subject)) {
      res.status(400).json({ message: "Invalid subject" });
      return;
    }

    if (
      ![
        "improving",
        "struggling",
        "excelling",
        "average",
        "needs_attention",
      ].includes(flag)
    ) {
      res.status(400).json({ message: "Invalid progress flag" });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    // Check permissions - mentors can only update students in their school
    if (req.user?.role === UserRole.MENTOR) {
      const userSchool = req.user.schoolId?.toString();
      const studentSchool = student.school?.toString();
      if (userSchool !== studentSchool) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    // Update current progress flag
    student.currentProgressFlags[subject as Subject] = flag as ProgressFlag;

    // Add to progress history
    student.progressHistory.push({
      flag: flag as ProgressFlag,
      subject: subject as Subject,
      reason,
      date: new Date(),
      mentorId: req.user?._id
        ? new mongoose.Types.ObjectId(req.user._id)
        : undefined,
    });

    await student.save();

    // Populate and return updated student
    const updatedStudent = await Student.findById(studentId)
      .populate("school", "name")
      .populate("progressHistory.mentorId", "name email");

    res.json({
      message: "Progress flag updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating progress flag:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStudentProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { includeHistory } = req.query;

    const student = await Student.findById(studentId)
      .populate("school", "name")
      .populate("progressHistory.mentorId", "name email");

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    // Check permissions
    if (req.user?.role === "MENTOR") {
      const userSchool = req.user.schoolId?.toString();
      const studentSchool = student.school?.toString();
      if (userSchool !== studentSchool) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    const response: any = {
      studentId: student._id,
      name: student.name,
      class: student.class,
      school: student.school,
      currentProgressFlags: student.currentProgressFlags,
      lastAssessmentDate: student.lastAssessmentDate,
      totalAssessments: student.totalAssessments,
      averagePerformance: student.averagePerformance,
      levels: {
        hindi: student.hindi_level,
        math: student.math_level,
        english: student.english_level,
      },
    };

    if (includeHistory === "true") {
      response.progressHistory = student.progressHistory;
    }

    res.json(response);
  } catch (error) {
    console.error("Error fetching student progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProgressStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId, subject, flag } = req.query;

    // Build match filter
    const matchFilter: any = {};

    if (schoolId) {
      matchFilter.school = new mongoose.Types.ObjectId(schoolId as string);
    }

    // If user is a mentor, filter by their school
    if (req.user?.role === "MENTOR" && req.user.schoolId) {
      matchFilter.school = new mongoose.Types.ObjectId(req.user.schoolId);
    }

    // Get progress statistics
    const pipeline: any[] = [
      { $match: matchFilter },
      {
        $project: {
          name: 1,
          class: 1,
          school: 1,
          hindiFlag: "$currentProgressFlags.hindi",
          mathFlag: "$currentProgressFlags.math",
          englishFlag: "$currentProgressFlags.english",
          levels: {
            hindi: "$hindi_level",
            math: "$math_level",
            english: "$english_level",
          },
        },
      },
    ];

    // Add subject-specific filtering if requested
    if (subject && flag) {
      pipeline.push({
        $match: {
          [`${subject}Flag`]: flag,
        },
      });
    }

    const students = await Student.aggregate(pipeline);

    // Calculate statistics
    const stats = {
      totalStudents: students.length,
      bySubject: {
        hindi: {
          improving: 0,
          struggling: 0,
          excelling: 0,
          average: 0,
          needs_attention: 0,
        },
        math: {
          improving: 0,
          struggling: 0,
          excelling: 0,
          average: 0,
          needs_attention: 0,
        },
        english: {
          improving: 0,
          struggling: 0,
          excelling: 0,
          average: 0,
          needs_attention: 0,
        },
      },
      overall: {
        improving: 0,
        struggling: 0,
        excelling: 0,
        average: 0,
        needs_attention: 0,
      },
    };

    students.forEach((student) => {
      // Count by subject
      if (student.hindiFlag) stats.bySubject.hindi[student.hindiFlag]++;
      if (student.mathFlag) stats.bySubject.math[student.mathFlag]++;
      if (student.englishFlag) stats.bySubject.english[student.englishFlag]++;

      // Calculate overall flag (worst case scenario)
      const flags = [student.hindiFlag, student.mathFlag, student.englishFlag];
      if (flags.includes("struggling") || flags.includes("needs_attention")) {
        stats.overall.needs_attention++;
      } else if (flags.includes("excelling")) {
        stats.overall.excelling++;
      } else if (flags.includes("improving")) {
        stats.overall.improving++;
      } else {
        stats.overall.average++;
      }
    });

    res.json({
      statistics: stats,
      students: subject && flag ? students : undefined,
    });
  } catch (error) {
    console.error("Error fetching progress statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const bulkUpdateProgressFlags = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({ message: "Updates array is required" });
      return;
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      try {
        const { studentId, subject, flag, reason } = update;

        if (!studentId || !subject || !flag || !reason) {
          results.failed++;
          results.errors.push(
            `Missing required fields for student ${studentId}`
          );
          continue;
        }

        const student = await Student.findById(studentId);
        if (!student) {
          results.failed++;
          results.errors.push(`Student ${studentId} not found`);
          continue;
        }

        // Check permissions
        if (req.user?.role === "MENTOR") {
          const userSchool = req.user.schoolId?.toString();
          const studentSchool = student.school?.toString();
          if (userSchool !== studentSchool) {
            results.failed++;
            results.errors.push(`Access denied for student ${studentId}`);
            continue;
          }
        }

        // Update progress flag
        student.currentProgressFlags[subject as Subject] = flag as ProgressFlag;
        student.progressHistory.push({
          flag: flag as ProgressFlag,
          subject: subject as Subject,
          reason,
          date: new Date(),
          mentorId: req.user?._id
            ? new mongoose.Types.ObjectId(req.user._id)
            : undefined,
        });

        await student.save();
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error updating student ${update.studentId}: ${error}`
        );
      }
    }

    res.json({
      message: "Bulk update completed",
      results,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProgressTrends = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId, subject, days = "30" } = req.query;

    if (!studentId) {
      res.status(400).json({ message: "Student ID is required" });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    // Check permissions
    if (req.user?.role === "MENTOR") {
      const userSchool = req.user.schoolId?.toString();
      const studentSchool = student.school?.toString();
      if (userSchool !== studentSchool) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    const daysBack = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Filter progress history
    let progressHistory = student.progressHistory.filter(
      (entry) => entry.date >= startDate
    );

    // Filter by subject if specified
    if (subject) {
      progressHistory = progressHistory.filter(
        (entry) => entry.subject === subject
      );
    }

    // Sort by date
    progressHistory.sort((a, b) => a.date.getTime() - b.date.getTime());

    res.json({
      studentId,
      subject: subject || "all",
      period: `${daysBack} days`,
      currentFlags: student.currentProgressFlags,
      trends: progressHistory,
    });
  } catch (error) {
    console.error("Error fetching progress trends:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
