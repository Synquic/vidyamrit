import { Request, Response } from "express";
import {
  EnhancedStudentProfile,
  StudentStatus,
  LearningStyle,
  AcademicLevel,
} from "../models/EnhancedStudentProfileModel";
import { Student } from "../models/StudentModel";
import { User } from "../models/UserModel";
import mongoose from "mongoose";

// Create enhanced student profile
export const createEnhancedStudentProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      studentId,
      admissionNumber,
      admissionDate,
      previousEducation,
      parentsGuardians,
      familyBackground,
      learningPreferences,
      healthInformation,
      specialNeedsSupport,
      academicGoals,
      personalDevelopmentGoals,
      privacySettings,
    } = req.body;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if enhanced profile already exists
    const existingProfile = await EnhancedStudentProfile.findOne({ studentId });
    if (existingProfile) {
      return res
        .status(400)
        .json({ message: "Enhanced profile already exists for this student" });
    }

    // Create enhanced profile
    const enhancedProfile = new EnhancedStudentProfile({
      studentId,
      admissionNumber,
      admissionDate: new Date(admissionDate),
      previousEducation,
      parentsGuardians: parentsGuardians || [],
      familyBackground,
      learningPreferences: {
        learningStyle: LearningStyle.MULTIMODAL,
        preferredLanguage: "Hindi",
        studyTimePreference: "evening",
        groupVsIndividual: "mixed",
        motivationFactors: [],
        challenges: [],
        strengths: [],
        interests: [],
        careerAspirations: [],
        ...learningPreferences,
      },
      healthInformation: {
        allergies: [],
        medicalConditions: [],
        medications: [],
        vaccinations: [],
        ...healthInformation,
      },
      specialNeedsSupport,
      academicRecords: [],
      assessmentHistory: [],
      extracurricularActivities: [],
      behavioralRecords: [],
      communicationLogs: [],
      transferHistory: [],
      academicGoals: {
        shortTerm: [],
        longTerm: [],
        ...academicGoals,
      },
      personalDevelopmentGoals: {
        social: [],
        emotional: [],
        behavioral: [],
        physical: [],
        ...personalDevelopmentGoals,
      },
      performanceMetrics: {
        academicTrend: "stable",
        attendanceTrend: "stable",
        behaviorTrend: "stable",
        engagementLevel: "medium",
        riskFactors: [],
        strengths: [],
        recommendations: [],
        lastAnalyzed: new Date(),
      },
      interventions: [],
      privacySettings: {
        shareAcademicInfo: true,
        shareBehavioralInfo: true,
        shareHealthInfo: false,
        shareContactInfo: true,
        allowPhotography: true,
        allowSocialMedia: false,
        emergencyContactConsent: true,
        ...privacySettings,
      },
      lastUpdatedBy: req.user.id,
    });

    await enhancedProfile.save();

    const populatedProfile = await EnhancedStudentProfile.findById(
      enhancedProfile._id
    )
      .populate("studentId", "name email phoneNo class school")
      .populate("lastUpdatedBy", "name email");

    res.status(201).json({
      message: "Enhanced student profile created successfully",
      profile: populatedProfile,
    });
  } catch (error) {
    console.error("Error creating enhanced student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get enhanced student profiles with filtering
export const getEnhancedStudentProfiles = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      schoolId,
      status,
      currentLevel,
      learningStyle,
      academicTrend,
      engagementLevel,
      hasSpecialNeeds,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (status) filter.status = status;
    if (currentLevel) filter.currentLevel = currentLevel;
    if (learningStyle)
      filter["learningPreferences.learningStyle"] = learningStyle;
    if (academicTrend)
      filter["performanceMetrics.academicTrend"] = academicTrend;
    if (engagementLevel)
      filter["performanceMetrics.engagementLevel"] = engagementLevel;
    if (hasSpecialNeeds === "true") {
      filter["specialNeedsSupport.identifiedNeeds"] = { $ne: ["none"] };
    }

    // Role-based filtering
    if (req.user.role === "school_admin" && req.user.schoolId) {
      // Filter by school through student reference
      const schoolStudents = await Student.find({
        school: req.user.schoolId._id,
      }).select("_id");
      filter.studentId = { $in: schoolStudents.map((s) => s._id) };
    }

    if (schoolId && req.user.role === "super_admin") {
      const schoolStudents = await Student.find({ school: schoolId }).select(
        "_id"
      );
      filter.studentId = { $in: schoolStudents.map((s) => s._id) };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [profiles, total] = await Promise.all([
      EnhancedStudentProfile.find(filter)
        .populate("studentId", "name email phoneNo class school")
        .populate("lastUpdatedBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      EnhancedStudentProfile.countDocuments(filter),
    ]);

    res.json({
      profiles,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching enhanced student profiles:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get enhanced student profile by ID
export const getEnhancedStudentProfileById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const profile = await EnhancedStudentProfile.findById(id)
      .populate("studentId", "name email phoneNo class school")
      .populate("lastUpdatedBy", "name email")
      .populate("academicRecords.subjects.teacher", "name email")
      .populate("extracurricularActivities.mentor", "name email")
      .populate("behavioralRecords.reportedBy", "name email")
      .populate("assessmentHistory.conductedBy", "name email")
      .populate("interventions.provider", "name email");

    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    // Check access permissions
    if (req.user.role === "school_admin" && req.user.schoolId) {
      const student = await Student.findById(profile.studentId._id);
      if (
        student &&
        student.school.toString() !== req.user.schoolId._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json({ profile });
  } catch (error) {
    console.error("Error fetching enhanced student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update enhanced student profile
export const updateEnhancedStudentProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    // Update profile
    Object.assign(profile, updates);
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    const populatedProfile = await EnhancedStudentProfile.findById(profile._id)
      .populate("studentId", "name email phoneNo class school")
      .populate("lastUpdatedBy", "name email");

    res.json({
      message: "Enhanced student profile updated successfully",
      profile: populatedProfile,
    });
  } catch (error) {
    console.error("Error updating enhanced student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add academic record
export const addAcademicRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recordData = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    profile.academicRecords.push(recordData);
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Academic record added successfully",
      profile,
    });
  } catch (error) {
    console.error("Error adding academic record:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add assessment record
export const addAssessmentRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assessmentData = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    profile.assessmentHistory.push({
      ...assessmentData,
      conductedBy: req.user.id,
      date: new Date(assessmentData.date),
    });
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Assessment record added successfully",
      profile,
    });
  } catch (error) {
    console.error("Error adding assessment record:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add behavioral record
export const addBehavioralRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const behaviorData = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    profile.behavioralRecords.push({
      ...behaviorData,
      reportedBy: req.user.id,
      date: new Date(behaviorData.date || Date.now()),
    });
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Behavioral record added successfully",
      profile,
    });
  } catch (error) {
    console.error("Error adding behavioral record:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add communication log
export const addCommunicationLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const communicationData = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    profile.addCommunicationLog({
      ...communicationData,
      date: new Date(communicationData.date || Date.now()),
    });
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Communication log added successfully",
      profile,
    });
  } catch (error) {
    console.error("Error adding communication log:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add extracurricular activity
export const addExtracurricularActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const activityData = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    profile.extracurricularActivities.push({
      ...activityData,
      startDate: new Date(activityData.startDate),
      endDate: activityData.endDate
        ? new Date(activityData.endDate)
        : undefined,
    });
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Extracurricular activity added successfully",
      profile,
    });
  } catch (error) {
    console.error("Error adding extracurricular activity:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add intervention
export const addIntervention = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interventionData = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    profile.interventions.push({
      ...interventionData,
      provider: req.user.id,
      startDate: new Date(interventionData.startDate),
      endDate: interventionData.endDate
        ? new Date(interventionData.endDate)
        : undefined,
      progress: [],
    });
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Intervention added successfully",
      profile,
    });
  } catch (error) {
    console.error("Error adding intervention:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update intervention progress
export const updateInterventionProgress = async (
  req: Request,
  res: Response
) => {
  try {
    const { id, interventionId } = req.params;
    const { notes, effectiveness } = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    const intervention = profile.interventions.id(interventionId);
    if (!intervention) {
      return res.status(404).json({ message: "Intervention not found" });
    }

    intervention.progress.push({
      date: new Date(),
      notes,
      effectiveness,
    });
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Intervention progress updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating intervention progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update academic goals
export const updateAcademicGoals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { shortTerm, longTerm } = req.body;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    if (shortTerm) profile.academicGoals.shortTerm = shortTerm;
    if (longTerm) profile.academicGoals.longTerm = longTerm;
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Academic goals updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating academic goals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update performance metrics
export const updatePerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    profile.updatePerformanceMetrics();
    profile.lastUpdatedBy = req.user.id;
    await profile.save();

    res.json({
      message: "Performance metrics updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating performance metrics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get student statistics
export const getStudentStatistics = async (req: Request, res: Response) => {
  try {
    const { schoolId, dateFrom, dateTo } = req.query;

    const filter: any = {};
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
    }

    // Role-based filtering
    if (req.user.role === "school_admin" && req.user.schoolId) {
      const schoolStudents = await Student.find({
        school: req.user.schoolId._id,
      }).select("_id");
      filter.studentId = { $in: schoolStudents.map((s) => s._id) };
    } else if (schoolId && req.user.role === "super_admin") {
      const schoolStudents = await Student.find({ school: schoolId }).select(
        "_id"
      );
      filter.studentId = { $in: schoolStudents.map((s) => s._id) };
    }

    const stats = await EnhancedStudentProfile.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          activeStudents: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactiveStudents: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
          studentsWithSpecialNeeds: {
            $sum: {
              $cond: [
                { $ne: ["$specialNeedsSupport.identifiedNeeds", ["none"]] },
                1,
                0,
              ],
            },
          },
          highEngagementStudents: {
            $sum: {
              $cond: [
                { $eq: ["$performanceMetrics.engagementLevel", "high"] },
                1,
                0,
              ],
            },
          },
          mediumEngagementStudents: {
            $sum: {
              $cond: [
                { $eq: ["$performanceMetrics.engagementLevel", "medium"] },
                1,
                0,
              ],
            },
          },
          lowEngagementStudents: {
            $sum: {
              $cond: [
                { $eq: ["$performanceMetrics.engagementLevel", "low"] },
                1,
                0,
              ],
            },
          },
          improvingTrend: {
            $sum: {
              $cond: [
                { $eq: ["$performanceMetrics.academicTrend", "improving"] },
                1,
                0,
              ],
            },
          },
          decliningTrend: {
            $sum: {
              $cond: [
                { $eq: ["$performanceMetrics.academicTrend", "declining"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const learningStyleDistribution = await EnhancedStudentProfile.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$learningPreferences.learningStyle",
          count: { $sum: 1 },
        },
      },
    ]);

    const academicLevelDistribution = await EnhancedStudentProfile.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$currentLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      statistics: stats[0] || {
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        studentsWithSpecialNeeds: 0,
        highEngagementStudents: 0,
        mediumEngagementStudents: 0,
        lowEngagementStudents: 0,
        improvingTrend: 0,
        decliningTrend: 0,
      },
      learningStyleDistribution,
      academicLevelDistribution,
    });
  } catch (error) {
    console.error("Error fetching student statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Generate student report
export const generateStudentReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type = "comprehensive" } = req.query;

    const profile = await EnhancedStudentProfile.findById(id)
      .populate("studentId", "name email phoneNo class school")
      .populate("academicRecords.subjects.teacher", "name email")
      .populate("extracurricularActivities.mentor", "name email")
      .populate("behavioralRecords.reportedBy", "name email")
      .populate("assessmentHistory.conductedBy", "name email")
      .populate("interventions.provider", "name email");

    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    const report = profile.generateStudentReport(
      type as "comprehensive" | "academic" | "behavioral"
    );

    res.json({
      message: "Student report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get upcoming goals
export const getUpcomingGoals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    const upcomingGoals = profile.getUpcomingGoals();

    res.json({
      upcomingGoals,
    });
  } catch (error) {
    console.error("Error fetching upcoming goals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get attendance overview
export const getAttendanceOverview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period } = req.query;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    const attendanceOverview = profile.getAttendanceOverview(period as string);

    res.json({
      attendanceOverview,
    });
  } catch (error) {
    console.error("Error fetching attendance overview:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get behavioral summary
export const getBehavioralSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period } = req.query;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    const behavioralSummary = profile.getBehavioralSummary(period as string);

    res.json({
      behavioralSummary,
    });
  } catch (error) {
    console.error("Error fetching behavioral summary:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete enhanced student profile
export const deleteEnhancedStudentProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const profile = await EnhancedStudentProfile.findById(id);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Enhanced student profile not found" });
    }

    // Only super admin can delete profiles
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await EnhancedStudentProfile.findByIdAndDelete(id);

    res.json({ message: "Enhanced student profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting enhanced student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
