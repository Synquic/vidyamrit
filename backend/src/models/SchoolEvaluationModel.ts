import mongoose, { Document, Schema } from "mongoose";

// Enums for evaluation criteria
export enum EvaluationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  APPROVED = "approved",
  REJECTED = "rejected",
  REVISION_REQUIRED = "revision_required",
}

export enum EvaluationCategory {
  INFRASTRUCTURE = "infrastructure",
  ACADEMIC_STANDARDS = "academic_standards",
  FACULTY_QUALITY = "faculty_quality",
  STUDENT_FACILITIES = "student_facilities",
  TECHNOLOGY_READINESS = "technology_readiness",
  ADMINISTRATIVE_CAPACITY = "administrative_capacity",
  SAFETY_SECURITY = "safety_security",
  FINANCIAL_STABILITY = "financial_stability",
}

export enum EvaluationRating {
  EXCELLENT = 5,
  GOOD = 4,
  SATISFACTORY = 3,
  NEEDS_IMPROVEMENT = 2,
  POOR = 1,
}

// Sub-interfaces for evaluation components
interface EvaluationCriterion {
  name: string;
  description: string;
  rating: EvaluationRating;
  score: number;
  maxScore: number;
  comments: string;
  evidence: string[];
  evaluatedBy: mongoose.Types.ObjectId;
  evaluatedAt: Date;
}

interface EvaluationCategory {
  category: EvaluationCategory;
  criteria: EvaluationCriterion[];
  overallRating: EvaluationRating;
  totalScore: number;
  maxScore: number;
  weightage: number;
  recommendations: string[];
}

interface DocumentSubmission {
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedBy?: mongoose.Types.ObjectId;
  verificationComments?: string;
}

interface VisitSchedule {
  visitType: "initial" | "follow_up" | "final";
  scheduledDate: Date;
  duration: number; // in hours
  evaluators: mongoose.Types.ObjectId[];
  agenda: string[];
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  completedAt?: Date;
  visitReport?: string;
}

interface ActionItem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: EvaluationCategory;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: mongoose.Types.ObjectId;
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  completedAt?: Date;
  completionEvidence?: string[];
  comments: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

interface EvaluationTimeline {
  phase: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "completed" | "delayed";
  milestones: {
    name: string;
    dueDate: Date;
    completed: boolean;
    completedAt?: Date;
  }[];
}

// Main SchoolEvaluation interface
export interface ISchoolEvaluation extends Document {
  _id: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  evaluationCode: string; // Unique identifier
  evaluationRound: number; // 1, 2, 3, etc.

  // Basic Information
  initiatedBy: mongoose.Types.ObjectId;
  assignedEvaluators: mongoose.Types.ObjectId[];
  leadEvaluator: mongoose.Types.ObjectId;

  // Status and Timeline
  status: EvaluationStatus;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  timeline: EvaluationTimeline[];

  // Evaluation Components
  categories: EvaluationCategory[];
  overallScore: number;
  maxOverallScore: number;
  overallRating: EvaluationRating;

  // Documentation
  requiredDocuments: string[];
  submittedDocuments: DocumentSubmission[];
  documentCompletionPercentage: number;

  // Visits and Inspections
  visits: VisitSchedule[];

  // Action Items and Recommendations
  actionItems: ActionItem[];
  recommendations: string[];

  // Decision and Approval
  evaluationSummary: string;
  decision: "approved" | "conditional_approval" | "rejected" | "pending";
  decisionDate?: Date;
  decisionBy?: mongoose.Types.ObjectId;
  decisionReason: string;
  conditions: string[]; // For conditional approval

  // Follow-up
  nextEvaluationDate?: Date;
  followUpRequired: boolean;
  followUpItems: string[];

  // Compliance and Certification
  complianceScore: number;
  certificationLevel: "basic" | "standard" | "premium" | "none";
  certificationValidUntil?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;

  // Methods
  calculateOverallScore(): number;
  updateStatus(newStatus: EvaluationStatus): void;
  addActionItem(actionItem: Omit<ActionItem, "_id" | "createdAt">): void;
  completeActionItem(
    actionItemId: mongoose.Types.ObjectId,
    evidence?: string[]
  ): void;
  getCompletionPercentage(): number;
  generateEvaluationReport(): object;
}

