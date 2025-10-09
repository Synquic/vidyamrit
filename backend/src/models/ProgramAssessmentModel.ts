import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./UserModel";
import { ISchool } from "./SchoolModel";
import { IStudent } from "./StudentModel";
import { IProgram, IAssessmentQuestion } from "./ProgramModel";

// Enum for assessment status
export enum AssessmentStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
}

// Interface for individual question response
export interface IQuestionResponse {
  questionId: string;
  levelNumber: number;
  questionText: string;
  userAnswer: string | boolean | number;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  attempts: number;
  pointsEarned: number;
  timestamp: Date;
}

// Interface for level assessment data
export interface ILevelAssessment {
  levelNumber: number;
  questionsAnswered: number;
  correctAnswers: number;
  totalPoints: number;
  timeSpent: number; // in seconds
  stabilityCount: number; // How many consecutive questions at this level
  isStable: boolean; // Whether the student is stable at this level
}

// Interface for oscillation tracking
export interface IOscillationPattern {
  levels: [number, number]; // The two levels being oscillated between
  cycles: number; // Number of complete oscillation cycles
  questionsInPattern: number; // Total questions in this pattern
  detected: boolean; // Whether oscillation has been detected
}

// Interface for baseline assessment algorithm state
export interface IBaselineAlgorithmState {
  currentLevel: number;
  correctStreak: number;
  wrongStreak: number;
  highPerformanceStreak: number;
  levelHistory: number[]; // History of levels visited
  questionsAtCurrentLevel: number;
  oscillationPattern: IOscillationPattern | null;
  shouldStop: boolean; // Whether the algorithm determines assessment should stop
  stopReason: string; // Reason for stopping
}

// Interface for Program Assessment Document
export interface IProgramAssessment extends Document {
  // Basic Information
  student: mongoose.Types.ObjectId | IStudent;
  school: mongoose.Types.ObjectId | ISchool;
  mentor: mongoose.Types.ObjectId | IUser;
  program: mongoose.Types.ObjectId | IProgram;

  // Assessment Configuration
  subject: string; // From program
  randomizeQuestions: boolean;
  maxQuestionsPerLevel: number;
  oscillationTolerance: number;
  minQuestionsBeforeOscillationStop: number;

  // Assessment State
  status: AssessmentStatus;
  startTime: Date;
  endTime?: Date;
  totalDuration: number; // in seconds

  // Questions and Responses
  questionPool: IAssessmentQuestion[]; // Randomized questions from program
  responses: IQuestionResponse[];
  currentQuestionIndex: number;

  // Level Assessment Data
  levelAssessments: ILevelAssessment[];

  // Baseline Algorithm State
  algorithmState: IBaselineAlgorithmState;

