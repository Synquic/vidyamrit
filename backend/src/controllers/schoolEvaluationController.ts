import { Request, Response } from "express";
import {
  SchoolEvaluation,
  EvaluationStatus,
  EvaluationCategory,
} from "../models/SchoolEvaluationModel";
import { School } from "../models/SchoolModel";
import { User } from "../models/UserModel";
import mongoose from "mongoose";

// Create a new school evaluation
export const createSchoolEvaluation = async (req: Request, res: Response) => {
  try {
    const {
      schoolId,
      assignedEvaluators,
      leadEvaluator,
      expectedEndDate,
      requiredDocuments,
      timeline,
    } = req.body;

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Verify evaluators exist
    const evaluators = await User.find({ _id: { $in: assignedEvaluators } });
    if (evaluators.length !== assignedEvaluators.length) {
      return res
        .status(404)
        .json({ message: "One or more evaluators not found" });
    }

    // Generate evaluation code
    const evaluationCount = await SchoolEvaluation.countDocuments({ schoolId });
    const schoolCode = school.name
      .replace(/\s+/g, "")
      .substring(0, 3)
      .toUpperCase();
    const evaluationCode = `EVAL-${schoolCode}-${String(
      evaluationCount + 1
    ).padStart(3, "0")}`;

    // Create evaluation
    const evaluation = new SchoolEvaluation({
      schoolId,
      evaluationCode,
      evaluationRound: evaluationCount + 1,
      initiatedBy: req.user.id,
      assignedEvaluators,
      leadEvaluator,
      startDate: new Date(),
      expectedEndDate: new Date(expectedEndDate),
      requiredDocuments: requiredDocuments || [],
      timeline: timeline || [],
      categories: [],
      actionItems: [],
      visits: [],
      submittedDocuments: [],
    });

    await evaluation.save();

    const populatedEvaluation = await SchoolEvaluation.findById(evaluation._id)
      .populate("schoolId", "name location contactEmail")
      .populate("assignedEvaluators", "name email")
      .populate("leadEvaluator", "name email")
      .populate("initiatedBy", "name email");

    res.status(201).json({
      message: "School evaluation created successfully",
      evaluation: populatedEvaluation,
    });
  } catch (error) {
    console.error("Error creating school evaluation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all school evaluations with filtering
export const getSchoolEvaluations = async (req: Request, res: Response) => {
  try {
    const {
      schoolId,
      status,
      leadEvaluator,
      evaluationRound,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (schoolId) filter.schoolId = schoolId;
    if (status) filter.status = status;
    if (leadEvaluator) filter.leadEvaluator = leadEvaluator;
    if (evaluationRound)
      filter.evaluationRound = parseInt(evaluationRound as string);

    // Role-based filtering
    if (req.user.role === "school_admin" && req.user.schoolId) {
      filter.schoolId = req.user.schoolId._id;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [evaluations, total] = await Promise.all([
      SchoolEvaluation.find(filter)
        .populate("schoolId", "name location contactEmail")
        .populate("assignedEvaluators", "name email")
        .populate("leadEvaluator", "name email")
        .populate("initiatedBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      SchoolEvaluation.countDocuments(filter),
    ]);

    res.json({
      evaluations,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching school evaluations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a specific school evaluation by ID
export const getSchoolEvaluationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const evaluation = await SchoolEvaluation.findById(id)
      .populate("schoolId", "name location contactEmail")
      .populate("assignedEvaluators", "name email")
      .populate("leadEvaluator", "name email")
      .populate("initiatedBy", "name email")
      .populate("actionItems.assignedTo", "name email")
      .populate("actionItems.createdBy", "name email")
      .populate("visits.evaluators", "name email")
      .populate("submittedDocuments.verifiedBy", "name email");

    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    // Check access permissions
    if (
      req.user.role === "school_admin" &&
      req.user.schoolId &&
      evaluation.schoolId._id.toString() !== req.user.schoolId._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ evaluation });
  } catch (error) {
    console.error("Error fetching school evaluation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update school evaluation
export const updateSchoolEvaluation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    // Check permissions
    if (
      req.user.role !== "super_admin" &&
      !evaluation.assignedEvaluators.includes(req.user.id) &&
      evaluation.leadEvaluator.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update evaluation
    Object.assign(evaluation, updates);
    evaluation.version += 1;
    await evaluation.save();

    const populatedEvaluation = await SchoolEvaluation.findById(evaluation._id)
      .populate("schoolId", "name location contactEmail")
      .populate("assignedEvaluators", "name email")
      .populate("leadEvaluator", "name email");

    res.json({
      message: "School evaluation updated successfully",
      evaluation: populatedEvaluation,
    });
  } catch (error) {
    console.error("Error updating school evaluation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add evaluation category with criteria
export const addEvaluationCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, criteria, weightage } = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    // Check if category already exists
    const existingCategory = evaluation.categories.find(
      (cat) => cat.category === category
    );
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Calculate scores
    let totalScore = 0;
    let maxScore = 0;
    const processedCriteria = criteria.map((criterion: any) => {
      totalScore += criterion.score;
      maxScore += criterion.maxScore;
      return {
        ...criterion,
        evaluatedBy: req.user.id,
        evaluatedAt: new Date(),
      };
    });

    const overallRating = Math.round((totalScore / maxScore) * 5);

    evaluation.categories.push({
      category,
      criteria: processedCriteria,
      overallRating,
      totalScore,
      maxScore,
      weightage,
      recommendations: [],
    });

    // Recalculate overall score
    evaluation.calculateOverallScore();
    await evaluation.save();

    res.json({
      message: "Evaluation category added successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Error adding evaluation category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add action item
export const addActionItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actionItem = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    evaluation.addActionItem({
      ...actionItem,
      createdBy: req.user.id,
    });

    await evaluation.save();

    res.json({
      message: "Action item added successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Error adding action item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Complete action item
export const completeActionItem = async (req: Request, res: Response) => {
  try {
    const { id, actionItemId } = req.params;
    const { evidence } = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    evaluation.completeActionItem(
      new mongoose.Types.ObjectId(actionItemId),
      evidence
    );
    await evaluation.save();

    res.json({
      message: "Action item completed successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Error completing action item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Schedule evaluation visit
export const scheduleEvaluationVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const visitData = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    evaluation.visits.push({
      ...visitData,
      scheduledDate: new Date(visitData.scheduledDate),
    });

    await evaluation.save();

    res.json({
      message: "Evaluation visit scheduled successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Error scheduling evaluation visit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Submit document for evaluation
export const submitEvaluationDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType, fileName, fileUrl } = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    evaluation.submittedDocuments.push({
      documentType,
      fileName,
      fileUrl,
      uploadedAt: new Date(),
      verificationStatus: "pending",
    });

    await evaluation.save();

    res.json({
      message: "Document submitted successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Error submitting document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Verify submitted document
export const verifyEvaluationDocument = async (req: Request, res: Response) => {
  try {
    const { id, documentId } = req.params;
    const { verificationStatus, comments } = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    const document = evaluation.submittedDocuments.id(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    document.verificationStatus = verificationStatus;
    document.verifiedBy = req.user.id;
    document.verificationComments = comments;

    await evaluation.save();

    res.json({
      message: "Document verification updated successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Finalize evaluation decision
export const finalizeEvaluationDecision = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { decision, decisionReason, conditions } = req.body;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    evaluation.decision = decision;
    evaluation.decisionDate = new Date();
    evaluation.decisionBy = req.user.id;
    evaluation.decisionReason = decisionReason;
    evaluation.conditions = conditions || [];

    if (decision === "approved" || decision === "conditional_approval") {
      evaluation.status = EvaluationStatus.APPROVED;
      // Set certification validity
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1); // Valid for 1 year
      evaluation.certificationValidUntil = validUntil;
    } else if (decision === "rejected") {
      evaluation.status = EvaluationStatus.REJECTED;
    }

    await evaluation.save();

    res.json({
      message: "Evaluation decision finalized successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Error finalizing evaluation decision:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get evaluation statistics
export const getEvaluationStatistics = async (req: Request, res: Response) => {
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

    const stats = await SchoolEvaluation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          pendingEvaluations: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          inProgressEvaluations: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          completedEvaluations: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          approvedEvaluations: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejectedEvaluations: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          averageScore: { $avg: "$overallScore" },
          averageComplianceScore: { $avg: "$complianceScore" },
        },
      },
    ]);

    const certificationLevels = await SchoolEvaluation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$certificationLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      statistics: stats[0] || {
        totalEvaluations: 0,
        pendingEvaluations: 0,
        inProgressEvaluations: 0,
        completedEvaluations: 0,
        approvedEvaluations: 0,
        rejectedEvaluations: 0,
        averageScore: 0,
        averageComplianceScore: 0,
      },
      certificationLevels,
    });
  } catch (error) {
    console.error("Error fetching evaluation statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Generate evaluation report
export const generateEvaluationReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const evaluation = await SchoolEvaluation.findById(id)
      .populate("schoolId", "name location contactEmail")
      .populate("assignedEvaluators", "name email")
      .populate("leadEvaluator", "name email");

    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    const report = evaluation.generateEvaluationReport();

    res.json({
      message: "Evaluation report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Error generating evaluation report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete school evaluation
export const deleteSchoolEvaluation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const evaluation = await SchoolEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "School evaluation not found" });
    }

    // Only super admin can delete evaluations
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await SchoolEvaluation.findByIdAndDelete(id);

    res.json({ message: "School evaluation deleted successfully" });
  } catch (error) {
    console.error("Error deleting school evaluation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
