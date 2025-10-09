import mongoose, { Document, Schema } from "mongoose";

// Enums for onboarding process
export enum OnboardingStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ON_HOLD = "on_hold",
  CANCELLED = "cancelled",
}

export enum OnboardingStepStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SKIPPED = "skipped",
  BLOCKED = "blocked",
}

export enum OnboardingPhase {
  INITIAL_SETUP = "initial_setup",
  DOCUMENTATION = "documentation",
  INFRASTRUCTURE_SETUP = "infrastructure_setup",
  STAFF_TRAINING = "staff_training",
  SYSTEM_INTEGRATION = "system_integration",
  PILOT_TESTING = "pilot_testing",
  GO_LIVE = "go_live",
  POST_LAUNCH_SUPPORT = "post_launch_support",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Sub-interfaces for onboarding components
interface OnboardingTask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  instructions: string[];
  phase: OnboardingPhase;
  priority: TaskPriority;
  estimatedDuration: number; // in hours
  dependencies: string[]; // task IDs this depends on
  assignedTo: mongoose.Types.ObjectId[];
  status: OnboardingStepStatus;
  startDate?: Date;
  dueDate: Date;
  completedDate?: Date;
  completionPercentage: number;
  completionEvidence: string[];
  blockers: string[];
  comments: {
    userId: mongoose.Types.ObjectId;
    comment: string;
    timestamp: Date;
  }[];
  resources: {
    name: string;
    type: "document" | "video" | "link" | "software";
    url: string;
    description?: string;
  }[];
}

interface OnboardingMilestone {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  phase: OnboardingPhase;
  targetDate: Date;
  completedDate?: Date;
  isCompleted: boolean;
  completionCriteria: string[];
  signOffRequired: boolean;
  signOffBy?: mongoose.Types.ObjectId[];
  signedOffBy?: {
    userId: mongoose.Types.ObjectId;
    signedAt: Date;
    comments?: string;
  }[];
}

interface TrainingSession {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: "online" | "in_person" | "hybrid";
  scheduledDate: Date;
  duration: number; // in hours
  trainer: mongoose.Types.ObjectId;
  attendees: {
    userId: mongoose.Types.ObjectId;
    registrationStatus: "registered" | "attended" | "missed" | "excused";
    completionScore?: number;
    feedback?: string;
  }[];
  materials: {
    name: string;
    type: "presentation" | "manual" | "video" | "assessment";
    url: string;
  }[];
  prerequisites: string[];
  learningObjectives: string[];
  assessmentRequired: boolean;
  certificationAwarded: boolean;
}

interface SystemSetup {
  component: string;
  description: string;
  configurationSteps: string[];
  status: OnboardingStepStatus;
  assignedTo: mongoose.Types.ObjectId;
  estimatedHours: number;
  actualHours?: number;
  testingRequired: boolean;
  testingCompleted: boolean;
  signOffRequired: boolean;
  signedOff: boolean;
  rollbackPlan: string;
}

interface QualityGate {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  criteria: {
    criterion: string;
    requirement: string;
    status: "pending" | "met" | "not_met";
    evidence?: string;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
  }[];
  overallStatus: "pending" | "passed" | "failed";
  approver: mongoose.Types.ObjectId;
  approvedDate?: Date;
  comments?: string;
}

interface SupportTicket {
  _id?: mongoose.Types.ObjectId;
  ticketNumber: string;
  title: string;
  description: string;
  category: "technical" | "training" | "process" | "other";
  priority: TaskPriority;
  status: "open" | "in_progress" | "resolved" | "closed";
  reportedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  satisfaction?: number; // 1-5 rating
}

// Main SchoolOnboarding interface
export interface ISchoolOnboarding extends Document {
  _id: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  onboardingCode: string; // Unique identifier

  // Basic Information
  initiatedBy: mongoose.Types.ObjectId;
  projectManager: mongoose.Types.ObjectId;
  onboardingTeam: mongoose.Types.ObjectId[];
  schoolContacts: {
    role: string;
    userId: mongoose.Types.ObjectId;
    primary: boolean;
  }[];

