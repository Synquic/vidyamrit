import { Request, Response } from "express";
import {
  SchoolOnboarding,
  OnboardingStatus,
  OnboardingPhase,
  OnboardingStepStatus,
} from "../models/SchoolOnboardingModel";
import { School } from "../models/SchoolModel";
import { User } from "../models/UserModel";
import mongoose from "mongoose";

// Create a new school onboarding
export const createSchoolOnboarding = async (req: Request, res: Response) => {
  try {
    const {
      schoolId,
      projectManager,
      onboardingTeam,
      schoolContacts,
      plannedEndDate,
      tasks,
      milestones,
      successCriteria,
    } = req.body;

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Check if onboarding already exists for this school
    const existingOnboarding = await SchoolOnboarding.findOne({ schoolId });
    if (existingOnboarding) {
      return res
        .status(400)
        .json({ message: "Onboarding already exists for this school" });
    }

    // Verify team members exist
    const teamMembers = await User.find({
      _id: { $in: [...onboardingTeam, projectManager] },
    });
    if (teamMembers.length !== onboardingTeam.length + 1) {
      return res
        .status(404)
        .json({ message: "One or more team members not found" });
    }

    // Create onboarding
    const onboarding = new SchoolOnboarding({
      schoolId,
      initiatedBy: req.user.id,
      projectManager,
      onboardingTeam,
      schoolContacts: schoolContacts || [],
      startDate: new Date(),
      plannedEndDate: new Date(plannedEndDate),
      tasks: tasks || [],
      milestones: milestones || [],
      successCriteria: successCriteria || [],
      qualityGates: [],
      trainingSessions: [],
      systemSetups: [],
      supportTickets: [],
      communications: [],
      risks: [],
      kpis: [],
      schoolFeedback: [],
      lessonsLearned: [],
    });

    await onboarding.save();

    const populatedOnboarding = await SchoolOnboarding.findById(onboarding._id)
      .populate("schoolId", "name location contactEmail")
      .populate("projectManager", "name email")
      .populate("onboardingTeam", "name email")
      .populate("initiatedBy", "name email");

    res.status(201).json({
      message: "School onboarding created successfully",
      onboarding: populatedOnboarding,
    });
  } catch (error) {
    console.error("Error creating school onboarding:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all school onboardings with filtering
export const getSchoolOnboardings = async (req: Request, res: Response) => {
  try {
    const {
      schoolId,
      status,
      currentPhase,
      projectManager,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (schoolId) filter.schoolId = schoolId;
    if (status) filter.status = status;
    if (currentPhase) filter.currentPhase = currentPhase;
    if (projectManager) filter.projectManager = projectManager;

    // Role-based filtering
    if (req.user.role === "school_admin" && req.user.schoolId) {
      filter.schoolId = req.user.schoolId._id;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [onboardings, total] = await Promise.all([
      SchoolOnboarding.find(filter)
        .populate("schoolId", "name location contactEmail")
        .populate("projectManager", "name email")
        .populate("onboardingTeam", "name email")
        .populate("initiatedBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      SchoolOnboarding.countDocuments(filter),
    ]);

    res.json({
      onboardings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching school onboardings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a specific school onboarding by ID
export const getSchoolOnboardingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await SchoolOnboarding.findById(id)
      .populate("schoolId", "name location contactEmail")
      .populate("projectManager", "name email")
      .populate("onboardingTeam", "name email")
      .populate("initiatedBy", "name email")
      .populate("tasks.assignedTo", "name email")
      .populate("tasks.comments.userId", "name email")
      .populate("trainingSessions.trainer", "name email")
      .populate("trainingSessions.attendees.userId", "name email")
      .populate("systemSetups.assignedTo", "name email")
      .populate("supportTickets.reportedBy", "name email")
      .populate("supportTickets.assignedTo", "name email");

    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    // Check access permissions
    if (
      req.user.role === "school_admin" &&
      req.user.schoolId &&
      onboarding.schoolId._id.toString() !== req.user.schoolId._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ onboarding });
  } catch (error) {
    console.error("Error fetching school onboarding:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update school onboarding
export const updateSchoolOnboarding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    // Check permissions
    if (
      req.user.role !== "super_admin" &&
      !onboarding.onboardingTeam.includes(req.user.id) &&
      onboarding.projectManager.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update onboarding
    Object.assign(onboarding, updates);
    await onboarding.save();

    const populatedOnboarding = await SchoolOnboarding.findById(onboarding._id)
      .populate("schoolId", "name location contactEmail")
      .populate("projectManager", "name email")
      .populate("onboardingTeam", "name email");

    res.json({
      message: "School onboarding updated successfully",
      onboarding: populatedOnboarding,
    });
  } catch (error) {
    console.error("Error updating school onboarding:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add onboarding task
export const addOnboardingTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskData = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    onboarding.addTask({
      ...taskData,
      dueDate: new Date(taskData.dueDate),
    });

    await onboarding.save();

    res.json({
      message: "Onboarding task added successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error adding onboarding task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update task progress
export const updateTaskProgress = async (req: Request, res: Response) => {
  try {
    const { id, taskId } = req.params;
    const { status, completionPercentage, comments, blockers } = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    const task = onboarding.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update task
    if (status) task.status = status;
    if (completionPercentage !== undefined)
      task.completionPercentage = completionPercentage;
    if (blockers) task.blockers = blockers;

    if (comments) {
      task.comments.push({
        userId: req.user.id,
        comment: comments,
        timestamp: new Date(),
      });
    }

    if (status === OnboardingStepStatus.COMPLETED) {
      task.completedDate = new Date();
      task.completionPercentage = 100;
    }

    await onboarding.save();

    res.json({
      message: "Task progress updated successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error updating task progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Complete onboarding task
export const completeOnboardingTask = async (req: Request, res: Response) => {
  try {
    const { id, taskId } = req.params;
    const { evidence } = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    onboarding.completeTask(new mongoose.Types.ObjectId(taskId), evidence);
    await onboarding.save();

    res.json({
      message: "Onboarding task completed successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error completing onboarding task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add milestone
export const addOnboardingMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const milestoneData = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    onboarding.milestones.push({
      ...milestoneData,
      targetDate: new Date(milestoneData.targetDate),
      isCompleted: false,
    });

    await onboarding.save();

    res.json({
      message: "Milestone added successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error adding milestone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Complete milestone
export const completeMilestone = async (req: Request, res: Response) => {
  try {
    const { id, milestoneId } = req.params;
    const { signOffComments } = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    const milestone = onboarding.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    milestone.isCompleted = true;
    milestone.completedDate = new Date();

    if (milestone.signOffRequired) {
      if (!milestone.signedOffBy) milestone.signedOffBy = [];
      milestone.signedOffBy.push({
        userId: req.user.id,
        signedAt: new Date(),
        comments: signOffComments,
      });
    }

    await onboarding.save();

    res.json({
      message: "Milestone completed successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error completing milestone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Schedule training session
export const scheduleTrainingSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessionData = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    onboarding.trainingSessions.push({
      ...sessionData,
      scheduledDate: new Date(sessionData.scheduledDate),
      attendees: sessionData.attendees || [],
    });

    await onboarding.save();

    res.json({
      message: "Training session scheduled successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error scheduling training session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update training attendance
export const updateTrainingAttendance = async (req: Request, res: Response) => {
  try {
    const { id, sessionId } = req.params;
    const { attendeeId, registrationStatus, completionScore, feedback } =
      req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    const session = onboarding.trainingSessions.id(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Training session not found" });
    }

    const attendee = session.attendees.find(
      (a) => a.userId.toString() === attendeeId
    );
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    attendee.registrationStatus = registrationStatus;
    if (completionScore !== undefined)
      attendee.completionScore = completionScore;
    if (feedback) attendee.feedback = feedback;

    await onboarding.save();

    res.json({
      message: "Training attendance updated successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error updating training attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create support ticket
export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketData = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    onboarding.createSupportTicket({
      ...ticketData,
      reportedBy: req.user.id,
    });

    await onboarding.save();

    res.json({
      message: "Support ticket created successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update support ticket
export const updateSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id, ticketId } = req.params;
    const { status, assignedTo, resolution, satisfaction } = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    const ticket = onboarding.supportTickets.id(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (resolution) {
      ticket.resolution = resolution;
      ticket.resolvedAt = new Date();
    }
    if (satisfaction) ticket.satisfaction = satisfaction;

    await onboarding.save();

    res.json({
      message: "Support ticket updated successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add school feedback
export const addSchoolFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, rating, comments } = req.body;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    onboarding.schoolFeedback.push({
      category,
      rating,
      comments,
      submittedBy: req.user.id,
      submittedAt: new Date(),
    });

    // Calculate overall satisfaction
    const totalRating = onboarding.schoolFeedback.reduce(
      (sum, feedback) => sum + feedback.rating,
      0
    );
    onboarding.overallSatisfaction =
      totalRating / onboarding.schoolFeedback.length;

    await onboarding.save();

    res.json({
      message: "School feedback added successfully",
      onboarding,
    });
  } catch (error) {
    console.error("Error adding school feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get onboarding statistics
export const getOnboardingStatistics = async (req: Request, res: Response) => {
  try {
    const { schoolId, dateFrom, dateTo } = req.query;

    const filter: any = {};
    if (schoolId) filter.schoolId = schoolId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
    }

    // Role-based filtering
    if (req.user.role === "school_admin" && req.user.schoolId) {
      filter.schoolId = req.user.schoolId._id;
    }

    const stats = await SchoolOnboarding.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOnboardings: { $sum: 1 },
          notStartedOnboardings: {
            $sum: { $cond: [{ $eq: ["$status", "not_started"] }, 1, 0] },
          },
          inProgressOnboardings: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          completedOnboardings: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          onHoldOnboardings: {
            $sum: { $cond: [{ $eq: ["$status", "on_hold"] }, 1, 0] },
          },
          averageProgress: { $avg: "$overallProgress" },
          averageSatisfaction: { $avg: "$overallSatisfaction" },
        },
      },
    ]);

    const phaseDistribution = await SchoolOnboarding.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$currentPhase",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      statistics: stats[0] || {
        totalOnboardings: 0,
        notStartedOnboardings: 0,
        inProgressOnboardings: 0,
        completedOnboardings: 0,
        onHoldOnboardings: 0,
        averageProgress: 0,
        averageSatisfaction: 0,
      },
      phaseDistribution,
    });
  } catch (error) {
    console.error("Error fetching onboarding statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Generate onboarding report
export const generateOnboardingReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await SchoolOnboarding.findById(id)
      .populate("schoolId", "name location contactEmail")
      .populate("projectManager", "name email")
      .populate("onboardingTeam", "name email");

    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    const report = onboarding.generateOnboardingReport();

    res.json({
      message: "Onboarding report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Error generating onboarding report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get blocked tasks
export const getBlockedTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    const blockedTasks = onboarding.getBlockedTasks();

    res.json({
      blockedTasks,
    });
  } catch (error) {
    console.error("Error fetching blocked tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get upcoming deadlines
export const getUpcomingDeadlines = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    const upcomingTasks = onboarding.getUpcomingDeadlines(
      parseInt(days as string)
    );

    res.json({
      upcomingTasks,
    });
  } catch (error) {
    console.error("Error fetching upcoming deadlines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete school onboarding
export const deleteSchoolOnboarding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await SchoolOnboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ message: "School onboarding not found" });
    }

    // Only super admin can delete onboardings
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await SchoolOnboarding.findByIdAndDelete(id);

    res.json({ message: "School onboarding deleted successfully" });
  } catch (error) {
    console.error("Error deleting school onboarding:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
