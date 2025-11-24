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

export interface IStudent extends Document {
  roll_no?: string;
  aadharNumber?: string;
  name: string;
  age: number;
  gender: string;
  class: string;
  caste?: string;
  mobileNumber?: string;
  school: mongoose.Types.ObjectId;
  contactInfo: IGuardianInfo[];
  knowledgeLevel: IKnowledgeLevel[];
  cohort: ICohort[];

  // Progress flags
  progressHistory: IProgressHistory[];

  // Additional tracking
  lastAssessmentDate?: Date;

  // Archive flag
  isArchived: boolean;
  archivedAt?: Date;

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

  // Additional tracking
  lastAssessmentDate: { type: Date },

  // Archive flag
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },

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

// Pre-save middleware to update timestamps
StudentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Student = mongoose.model<IStudent>("Student", StudentSchema);
export default Student;
