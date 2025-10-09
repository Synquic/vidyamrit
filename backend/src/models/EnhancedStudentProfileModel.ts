import mongoose, { Document, Schema } from "mongoose";

// Enums for enhanced student management
export enum StudentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  GRADUATED = "graduated",
  TRANSFERRED = "transferred",
  DROPPED_OUT = "dropped_out",
  SUSPENDED = "suspended",
}

export enum LearningStyle {
  VISUAL = "visual",
  AUDITORY = "auditory",
  KINESTHETIC = "kinesthetic",
  READING_WRITING = "reading_writing",
  MULTIMODAL = "multimodal",
}

export enum SpecialNeed {
  NONE = "none",
  DYSLEXIA = "dyslexia",
  ADHD = "adhd",
  AUTISM = "autism",
  HEARING_IMPAIRED = "hearing_impaired",
  VISUAL_IMPAIRED = "visual_impaired",
  PHYSICAL_DISABILITY = "physical_disability",
  INTELLECTUAL_DISABILITY = "intellectual_disability",
  EMOTIONAL_BEHAVIORAL = "emotional_behavioral",
  SPEECH_LANGUAGE = "speech_language",
  OTHER = "other",
}

export enum AcademicLevel {
  BEGINNER = "beginner",
  ELEMENTARY = "elementary",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  PROFICIENT = "proficient",
}

export enum RelationshipType {
  FATHER = "father",
  MOTHER = "mother",
  GUARDIAN = "guardian",
  GRANDFATHER = "grandfather",
  GRANDMOTHER = "grandmother",
  UNCLE = "uncle",
  AUNT = "aunt",
  SIBLING = "sibling",
  OTHER = "other",
}

// Sub-interfaces for student profile components
interface ParentGuardianInfo {
  _id?: mongoose.Types.ObjectId;
  name: string;
  relationship: RelationshipType;
  phoneNumber: string;
  email?: string;
  occupation?: string;
  education?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  emergencyContact: boolean;
  primaryContact: boolean;
  canPickup: boolean;
  communicationPreferences: {
    sms: boolean;
    email: boolean;
    phone: boolean;
    app: boolean;
  };
  notes?: string;
}

interface AcademicRecord {
  _id?: mongoose.Types.ObjectId;
  academicYear: string;
  term: string;
  subjects: {
    name: string;
    code?: string;
    teacher?: mongoose.Types.ObjectId;
    grades: {
      assessmentType: string;
      score: number;
      maxScore: number;
      percentage: number;
      grade: string;
      date: Date;
      remarks?: string;
    }[];
    attendance: {
      totalClasses: number;
      attendedClasses: number;
      attendancePercentage: number;
    };
    finalGrade: string;
    finalPercentage: number;
    remarks?: string;
  }[];
  overallGPA: number;
  overallPercentage: number;
  rank?: number;
  totalStudents?: number;
  promotionStatus: "promoted" | "detained" | "conditionally_promoted";
  achievements: string[];
  disciplinaryActions: {
    date: Date;
    type: string;
    description: string;
    action: string;
    resolvedDate?: Date;
  }[];
}

interface LearningPreferences {
  learningStyle: LearningStyle;
  preferredLanguage: string;
  studyTimePreference: "morning" | "afternoon" | "evening" | "night";
  groupVsIndividual: "group" | "individual" | "mixed";
  motivationFactors: string[];
  challenges: string[];
  strengths: string[];
  interests: string[];
  careerAspirations: string[];
}

interface HealthInformation {
  bloodGroup?: string;
  allergies: string[];
  medicalConditions: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy: string;
    startDate: Date;
    endDate?: Date;
  }[];
  emergencyMedicalInfo?: string;
  doctorContact?: {
    name: string;
    phone: string;
    hospital?: string;
  };
  lastMedicalCheckup?: Date;
  vaccinations: {
    name: string;
    date: Date;
    nextDue?: Date;
  }[];
}

interface SpecialNeedsSupport {
  identifiedNeeds: SpecialNeed[];
  assessmentDate?: Date;
  assessedBy?: string;
  supportRequired: string[];
  accommodations: string[];
  assistiveTechnology: string[];
  therapies: {
    type: string;
    provider: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    progress: string;
  }[];
  iepGoals: {
    goal: string;
    targetDate: Date;
    status: "not_started" | "in_progress" | "achieved" | "modified";
    progress: string;
  }[];
  reviewDate?: Date;
}