  // Status and Timeline
  status: OnboardingStatus;
  startDate: Date;
  plannedEndDate: Date;
  actualEndDate?: Date;
  currentPhase: OnboardingPhase;

  // Onboarding Components
  tasks: OnboardingTask[];
  milestones: OnboardingMilestone[];
  qualityGates: QualityGate[];

  // Training and Support
  trainingSessions: TrainingSession[];
  systemSetups: SystemSetup[];
  supportTickets: SupportTicket[];

  // Progress Tracking
  overallProgress: number; // 0-100%
  phaseProgress: {
    phase: OnboardingPhase;
    progress: number;
    status: OnboardingStepStatus;
  }[];

  // Resources and Documentation
  onboardingDocuments: {
    name: string;
    type: string;
    url: string;
    version: string;
    uploadedAt: Date;
    uploadedBy: mongoose.Types.ObjectId;
  }[];

  // Communication and Updates
  communications: {
    type: "email" | "meeting" | "call" | "message";
    subject: string;
    content: string;
    participants: mongoose.Types.ObjectId[];
    timestamp: Date;
    followUpRequired: boolean;
    followUpDate?: Date;
  }[];

  // Risk Management
  risks: {
    description: string;
    impact: "low" | "medium" | "high";
    probability: "low" | "medium" | "high";
    mitigation: string;
    owner: mongoose.Types.ObjectId;
    status: "open" | "mitigated" | "closed";
  }[];

  // Success Metrics
  successCriteria: string[];
  kpis: {
    name: string;
    target: number;
    actual?: number;
    unit: string;
    achieved: boolean;
  }[];

  // Post-Launch
  goLiveDate?: Date;
  stabilizationPeriod: number; // days after go-live
  postLaunchSupport: {
    supportLevel: "basic" | "standard" | "premium";
    supportUntil: Date;
    contactPerson: mongoose.Types.ObjectId;
  };

  // Feedback and Evaluation
  schoolFeedback: {
    category: string;
    rating: number; // 1-5
    comments: string;
    submittedBy: mongoose.Types.ObjectId;
    submittedAt: Date;
  }[];

  overallSatisfaction?: number; // 1-5
  lessonsLearned: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateOverallProgress(): number;
  updatePhaseProgress(): void;
  addTask(task: Omit<OnboardingTask, "_id">): void;
  completeTask(taskId: mongoose.Types.ObjectId, evidence?: string[]): void;
  createSupportTicket(
    ticket: Omit<SupportTicket, "_id" | "ticketNumber" | "createdAt">
  ): void;
  generateOnboardingReport(): object;
  checkQualityGates(): boolean;
  getBlockedTasks(): OnboardingTask[];
  getUpcomingDeadlines(days: number): OnboardingTask[];
}

// Schema definitions
const OnboardingTaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: [{ type: String }],
  phase: {
    type: String,
    enum: Object.values(OnboardingPhase),
    required: true,
  },
  priority: {
    type: String,
    enum: Object.values(TaskPriority),
    required: true,
  },
  estimatedDuration: { type: Number, required: true, min: 0 },
  dependencies: [{ type: String }],
  assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: {
    type: String,
    enum: Object.values(OnboardingStepStatus),
    default: OnboardingStepStatus.PENDING,
  },
  startDate: { type: Date },
  dueDate: { type: Date, required: true },
  completedDate: { type: Date },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  completionEvidence: [{ type: String }],
  blockers: [{ type: String }],
  comments: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      comment: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  resources: [
    {
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ["document", "video", "link", "software"],
        required: true,
      },
      url: { type: String, required: true },
      description: { type: String },
    },
  ],
});

const OnboardingMilestoneSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  phase: {
    type: String,
    enum: Object.values(OnboardingPhase),
    required: true,
  },
  targetDate: { type: Date, required: true },
  completedDate: { type: Date },
  isCompleted: { type: Boolean, default: false },
  completionCriteria: [{ type: String }],
  signOffRequired: { type: Boolean, default: false },
  signOffBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  signedOffBy: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      signedAt: { type: Date, required: true },
      comments: { type: String },
    },
  ],
});

const TrainingSessionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["online", "in_person", "hybrid"],
    required: true,
  },
  scheduledDate: { type: Date, required: true },
  duration: { type: Number, required: true, min: 0 },
  trainer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  attendees: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      registrationStatus: {
        type: String,
        enum: ["registered", "attended", "missed", "excused"],
        default: "registered",
      },
      completionScore: { type: Number, min: 0, max: 100 },
      feedback: { type: String },
    },
  ],
  materials: [
    {
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ["presentation", "manual", "video", "assessment"],
        required: true,
      },
      url: { type: String, required: true },
    },
  ],
  prerequisites: [{ type: String }],
  learningObjectives: [{ type: String }],
  assessmentRequired: { type: Boolean, default: false },
  certificationAwarded: { type: Boolean, default: false },
});

const SystemSetupSchema = new Schema({
  component: { type: String, required: true },
  description: { type: String, required: true },
  configurationSteps: [{ type: String }],
  status: {
    type: String,
    enum: Object.values(OnboardingStepStatus),
    default: OnboardingStepStatus.PENDING,
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  estimatedHours: { type: Number, required: true, min: 0 },
  actualHours: { type: Number, min: 0 },
  testingRequired: { type: Boolean, default: true },
  testingCompleted: { type: Boolean, default: false },
  signOffRequired: { type: Boolean, default: true },
  signedOff: { type: Boolean, default: false },
  rollbackPlan: { type: String, required: true },
});

const QualityGateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  criteria: [
    {
      criterion: { type: String, required: true },
      requirement: { type: String, required: true },
      status: {
        type: String,
        enum: ["pending", "met", "not_met"],
        default: "pending",
      },
      evidence: { type: String },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verifiedAt: { type: Date },
    },
  ],
  overallStatus: {
    type: String,
    enum: ["pending", "passed", "failed"],
    default: "pending",
  },
  approver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approvedDate: { type: Date },
  comments: { type: String },
});

const SupportTicketSchema = new Schema({
  ticketNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["technical", "training", "process", "other"],
    required: true,
  },
  priority: {
    type: String,
    enum: Object.values(TaskPriority),
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open",
  },
  reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  resolution: { type: String },
  satisfaction: { type: Number, min: 1, max: 5 },
});

const SchoolOnboardingSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true,
      index: true,
    },
    onboardingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Basic Information
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    onboardingTeam: [{ type: Schema.Types.ObjectId, ref: "User" }],
    schoolContacts: [
      {
        role: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        primary: { type: Boolean, default: false },
      },
    ],

    // Status and Timeline
    status: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.NOT_STARTED,
      index: true,
    },
    startDate: { type: Date, required: true },
    plannedEndDate: { type: Date, required: true },
    actualEndDate: { type: Date },
    currentPhase: {
      type: String,
      enum: Object.values(OnboardingPhase),
      default: OnboardingPhase.INITIAL_SETUP,
    },

    // Onboarding Components
    tasks: [OnboardingTaskSchema],
    milestones: [OnboardingMilestoneSchema],
    qualityGates: [QualityGateSchema],

    // Training and Support
    trainingSessions: [TrainingSessionSchema],
    systemSetups: [SystemSetupSchema],
    supportTickets: [SupportTicketSchema],

    // Progress Tracking
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    phaseProgress: [
      {
        phase: {
          type: String,
          enum: Object.values(OnboardingPhase),
          required: true,
        },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        status: {
          type: String,
          enum: Object.values(OnboardingStepStatus),
          default: OnboardingStepStatus.PENDING,
        },
      },
    ],

    // Resources and Documentation
    onboardingDocuments: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        url: { type: String, required: true },
        version: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],

    // Communication and Updates
    communications: [
      {
        type: {
          type: String,
          enum: ["email", "meeting", "call", "message"],
          required: true,
        },
        subject: { type: String, required: true },
        content: { type: String, required: true },
        participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
        timestamp: { type: Date, default: Date.now },
        followUpRequired: { type: Boolean, default: false },
        followUpDate: { type: Date },
      },
    ],

    // Risk Management
    risks: [
      {
        description: { type: String, required: true },
        impact: {
          type: String,
          enum: ["low", "medium", "high"],
          required: true,
        },
        probability: {
          type: String,
          enum: ["low", "medium", "high"],
          required: true,
        },
        mitigation: { type: String, required: true },
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
          type: String,
          enum: ["open", "mitigated", "closed"],
          default: "open",
        },
      },
    ],

    // Success Metrics
    successCriteria: [{ type: String }],
    kpis: [
      {
        name: { type: String, required: true },
        target: { type: Number, required: true },
        actual: { type: Number },
        unit: { type: String, required: true },
        achieved: { type: Boolean, default: false },
      },
    ],

    // Post-Launch
    goLiveDate: { type: Date },
    stabilizationPeriod: { type: Number, default: 30 },
    postLaunchSupport: {
      supportLevel: {
        type: String,
        enum: ["basic", "standard", "premium"],
        default: "standard",
      },
      supportUntil: { type: Date },
      contactPerson: { type: Schema.Types.ObjectId, ref: "User" },
    },

    // Feedback and Evaluation
    schoolFeedback: [
      {
        category: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String, required: true },
        submittedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        submittedAt: { type: Date, default: Date.now },
      },
    ],

    overallSatisfaction: { type: Number, min: 1, max: 5 },
    lessonsLearned: [{ type: String }],
  },
  {
    timestamps: true,
    indexes: [
      { status: 1, currentPhase: 1 },
      { projectManager: 1, status: 1 },
      { "tasks.assignedTo": 1, "tasks.status": 1 },
      { startDate: 1, plannedEndDate: 1 },
    ],
  }
);

// Methods
SchoolOnboardingSchema.methods.calculateOverallProgress = function (): number {
  const totalTasks = this.tasks.length;
  if (totalTasks === 0) return 0;

  const completedTasks = this.tasks.filter(
    (task: any) => task.status === OnboardingStepStatus.COMPLETED
  ).length;
  const inProgressTasks = this.tasks.filter(
    (task: any) => task.status === OnboardingStepStatus.IN_PROGRESS
  );

  let progressSum = completedTasks * 100;
  inProgressTasks.forEach((task: any) => {
    progressSum += task.completionPercentage;
  });

  this.overallProgress = Math.round(progressSum / totalTasks);
  return this.overallProgress;
};

SchoolOnboardingSchema.methods.updatePhaseProgress = function (): void {
  const phases = Object.values(OnboardingPhase);

  phases.forEach((phase) => {
    const phaseTasks = this.tasks.filter((task: any) => task.phase === phase);
    if (phaseTasks.length === 0) return;

    const completedTasks = phaseTasks.filter(
      (task: any) => task.status === OnboardingStepStatus.COMPLETED
    ).length;
    const phaseProgress = Math.round(
      (completedTasks / phaseTasks.length) * 100
    );

    let phaseStatus = OnboardingStepStatus.PENDING;
    if (phaseProgress === 100) phaseStatus = OnboardingStepStatus.COMPLETED;
    else if (phaseProgress > 0) phaseStatus = OnboardingStepStatus.IN_PROGRESS;

    const existingPhaseProgress = this.phaseProgress.find(
      (p: any) => p.phase === phase
    );
    if (existingPhaseProgress) {
      existingPhaseProgress.progress = phaseProgress;
      existingPhaseProgress.status = phaseStatus;
    } else {
      this.phaseProgress.push({
        phase,
        progress: phaseProgress,
        status: phaseStatus,
      });
    }
  });
};

SchoolOnboardingSchema.methods.addTask = function (
  task: Omit<OnboardingTask, "_id">
): void {
  this.tasks.push(task);
  this.updatePhaseProgress();
};

