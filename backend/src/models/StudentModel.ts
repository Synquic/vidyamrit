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
  roll_no: string;
  name: string;
  age: number;
  gender: string;
  class: string;
  caste: string;
  school: mongoose.Types.ObjectId;
  contactInfo: IGuardianInfo[];
  knowledgeLevel: IKnowledgeLevel[];
  cohort: ICohort[];

  // Assessment levels
  hindi_level?: number;
  math_level?: number;
  english_level?: number;

  // Progress flags
  currentProgressFlags: {
    hindi?: ProgressFlag;
    math?: ProgressFlag;
    english?: ProgressFlag;
  };
  progressHistory: IProgressHistory[];

  // Additional tracking
  lastAssessmentDate?: Date;
  totalAssessments: number;
  averagePerformance: number;

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
  roll_no: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  class: { type: String, required: true },
  caste: { type: String, required: true },
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

  // Assessment levels
  hindi_level: { type: Number, min: 1, max: 5, default: 1 },
  math_level: { type: Number, min: 1, max: 5, default: 1 },
  english_level: { type: Number, min: 1, max: 5, default: 1 },

  // Progress flags
  currentProgressFlags: {
    hindi: {
      type: String,
      enum: [
        "improving",
        "struggling",
        "excelling",
        "average",
        "needs_attention",
      ],
      default: "average",
    },
    math: {
      type: String,
      enum: [
        "improving",
        "struggling",
        "excelling",
        "average",
        "needs_attention",
      ],
      default: "average",
    },
    english: {
      type: String,
      enum: [
        "improving",
        "struggling",
        "excelling",
        "average",
        "needs_attention",
      ],
      default: "average",
    },
  },
  progressHistory: [ProgressHistorySchema],

  // Additional tracking
  lastAssessmentDate: { type: Date },
  totalAssessments: { type: Number, default: 0 },
  averagePerformance: { type: Number, default: 0, min: 0, max: 5 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient queries
StudentSchema.index({ school: 1, class: 1 });
StudentSchema.index({ roll_no: 1, school: 1 }, { unique: true });
StudentSchema.index({ "currentProgressFlags.hindi": 1 });
StudentSchema.index({ "currentProgressFlags.math": 1 });
StudentSchema.index({ "currentProgressFlags.english": 1 });

// Pre-save middleware to update timestamps
StudentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for overall progress flag
StudentSchema.virtual("overallProgressFlag").get(function () {
  const flags = Object.values(this.currentProgressFlags).filter((flag) => flag);
  if (flags.includes("struggling") || flags.includes("needs_attention"))
    return "needs_attention";
  if (flags.includes("excelling")) return "excelling";
  if (flags.includes("improving")) return "improving";
  return "average";
});

const Student = mongoose.model<IStudent>("Student", StudentSchema);
export default Student;