interface ExtracurricularActivity {
  _id?: mongoose.Types.ObjectId;
  activityName: string;
  category:
    | "sports"
    | "arts"
    | "academic"
    | "community_service"
    | "leadership"
    | "other";
  role?: string;
  startDate: Date;
  endDate?: Date;
  hoursPerWeek?: number;
  achievements: string[];
  skills: string[];
  mentor?: mongoose.Types.ObjectId;
  description?: string;
}

interface BehavioralRecord {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  type: "positive" | "negative" | "neutral";
  category: "academic" | "social" | "emotional" | "behavioral";
  description: string;
  action: string;
  reportedBy: mongoose.Types.ObjectId;
  severity?: "low" | "medium" | "high";
  followUpRequired: boolean;
  followUpDate?: Date;
  parentNotified: boolean;
  resolved: boolean;
  resolutionDate?: Date;
  resolutionNotes?: string;
}

interface CommunicationLog {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  type: "meeting" | "phone_call" | "email" | "sms" | "app_message" | "note";
  participants: {
    name: string;
    role: string;
    userId?: mongoose.Types.ObjectId;
  }[];
  subject: string;
  content: string;
  purpose:
    | "academic"
    | "behavioral"
    | "health"
    | "administrative"
    | "social"
    | "other";
  followUpRequired: boolean;
  followUpDate?: Date;
  attachments: string[];
  confidential: boolean;
}

interface AssessmentHistory {
  _id?: mongoose.Types.ObjectId;
  assessmentType:
    | "baseline"
    | "diagnostic"
    | "formative"
    | "summative"
    | "standardized";
  subject: string;
  assessmentName: string;
  date: Date;
  score: number;
  maxScore: number;
  percentage: number;
  level: AcademicLevel;
  skills: {
    skillName: string;
    mastery:
      | "not_attempted"
      | "developing"
      | "approaching"
      | "proficient"
      | "advanced";
    score?: number;
    notes?: string;
  }[];
  recommendations: string[];
  conductedBy: mongoose.Types.ObjectId;
  nextAssessmentDate?: Date;
}

interface TransferHistory {
  _id?: mongoose.Types.ObjectId;
  fromSchool?: {
    name: string;
    address: string;
    lastClass: string;
    transferDate: Date;
    reason: string;
    documents: string[];
  };
  toSchool?: {
    name: string;
    address: string;
    admissionDate: Date;
    reason: string;
    documents: string[];
  };
  status: "transfer_in" | "transfer_out" | "internal_transfer";
  approvedBy?: mongoose.Types.ObjectId;
  notes?: string;
}