// Schema definition
const EvaluationCriterionSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  rating: {
    type: Number,
    enum: Object.values(EvaluationRating).filter((v) => typeof v === "number"),
    required: true,
  },
  score: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, min: 0 },
  comments: { type: String, default: "" },
  evidence: [{ type: String }],
  evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  evaluatedAt: { type: Date, required: true },
});

const EvaluationCategorySchema = new Schema({
  category: {
    type: String,
    enum: Object.values(EvaluationCategory),
    required: true,
  },
  criteria: [EvaluationCriterionSchema],
  overallRating: {
    type: Number,
    enum: Object.values(EvaluationRating).filter((v) => typeof v === "number"),
    required: true,
  },
  totalScore: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, min: 0 },
  weightage: { type: Number, required: true, min: 0, max: 1 },
  recommendations: [{ type: String }],
});

const DocumentSubmissionSchema = new Schema({
  documentType: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  verificationComments: { type: String },
});

const VisitScheduleSchema = new Schema({
  visitType: {
    type: String,
    enum: ["initial", "follow_up", "final"],
    required: true,
  },
  scheduledDate: { type: Date, required: true },
  duration: { type: Number, required: true, min: 1 },
  evaluators: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  agenda: [{ type: String }],
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled", "rescheduled"],
    default: "scheduled",
  },
  completedAt: { type: Date },
  visitReport: { type: String },
});

const ActionItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: Object.values(EvaluationCategory),
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: true,
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "overdue"],
    default: "pending",
  },
  completedAt: { type: Date },
  completionEvidence: [{ type: String }],
  comments: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const EvaluationTimelineSchema = new Schema({
  phase: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["upcoming", "active", "completed", "delayed"],
    default: "upcoming",
  },
  milestones: [
    {
      name: { type: String, required: true },
      dueDate: { type: Date, required: true },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
    },
  ],
});

const SchoolEvaluationSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    evaluationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    evaluationRound: { type: Number, required: true, min: 1 },

    // Basic Information
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedEvaluators: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    leadEvaluator: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Status and Timeline
    status: {
      type: String,
      enum: Object.values(EvaluationStatus),
      default: EvaluationStatus.PENDING,
      index: true,
    },
    startDate: { type: Date, required: true },
    expectedEndDate: { type: Date, required: true },
    actualEndDate: { type: Date },
    timeline: [EvaluationTimelineSchema],

    // Evaluation Components
    categories: [EvaluationCategorySchema],
    overallScore: { type: Number, default: 0, min: 0 },
    maxOverallScore: { type: Number, default: 100, min: 0 },
    overallRating: {
      type: Number,
      enum: Object.values(EvaluationRating).filter(
        (v) => typeof v === "number"
      ),
      default: EvaluationRating.NEEDS_IMPROVEMENT,
    },

    // Documentation
    requiredDocuments: [{ type: String }],
    submittedDocuments: [DocumentSubmissionSchema],
    documentCompletionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Visits and Inspections
    visits: [VisitScheduleSchema],

    // Action Items and Recommendations
    actionItems: [ActionItemSchema],
    recommendations: [{ type: String }],

    // Decision and Approval
    evaluationSummary: { type: String, default: "" },
    decision: {
      type: String,
      enum: ["approved", "conditional_approval", "rejected", "pending"],
      default: "pending",
    },
    decisionDate: { type: Date },
    decisionBy: { type: Schema.Types.ObjectId, ref: "User" },
    decisionReason: { type: String, default: "" },
    conditions: [{ type: String }],

    // Follow-up
    nextEvaluationDate: { type: Date },
    followUpRequired: { type: Boolean, default: false },
    followUpItems: [{ type: String }],

    // Compliance and Certification
    complianceScore: { type: Number, default: 0, min: 0, max: 100 },
    certificationLevel: {
      type: String,
      enum: ["basic", "standard", "premium", "none"],
      default: "none",
    },
    certificationValidUntil: { type: Date },

    // Metadata
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    indexes: [
      { schoolId: 1, evaluationRound: 1 },
      { status: 1, createdAt: -1 },
      { leadEvaluator: 1, status: 1 },
      { "actionItems.assignedTo": 1, "actionItems.status": 1 },
    ],
  }
);

