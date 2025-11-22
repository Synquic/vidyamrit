import { authAxios, apiUrl } from "./index";

// TypeScript interfaces matching the backend model
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

  points?: number; // Points awarded for correct answer (default: 1)
  isRequired?: boolean; // Whether this question is mandatory (default: true)
}

export interface IProgramLevel {
  levelNumber: number;
  title: string;
  description: string;
  timeframe: number;
  timeframeUnit: TimeframeUnit;
  prerequisites?: number[];
  objectives?: string[];
  resources?: string[];
  assessmentCriteria?: string;

  // Assessment questions for this level
  assessmentQuestions?: IAssessmentQuestion[];
}

export interface IProgram {
  _id: string;
  name: string;
  subject: string;
  description: string;
  totalLevels: number;
  levels: IProgramLevel[];
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProgramsResponse {
  programs: IProgram[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateProgramData {
  name: string;
  subject: string;
  description?: string;
  totalLevels: number;
  levels: Omit<IProgramLevel, "_id">[];
}

export interface UpdateProgramData {
  name?: string;
  subject?: string;
  description?: string;
  totalLevels?: number;
  levels?: Omit<IProgramLevel, "_id">[];
  isActive?: boolean;
}

export interface ProgramFilters {
  subject?: string;
  isActive?: string;
  includeInactive?: string;
  page?: number;
  limit?: number;
}

export interface TimeLapseMatrixResponse {
  programId: string;
  programName: string;
  subject: string;
  unit: TimeframeUnit;
  totalLevels: number;
  timeLapseMatrix: number[][];
  levelTitles: Array<{
    levelNumber: number;
    title: string;
  }>;
}

export interface TimeToCompleteResponse {
  programId: string;
  programName: string;
  fromLevel: number;
  toLevel: number;
  totalTime: number;
  unit: TimeframeUnit;
  breakdown: Array<{
    levelNumber: number;
    title: string;
    timeframe: number;
    timeframeUnit: TimeframeUnit;
  }>;
}

export interface LevelDetailsResponse {
  programId: string;
  programName: string;
  level: IProgramLevel;
  navigation: {
    nextLevel: {
      levelNumber: number;
      title: string;
    } | null;
    previousLevel: {
      levelNumber: number;
      title: string;
    } | null;
  };
}

export interface ProgressionValidationResponse {
  programId: string;
  fromLevel: number;
  toLevel: number;
  isValid: boolean;
  message: string;
}

// Service class for program management
class ProgramsService {
  private baseUrl = `${apiUrl}/programs`;

  // Get all programs with filtering and pagination
  async getPrograms(filters?: ProgramFilters): Promise<ProgramsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.subject) params.append("subject", filters.subject);
      if (filters?.isActive) params.append("isActive", filters.isActive);
      if (filters?.includeInactive)
        params.append("includeInactive", filters.includeInactive);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const response = await authAxios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching programs:", error);
      throw error;
    }
  }

  // Get program by ID
  async getProgramById(id: string): Promise<IProgram> {
    try {
      const response = await authAxios.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching program:", error);
      throw error;
    }
  }

  // Create new program
  async createProgram(data: CreateProgramData): Promise<IProgram> {
    try {
      const cleanedData = this.cleanProgramData(data);

      console.log("=== CREATE PROGRAM DEBUG ===");
      console.log("Original data:", JSON.stringify(data, null, 2));
      console.log("Cleaned data:", JSON.stringify(cleanedData, null, 2));

      const response = await authAxios.post(this.baseUrl, cleanedData);
      return response.data;
    } catch (error) {
      console.error("Error creating program:", error);
      throw error;
    }
  }