// Main EnhancedStudentProfile interface
export interface IEnhancedStudentProfile extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId; // Reference to base Student model

  // Personal Information (extended)
  status: StudentStatus;
  admissionNumber: string;
  admissionDate: Date;
  previousEducation?: {
    schoolName: string;
    lastClass: string;
    percentage: number;
    documents: string[];
  };

  // Family Information
  parentsGuardians: ParentGuardianInfo[];
  familyBackground: {
    familyIncome?:
      | "below_1_lakh"
      | "1_3_lakh"
      | "3_5_lakh"
      | "5_10_lakh"
      | "above_10_lakh";
    familySize: number;
    homeEnvironment: string;
    languagesSpokenAtHome: string[];
    studySupport: "excellent" | "good" | "average" | "poor" | "none";
  };

  // Academic Information (comprehensive)
  academicRecords: AcademicRecord[];
  currentLevel: AcademicLevel;
  learningPreferences: LearningPreferences;
  assessmentHistory: AssessmentHistory[];

  // Health and Special Needs
  healthInformation: HealthInformation;
  specialNeedsSupport?: SpecialNeedsSupport;

  // Activities and Behavior
  extracurricularActivities: ExtracurricularActivity[];
  behavioralRecords: BehavioralRecord[];

  // Communication and Tracking
  communicationLogs: CommunicationLog[];
  transferHistory: TransferHistory[];

  // Goals and Development
  academicGoals: {
    shortTerm: {
      goal: string;
      targetDate: Date;
      status: "not_started" | "in_progress" | "achieved" | "modified";
      progress: number;
    }[];
    longTerm: {
      goal: string;
      targetDate: Date;
      status: "not_started" | "in_progress" | "achieved" | "modified";
      progress: number;
    }[];
  };

  personalDevelopmentGoals: {
    social: string[];
    emotional: string[];
    behavioral: string[];
    physical: string[];
  };

  // Analytics and Insights
  performanceMetrics: {
    academicTrend: "improving" | "stable" | "declining";
    attendanceTrend: "improving" | "stable" | "declining";
    behaviorTrend: "improving" | "stable" | "declining";
    engagementLevel: "high" | "medium" | "low";
    riskFactors: string[];
    strengths: string[];
    recommendations: string[];
    lastAnalyzed: Date;
  };

  // Intervention Tracking
  interventions: {
    _id?: mongoose.Types.ObjectId;
    type: "academic" | "behavioral" | "social" | "health" | "family";
    description: string;
    startDate: Date;
    endDate?: Date;
    provider: mongoose.Types.ObjectId;
    frequency: string;
    goals: string[];
    progress: {
      date: Date;
      notes: string;
      effectiveness:
        | "very_effective"
        | "effective"
        | "somewhat_effective"
        | "not_effective";
    }[];
    status: "active" | "completed" | "discontinued";
    outcome?: string;
  }[];

  // Privacy and Permissions
  privacySettings: {
    shareAcademicInfo: boolean;
    shareBehavioralInfo: boolean;
    shareHealthInfo: boolean;
    shareContactInfo: boolean;
    allowPhotography: boolean;
    allowSocialMedia: boolean;
    emergencyContactConsent: boolean;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: mongoose.Types.ObjectId;

  // Methods
  calculateGPA(academicYear?: string): number;
  getAttendanceOverview(period?: string): object;
  getBehavioralSummary(period?: string): object;
  getAcademicProgress(subject?: string): object;
  addCommunicationLog(log: Omit<CommunicationLog, "_id">): void;
  updatePerformanceMetrics(): void;
  getUpcomingGoals(): object[];
  generateStudentReport(
    type: "comprehensive" | "academic" | "behavioral"
  ): object;
}

// Schema definitions
const ParentGuardianSchema = new Schema({
  name: { type: String, required: true },
  relationship: {
    type: String,
    enum: Object.values(RelationshipType),
    required: true,
  },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  occupation: { type: String },
  education: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: "India" },
  },
  emergencyContact: { type: Boolean, default: false },
  primaryContact: { type: Boolean, default: false },
  canPickup: { type: Boolean, default: true },
  communicationPreferences: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    phone: { type: Boolean, default: true },
    app: { type: Boolean, default: true },
  },
  notes: { type: String },
});

const AcademicRecordSchema = new Schema({
  academicYear: { type: String, required: true },
  term: { type: String, required: true },
  subjects: [
    {
      name: { type: String, required: true },
      code: { type: String },
      teacher: { type: Schema.Types.ObjectId, ref: "User" },
      grades: [
        {
          assessmentType: { type: String, required: true },
          score: { type: Number, required: true },
          maxScore: { type: Number, required: true },
          percentage: { type: Number, required: true },
          grade: { type: String, required: true },
          date: { type: Date, required: true },
          remarks: { type: String },
        },
      ],
      attendance: {
        totalClasses: { type: Number, default: 0 },
        attendedClasses: { type: Number, default: 0 },
        attendancePercentage: { type: Number, default: 0 },
      },
      finalGrade: { type: String },
      finalPercentage: { type: Number },
      remarks: { type: String },
    },
  ],
  overallGPA: { type: Number, default: 0 },
  overallPercentage: { type: Number, default: 0 },
  rank: { type: Number },
  totalStudents: { type: Number },
  promotionStatus: {
    type: String,
    enum: ["promoted", "detained", "conditionally_promoted"],
    default: "promoted",
  },
  achievements: [{ type: String }],
  disciplinaryActions: [
    {
      date: { type: Date, required: true },
      type: { type: String, required: true },
      description: { type: String, required: true },
      action: { type: String, required: true },
      resolvedDate: { type: Date },
    },
  ],
});