// Methods
SchoolEvaluationSchema.methods.calculateOverallScore = function (): number {
  let totalWeightedScore = 0;
  let totalWeightage = 0;

  this.categories.forEach((category: any) => {
    totalWeightedScore +=
      (category.totalScore / category.maxScore) * category.weightage * 100;
    totalWeightage += category.weightage;
  });

  this.overallScore =
    totalWeightage > 0 ? totalWeightedScore / totalWeightage : 0;
  return this.overallScore;
};

SchoolEvaluationSchema.methods.updateStatus = function (
  newStatus: EvaluationStatus
): void {
  this.status = newStatus;

  // Update timeline phases
  const now = new Date();
  this.timeline.forEach((phase: any) => {
    if (phase.endDate < now && phase.status !== "completed") {
      phase.status = "delayed";
    }
  });
};

SchoolEvaluationSchema.methods.addActionItem = function (
  actionItem: Omit<ActionItem, "_id" | "createdAt">
): void {
  this.actionItems.push({
    ...actionItem,
    createdAt: new Date(),
  });
};

SchoolEvaluationSchema.methods.completeActionItem = function (
  actionItemId: mongoose.Types.ObjectId,
  evidence?: string[]
): void {
  const actionItem = this.actionItems.id(actionItemId);
  if (actionItem) {
    actionItem.status = "completed";
    actionItem.completedAt = new Date();
    if (evidence) {
      actionItem.completionEvidence = evidence;
    }
  }
};

SchoolEvaluationSchema.methods.getCompletionPercentage = function (): number {
  const totalItems = this.actionItems.length;
  if (totalItems === 0) return 100;

  const completedItems = this.actionItems.filter(
    (item: any) => item.status === "completed"
  ).length;
  return Math.round((completedItems / totalItems) * 100);
};

SchoolEvaluationSchema.methods.generateEvaluationReport = function (): object {
  return {
    evaluationCode: this.evaluationCode,
    schoolName: this.schoolId?.name || "Unknown School",
    overallScore: this.overallScore,
    overallRating: this.overallRating,
    decision: this.decision,
    categories: this.categories.map((cat: any) => ({
      category: cat.category,
      score: cat.totalScore,
      maxScore: cat.maxScore,
      rating: cat.overallRating,
      recommendations: cat.recommendations,
    })),
    actionItemsCompleted: this.getCompletionPercentage(),
    certificationLevel: this.certificationLevel,
    generatedAt: new Date(),
  };
};

// Pre-save middleware
SchoolEvaluationSchema.pre("save", function (next) {
  // Calculate document completion percentage
  if (this.requiredDocuments.length > 0) {
    const verifiedDocs = this.submittedDocuments.filter(
      (doc) => doc.verificationStatus === "verified"
    ).length;
    this.documentCompletionPercentage = Math.round(
      (verifiedDocs / this.requiredDocuments.length) * 100
    );
  }

  // Update overall rating based on score
  if (this.overallScore >= 85) this.overallRating = EvaluationRating.EXCELLENT;
  else if (this.overallScore >= 70) this.overallRating = EvaluationRating.GOOD;
  else if (this.overallScore >= 55)
    this.overallRating = EvaluationRating.SATISFACTORY;
  else if (this.overallScore >= 40)
    this.overallRating = EvaluationRating.NEEDS_IMPROVEMENT;
  else this.overallRating = EvaluationRating.POOR;

  // Update compliance score and certification level
  this.complianceScore = this.overallScore;
  if (this.complianceScore >= 85) this.certificationLevel = "premium";
  else if (this.complianceScore >= 70) this.certificationLevel = "standard";
  else if (this.complianceScore >= 55) this.certificationLevel = "basic";
  else this.certificationLevel = "none";

  next();
});

export const SchoolEvaluation = mongoose.model<ISchoolEvaluation>(
  "SchoolEvaluation",
  SchoolEvaluationSchema
);
export default SchoolEvaluation;
