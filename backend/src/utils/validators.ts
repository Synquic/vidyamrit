import { QuestionType } from "../models/ProgramModel";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface ImportQuestion {
  questionText: string;
  questionType: string;
  options?: string[];
  correctOptionIndex?: number;
  acceptedAnswers?: string[];
  points?: number;
  isRequired?: boolean;
}

interface ImportLevel {
  levelNumber: number;
  title: string;
  description: string;
  timeframe: number;
  timeframeUnit: string;
  prerequisites?: number[];
  objectives?: string[];
  resources?: string[];
  assessmentCriteria?: string;
  assessmentQuestions?: ImportQuestion[];
}

interface ImportProgramData {
  programName: string;
  subject: string;
  description: string;
  levels: ImportLevel[];
}

export function validateProgramImportData(data: any): ValidationResult {
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

  if (!data.levels || !Array.isArray(data.levels) || data.levels.length === 0) {
    errors.push("levels is required and must be a non-empty array");
    return { isValid: false, errors };
  }

  // Validate levels
  const levelNumbers = new Set<number>();

  data.levels.forEach((level: any, index: number) => {
    const levelPrefix = `Level ${index + 1}`;

    // Required level fields
    if (typeof level.levelNumber !== "number" || level.levelNumber < 1) {
      errors.push(`${levelPrefix}: levelNumber must be a positive number`);
    } else {
      if (levelNumbers.has(level.levelNumber)) {
        errors.push(
          `${levelPrefix}: Duplicate level number ${level.levelNumber}`
        );
      }
      levelNumbers.add(level.levelNumber);
    }

    if (
      !level.title ||
      typeof level.title !== "string" ||
      level.title.trim() === ""
    ) {
      errors.push(
        `${levelPrefix}: title is required and must be a non-empty string`
      );
    }

    if (
      !level.description ||
      typeof level.description !== "string" ||
      level.description.trim() === ""
    ) {
      errors.push(
        `${levelPrefix}: description is required and must be a non-empty string`
      );
    }

    if (typeof level.timeframe !== "number" || level.timeframe < 1) {
      errors.push(`${levelPrefix}: timeframe must be a positive number`);
    }

    if (
      !level.timeframeUnit ||
      !["days", "weeks", "months"].includes(level.timeframeUnit)
    ) {
      errors.push(
        `${levelPrefix}: timeframeUnit must be one of: days, weeks, months`
      );
    }

    // Optional fields validation
    if (level.prerequisites && !Array.isArray(level.prerequisites)) {
      errors.push(`${levelPrefix}: prerequisites must be an array of numbers`);
    } else if (level.prerequisites) {
      level.prerequisites.forEach((prereq: any, prereqIndex: number) => {
        if (typeof prereq !== "number" || prereq < 1) {
          errors.push(
            `${levelPrefix}: prerequisite ${
              prereqIndex + 1
            } must be a positive number`
          );
        }
      });
    }

    if (level.objectives && !Array.isArray(level.objectives)) {
      errors.push(`${levelPrefix}: objectives must be an array of strings`);
    }

    if (level.resources && !Array.isArray(level.resources)) {
      errors.push(`${levelPrefix}: resources must be an array of strings`);
    }

    // Validate assessment questions
    if (level.assessmentQuestions) {
      if (!Array.isArray(level.assessmentQuestions)) {
        errors.push(`${levelPrefix}: assessmentQuestions must be an array`);
      } else {
        level.assessmentQuestions.forEach((question: any, qIndex: number) => {
          const questionPrefix = `${levelPrefix}, Question ${qIndex + 1}`;

          if (
            !question.questionText ||
            typeof question.questionText !== "string" ||
            question.questionText.trim() === ""
          ) {
            errors.push(
              `${questionPrefix}: questionText is required and must be a non-empty string`
            );
          }

          if (
            !question.questionType ||
            !Object.values(QuestionType).includes(question.questionType)
          ) {
            errors.push(
              `${questionPrefix}: questionType must be one of: ${Object.values(
                QuestionType
              ).join(", ")}`
            );
          }

          // Validate question type specific fields
          if (question.questionType === QuestionType.MULTIPLE_CHOICE) {
            if (
              !Array.isArray(question.options) ||
              question.options.length !== 4
            ) {
              errors.push(
                `${questionPrefix}: Multiple choice questions must have exactly 4 options`
              );
            }

            if (
              typeof question.correctOptionIndex !== "number" ||
              question.correctOptionIndex < 0 ||
              question.correctOptionIndex > 3
            ) {
              errors.push(
                `${questionPrefix}: correctOptionIndex must be a number between 0 and 3`
              );
            }
          }

          if (question.questionType === QuestionType.ONE_WORD_ANSWER) {
            if (
              !Array.isArray(question.acceptedAnswers) ||
              question.acceptedAnswers.length === 0
            ) {
              errors.push(
                `${questionPrefix}: One word answer questions must have at least one accepted answer`
              );
            }
          }

          // Optional field validation
          if (question.points !== undefined) {
            if (typeof question.points !== "number" || question.points < 1) {
              errors.push(
                `${questionPrefix}: points must be a positive number`
              );
            }
          }

          if (
            question.isRequired !== undefined &&
            typeof question.isRequired !== "boolean"
          ) {
            errors.push(`${questionPrefix}: isRequired must be a boolean`);
          }
        });
      }
    }
  });

  // Check level number sequence
  const sortedLevels = Array.from(levelNumbers).sort((a, b) => a - b);
  for (let i = 0; i < sortedLevels.length; i++) {
    if (sortedLevels[i] !== i + 1) {
      warnings.push(
        `Level numbers should be sequential starting from 1. Found: ${sortedLevels.join(
          ", "
        )}`
      );
      break;
    }
  }

  // Validate prerequisites refer to existing levels
  data.levels.forEach((level: any, index: number) => {
    if (level.prerequisites) {
      level.prerequisites.forEach((prereq: number) => {
        if (!levelNumbers.has(prereq)) {
          errors.push(
            `Level ${level.levelNumber}: prerequisite level ${prereq} does not exist`
          );
        } else if (prereq >= level.levelNumber) {
          errors.push(
            `Level ${level.levelNumber}: prerequisite level ${prereq} must be lower than current level`
          );
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function validateQuestionData(
  question: ImportQuestion
): ValidationResult {
  const errors: string[] = [];

  if (!question.questionText || question.questionText.trim() === "") {
    errors.push("Question text is required");
  }

  if (
    !Object.values(QuestionType).includes(question.questionType as QuestionType)
  ) {
    errors.push(
      `Invalid question type. Must be one of: ${Object.values(
        QuestionType
      ).join(", ")}`
    );
  }

  switch (question.questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      if (!question.options || question.options.length !== 4) {
        errors.push("Multiple choice questions must have exactly 4 options");
      }
      if (
        question.correctOptionIndex === undefined ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex > 3
      ) {
        errors.push(
          "Multiple choice questions must have a valid correctOptionIndex (0-3)"
        );
      }
      break;

    case QuestionType.ONE_WORD_ANSWER:
      if (!question.acceptedAnswers || question.acceptedAnswers.length === 0) {
        errors.push(
          "One word answer questions must have at least one accepted answer"
        );
      }
      break;

    case QuestionType.VERBAL_EVALUATION:
      // No additional validation required for verbal evaluation
      break;
  }

  if (
    question.points !== undefined &&
    (typeof question.points !== "number" || question.points < 1)
  ) {
    errors.push("Points must be a positive number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