const LearningPreferencesSchema = new Schema({
  learningStyle: {
    type: String,
    enum: Object.values(LearningStyle),
    default: LearningStyle.MULTIMODAL,
  },
  preferredLanguage: { type: String, default: "Hindi" },
  studyTimePreference: {
    type: String,
    enum: ["morning", "afternoon", "evening", "night"],
    default: "evening",
  },
  groupVsIndividual: {
    type: String,
    enum: ["group", "individual", "mixed"],
    default: "mixed",
  },
  motivationFactors: [{ type: String }],
  challenges: [{ type: String }],
  strengths: [{ type: String }],
  interests: [{ type: String }],
  careerAspirations: [{ type: String }],
});

const HealthInformationSchema = new Schema({
  bloodGroup: { type: String },
  allergies: [{ type: String }],
  medicalConditions: [{ type: String }],
  medications: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      prescribedBy: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
    },
  ],
  emergencyMedicalInfo: { type: String },
  doctorContact: {
    name: { type: String },
    phone: { type: String },
    hospital: { type: String },
  },
  lastMedicalCheckup: { type: Date },
  vaccinations: [
    {
      name: { type: String, required: true },
      date: { type: Date, required: true },
      nextDue: { type: Date },
    },
  ],
});

const ExtracurricularActivitySchema = new Schema({
  activityName: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "sports",
      "arts",
      "academic",
      "community_service",
      "leadership",
      "other",
    ],
    required: true,
  },
  role: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  hoursPerWeek: { type: Number },
  achievements: [{ type: String }],
  skills: [{ type: String }],
  mentor: { type: Schema.Types.ObjectId, ref: "User" },
  description: { type: String },
});

const BehavioralRecordSchema = new Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ["positive", "negative", "neutral"],
    required: true,
  },
  category: {
    type: String,
    enum: ["academic", "social", "emotional", "behavioral"],
    required: true,
  },
  description: { type: String, required: true },
  action: { type: String, required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
  },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  parentNotified: { type: Boolean, default: false },
  resolved: { type: Boolean, default: false },
  resolutionDate: { type: Date },
  resolutionNotes: { type: String },
});

