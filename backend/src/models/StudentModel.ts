import mongoose, { Document } from "mongoose";

export type ProgressFlag =
  | "improving"
  | "struggling"
  | "excelling"
  | "average"
  | "needs_attention";
export type Subject = "hindi" | "math" | "english";

export interface IProgressHistory {
  flag: ProgressFlag;
  subject: Subject;
  reason: string;
  date: Date;
  mentorId?: mongoose.Types.ObjectId;
}

export interface IBaselineHistory {
  program: mongoose.Types.ObjectId;
  programName: string;
  subject: string;
  level: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean | null;
  date: Date;
  mentorId?: mongoose.Types.ObjectId;
}

export interface IStudent extends Document {
  roll_no?: string;
  aadharNumber?: string;
  apaarId?: string;
  name: string;
  age: number;
  gender: string;
  class: string;
  caste?: string;
  mobileNumber?: string;
  school: mongoose.Types.ObjectId;
  contactInfo: IGuardianInfo[];
  knowledgeLevel: IKnowledgeLevel[];
  fln: IFLN[];
  cohort: ICohort[];

  // Progress flags
  progressHistory: IProgressHistory[];

  // Baseline assessment history
  baselineHistory: IBaselineHistory[];

  // Additional tracking
  lastAssessmentDate?: Date;

  // Archive flag
  isArchived: boolean;
  archivedAt?: Date;

  // Hidden flag (see the query hooks at the bottom of this file)
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IGuardianInfo {
  name: string;
  relation: string;
  occupation: string;
  phone_no: string;
}

export interface IKnowledgeLevel {
  program: mongoose.Types.ObjectId; // Reference to Program
  programName: string; // Subject value from program (e.g., "Hindi")
  subject: string; // Subject value (same as programName for consistency)
  level: number;
  date: Date;
}

export interface IFLN {
  program: mongoose.Types.ObjectId;
  subject: string;
  source: "baseline" | "level_test";
  clearedAt: Date;
}

export interface ICohort {
  cohortId: mongoose.Types.ObjectId;
  dateJoined: Date;
  dateLeaved?: Date;
}

const ProgressHistorySchema = new mongoose.Schema({
  flag: {
    type: String,
    enum: [
      "improving",
      "struggling",
      "excelling",
      "average",
      "needs_attention",
    ],
    required: true,
  },
  subject: {
    type: String,
    enum: ["hindi", "math", "english"],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
});

const StudentSchema = new mongoose.Schema({
  roll_no: { type: String, required: false },
  aadharNumber: { type: String, required: false },
  apaarId: { type: String, required: false },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  class: { type: String, required: true },
  caste: { type: String, required: false },
  mobileNumber: { type: String, required: false },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  contactInfo: [
    {
      name: { type: String, required: true },
      relation: { type: String, required: true },
      occupation: { type: String, required: false },
      phone_no: { type: String, required: false },
    },
  ],
  knowledgeLevel: [
    {
      program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
        required: true,
      },
      programName: { type: String, required: true, trim: true },
      subject: { type: String, required: true, trim: true },
      level: { type: Number, required: true },
      date: { type: Date, required: true },
    },
  ],
  fln: [
    {
      program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
      subject: { type: String, required: true, trim: true },
      source: { type: String, enum: ["baseline", "level_test"], default: "baseline" },
      clearedAt: { type: Date, default: Date.now },
    },
  ],
  cohort: [
    {
      cohortId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cohort",
        required: true,
      },
      dateJoined: { type: Date, required: true },
      dateLeaved: { type: Date, required: false },
    },
  ],

  // Progress flags
  progressHistory: [ProgressHistorySchema],

  // Baseline assessment history
  baselineHistory: [
    {
      program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
      programName: { type: String, required: true, trim: true },
      subject: { type: String, required: true, trim: true },
      level: { type: Number, required: true },
      score: { type: Number, required: true },
      totalQuestions: { type: Number, required: true },
      correctAnswers: { type: Number, required: true },
      passed: { type: Boolean, default: null },
      date: { type: Date, default: Date.now },
      mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    },
  ],

  // Additional tracking
  lastAssessmentDate: { type: Date },

  // Archive flag — student moves to the "Inactive" tab, still visible in
  // cohorts and reports (with an "Inactive" badge).
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },

  // Hidden flag — the record stays in the database but disappears from the
  // whole app. Set from the Inactive tab; see the query hooks below.
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient queries
StudentSchema.index({ school: 1, class: 1 });
// Unique index for roll_no and school combination
StudentSchema.index({ roll_no: 1, school: 1 }, { unique: true });
// Index for knowledgeLevel queries
StudentSchema.index({ "knowledgeLevel.program": 1 });
StudentSchema.index({ "knowledgeLevel.subject": 1 });
StudentSchema.index({ isDeleted: 1 });

// Deleted students are hidden from every read, everywhere in the app, instead
// of each caller remembering to filter. Student is queried from ~8 controllers
// and services; filtering per call site would eventually miss one and leak a
// deleted student into a cohort or report.
//
// Pass { includeDeleted: true } via setOptions() to opt out — needed wherever a
// query must see the whole collection, such as the roll_no uniqueness check
// (a deleted student still occupies its roll_no in the unique index).
//
// Note: isArchived is deliberately untouched here. Archived students keep
// showing in cohorts and reports with their "Inactive" badge, as before.
function excludeDeleted(this: any) {
  if (!this.getOptions?.().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
}

StudentSchema.pre(/^find/, excludeDeleted);
StudentSchema.pre("countDocuments", excludeDeleted);
StudentSchema.pre("distinct", excludeDeleted);
StudentSchema.pre("aggregate", function (this: any) {
  if (!this.options?.includeDeleted) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  }
});

// Pre-save middleware to update timestamps
StudentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Student = mongoose.model<IStudent>("Student", StudentSchema);
export default Student;