  // Update program
  async updateProgram(id: string, data: UpdateProgramData): Promise<IProgram> {
    try {
      const cleanedData = this.cleanProgramData(data);

      console.log("=== UPDATE PROGRAM DEBUG ===");
      console.log("Original data:", JSON.stringify(data, null, 2));
      console.log("Cleaned data:", JSON.stringify(cleanedData, null, 2));

      const response = await authAxios.put(
        `${this.baseUrl}/${id}`,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating program:", error);
      throw error;
    }
  }

  // Delete program
  async deleteProgram(id: string): Promise<{ message: string }> {
    try {
      const response = await authAxios.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting program:", error);
      throw error;
    }
  }

  // Toggle program active status
  async toggleProgramStatus(
    id: string
  ): Promise<{ message: string; isActive: boolean }> {
    try {
      const response = await authAxios.patch(
        `${this.baseUrl}/${id}/toggle-status`
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling program status:", error);
      throw error;
    }
  }

  // Get time lapse matrix for program
  async getProgramTimeLapseMatrix(
    id: string,
    unit: TimeframeUnit = TimeframeUnit.WEEKS
  ): Promise<TimeLapseMatrixResponse> {
    try {
      const response = await authAxios.get(
        `${this.baseUrl}/${id}/time-lapse-matrix?unit=${unit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching time lapse matrix:", error);
      throw error;
    }
  }

  // Get time to complete between levels
  async getTimeToComplete(
    id: string,
    fromLevel?: number,
    toLevel?: number,
    unit: TimeframeUnit = TimeframeUnit.WEEKS
  ): Promise<TimeToCompleteResponse> {
    try {
      const params = new URLSearchParams();
      if (fromLevel) params.append("fromLevel", fromLevel.toString());
      if (toLevel) params.append("toLevel", toLevel.toString());
      params.append("unit", unit);

      const response = await authAxios.get(
        `${this.baseUrl}/${id}/time-to-complete?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error calculating time to complete:", error);
      throw error;
    }
  }

  // Get level details
  async getLevelDetails(
    id: string,
    levelNumber: number
  ): Promise<LevelDetailsResponse> {
    try {
      const response = await authAxios.get(
        `${this.baseUrl}/${id}/levels/${levelNumber}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching level details:", error);
      throw error;
    }
  }

  // Validate level progression
  async validateLevelProgression(
    id: string,
    fromLevel: number,
    toLevel: number
  ): Promise<ProgressionValidationResponse> {
    try {
      const response = await authAxios.post(
        `${this.baseUrl}/${id}/validate-progression`,
        {
          fromLevel,
          toLevel,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error validating level progression:", error);
      throw error;
    }
  }

  // Create sample Hindi program (Super Admin only)
  async createSampleHindiProgram(): Promise<{
    message: string;
    program: IProgram;
  }> {
    try {
      const response = await authAxios.post(`${this.baseUrl}/samples/hindi`);
      return response.data;
    } catch (error) {
      console.error("Error creating sample Hindi program:", error);
      throw error;
    }
  }

  // Import program from JSON file
  async importProgram(file: File): Promise<{
    success: boolean;
    message: string;
    data?: {
      programId: string;
      programName: string;
      subject: string;
      totalLevels: number;
      levelsImported: number;
      totalQuestions: number;
    };
    warnings?: string[];
  }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authAxios.post(
        `${this.baseUrl}/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error importing program:", error);
      throw error;
    }
  }

  // Helper method to create level template
  createLevelTemplate(levelNumber: number): Omit<IProgramLevel, "_id"> {
    return {
      levelNumber,
      title: `Level ${levelNumber}`,
      description: "",
      timeframe: 1,
      timeframeUnit: TimeframeUnit.WEEKS,
      prerequisites: levelNumber > 1 ? [levelNumber - 1] : undefined,
      objectives: undefined,
      resources: undefined,
      assessmentCriteria: undefined,
      assessmentQuestions: [], // Initialize with empty questions array
    };
  }

  // Helper method to create a new assessment question template
  createQuestionTemplate(questionType: QuestionType): IAssessmentQuestion {
    const baseQuestion: IAssessmentQuestion = {
      questionText: "",
      questionType,
      points: 1,
      isRequired: true,
    };

    switch (questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return {
          ...baseQuestion,
          options: ["", "", "", ""],
          correctOptionIndex: 0,
        };

      case QuestionType.ONE_WORD_ANSWER:
        return {
          ...baseQuestion,
          acceptedAnswers: [""],
        };

      case QuestionType.VERBAL_EVALUATION:
        return baseQuestion;

      default:
        return baseQuestion;
    }
  }

  // Helper method to validate program data before submission
  validateProgramData(data: CreateProgramData): string[] {
    const errors: string[] = [];

    if (!data.name.trim()) {
      errors.push("Program name is required");
    }

    if (!data.subject.trim()) {
      errors.push("Subject is required");
    }

    if (data.totalLevels < 1 || data.totalLevels > 50) {
      errors.push("Total levels must be between 1 and 50");
    }

    if (!data.levels || data.levels.length !== data.totalLevels) {
      errors.push(
        `Levels array must contain exactly ${data.totalLevels} levels`
      );
    }

    // Validate level numbers are sequential
    if (data.levels) {
      const levelNumbers = data.levels
        .map((l) => l.levelNumber)
        .sort((a, b) => a - b);
      for (let i = 0; i < levelNumbers.length; i++) {
        if (levelNumbers[i] !== i + 1) {
          errors.push("Level numbers must be sequential starting from 1");
          break;
        }
      }

      // Validate prerequisites
      for (const level of data.levels) {
        if (level.prerequisites) {
          for (const prereq of level.prerequisites) {
            if (prereq >= level.levelNumber) {
              errors.push(
                `Level ${level.levelNumber}: Prerequisites cannot be same or higher level`
              );
            }
          }
        }

        if (!level.title.trim()) {
          errors.push(`Level ${level.levelNumber}: Title is required`);
        }

        if (!level.description.trim()) {
          errors.push(`Level ${level.levelNumber}: Description is required`);
        }

        if (level.timeframe < 1) {
          errors.push(
            `Level ${level.levelNumber}: Timeframe must be at least 1`
          );
        }
      }
    }

    return errors;
  }

  // Helper method to clean program data before sending to backend
  cleanProgramData(
    data: CreateProgramData | UpdateProgramData
  ): CreateProgramData {
    // Ensure required fields are present for validation
    const cleanedData: CreateProgramData = {
      name: data.name?.trim() || "",
      subject: data.subject?.trim() || "",
      description: data.description?.trim() || "",
      totalLevels: data.totalLevels || 1,
      levels: (data.levels || []).map((level) => ({
        levelNumber: level.levelNumber,
        title: level.title?.trim() || "",
        description: level.description?.trim() || "",
        timeframe: level.timeframe || 1,
        timeframeUnit: level.timeframeUnit || TimeframeUnit.WEEKS,
        prerequisites:
          level.prerequisites && level.prerequisites.length > 0
            ? level.prerequisites
            : undefined,
        objectives:
          level.objectives && level.objectives.length > 0
            ? level.objectives.filter((obj) => obj?.trim())
            : undefined,
        resources:
          level.resources && level.resources.length > 0
            ? level.resources.filter((res) => res?.trim())
            : undefined,
        assessmentCriteria: level.assessmentCriteria?.trim() || undefined,
        assessmentQuestions: level.assessmentQuestions || [],
      })),
    };

    return cleanedData;
  }

  // Helper method to calculate total program duration
  calculateTotalDuration(
    levels: IProgramLevel[],
    unit: TimeframeUnit = TimeframeUnit.WEEKS
  ): number {
    let total = 0;

    for (const level of levels) {
      // Convert timeframe to target unit
      let timeInTargetUnit = level.timeframe;

      if (level.timeframeUnit !== unit) {
        // Convert to days first
        let days: number;
        switch (level.timeframeUnit) {
          case TimeframeUnit.DAYS:
            days = level.timeframe;
            break;
          case TimeframeUnit.WEEKS:
            days = level.timeframe * 7;
            break;
          case TimeframeUnit.MONTHS:
            days = level.timeframe * 30;
            break;
          default:
            days = level.timeframe;
        }

        // Convert from days to target unit
        switch (unit) {
          case TimeframeUnit.DAYS:
            timeInTargetUnit = days;
            break;
          case TimeframeUnit.WEEKS:
            timeInTargetUnit = Math.ceil(days / 7);
            break;
          case TimeframeUnit.MONTHS:
            timeInTargetUnit = Math.ceil(days / 30);
            break;
          default:
            timeInTargetUnit = days;
        }
      }

      total += timeInTargetUnit;
    }

    return total;
  }

  // Assessment question management methods
  addQuestionToLevel(
    levelData: IProgramLevel,
    question: IAssessmentQuestion
  ): void {
    if (!levelData.assessmentQuestions) {
      levelData.assessmentQuestions = [];
    }
    levelData.assessmentQuestions.push(question);
  }

  removeQuestionFromLevel(
    levelData: IProgramLevel,
    questionIndex: number
  ): boolean {
    if (
      !levelData.assessmentQuestions ||
      questionIndex < 0 ||
      questionIndex >= levelData.assessmentQuestions.length
    ) {
      return false;
    }
    levelData.assessmentQuestions.splice(questionIndex, 1);
    return true;
  }

  updateQuestionInLevel(
    levelData: IProgramLevel,
    questionIndex: number,
    updatedQuestion: IAssessmentQuestion
  ): boolean {
    if (
      !levelData.assessmentQuestions ||
      questionIndex < 0 ||
      questionIndex >= levelData.assessmentQuestions.length
    ) {
      return false;
    }
    levelData.assessmentQuestions[questionIndex] = updatedQuestion;
    return true;
  }

  validateQuestion(question: IAssessmentQuestion): string[] {
    const errors: string[] = [];

    if (!question.questionText.trim()) {
      errors.push("Question text is required");
    }

    if (!question.questionType) {
      errors.push("Question type is required");
    }

    // Validate based on question type
    switch (question.questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!question.options || question.options.length !== 4) {
          errors.push("Multiple choice questions must have exactly 4 options");
        } else if (question.options.some((option) => !option.trim())) {
          errors.push("All options must be filled");
        }

        if (
          question.correctOptionIndex === undefined ||
          question.correctOptionIndex < 0 ||
          question.correctOptionIndex > 3
        ) {
          errors.push("Must select a correct option (0-3)");
        }
        break;

      case QuestionType.ONE_WORD_ANSWER:
        if (
          !question.acceptedAnswers ||
          question.acceptedAnswers.length === 0 ||
          question.acceptedAnswers.every((answer) => !answer.trim())
        ) {
          errors.push("At least one accepted answer is required");
        }
        break;

      case QuestionType.VERBAL_EVALUATION:
        // No additional validation needed for verbal questions
        break;

      default:
        errors.push("Invalid question type");
    }

    if (question.points !== undefined && question.points < 0) {
      errors.push("Points must be non-negative");
    }

    return errors;
  }
}

// Export singleton instance
export const programsService = new ProgramsService();
export default programsService;
