import mongoose, { Schema, Document } from "mongoose";

export type Specialization =
  | "hindi"
  | "math"
  | "english"
  | "general"
  | "remedial"
  | "advanced";
export type PerformanceRating = 1 | 2 | 3 | 4 | 5;
export type AssignmentStatus = "active" | "completed" | "on_hold" | "cancelled";

export interface IQualification {
  degree: string;
  institution: string;
  year: number;
  grade?: string;
}

export interface IExperience {
  role: string;
  organization: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isCurrent: boolean;
}

export interface IPerformanceMetric {
  period: string; // e.g., "2024-Q1", "January 2024"
  studentsAssigned: number;
  averageStudentImprovement: number; // percentage
  attendanceRate: number; // percentage
  assessmentCompletionRate: number; // percentage
  parentSatisfactionScore?: number; // 1-5 scale
  adminRating?: PerformanceRating;
  notes?: string;
  createdAt: Date;
}

export interface IAssignment {
  type: "student" | "group" | "cohort";
  targetId: mongoose.Types.ObjectId; // Student, Group, or Cohort ID
  targetName: string;
  subject?: Specialization;
  startDate: Date;
  endDate?: Date;
  status: AssignmentStatus;
  priority: "low" | "medium" | "high";
  notes?: string;
  goals?: string[];
  progress?: number; // 0-100 percentage
}

export interface ICertification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  verificationUrl?: string;
}

export interface IAvailability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
}

export interface IMentorProfile extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User
  personalInfo: {
    dateOfBirth?: Date;
    address?: string;
    emergencyContact?: {
      name: string;
      relation: string;
      phone: string;
    };
    languages: string[];
    profilePicture?: string;
  };
  professionalInfo: {
    employeeId?: string;
    joinDate: Date;
    department?: string;
    position: string;
    salary?: number;
    workType: "full_time" | "part_time" | "contract" | "volunteer";
    specializations: Specialization[];
    maxStudents: number; // Maximum students they can handle
    currentStudents: number; // Current number of assigned students
  };
  qualifications: IQualification[];
  experience: IExperience[];
  certifications: ICertification[];
  performanceMetrics: IPerformanceMetric[];
  assignments: IAssignment[];
  availability: IAvailability[];
  preferences: {
    preferredSubjects: Specialization[];
    preferredStudentLevels: number[]; // 1-5 assessment levels
    maxClassSize?: number;
    teachingStyle?: string;
    communicationPreferences: string[];
  };
  skills: {
    technicalSkills: string[];
    softSkills: string[];
    languageProficiency: {
      language: string;
      level: "basic" | "intermediate" | "advanced" | "native";
    }[];
  };
  feedback: {
    fromStudents: {
      rating: number;
      comment?: string;
      date: Date;
      studentId: mongoose.Types.ObjectId;
    }[];
    fromParents: {
      rating: number;
      comment?: string;
      date: Date;
      studentId: mongoose.Types.ObjectId;
    }[];
    fromAdmins: {
      rating: number;
      comment?: string;
      date: Date;
      adminId: mongoose.Types.ObjectId;
    }[];
  };
  status: "active" | "inactive" | "on_leave" | "probation" | "terminated";
  createdAt: Date;
  updatedAt: Date;
}

const QualificationSchema = new Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  year: { type: Number, required: true },
  grade: { type: String },
});

const ExperienceSchema = new Schema({
  role: { type: String, required: true },
  organization: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
  isCurrent: { type: Boolean, default: false },
});

const PerformanceMetricSchema = new Schema({
  period: { type: String, required: true },
  studentsAssigned: { type: Number, required: true, min: 0 },
  averageStudentImprovement: { type: Number, required: true, min: 0, max: 100 },
  attendanceRate: { type: Number, required: true, min: 0, max: 100 },
  assessmentCompletionRate: { type: Number, required: true, min: 0, max: 100 },
  parentSatisfactionScore: { type: Number, min: 1, max: 5 },
  adminRating: { type: Number, min: 1, max: 5 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const AssignmentSchema = new Schema({
  type: { type: String, enum: ["student", "group", "cohort"], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetName: { type: String, required: true },
  subject: {
    type: String,
    enum: ["hindi", "math", "english", "general", "remedial", "advanced"],
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["active", "completed", "on_hold", "cancelled"],
    default: "active",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  notes: { type: String },
  goals: [{ type: String }],
  progress: { type: Number, min: 0, max: 100, default: 0 },
});

const CertificationSchema = new Schema({
  name: { type: String, required: true },
  issuingOrganization: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date },
  credentialId: { type: String },
  verificationUrl: { type: String },
});

const AvailabilitySchema = new Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
});

const FeedbackSchema = new Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  date: { type: Date, default: Date.now },
});

const MentorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    personalInfo: {
      dateOfBirth: { type: Date },
      address: { type: String },
      emergencyContact: {
        name: { type: String },
        relation: { type: String },
        phone: { type: String },
      },
      languages: [{ type: String }],
      profilePicture: { type: String },
    },
    professionalInfo: {
      employeeId: { type: String, unique: true, sparse: true },
      joinDate: { type: Date, required: true },
      department: { type: String },
      position: { type: String, required: true },
      salary: { type: Number, min: 0 },
      workType: {
        type: String,
        enum: ["full_time", "part_time", "contract", "volunteer"],
        required: true,
      },
      specializations: [
        {
          type: String,
          enum: ["hindi", "math", "english", "general", "remedial", "advanced"],
        },
      ],
      maxStudents: { type: Number, required: true, min: 1, default: 20 },
      currentStudents: { type: Number, default: 0, min: 0 },
    },
    qualifications: [QualificationSchema],
    experience: [ExperienceSchema],
    certifications: [CertificationSchema],
    performanceMetrics: [PerformanceMetricSchema],
    assignments: [AssignmentSchema],
    availability: [AvailabilitySchema],
    preferences: {
      preferredSubjects: [
        {
          type: String,
          enum: ["hindi", "math", "english", "general", "remedial", "advanced"],
        },
      ],
      preferredStudentLevels: [{ type: Number, min: 1, max: 5 }],
      maxClassSize: { type: Number, min: 1 },
      teachingStyle: { type: String },
      communicationPreferences: [{ type: String }],
    },
    skills: {
      technicalSkills: [{ type: String }],
      softSkills: [{ type: String }],
      languageProficiency: [
        {
          language: { type: String, required: true },
          level: {
            type: String,
            enum: ["basic", "intermediate", "advanced", "native"],
            required: true,
          },
        },
      ],
    },
    feedback: {
      fromStudents: [
        FeedbackSchema.add({
          studentId: {
            type: Schema.Types.ObjectId,
            ref: "Student",
            required: true,
          },
        }),
      ],
      fromParents: [
        FeedbackSchema.add({
          studentId: {
            type: Schema.Types.ObjectId,
            ref: "Student",
            required: true,
          },
        }),
      ],
      fromAdmins: [
        FeedbackSchema.add({
          adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        }),
      ],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "probation", "terminated"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MentorProfileSchema.index({ userId: 1 }, { unique: true });
MentorProfileSchema.index({ "professionalInfo.specializations": 1 });
MentorProfileSchema.index({ status: 1 });
MentorProfileSchema.index({ "professionalInfo.employeeId": 1 });
MentorProfileSchema.index({ "assignments.status": 1 });

// Virtual for overall rating
MentorProfileSchema.virtual("overallRating").get(function () {
  const allFeedback = [
    ...this.feedback.fromStudents,
    ...this.feedback.fromParents,
    ...this.feedback.fromAdmins,
  ];

  if (allFeedback.length === 0) return 0;

  const totalRating = allFeedback.reduce(
    (sum, feedback) => sum + feedback.rating,
    0
  );
  return parseFloat((totalRating / allFeedback.length).toFixed(2));
});

// Virtual for workload percentage
MentorProfileSchema.virtual("workloadPercentage").get(function () {
  return Math.round(
    (this.professionalInfo.currentStudents /
      this.professionalInfo.maxStudents) *
      100
  );
});

// Pre-save middleware
MentorProfileSchema.pre("save", function (next) {
  // Update current students count based on active assignments
  const activeStudentAssignments = this.assignments.filter(
    (assignment) =>
      assignment.type === "student" && assignment.status === "active"
  );
  this.professionalInfo.currentStudents = activeStudentAssignments.length;

  next();
});

export default mongoose.model<IMentorProfile>(
  "MentorProfile",
  MentorProfileSchema
);
