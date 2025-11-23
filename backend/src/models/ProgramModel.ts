import mongoose, { Document, Schema } from "mongoose";

export enum TimeframeUnit {
  DAYS = "days",
  WEEKS = "weeks",
  MONTHS = "months",
}

// Enum for question types
export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  ONE_WORD_ANSWER = "one_word_answer",
  VERBAL_EVALUATION = "verbal_evaluation",
}

// Interface for assessment questions
export interface IAssessmentQuestion {
  _id?: string;
  questionText: string;
  questionType: QuestionType;

  // For multiple choice questions
  options?: string[]; // Array of 4 options
  correctOptionIndex?: number; // Index of correct option (0-3)

  // For one word answer questions
  acceptedAnswers?: string[]; // Array of acceptable answer strings

  // For verbal evaluation questions (no additional fields needed)
  // Evaluator will manually mark as correct/incorrect

  points?: number; // Points awarded for correct answer (default: 1)
  isRequired?: boolean; // Whether this question is mandatory (default: true)
  levelNumber?: number; // Level number for baseline assessment (added dynamically)
}

// Interface for Program Level
export interface IProgramLevel {
  levelNumber: number;
  title: string;
  description: string;
  timeframe: number;
  timeframeUnit: TimeframeUnit;
  prerequisites?: number[]; // Array of level numbers that must be completed before this level
  objectives?: string[]; // Learning objectives for this level
  resources?: string[]; // Resources/materials needed for this level
  assessmentCriteria?: string; // How to assess completion of this level

  // Assessment questions for this level
  assessmentQuestions?: IAssessmentQuestion[]; // Questions to assess before progressing to next level
}

// Interface for Program Document
export interface IProgram extends Document {
  name: string;
  subject: string;
  description: string;
  totalLevels: number;
  levels: IProgramLevel[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtual methods
  getTotalTimeToComplete(
    fromLevel?: number,
    toLevel?: number,
    unit?: TimeframeUnit
  ): number;
  getTimeLapseMatrix(unit?: TimeframeUnit): number[][];
  getLevelByNumber(levelNumber: number): IProgramLevel | null;
  getNextLevel(currentLevel: number): IProgramLevel | null;
  getPreviousLevel(currentLevel: number): IProgramLevel | null;
  validateLevelProgression(fromLevel: number, toLevel: number): boolean;

  // Assessment question methods
  addQuestionToLevel(levelNumber: number, question: IAssessmentQuestion): void;
  removeQuestionFromLevel(levelNumber: number, questionId: string): boolean;
  updateQuestionInLevel(
    levelNumber: number,
    questionId: string,
    updatedQuestion: Partial<IAssessmentQuestion>
  ): boolean;
  getQuestionsForLevel(levelNumber: number): IAssessmentQuestion[];
  getQuestionById(
    levelNumber: number,
    questionId: string
  ): IAssessmentQuestion | null;
}

// Assessment Question Schema
const AssessmentQuestionSchema = new Schema<IAssessmentQuestion>(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },
    // For multiple choice questions
    options: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    correctOptionIndex: {
      type: Number,
      min: 0,
      max: 3,
    },
    // For one word answer questions
    acceptedAnswers: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true, // Generate _id for each question for easy identification
  }
);

// Add validation for assessment questions
AssessmentQuestionSchema.pre("validate", function () {
  // Validate multiple choice questions
  if (this.questionType === QuestionType.MULTIPLE_CHOICE) {
    if (!this.options || this.options.length !== 4) {
      throw new Error("Multiple choice questions must have exactly 4 options");
    }
    if (
      this.correctOptionIndex === undefined ||
      this.correctOptionIndex < 0 ||
      this.correctOptionIndex > 3
    ) {
      throw new Error(
        "Multiple choice questions must have a valid correct option index (0-3)"
      );
    }
  }

  // Validate one word answer questions
  if (this.questionType === QuestionType.ONE_WORD_ANSWER) {
    if (!this.acceptedAnswers || this.acceptedAnswers.length === 0) {
      throw new Error(
        "One word answer questions must have at least one accepted answer"
      );
    }
  }

  // Verbal evaluation questions don't need additional validation
  // They only require questionText which is already required
});