SchoolOnboardingSchema.methods.completeTask = function (
  taskId: mongoose.Types.ObjectId,
  evidence?: string[]
): void {
  const task = this.tasks.id(taskId);
  if (task) {
    task.status = OnboardingStepStatus.COMPLETED;
    task.completedDate = new Date();
    task.completionPercentage = 100;
    if (evidence) {
      task.completionEvidence = evidence;
    }
    this.updatePhaseProgress();
    this.calculateOverallProgress();
  }
};

SchoolOnboardingSchema.methods.createSupportTicket = function (
  ticket: Omit<SupportTicket, "_id" | "ticketNumber" | "createdAt">
): void {
  const ticketNumber = `ONBD-${this.onboardingCode}-${
    this.supportTickets.length + 1
  }`;
  this.supportTickets.push({
    ...ticket,
    ticketNumber,
    createdAt: new Date(),
  });
};

SchoolOnboardingSchema.methods.generateOnboardingReport = function (): object {
  return {
    onboardingCode: this.onboardingCode,
    schoolName: this.schoolId?.name || "Unknown School",
    status: this.status,
    overallProgress: this.overallProgress,
    currentPhase: this.currentPhase,
    startDate: this.startDate,
    plannedEndDate: this.plannedEndDate,
    actualEndDate: this.actualEndDate,
    phaseProgress: this.phaseProgress,
    tasksCompleted: this.tasks.filter(
      (task: any) => task.status === OnboardingStepStatus.COMPLETED
    ).length,
    totalTasks: this.tasks.length,
    milestonesCompleted: this.milestones.filter((m: any) => m.isCompleted)
      .length,
    totalMilestones: this.milestones.length,
    openSupportTickets: this.supportTickets.filter(
      (t: any) => t.status === "open"
    ).length,
    overallSatisfaction: this.overallSatisfaction,
    generatedAt: new Date(),
  };
};

SchoolOnboardingSchema.methods.checkQualityGates = function (): boolean {
  return this.qualityGates.every(
    (gate: any) => gate.overallStatus === "passed"
  );
};

SchoolOnboardingSchema.methods.getBlockedTasks = function (): OnboardingTask[] {
  return this.tasks.filter(
    (task: any) => task.status === OnboardingStepStatus.BLOCKED
  );
};

SchoolOnboardingSchema.methods.getUpcomingDeadlines = function (
  days: number
): OnboardingTask[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  return this.tasks.filter(
    (task: any) =>
      task.status !== OnboardingStepStatus.COMPLETED &&
      task.dueDate <= cutoffDate
  );
};

// Pre-save middleware
SchoolOnboardingSchema.pre("save", function (next) {
  // Auto-generate onboarding code if not set
  if (!this.onboardingCode) {
    const schoolCode = this.schoolId.toString().slice(-6).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.onboardingCode = `ONB-${schoolCode}-${timestamp}`;
  }

  // Update progress calculations
  this.calculateOverallProgress();
  this.updatePhaseProgress();

  // Update current phase based on progress
  const phases = Object.values(OnboardingPhase);
  for (const phase of phases) {
    const phaseProgress = this.phaseProgress.find(
      (p: any) => p.phase === phase
    );
    if (
      phaseProgress &&
      phaseProgress.status === OnboardingStepStatus.IN_PROGRESS
    ) {
      this.currentPhase = phase;
      break;
    }
  }

  // Update overall status based on progress
  if (this.overallProgress === 100) {
    this.status = OnboardingStatus.COMPLETED;
    if (!this.actualEndDate) {
      this.actualEndDate = new Date();
    }
  } else if (this.overallProgress > 0) {
    this.status = OnboardingStatus.IN_PROGRESS;
  }

  next();
});

export const SchoolOnboarding = mongoose.model<ISchoolOnboarding>(
  "SchoolOnboarding",
  SchoolOnboardingSchema
);
export default SchoolOnboarding;
