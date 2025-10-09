import { Request, Response } from "express";
import MentorProfile, {
  IMentorProfile,
  Specialization,
  PerformanceRating,
} from "../models/MentorProfileModel";
import User from "../models/UserModel";
import Student from "../models/StudentModel";
import { AuthRequest } from "../types/auth";
import mongoose from "mongoose";

export const createMentorProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      personalInfo,
      professionalInfo,
      qualifications,
      experience,
      certifications,
    } = req.body;

    // Validate that the user exists and is a mentor
    const user = await User.findById(userId);
    if (!user || user.role !== "mentor") {
      res.status(400).json({ message: "User must be a mentor" });
      return;
    }

    // Check if profile already exists
    const existingProfile = await MentorProfile.findOne({ userId });
    if (existingProfile) {
      res.status(400).json({ message: "Mentor profile already exists" });
      return;
    }

    const mentorProfile = new MentorProfile({
      userId,
      personalInfo: personalInfo || {},
      professionalInfo: {
        joinDate: new Date(),
        position: "Mentor",
        workType: "full_time",
        specializations: ["general"],
        maxStudents: 20,
        currentStudents: 0,
        ...professionalInfo,
      },
      qualifications: qualifications || [],
      experience: experience || [],
      certifications: certifications || [],
      performanceMetrics: [],
      assignments: [],
      availability: [],
      preferences: {
        preferredSubjects: ["general"],
        preferredStudentLevels: [1, 2, 3, 4, 5],
        communicationPreferences: ["email"],
      },
      skills: {
        technicalSkills: [],
        softSkills: [],
        languageProficiency: [],
      },
      feedback: {
        fromStudents: [],
        fromParents: [],
        fromAdmins: [],
      },
      status: "active",
    });

    await mentorProfile.save();

    const populatedProfile = await MentorProfile.findById(
      mentorProfile._id
    ).populate("userId", "name email phoneNo");

    res.status(201).json(populatedProfile);
  } catch (error) {
    console.error("Error creating mentor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMentorProfiles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      schoolId,
      specialization,
      status,
      workType,
      available,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (workType) {
      filter["professionalInfo.workType"] = workType;
    }

    if (specialization) {
      filter["professionalInfo.specializations"] = specialization;
    }

    if (available === "true") {
      // Filter for mentors who have capacity for more students
      filter.$expr = {
        $lt: [
          "$professionalInfo.currentStudents",
          "$professionalInfo.maxStudents",
        ],
      };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const mentorProfiles = await MentorProfile.find(filter)
      .populate("userId", "name email phoneNo schoolId")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Filter by school if specified and user is not super admin
    let filteredProfiles = mentorProfiles;
    if (schoolId || req.user?.role !== "super_admin") {
      const targetSchoolId = schoolId || req.user?.schoolId?.toString();
      filteredProfiles = mentorProfiles.filter(
        (profile) => profile.userId?.schoolId?.toString() === targetSchoolId
      );
    }

    const total = await MentorProfile.countDocuments(filter);

    res.json({
      mentors: filteredProfiles,
      pagination: {
        current: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching mentor profiles:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMentorProfileById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const mentorProfile = await MentorProfile.findById(id)
      .populate("userId", "name email phoneNo schoolId")
      .populate("assignments.targetId")
      .populate("feedback.fromStudents.studentId", "name")
      .populate("feedback.fromAdmins.adminId", "name");

    if (!mentorProfile) {
      res.status(404).json({ message: "Mentor profile not found" });
      return;
    }

    // Check permissions
    if (
      req.user?.role === "mentor" &&
      mentorProfile.userId?._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json(mentorProfile);
  } catch (error) {
    console.error("Error fetching mentor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMentorProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const mentorProfile = await MentorProfile.findById(id);
    if (!mentorProfile) {
      res.status(404).json({ message: "Mentor profile not found" });
      return;
    }

    // Check permissions
    if (
      req.user?.role === "mentor" &&
      mentorProfile.userId?.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        (mentorProfile as any)[key] = updateData[key];
      }
    });

    await mentorProfile.save();

    const updatedProfile = await MentorProfile.findById(id).populate(
      "userId",
      "name email phoneNo schoolId"
    );

    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating mentor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addPerformanceMetric = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      period,
      studentsAssigned,
      averageStudentImprovement,
      attendanceRate,
      assessmentCompletionRate,
      parentSatisfactionScore,
      adminRating,
      notes,
    } = req.body;

    const mentorProfile = await MentorProfile.findById(id);
    if (!mentorProfile) {
      res.status(404).json({ message: "Mentor profile not found" });
      return;
    }

    const newMetric = {
      period,
      studentsAssigned,
      averageStudentImprovement,
      attendanceRate,
      assessmentCompletionRate,
      parentSatisfactionScore,
      adminRating,
      notes,
      createdAt: new Date(),
    };

    mentorProfile.performanceMetrics.push(newMetric);
    await mentorProfile.save();

    res.json({
      message: "Performance metric added successfully",
      metric: newMetric,
    });
  } catch (error) {
    console.error("Error adding performance metric:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const assignToMentor = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, targetId, targetName, subject, priority, notes, goals } =
      req.body;

    if (!["student", "group", "cohort"].includes(type)) {
      res.status(400).json({ message: "Invalid assignment type" });
      return;
    }

    const mentorProfile = await MentorProfile.findById(id);
    if (!mentorProfile) {
      res.status(404).json({ message: "Mentor profile not found" });
      return;
    }

    // Check if mentor has capacity
    if (
      type === "student" &&
      mentorProfile.professionalInfo.currentStudents >=
        mentorProfile.professionalInfo.maxStudents
    ) {
      res
        .status(400)
        .json({ message: "Mentor has reached maximum student capacity" });
      return;
    }

    const newAssignment = {
      type,
      targetId: new mongoose.Types.ObjectId(targetId),
      targetName,
      subject,
      startDate: new Date(),
      status: "active" as const,
      priority: priority || "medium",
      notes,
      goals: goals || [],
      progress: 0,
    };

    mentorProfile.assignments.push(newAssignment);
    await mentorProfile.save();

    res.json({
      message: "Assignment added successfully",
      assignment: newAssignment,
    });
  } catch (error) {
    console.error("Error adding assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAssignment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id, assignmentId } = req.params;
    const updateData = req.body;

    const mentorProfile = await MentorProfile.findById(id);
    if (!mentorProfile) {
      res.status(404).json({ message: "Mentor profile not found" });
      return;
    }

    const assignment = mentorProfile.assignments.id(assignmentId);
    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    // Update assignment fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        (assignment as any)[key] = updateData[key];
      }
    });

    await mentorProfile.save();

    res.json({
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addFeedback = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, rating, comment, studentId, adminId } = req.body;

    if (!["student", "parent", "admin"].includes(type)) {
      res.status(400).json({ message: "Invalid feedback type" });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const mentorProfile = await MentorProfile.findById(id);
    if (!mentorProfile) {
      res.status(404).json({ message: "Mentor profile not found" });
      return;
    }

    const feedbackData = {
      rating,
      comment,
      date: new Date(),
    };

    switch (type) {
      case "student":
        if (!studentId) {
          res
            .status(400)
            .json({ message: "Student ID required for student feedback" });
          return;
        }
        mentorProfile.feedback.fromStudents.push({
          ...feedbackData,
          studentId: new mongoose.Types.ObjectId(studentId),
        });
        break;
      case "parent":
        if (!studentId) {
          res
            .status(400)
            .json({ message: "Student ID required for parent feedback" });
          return;
        }
        mentorProfile.feedback.fromParents.push({
          ...feedbackData,
          studentId: new mongoose.Types.ObjectId(studentId),
        });
        break;
      case "admin":
        if (!adminId) {
          res
            .status(400)
            .json({ message: "Admin ID required for admin feedback" });
          return;
        }
        mentorProfile.feedback.fromAdmins.push({
          ...feedbackData,
          adminId: new mongoose.Types.ObjectId(adminId),
        });
        break;
    }

    await mentorProfile.save();

    res.json({
      message: "Feedback added successfully",
      feedback: feedbackData,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMentorStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId, period } = req.query;

    // Build match filter
    const matchFilter: any = {};

    if (schoolId && req.user?.role === "super_admin") {
      // Super admin can filter by any school
      matchFilter["userId.schoolId"] = new mongoose.Types.ObjectId(
        schoolId as string
      );
    } else if (req.user?.schoolId) {
      // Other roles filter by their school
      matchFilter["userId.schoolId"] = new mongoose.Types.ObjectId(
        req.user.schoolId
      );
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalMentors: { $sum: 1 },
          activeMentors: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          totalStudentsAssigned: { $sum: "$professionalInfo.currentStudents" },
          averageWorkload: { $avg: "$professionalInfo.currentStudents" },
          specializations: { $push: "$professionalInfo.specializations" },
          workTypes: { $push: "$professionalInfo.workType" },
          overallRatings: { $push: "$overallRating" },
        },
      },
    ];

    const stats = await MentorProfile.aggregate(pipeline);
    const result = stats[0] || {
      totalMentors: 0,
      activeMentors: 0,
      totalStudentsAssigned: 0,
      averageWorkload: 0,
      specializations: [],
      workTypes: [],
      overallRatings: [],
    };

    // Process specializations count
    const specializationCounts: any = {};
    result.specializations.flat().forEach((spec: string) => {
      specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
    });

    // Process work types count
    const workTypeCounts: any = {};
    result.workTypes.forEach((type: string) => {
      workTypeCounts[type] = (workTypeCounts[type] || 0) + 1;
    });

    // Calculate average rating
    const validRatings = result.overallRatings.filter(
      (rating: number) => rating > 0
    );
    const averageRating =
      validRatings.length > 0
        ? validRatings.reduce(
            (sum: number, rating: number) => sum + rating,
            0
          ) / validRatings.length
        : 0;

    res.json({
      totalMentors: result.totalMentors,
      activeMentors: result.activeMentors,
      totalStudentsAssigned: result.totalStudentsAssigned,
      averageWorkload: Math.round(result.averageWorkload * 100) / 100,
      averageRating: Math.round(averageRating * 100) / 100,
      specializationDistribution: specializationCounts,
      workTypeDistribution: workTypeCounts,
      capacityUtilization:
        result.totalMentors > 0
          ? Math.round(
              (result.totalStudentsAssigned / result.totalMentors) * 100
            ) / 100
          : 0,
    });
  } catch (error) {
    console.error("Error fetching mentor statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