// Program Level Schema
const ProgramLevelSchema = new Schema<IProgramLevel>(
  {
    levelNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    timeframe: {
      type: Number,
      required: true,
      min: 1,
    },
    timeframeUnit: {
      type: String,
      enum: Object.values(TimeframeUnit),
      default: TimeframeUnit.WEEKS,
    },
    prerequisites: [
      {
        type: Number,
        min: 1,
      },
    ],
    objectives: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
    resources: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
    assessmentCriteria: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Assessment questions for this level
    assessmentQuestions: [AssessmentQuestionSchema],
  },
  {
    _id: false, // Don't create separate _id for subdocuments
  }
);

// Main Program Schema
const ProgramSchema = new Schema<IProgram>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    totalLevels: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    levels: {
      type: [ProgramLevelSchema],
      validate: {
        validator: function (this: IProgram, levels: IProgramLevel[]) {
          // Get totalLevels from this context or from the parent document
          const totalLevels =
            this.totalLevels || (this as any).parent?.totalLevels;

          // If we can't determine totalLevels, we can't validate the length
          if (totalLevels === undefined || totalLevels === null) {
            // Continue with other validations but skip length check
          } else {
            // Validate that levels array length matches totalLevels
            if (levels.length !== totalLevels) {
              return false;
            }
          }

          // Validate that level numbers are sequential starting from 1
          const levelNumbers = levels
            .map((l) => l.levelNumber)
            .sort((a, b) => a - b);
          for (let i = 0; i < levelNumbers.length; i++) {
            if (levelNumbers[i] !== i + 1) {
              return false;
            }
          }

          // Validate prerequisites
          for (const level of levels) {
            if (level.prerequisites) {
              for (const prereq of level.prerequisites) {
                if (prereq >= level.levelNumber) {
                  return false; // Prerequisite cannot be same or higher level
                }
              }
            }
          }

          return true;
        },
        message: "Invalid levels configuration",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Instance method to get total time to complete from one level to another
ProgramSchema.methods.getTotalTimeToComplete = function (
  fromLevel: number = 1,
  toLevel?: number,
  unit: TimeframeUnit = TimeframeUnit.WEEKS
): number {
  const endLevel = toLevel || this.totalLevels;
  if (fromLevel < 1 || endLevel > this.totalLevels || fromLevel > endLevel) {
    throw new Error("Invalid level range");
  }

  let totalTime = 0;

  for (let i = fromLevel; i <= endLevel; i++) {
    const level = this.levels.find((l: IProgramLevel) => l.levelNumber === i);
    if (level) {
      // Convert level timeframe to the requested unit
      totalTime += convertTimeframe(level.timeframe, level.timeframeUnit, unit);
    }
  }

  return totalTime;
};

// Instance method to generate time lapse matrix
ProgramSchema.methods.getTimeLapseMatrix = function (
  unit: TimeframeUnit = TimeframeUnit.WEEKS
): number[][] {
  const matrix: number[][] = [];

  for (let from = 1; from <= this.totalLevels; from++) {
    const row: number[] = [];
    for (let to = 1; to <= this.totalLevels; to++) {
      if (to < from) {
        row.push(0); // Cannot go backward
      } else if (to === from) {
        // Time to complete current level
        const level = this.levels.find(
          (l: IProgramLevel) => l.levelNumber === from
        );
        row.push(
          level
            ? convertTimeframe(level.timeframe, level.timeframeUnit, unit)
            : 0
        );
      } else {
        // Time to go from 'from' level to 'to' level
        row.push(this.getTotalTimeToComplete(from, to, unit));
      }
    }
    matrix.push(row);
  }

  return matrix;
};

// Instance method to get level by number
ProgramSchema.methods.getLevelByNumber = function (
  levelNumber: number
): IProgramLevel | null {
  return (
    this.levels.find((l: IProgramLevel) => l.levelNumber === levelNumber) ||
    null
  );
};

// Instance method to get next level
ProgramSchema.methods.getNextLevel = function (
  currentLevel: number
): IProgramLevel | null {
  if (currentLevel >= this.totalLevels) return null;
  return this.getLevelByNumber(currentLevel + 1);
};

// Instance method to get previous level
ProgramSchema.methods.getPreviousLevel = function (
  currentLevel: number
): IProgramLevel | null {
  if (currentLevel <= 1) return null;
  return this.getLevelByNumber(currentLevel - 1);
};

// Instance method to validate level progression
ProgramSchema.methods.validateLevelProgression = function (
  fromLevel: number,
  toLevel: number
): boolean {
  if (toLevel <= fromLevel) return false;
  if (toLevel > fromLevel + 1) return false; // Can only progress one level at a time

  const targetLevel = this.getLevelByNumber(toLevel);
  if (!targetLevel) return false;

  // Check if all prerequisites are met
  if (targetLevel.prerequisites && targetLevel.prerequisites.length > 0) {
    return targetLevel.prerequisites.every(
      (prereq: number) => prereq < toLevel
    );
  }

  return true;
};

// Assessment question management methods
ProgramSchema.methods.addQuestionToLevel = function (
  levelNumber: number,
  question: IAssessmentQuestion
): void {
  const level = this.getLevelByNumber(levelNumber);
  if (!level) {
    throw new Error(`Level ${levelNumber} not found`);
  }

  if (!level.assessmentQuestions) {
    level.assessmentQuestions = [];
  }

  level.assessmentQuestions.push(question);
};

ProgramSchema.methods.removeQuestionFromLevel = function (
  levelNumber: number,
  questionId: string
): boolean {
  const level = this.getLevelByNumber(levelNumber);
  if (!level || !level.assessmentQuestions) {
    return false;
  }

  const questionIndex = level.assessmentQuestions.findIndex(
    (q: IAssessmentQuestion) => q._id?.toString() === questionId
  );

  if (questionIndex === -1) {
    return false;
  }

  level.assessmentQuestions.splice(questionIndex, 1);
  return true;
};

ProgramSchema.methods.updateQuestionInLevel = function (
  levelNumber: number,
  questionId: string,
  updatedQuestion: Partial<IAssessmentQuestion>
): boolean {
  const level = this.getLevelByNumber(levelNumber);
  if (!level || !level.assessmentQuestions) {
    return false;
  }

  const question = level.assessmentQuestions.find(
    (q: IAssessmentQuestion) => q._id?.toString() === questionId
  );

  if (!question) {
    return false;
  }

  // Update question properties
  Object.assign(question, updatedQuestion);
  return true;
};

ProgramSchema.methods.getQuestionsForLevel = function (
  levelNumber: number
): IAssessmentQuestion[] {
  const level = this.getLevelByNumber(levelNumber);
  return level?.assessmentQuestions || [];
};

ProgramSchema.methods.getQuestionById = function (
  levelNumber: number,
  questionId: string
): IAssessmentQuestion | null {
  const level = this.getLevelByNumber(levelNumber);
  if (!level || !level.assessmentQuestions) {
    return null;
  }

  return (
    level.assessmentQuestions.find(
      (q: IAssessmentQuestion) => q._id?.toString() === questionId
    ) || null
  );
};

// Helper function to convert timeframes between units
function convertTimeframe(
  value: number,
  fromUnit: TimeframeUnit,
  toUnit: TimeframeUnit
): number {
  if (fromUnit === toUnit) return value;

  // Convert to days first
  let days: number;
  switch (fromUnit) {
    case TimeframeUnit.DAYS:
      days = value;
      break;
    case TimeframeUnit.WEEKS:
      days = value * 7;
      break;
    case TimeframeUnit.MONTHS:
      days = value * 30; // Approximate
      break;
    default:
      days = value;
  }

  // Convert from days to target unit
  switch (toUnit) {
    case TimeframeUnit.DAYS:
      return days;
    case TimeframeUnit.WEEKS:
      return Math.ceil(days / 7);
    case TimeframeUnit.MONTHS:
      return Math.ceil(days / 30);
    default:
      return days;
  }
}

// Static method to create Hindi program with your example data
// ProgramSchema.statics.createHindiProgram = async function (
//   createdBy: mongoose.Types.ObjectId
// ) {
//   const hindiLevels: IProgramLevel[] = [
//     {
//       levelNumber: 1,
//       title: "Akshar Recognition",
//       description: "Learn to recognize Hindi alphabets and characters",
//       timeframe: 2,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       objectives: [
//         "Recognize all Hindi vowels",
//         "Recognize all Hindi consonants",
//         "Identify basic character combinations",
//       ],
//       assessmentCriteria:
//         "Student can identify at least 90% of Hindi characters correctly",
//     },
//     {
//       levelNumber: 2,
//       title: "2 Akshar with Blending",
//       description: "Learn to blend two characters together",
//       timeframe: 2,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [1],
//       objectives: [
//         "Blend consonant + vowel combinations",
//         "Read simple two-character words",
//       ],
//       assessmentCriteria:
//         "Student can read 2-character combinations with 85% accuracy",
//     },
//     {
//       levelNumber: 3,
//       title: "3,4 Akshar with Blending",
//       description: "Learn to blend three and four characters together",
//       timeframe: 1,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [2],
//       objectives: [
//         "Blend 3-character combinations",
//         "Blend 4-character combinations",
//         "Read simple words",
//       ],
//       assessmentCriteria:
//         "Student can read 3-4 character words with 80% accuracy",
//     },
//     {
//       levelNumber: 4,
//       title: "Bina Matra Para Reading",
//       description: "Read paragraphs without vowel marks",
//       timeframe: 1,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [3],
//       objectives: [
//         "Read sentences without matras",
//         "Understand basic sentence structure",
//       ],
//       assessmentCriteria:
//         "Student can read basic paragraphs without matras with 75% accuracy",
//     },
//     {
//       levelNumber: 5,
//       title: "Matra Part 1",
//       description: "Learn basic vowel marks (matras)",
//       timeframe: 1,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [4],
//       objectives: [
//         "Recognize basic matras",
//         "Apply matras to consonants",
//         "Read words with basic matras",
//       ],
//       assessmentCriteria:
//         "Student can read words with basic matras with 80% accuracy",
//     },
//     {
//       levelNumber: 6,
//       title: "Matra Part 2",
//       description: "Learn intermediate vowel marks",
//       timeframe: 2,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [5],
//       objectives: [
//         "Recognize all matras",
//         "Read complex words with multiple matras",
//       ],
//       assessmentCriteria:
//         "Student can read words with all matras with 85% accuracy",
//     },
//     {
//       levelNumber: 7,
//       title: "Matra Part 3",
//       description: "Master advanced vowel mark combinations",
//       timeframe: 2,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [6],
//       objectives: [
//         "Read advanced matra combinations",
//         "Understand compound characters",
//       ],
//       assessmentCriteria:
//         "Student can read complex words with compound matras with 90% accuracy",
//     },
//     {
//       levelNumber: 8,
//       title: "Hard Words",
//       description: "Read challenging vocabulary and complex words",
//       timeframe: 2,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [7],
//       objectives: ["Read multisyllabic words", "Understand complex vocabulary"],
//       assessmentCriteria:
//         "Student can read grade-appropriate complex words with 85% accuracy",
//     },
//     {
//       levelNumber: 9,
//       title: "Language Comprehension",
//       description: "Understand and comprehend Hindi text",
//       timeframe: 1,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [8],
//       objectives: [
//         "Understand story content",
//         "Answer comprehension questions",
//         "Summarize text",
//       ],
//       assessmentCriteria:
//         "Student can answer comprehension questions with 80% accuracy",
//     },
//     {
//       levelNumber: 10,
//       title: "Language Written",
//       description: "Write in Hindi with proper grammar and structure",
//       timeframe: 1,
//       timeframeUnit: TimeframeUnit.WEEKS,
//       prerequisites: [9],
//       objectives: [
//         "Write sentences correctly",
//         "Use proper grammar",
//         "Express ideas in writing",
//       ],
//       assessmentCriteria:
//         "Student can write coherent paragraphs with minimal grammatical errors",
//     },
//   ];

//   return this.create({
//     name: "Hindi Language Program",
//     subject: "hindi",
//     description:
//       "Comprehensive Hindi language learning program from basic character recognition to advanced reading and writing",
//     totalLevels: 10,
//     levels: hindiLevels,
//     createdBy,
//   });
// };

// Static method to create sample assessment questions for a level
// ProgramSchema.statics.createSampleQuestions = function (
//   levelNumber: number,
//   subject: string
// ): IAssessmentQuestion[] {
//   const questions: IAssessmentQuestion[] = [];

//   if (
//     subject.toLowerCase() === "hindi" ||
//     subject.toLowerCase() === "english"
//   ) {
//     // Sample questions based on level and subject
//     if (levelNumber === 1) {
//       // Level 1: Character/Letter Recognition
//       questions.push({
//         questionText: "Which of these is the correct letter 'अ'?",
//         questionType: QuestionType.MULTIPLE_CHOICE,
//         options: ["अ", "आ", "इ", "ई"],
//         correctOptionIndex: 0,
//         points: 1,
//         isRequired: true,
//       });

//       questions.push({
//         questionText: "What sound does this letter make: 'क'?",
//         questionType: QuestionType.ONE_WORD_ANSWER,
//         acceptedAnswers: ["क", "ka", "k"],
//         points: 1,
//         isRequired: true,
//       });

//       questions.push({
//         questionText:
//           "Ask the student to read these 5 letters aloud and mark their pronunciation",
//         questionType: QuestionType.VERBAL_EVALUATION,
//         points: 2,
//         isRequired: true,
//       });
//     } else if (levelNumber === 2) {
//       // Level 2: Blending
//       questions.push({
//         questionText: "What word is formed by blending 'क' + 'अ'?",
//         questionType: QuestionType.MULTIPLE_CHOICE,
//         options: ["का", "कि", "कु", "के"],
//         correctOptionIndex: 0,
//         points: 1,
//         isRequired: true,
//       });

//       questions.push({
//         questionText: "Write the word that sounds like 'ma-ma'",
//         questionType: QuestionType.ONE_WORD_ANSWER,
//         acceptedAnswers: ["मम", "mama", "मामा"],
//         points: 1,
//         isRequired: true,
//       });
//     }
//   } else if (subject.toLowerCase() === "math") {
//     if (levelNumber === 1) {
//       questions.push({
//         questionText: "What is 2 + 3?",
//         questionType: QuestionType.MULTIPLE_CHOICE,
//         options: ["4", "5", "6", "7"],
//         correctOptionIndex: 1,
//         points: 1,
//         isRequired: true,
//       });

//       questions.push({
//         questionText: "Count and write how many dots you see: • • • • •",
//         questionType: QuestionType.ONE_WORD_ANSWER,
//         acceptedAnswers: ["5", "five", "पांच"],
//         points: 1,
//         isRequired: true,
//       });

//       questions.push({
//         questionText: "Ask student to count from 1 to 10 verbally",
//         questionType: QuestionType.VERBAL_EVALUATION,
//         points: 2,
//         isRequired: true,
//       });
//     }
//   }

//   return questions;
// };

export const Program = mongoose.model<IProgram>("Program", ProgramSchema);
export default Program;