  // Final Results
  finalLevel: number;
  totalQuestions: number;
  totalCorrectAnswers: number;
  accuracy: number; // percentage
  averageTimePerQuestion: number; // in seconds

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Question Response Schema
const QuestionResponseSchema = new Schema<IQuestionResponse>({
  questionId: { type: String, required: true },
  levelNumber: { type: Number, required: true },
  questionText: { type: String, required: true },
  userAnswer: { type: Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, required: true, default: 0 },
  attempts: { type: Number, required: true, default: 1 },
  pointsEarned: { type: Number, required: true, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

// Level Assessment Schema
const LevelAssessmentSchema = new Schema<ILevelAssessment>({
  levelNumber: { type: Number, required: true },
  questionsAnswered: { type: Number, required: true, default: 0 },
  correctAnswers: { type: Number, required: true, default: 0 },
  totalPoints: { type: Number, required: true, default: 0 },
  timeSpent: { type: Number, required: true, default: 0 },
  stabilityCount: { type: Number, required: true, default: 0 },
  isStable: { type: Boolean, required: true, default: false },
});

// Oscillation Pattern Schema
const OscillationPatternSchema = new Schema<IOscillationPattern>({
  levels: {
    type: [Number],
    validate: {
      validator: function (v: number[]) {
        return Array.isArray(v) && v.length === 2;
      },
      message: "Levels must be an array of exactly 2 numbers",
    },
  },
  cycles: { type: Number, required: true, default: 0 },
  questionsInPattern: { type: Number, required: true, default: 0 },
  detected: { type: Boolean, required: true, default: false },
});

// Baseline Algorithm State Schema
const BaselineAlgorithmStateSchema = new Schema<IBaselineAlgorithmState>({
  currentLevel: { type: Number, required: true, default: 0 },
  correctStreak: { type: Number, required: true, default: 0 },
  wrongStreak: { type: Number, required: true, default: 0 },
  highPerformanceStreak: { type: Number, required: true, default: 0 },
  levelHistory: [{ type: Number }],
  questionsAtCurrentLevel: { type: Number, required: true, default: 0 },
  oscillationPattern: { type: OscillationPatternSchema, default: null },
  shouldStop: { type: Boolean, required: true, default: false },
  stopReason: { type: String, default: "" },
});

// Assessment Question Schema (reused from ProgramModel but without _id)
const AssessmentQuestionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["multiple_choice", "one_word_answer", "verbal_evaluation"],
      required: true,
    },
    options: [{ type: String }],
    correctOptionIndex: { type: Number },
    acceptedAnswers: [{ type: String }],
    points: { type: Number, default: 1 },
    isRequired: { type: Boolean, default: true },
    levelNumber: { type: Number, required: true }, // Track which level this question belongs to
  },
  { _id: true }
);

// Main Program Assessment Schema
const ProgramAssessmentSchema = new Schema<IProgramAssessment>(
  {
    // Basic Information
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    program: {
      type: Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },

    // Assessment Configuration
    subject: { type: String, required: true },
    randomizeQuestions: { type: Boolean, default: true },
    maxQuestionsPerLevel: { type: Number, default: 4 },
    oscillationTolerance: { type: Number, default: 2 },
    minQuestionsBeforeOscillationStop: { type: Number, default: 8 },

    // Assessment State
    status: {
      type: String,
      enum: Object.values(AssessmentStatus),
      default: AssessmentStatus.IN_PROGRESS,
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    totalDuration: { type: Number, default: 0 },

    // Questions and Responses
    questionPool: [AssessmentQuestionSchema],
    responses: [QuestionResponseSchema],
    currentQuestionIndex: { type: Number, default: 0 },

    // Level Assessment Data
    levelAssessments: [LevelAssessmentSchema],

    // Baseline Algorithm State
    algorithmState: {
      type: BaselineAlgorithmStateSchema,
      default: () => ({
        currentLevel: 0,
        correctStreak: 0,
        wrongStreak: 0,
        highPerformanceStreak: 0,
        levelHistory: [0],
        questionsAtCurrentLevel: 0,
        oscillationPattern: null,
        shouldStop: false,
        stopReason: "",
      }),
    },

    // Final Results
    finalLevel: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalCorrectAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }, // percentage
    averageTimePerQuestion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Instance Methods

// Method to add a question response and update algorithm state
ProgramAssessmentSchema.methods.addResponse = function (
  questionId: string,
  levelNumber: number,
  questionText: string,
  userAnswer: string | boolean | number,
  isCorrect: boolean,
  timeSpent: number,
  pointsEarned: number
): void {
  const response: IQuestionResponse = {
    questionId,
    levelNumber,
    questionText,
    userAnswer,
    isCorrect,
    timeSpent,
    attempts: 1,
    pointsEarned,
    timestamp: new Date(),
  };

  this.responses.push(response);
  this.totalQuestions++;

  if (isCorrect) {
    this.totalCorrectAnswers++;
  }

  // Update accuracy
  this.accuracy = (this.totalCorrectAnswers / this.totalQuestions) * 100;

  // Update average time per question
  const totalTime = this.responses.reduce(
    (sum: number, r: IQuestionResponse) => sum + r.timeSpent,
    0
  );
  this.averageTimePerQuestion = totalTime / this.responses.length;

  // Update level assessment
  this.updateLevelAssessment(levelNumber, isCorrect, timeSpent, pointsEarned);
};

// Method to update level assessment data
ProgramAssessmentSchema.methods.updateLevelAssessment = function (
  levelNumber: number,
  isCorrect: boolean,
  timeSpent: number,
  pointsEarned: number
): void {
  let levelAssessment = this.levelAssessments.find(
    (la: ILevelAssessment) => la.levelNumber === levelNumber
  );

  if (!levelAssessment) {
    levelAssessment = {
      levelNumber,
      questionsAnswered: 0,
      correctAnswers: 0,
      totalPoints: 0,
      timeSpent: 0,
      stabilityCount: 0,
      isStable: false,
    };
    this.levelAssessments.push(levelAssessment);
  }

  levelAssessment.questionsAnswered++;
  levelAssessment.timeSpent += timeSpent;
  levelAssessment.totalPoints += pointsEarned;

  if (isCorrect) {
    levelAssessment.correctAnswers++;
  }

  // Update stability count
  if (this.algorithmState.currentLevel === levelNumber) {
    levelAssessment.stabilityCount++;
    levelAssessment.isStable =
      levelAssessment.stabilityCount >= this.maxQuestionsPerLevel;
  }
};

// Method to update baseline algorithm state
ProgramAssessmentSchema.methods.updateAlgorithmState = function (
  isCorrect: boolean
): void {
  const state = this.algorithmState;

  if (isCorrect) {
    state.correctStreak++;
    state.wrongStreak = 0;
    if (state.currentLevel >= 5) {
      state.highPerformanceStreak++;
    }
  } else {
    state.wrongStreak++;
    state.correctStreak = 0;
    state.highPerformanceStreak = 0;
  }

  state.questionsAtCurrentLevel++;
};

// Method to check for level progression
ProgramAssessmentSchema.methods.checkLevelProgression = function (): {
  shouldProgress: boolean;
  newLevel: number;
  reason: string;
} {
  const state = this.algorithmState;
  const currentLevel = state.currentLevel;
  let newLevel = currentLevel;
  let shouldProgress = false;
  let reason = "";

  // High performance progression
  if (
    state.highPerformanceStreak >= 3 &&
    currentLevel >= 6 &&
    currentLevel < 9
  ) {
    newLevel = currentLevel + 2;
    shouldProgress = true;
    reason = "High performance streak - skip level";
  }
  // Normal progression
  else if (state.correctStreak >= 2 && currentLevel < 9) {
    newLevel = currentLevel + 1;
    shouldProgress = true;
    reason = "Correct streak - advance level";
  }
  // Regression
  else if (state.wrongStreak >= 2 && currentLevel > 0) {
    newLevel = currentLevel - 1;
    shouldProgress = true;
    reason = "Wrong streak - go back level";
  }

  return { shouldProgress, newLevel, reason };
};

// Method to detect oscillation patterns
ProgramAssessmentSchema.methods.detectOscillation = function (): boolean {
  const history = this.algorithmState.levelHistory;

  if (history.length < 4) return false;

  // Check for simple oscillation (A -> B -> A -> B)
  const recent = history.slice(-6);

  if (recent.length >= 4) {
    const last4 = recent.slice(-4);
    const isSimpleOscillation =
      last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1];

    if (isSimpleOscillation) {
      const levels: [number, number] = [
        Math.min(last4[0], last4[1]),
        Math.max(last4[0], last4[1]),
      ];

      if (!this.algorithmState.oscillationPattern) {
        this.algorithmState.oscillationPattern = {
          levels,
          cycles: 0.5,
          questionsInPattern: 1,
          detected: true,
        };
      } else if (
        this.algorithmState.oscillationPattern.levels[0] === levels[0] &&
        this.algorithmState.oscillationPattern.levels[1] === levels[1]
      ) {
        this.algorithmState.oscillationPattern.cycles += 0.5;
        this.algorithmState.oscillationPattern.questionsInPattern++;
      }

      return true;
    }
  }

  return false;
};

// Method to check if assessment should stop
ProgramAssessmentSchema.methods.shouldStopAssessment = function (): {
  shouldStop: boolean;
  reason: string;
  finalLevel: number;
} {
  const state = this.algorithmState;
  const totalQuestions = this.totalQuestions;

  // Check various stopping conditions
  const hasMinQuestions =
    totalQuestions >= this.minQuestionsBeforeOscillationStop;
  const hasOscillationPattern =
    state.oscillationPattern &&
    state.oscillationPattern.cycles >= this.oscillationTolerance;
  const isStableAtLevel =
    this.levelAssessments.find(
      (la: ILevelAssessment) =>
        la.levelNumber === state.currentLevel && la.isStable
    ) && totalQuestions >= 12;
  const hasMaxPerformance =
    state.currentLevel === 9 &&
    state.correctStreak >= 2 &&
    totalQuestions >= 15;
  const hasMinPerformance =
    state.wrongStreak >= 4 && state.currentLevel === 0 && totalQuestions >= 10;
  const hasMaxQuestions = totalQuestions >= 35;
  const tooManyQuestionsAtLevel =
    state.questionsAtCurrentLevel >= this.maxQuestionsPerLevel * 2;

  // Simple bounce detection
  const recentHistory = state.levelHistory.slice(-4);
  const hasSimpleBounce =
    recentHistory.length >= 4 &&
    recentHistory[0] === recentHistory[2] &&
    recentHistory[1] === recentHistory[3] &&
    recentHistory[0] !== recentHistory[1] &&
    totalQuestions >= Math.max(4, this.minQuestionsBeforeOscillationStop - 2);

  let shouldStop = false;
  let reason = "";
  let finalLevel = state.currentLevel;

  if (hasMaxQuestions) {
    shouldStop = true;
    reason = "Maximum questions reached";
  } else if (hasMaxPerformance) {
    shouldStop = true;
    reason = "Maximum performance achieved";
  } else if (hasMinPerformance) {
    shouldStop = true;
    reason = "Minimum performance level";
  } else if (isStableAtLevel) {
    shouldStop = true;
    reason = "Stable at current level";
  } else if (hasMinQuestions && hasOscillationPattern) {
    shouldStop = true;
    reason = "Oscillation pattern detected";
    if (state.oscillationPattern) {
      finalLevel = state.oscillationPattern.levels[0]; // Lower level
    }
  } else if (hasMinQuestions && tooManyQuestionsAtLevel) {
    shouldStop = true;
    reason = "Too many questions at current level";
  } else if (hasSimpleBounce) {
    shouldStop = true;
    reason = "Simple bounce pattern detected";
    finalLevel = Math.min(recentHistory[0], recentHistory[1]);
  }

  return { shouldStop, reason, finalLevel };
};

// Method to complete the assessment
ProgramAssessmentSchema.methods.completeAssessment = function (
  finalLevel?: number,
  reason?: string
): void {
  this.status = AssessmentStatus.COMPLETED;
  this.endTime = new Date();
  this.totalDuration = Math.floor(
    (this.endTime.getTime() - this.startTime.getTime()) / 1000
  );

  this.finalLevel = finalLevel || this.algorithmState.currentLevel;
  this.algorithmState.shouldStop = true;
  this.algorithmState.stopReason = reason || "Assessment completed";
};

// Static method to create a new program assessment
ProgramAssessmentSchema.statics.createAssessment = async function (
  studentId: string,
  schoolId: string,
  mentorId: string,
  programId: string,
  config?: {
    randomizeQuestions?: boolean;
    maxQuestionsPerLevel?: number;
    oscillationTolerance?: number;
    minQuestionsBeforeOscillationStop?: number;
  }
) {
  // Fetch the program to get questions
  const Program = mongoose.model("Program");
  const program = await Program.findById(programId).populate(
    "levels.assessmentQuestions"
  );

  if (!program) {
    throw new Error("Program not found");
  }

  // Extract all questions from all levels
  const allQuestions: any[] = [];
  program.levels.forEach((level: any) => {
    if (level.assessmentQuestions) {
      level.assessmentQuestions.forEach((question: any) => {
        allQuestions.push({
          ...question.toObject(),
          levelNumber: level.levelNumber,
        });
      });
    }
  });

  // Randomize questions if requested
  let questionPool = allQuestions;
  if (config?.randomizeQuestions !== false) {
    questionPool = [...allQuestions].sort(() => Math.random() - 0.5);
  }

  const assessment = new this({
    student: studentId,
    school: schoolId,
    mentor: mentorId,
    program: programId,
    subject: program.subject,
    randomizeQuestions: config?.randomizeQuestions !== false,
    maxQuestionsPerLevel: config?.maxQuestionsPerLevel || 4,
    oscillationTolerance: config?.oscillationTolerance || 2,
    minQuestionsBeforeOscillationStop:
      config?.minQuestionsBeforeOscillationStop || 8,
    questionPool,
  });

  return assessment.save();
};

export const ProgramAssessment = mongoose.model<IProgramAssessment>(
  "ProgramAssessment",
  ProgramAssessmentSchema
);

export default ProgramAssessment;