const CommunicationLogSchema = new Schema({
  date: { type: Date, required: true, default: Date.now },
  type: {
    type: String,
    enum: ["meeting", "phone_call", "email", "sms", "app_message", "note"],
    required: true,
  },
  participants: [
    {
      name: { type: String, required: true },
      role: { type: String, required: true },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],
  subject: { type: String, required: true },
  content: { type: String, required: true },
  purpose: {
    type: String,
    enum: [
      "academic",
      "behavioral",
      "health",
      "administrative",
      "social",
      "other",
    ],
    required: true,
  },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  attachments: [{ type: String }],
  confidential: { type: Boolean, default: false },
});

const AssessmentHistorySchema = new Schema({
  assessmentType: {
    type: String,
    enum: ["baseline", "diagnostic", "formative", "summative", "standardized"],
    required: true,
  },
  subject: { type: String, required: true },
  assessmentName: { type: String, required: true },
  date: { type: Date, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  level: {
    type: String,
    enum: Object.values(AcademicLevel),
    required: true,
  },
  skills: [
    {
      skillName: { type: String, required: true },
      mastery: {
        type: String,
        enum: [
          "not_attempted",
          "developing",
          "approaching",
          "proficient",
          "advanced",
        ],
        required: true,
      },
      score: { type: Number },
      notes: { type: String },
    },
  ],
  recommendations: [{ type: String }],
  conductedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  nextAssessmentDate: { type: Date },
});

const EnhancedStudentProfileSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
      index: true,
    },

    // Personal Information
    status: {
      type: String,
      enum: Object.values(StudentStatus),
      default: StudentStatus.ACTIVE,
      index: true,
    },
    admissionNumber: { type: String, required: true, unique: true },
    admissionDate: { type: Date, required: true },
    previousEducation: {
      schoolName: { type: String },
      lastClass: { type: String },
      percentage: { type: Number },
      documents: [{ type: String }],
    },

    // Family Information
    parentsGuardians: [ParentGuardianSchema],
    familyBackground: {
      familyIncome: {
        type: String,
        enum: [
          "below_1_lakh",
          "1_3_lakh",
          "3_5_lakh",
          "5_10_lakh",
          "above_10_lakh",
        ],
      },
      familySize: { type: Number, default: 4 },
      homeEnvironment: { type: String },
      languagesSpokenAtHome: [{ type: String }],
      studySupport: {
        type: String,
        enum: ["excellent", "good", "average", "poor", "none"],
        default: "average",
      },
    },

    // Academic Information
    academicRecords: [AcademicRecordSchema],
    currentLevel: {
      type: String,
      enum: Object.values(AcademicLevel),
      default: AcademicLevel.BEGINNER,
    },
    learningPreferences: LearningPreferencesSchema,
    assessmentHistory: [AssessmentHistorySchema],

    // Health and Special Needs
    healthInformation: HealthInformationSchema,
    specialNeedsSupport: {
      identifiedNeeds: [
        {
          type: String,
          enum: Object.values(SpecialNeed),
          default: SpecialNeed.NONE,
        },
      ],
      assessmentDate: { type: Date },
      assessedBy: { type: String },
      supportRequired: [{ type: String }],
      accommodations: [{ type: String }],
      assistiveTechnology: [{ type: String }],
      therapies: [
        {
          type: { type: String, required: true },
          provider: { type: String, required: true },
          frequency: { type: String, required: true },
          startDate: { type: Date, required: true },
          endDate: { type: Date },
          progress: { type: String },
        },
      ],
      iepGoals: [
        {
          goal: { type: String, required: true },
          targetDate: { type: Date, required: true },
          status: {
            type: String,
            enum: ["not_started", "in_progress", "achieved", "modified"],
            default: "not_started",
          },
          progress: { type: String },
        },
      ],
      reviewDate: { type: Date },
    },

    // Activities and Behavior
    extracurricularActivities: [ExtracurricularActivitySchema],
    behavioralRecords: [BehavioralRecordSchema],

    // Communication and Tracking
    communicationLogs: [CommunicationLogSchema],
    transferHistory: [
      {
        fromSchool: {
          name: { type: String },
          address: { type: String },
          lastClass: { type: String },
          transferDate: { type: Date },
          reason: { type: String },
          documents: [{ type: String }],
        },
        toSchool: {
          name: { type: String },
          address: { type: String },
          admissionDate: { type: Date },
          reason: { type: String },
          documents: [{ type: String }],
        },
        status: {
          type: String,
          enum: ["transfer_in", "transfer_out", "internal_transfer"],
          required: true,
        },
        approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: { type: String },
      },
    ],

    // Goals and Development
    academicGoals: {
      shortTerm: [
        {
          goal: { type: String, required: true },
          targetDate: { type: Date, required: true },
          status: {
            type: String,
            enum: ["not_started", "in_progress", "achieved", "modified"],
            default: "not_started",
          },
          progress: { type: Number, default: 0, min: 0, max: 100 },
        },
      ],
      longTerm: [
        {
          goal: { type: String, required: true },
          targetDate: { type: Date, required: true },
          status: {
            type: String,
            enum: ["not_started", "in_progress", "achieved", "modified"],
            default: "not_started",
          },
          progress: { type: Number, default: 0, min: 0, max: 100 },
        },
      ],
    },

    personalDevelopmentGoals: {
      social: [{ type: String }],
      emotional: [{ type: String }],
      behavioral: [{ type: String }],
      physical: [{ type: String }],
    },

    // Analytics and Insights
    performanceMetrics: {
      academicTrend: {
        type: String,
        enum: ["improving", "stable", "declining"],
        default: "stable",
      },
      attendanceTrend: {
        type: String,
        enum: ["improving", "stable", "declining"],
        default: "stable",
      },
      behaviorTrend: {
        type: String,
        enum: ["improving", "stable", "declining"],
        default: "stable",
      },
      engagementLevel: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "medium",
      },
      riskFactors: [{ type: String }],
      strengths: [{ type: String }],
      recommendations: [{ type: String }],
      lastAnalyzed: { type: Date, default: Date.now },
    },

    // Intervention Tracking
    interventions: [
      {
        type: {
          type: String,
          enum: ["academic", "behavioral", "social", "health", "family"],
          required: true,
        },
        description: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        provider: { type: Schema.Types.ObjectId, ref: "User", required: true },
        frequency: { type: String, required: true },
        goals: [{ type: String }],
        progress: [
          {
            date: { type: Date, required: true },
            notes: { type: String, required: true },
            effectiveness: {
              type: String,
              enum: [
                "very_effective",
                "effective",
                "somewhat_effective",
                "not_effective",
              ],
              required: true,
            },
          },
        ],
        status: {
          type: String,
          enum: ["active", "completed", "discontinued"],
          default: "active",
        },
        outcome: { type: String },
      },
    ],

    // Privacy and Permissions
    privacySettings: {
      shareAcademicInfo: { type: Boolean, default: true },
      shareBehavioralInfo: { type: Boolean, default: true },
      shareHealthInfo: { type: Boolean, default: false },
      shareContactInfo: { type: Boolean, default: true },
      allowPhotography: { type: Boolean, default: true },
      allowSocialMedia: { type: Boolean, default: false },
      emergencyContactConsent: { type: Boolean, default: true },
    },

    // Metadata
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    indexes: [
      { studentId: 1 },
      { status: 1 },
      { admissionNumber: 1 },
      { "parentsGuardians.phoneNumber": 1 },
      { "academicRecords.academicYear": 1 },
      { "performanceMetrics.academicTrend": 1 },
      { "performanceMetrics.engagementLevel": 1 },
    ],
  }
);

