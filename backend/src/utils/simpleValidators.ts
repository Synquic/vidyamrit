import { QuestionType, TimeframeUnit } from "../models/ProgramModel";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface SimpleQuestionSet {
  level: number;
  type: "verbal" | "multiple_choice" | "one_word_answer";
  questions: (
    | string
    | {
        questionText: string;
        options: string[];
        correctAnswer: number;
      }
  )[];
  timeframe?: number;
  levelTitle?: string;
  levelDescription?: string;
}

interface SimpleProgramData {
  programName: string;
  subject: string;
  description: string;
  questionSets: SimpleQuestionSet[];
}

interface ConvertedProgramData {
  programName: string;
  subject: string;
  description: string;
  levels: {
    levelNumber: number;
    title: string;
    description: string;
    timeframe: number;
    timeframeUnit: string;
    prerequisites: number[];
    objectives: string[];
    resources: string[];
    assessmentCriteria: string;
    assessmentQuestions: {
      questionText: string;
      questionType: string;
      options?: string[];
      correctOptionIndex?: number;
      acceptedAnswers?: string[];
      points: number;
      isRequired: boolean;
    }[];
  }[];
}

export function validateSimpleProgramData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure validation
  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Invalid data format - must be an object"],
    };
  }

  // Required top-level fields
  if (
    !data.programName ||
    typeof data.programName !== "string" ||
    data.programName.trim() === ""
  ) {
    errors.push("programName is required and must be a non-empty string");
  }

  if (
    !data.subject ||
    typeof data.subject !== "string" ||
    data.subject.trim() === ""
  ) {
    errors.push("subject is required and must be a non-empty string");
  }

  if (
    !data.description ||
    typeof data.description !== "string" ||
    data.description.trim() === ""
  ) {
    errors.push("description is required and must be a non-empty string");
  }

  if (
    !data.questionSets ||
    !Array.isArray(data.questionSets) ||
    data.questionSets.length === 0
  ) {
    errors.push("questionSets is required and must be a non-empty array");
    return { isValid: false, errors };
  }

  // Validate question sets
  const levelNumbers = new Set<number>();

  data.questionSets.forEach((questionSet: any, index: number) => {
    const setPrefix = `Question Set ${index + 1}`;

    // Required fields
    if (typeof questionSet.level !== "number" || questionSet.level < 1) {
      errors.push(`${setPrefix}: level must be a positive number`);
    } else {
      levelNumbers.add(questionSet.level);
    }

    if (
      !questionSet.type ||
      !["verbal", "multiple_choice", "one_word_answer"].includes(
        questionSet.type
      )
    ) {
      errors.push(
        `${setPrefix}: type must be one of: verbal, multiple_choice, one_word_answer`
      );
    }

    if (
      !questionSet.questions ||
      !Array.isArray(questionSet.questions) ||
      questionSet.questions.length === 0
    ) {
      errors.push(
        `${setPrefix}: questions is required and must be a non-empty array`
      );
    } else {
      // Validate questions based on type
      questionSet.questions.forEach((question: any, qIndex: number) => {
        const questionPrefix = `${setPrefix}, Question ${qIndex + 1}`;

        if (
          questionSet.type === "verbal" ||
          questionSet.type === "one_word_answer"
        ) {
          if (typeof question !== "string" || question.trim() === "") {
            errors.push(
              `${questionPrefix}: must be a non-empty string for ${questionSet.type} questions`
            );
          }
          // Allow longer text for verbal questions (poems, text blocks)
          if (typeof question === "string" && question.length > 2000) {
            warnings.push(
              `${questionPrefix}: question text is quite long (${question.length} characters). Consider breaking into smaller segments if needed.`
            );
          }
        } else if (questionSet.type === "multiple_choice") {
          if (
            typeof question !== "object" ||
            !question.questionText ||
            !question.options ||
            typeof question.correctAnswer !== "number"
          ) {
            errors.push(
              `${questionPrefix}: multiple choice questions must have questionText, options array, and correctAnswer index`
            );
          } else {
            if (
              !Array.isArray(question.options) ||
              question.options.length < 2 ||
              question.options.length > 4
            ) {
              errors.push(
                `${questionPrefix}: options must be an array with 2-4 items`
              );
            }
            if (
              question.correctAnswer < 0 ||
              question.correctAnswer >= question.options.length
            ) {
              errors.push(
                `${questionPrefix}: correctAnswer must be a valid index (0-${
                  question.options.length - 1
                })`
              );
            }
          }
        }
      });
    }

    // Optional field validation
    if (questionSet.timeframe !== undefined) {
      if (
        typeof questionSet.timeframe !== "number" ||
        questionSet.timeframe < 1
      ) {
        errors.push(`${setPrefix}: timeframe must be a positive number`);
      }
    }

    if (
      questionSet.levelTitle !== undefined &&
      (typeof questionSet.levelTitle !== "string" ||
        questionSet.levelTitle.trim() === "")
    ) {
      errors.push(
        `${setPrefix}: levelTitle must be a non-empty string if provided`
      );
    }

    if (
      questionSet.levelDescription !== undefined &&
      (typeof questionSet.levelDescription !== "string" ||
        questionSet.levelDescription.trim() === "")
    ) {
      errors.push(
        `${setPrefix}: levelDescription must be a non-empty string if provided`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function convertSimpleToFullProgram(
  simpleData: SimpleProgramData
): ConvertedProgramData {
  // Group question sets by level
  const levelGroups = new Map<number, SimpleQuestionSet[]>();

  simpleData.questionSets.forEach((questionSet) => {
    if (!levelGroups.has(questionSet.level)) {
      levelGroups.set(questionSet.level, []);
    }
    levelGroups.get(questionSet.level)!.push(questionSet);
  });

  // Convert to full program format
  const levels = Array.from(levelGroups.keys())
    .sort((a, b) => a - b)
    .map((levelNumber) => {
      const questionSetsForLevel = levelGroups.get(levelNumber)!;

      // Use the first question set's metadata for the level
      const firstSet = questionSetsForLevel[0];
      const levelTitle = firstSet.levelTitle || `Level ${levelNumber}`;
      const levelDescription =
        firstSet.levelDescription ||
        `Level ${levelNumber} assessment questions`;
      const timeframe = firstSet.timeframe || 2;

      // Combine all questions from all sets for this level
      const assessmentQuestions: any[] = [];

      questionSetsForLevel.forEach((questionSet) => {
        questionSet.questions.forEach((question) => {
          if (typeof question === "string") {
            // Simple string question
            assessmentQuestions.push({
              questionText: question,
              questionType:
                questionSet.type === "verbal"
                  ? QuestionType.VERBAL_EVALUATION
                  : QuestionType.ONE_WORD_ANSWER,
              ...(questionSet.type === "one_word_answer" && {
                acceptedAnswers: [question.toLowerCase(), question],
              }),
              points: 1,
              isRequired: true,
            });
          } else {
            // Multiple choice question object
            assessmentQuestions.push({
              questionText: question.questionText,
              questionType: QuestionType.MULTIPLE_CHOICE,
              options: question.options,
              correctOptionIndex: question.correctAnswer,
              points: 1,
              isRequired: true,
            });
          }
        });
      });

      return {
        levelNumber,
        title: levelTitle,
        description: levelDescription,
        timeframe,
        timeframeUnit: TimeframeUnit.WEEKS,
        prerequisites: levelNumber > 1 ? [levelNumber - 1] : [],
        objectives: [
          `Complete Level ${levelNumber} assessment`,
          "Demonstrate understanding of concepts",
          "Progress to next level",
        ],
        resources: [
          `Level ${levelNumber} study materials`,
          "Practice exercises",
          "Assessment guide",
        ],
        assessmentCriteria: `Student can successfully complete Level ${levelNumber} questions with appropriate accuracy`,
        assessmentQuestions,
      };
    });

  return {
    programName: simpleData.programName,
    subject: simpleData.subject,
    description: simpleData.description,
    levels,
  };
}
