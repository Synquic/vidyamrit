import mongoose, { Document } from "mongoose";

export type CohortStatus = 'active' | 'pending' | 'completed' | 'archived';

export interface ICohort extends Document {
  name: string;
  schoolId: mongoose.Types.ObjectId;
  tutorId?: mongoose.Types.ObjectId; // Made optional
  programId?: mongoose.Types.ObjectId; // Reference to program
  currentLevel: number; // Current level the cohort is working on
  startDate: Date; // When the cohort started
  estimatedCompletionDate?: Date; // Calculated based on program timeline
  status: CohortStatus; // Status of the cohort (active, pending, completed, archived)
  students: Array<{
    _id: string;
  }>;
  attendance: Array<{
    date: Date;
    studentId: mongoose.Types.ObjectId;
    status: string;
  }>;
  progress: Array<{
    studentId: mongoose.Types.ObjectId;
    currentLevel: number;
    status: string;
    lastUpdated: Date;
    failureCount: number;
    lastAssessmentDate: Date;
    assessmentHistory: Array<{
      date: Date;
      level: number;
      passed: boolean;
      status: string;
      score?: number;
      responses?: any;
    }>;
  }>;
  // Time-based progress tracking
  timeTracking: {
    cohortStartDate: Date;
    currentLevelStartDate: Date;
    attendanceDays: number; // Total days with attendance recorded
    expectedDaysForCurrentLevel: number; // Expected days based on program timeframe (can be adjusted)
    totalExpectedDays: number; // Total days for entire program (recalculated based on adjustments)
    levelAdjustments?: {
      [levelNumber: number]: {
        originalDays: number;
        adjustedDays: number;
        adjustmentDate: Date;
        reason?: string;
      };
    };
  };
  // Level progress tracking - tracks adjusted durations and completed days per level
  levelProgress?: {
    [levelNumber: number]: {
      originalDaysRequired: number; // Original days from program (weeks * 6)
      adjustedDaysRequired: number; // Adjusted total days (can exceed original)
      completedDays: number; // Count of days marked as completed
      completedDates: Date[]; // Array of dates that were marked as teaching days
      isCompleted: boolean; // Whether this level is marked as complete
      completedAt?: Date; // When level was marked complete
      lastUpdated: Date;
    };
  };
  // Holidays - dates when teaching doesn't happen (Sundays are automatically excluded)
  holidays?: Date[]; // Array of holiday dates
  createdAt: Date;
  updatedAt: Date;
}

const LevelAdjustmentSchema = new mongoose.Schema({
  originalDays: { type: Number, required: true },
  adjustedDays: { type: Number, required: true },
  adjustmentDate: { type: Date, required: true, default: Date.now },
  reason: { type: String, required: false },
}, { _id: false });

const LevelProgressSchema = new mongoose.Schema({
  originalDaysRequired: { type: Number, required: true },
  adjustedDaysRequired: { type: Number, required: true },
  completedDays: { type: Number, default: 0 },
  completedDates: [{ type: Date }],
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, required: false },
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

const TimeTrackingSchema = new mongoose.Schema({
  cohortStartDate: { type: Date, required: false }, // Optional - cohort can be created without start date
  currentLevelStartDate: { type: Date, required: false }, // Optional - set when cohort starts
  attendanceDays: { type: Number, default: 0 },
  expectedDaysForCurrentLevel: { type: Number, default: 0 },
  totalExpectedDays: { type: Number, default: 0 },
  levelAdjustments: {
    type: Map,
    of: LevelAdjustmentSchema,
    default: {},
  },
});

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  status: { type: String, enum: ["present", "absent"], required: true },
});

const ProgressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  currentLevel: { type: Number, required: true },
  status: {
    type: String,
    enum: ["yellow", "orange", "red", "green"], // Green indicates successful progression
    default: "green",
  },
  lastUpdated: { type: Date, default: Date.now },
  failureCount: { type: Number, default: 0 }, // Number of consecutive assessment failures
  lastAssessmentDate: { type: Date }, // Date of last assessment
  assessmentHistory: [{
    date: { type: Date, required: true },
    level: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    status: { type: String, enum: ["yellow", "orange", "red", "green"], required: true },
    score: { type: Number }, // Assessment score percentage
    responses: { type: mongoose.Schema.Types.Mixed } // Store assessment responses
  }]
});

const CohortSchema = new mongoose.Schema({
  name: { type: String, required: true },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Made optional - cohorts can exist without tutors
    validate: {
      validator: async function (value: mongoose.Types.ObjectId | null | undefined) {
        if (!value) return true; // Allow null/undefined
        const User = mongoose.model("User");
        const user = await User.findById(value);
        return user && ["tutor", "super_admin"].includes(user.role);
      },
      message: "tutorId must reference a user with role TUTOR or SUPER_ADMIN",
    },
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: false, // Optional for backward compatibility
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1,
  },
  startDate: {
    type: Date,
    required: false, // Optional - cohort can be created without start date
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'completed', 'archived'],
    default: 'active',
  },
  estimatedCompletionDate: {
    type: Date,
    required: false,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  ],
  attendance: [AttendanceSchema],
  progress: [ProgressSchema],
  timeTracking: {
    type: TimeTrackingSchema,
    required: false, // Optional for backward compatibility
  },
  levelProgress: {
    type: Map,
    of: LevelProgressSchema,
    default: {},
  },
  holidays: [{
    type: Date,
    required: false,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Cohort = mongoose.model<ICohort>("Cohort", CohortSchema);
export default Cohort;