// Methods
EnhancedStudentProfileSchema.methods.calculateGPA = function (
  academicYear?: string
): number {
  let records = this.academicRecords;
  if (academicYear) {
    records = records.filter(
      (record: any) => record.academicYear === academicYear
    );
  }

  if (records.length === 0) return 0;

  const totalGPA = records.reduce(
    (sum: number, record: any) => sum + record.overallGPA,
    0
  );
  return totalGPA / records.length;
};

EnhancedStudentProfileSchema.methods.getAttendanceOverview = function (
  period?: string
): object {
  // Implementation would calculate attendance from attendance records
  return {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    percentage: 0,
    trend: this.performanceMetrics.attendanceTrend,
  };
};

EnhancedStudentProfileSchema.methods.getBehavioralSummary = function (
  period?: string
): object {
  const records = this.behavioralRecords;
  const positive = records.filter((r: any) => r.type === "positive").length;
  const negative = records.filter((r: any) => r.type === "negative").length;
  const total = records.length;

  return {
    totalRecords: total,
    positiveRecords: positive,
    negativeRecords: negative,
    ratio: total > 0 ? positive / total : 0,
    trend: this.performanceMetrics.behaviorTrend,
  };
};

EnhancedStudentProfileSchema.methods.addCommunicationLog = function (
  log: Omit<CommunicationLog, "_id">
): void {
  this.communicationLogs.push(log);
};

EnhancedStudentProfileSchema.methods.updatePerformanceMetrics =
  function (): void {
    // Implementation would analyze trends and update metrics
    this.performanceMetrics.lastAnalyzed = new Date();
  };

EnhancedStudentProfileSchema.methods.getUpcomingGoals = function (): object[] {
  const upcoming = [];
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Get short-term goals due in next 30 days
  this.academicGoals.shortTerm.forEach((goal: any) => {
    if (goal.targetDate <= thirtyDaysFromNow && goal.status !== "achieved") {
      upcoming.push({ ...goal, type: "academic", term: "short" });
    }
  });

  return upcoming;
};

EnhancedStudentProfileSchema.methods.generateStudentReport = function (
  type: "comprehensive" | "academic" | "behavioral"
): object {
  const baseReport = {
    studentId: this.studentId,
    admissionNumber: this.admissionNumber,
    status: this.status,
    generatedAt: new Date(),
  };

  switch (type) {
    case "academic":
      return {
        ...baseReport,
        academicRecords: this.academicRecords,
        assessmentHistory: this.assessmentHistory,
        currentLevel: this.currentLevel,
        academicGoals: this.academicGoals,
      };
    case "behavioral":
      return {
        ...baseReport,
        behavioralRecords: this.behavioralRecords,
        behavioralSummary: this.getBehavioralSummary(),
        interventions: this.interventions,
      };
    default:
      return {
        ...baseReport,
        ...this.toObject(),
      };
  }
};

export const EnhancedStudentProfile = mongoose.model<IEnhancedStudentProfile>(
  "EnhancedStudentProfile",
  EnhancedStudentProfileSchema
);
export default EnhancedStudentProfile;
