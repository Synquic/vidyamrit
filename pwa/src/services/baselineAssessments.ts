import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/baseline-assessments`;

export interface AssessmentQuestion {
  _id: string;
  questionText: string;
  questionType: "multiple_choice" | "one_word_answer" | "verbal_evaluation";
  options?: string[]; // For multiple choice
  points?: number;
  isRequired?: boolean;
}

export interface AssessmentQuestions {
  levelNumber: number;
  levelTitle: string;
  questions: AssessmentQuestion[];
  totalQuestions: number;
  totalPoints: number;
}

export interface StudentReadyForAssessment {
  studentId: string;
  studentName: string;
  currentLevel: number;
  nextLevel: number;
  daysInCurrentLevel: number;
  assessmentQuestions: AssessmentQuestion[];
}

export interface StudentsReadyResponse {
  cohortId: string;
  cohortName: string;
  programName: string;
  studentsReady: StudentReadyForAssessment[];
  totalReady: number;
}

export interface AssessmentResponse {
  questionId: string;
  answer: string | number; // For multiple choice: option index, for text: answer string
}

export interface ConductAssessmentRequest {
  cohortId: string;
  studentId: string;
  responses: AssessmentResponse[];
  totalQuestions: number;
  correctAnswers: number;
}

export interface AssessmentResult {
  passed: boolean;
  score: number;
  previousLevel: number;
  newLevel: number;
  status: "green" | "yellow" | "orange" | "red";
  failureCount: number;
}

export interface AssessmentHistoryItem {
  date: string;
  level: number;
  passed: boolean;
  status: string;
  score?: number;
  responses?: AssessmentResponse[];
}

export interface StudentAssessmentHistory {
  student: {
    _id: string;
    name: string;
    roll_no: string;
    class: string;
  };
  currentLevel: number;
  currentStatus: string;
  failureCount: number;
  assessmentHistory: AssessmentHistoryItem[];
}

// Get students ready for baseline assessment
export const getStudentsReadyForAssessment = async (
  cohortId: string
): Promise<StudentsReadyResponse> => {
  const response = await authAxios.get(`${baseUrl}/cohort/${cohortId}/ready`);
  return response.data;
};

// Get assessment questions for a specific level
export const getAssessmentQuestions = async (
  programId: string,
  levelNumber: number
): Promise<AssessmentQuestions> => {
  const response = await authAxios.get(`${baseUrl}/program/${programId}/level/${levelNumber}/questions`);
  return response.data;
};

// Conduct baseline assessment for a student
export const conductBaselineAssessment = async (
  data: ConductAssessmentRequest
): Promise<{
  message: string;
  result: AssessmentResult;
}> => {
  const response = await authAxios.post(`${baseUrl}/conduct`, data);
  return response.data;
};

// Get assessment history for a student
export const getStudentAssessmentHistory = async (
  cohortId: string,
  studentId: string
): Promise<StudentAssessmentHistory> => {
  const response = await authAxios.get(`${baseUrl}/cohort/${cohortId}/student/${studentId}/history`);
  return response.data;
};

// Helper function to validate assessment responses
export const validateAssessmentResponses = (
  questions: AssessmentQuestion[],
  responses: AssessmentResponse[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if all required questions are answered
  const requiredQuestions = questions.filter(q => q.isRequired !== false);
  const responseQuestionIds = responses.map(r => r.questionId);
  
  for (const question of requiredQuestions) {
    if (!responseQuestionIds.includes(question._id)) {
      errors.push(`Question "${question.questionText}" is required but not answered`);
    }
  }
  
  // Validate response format for each question type
  for (const response of responses) {
    const question = questions.find(q => q._id === response.questionId);
    if (!question) {
      errors.push(`Invalid question ID: ${response.questionId}`);
      continue;
    }
    
    switch (question.questionType) {
      case 'multiple_choice':
        if (typeof response.answer !== 'number' || response.answer < 0 || response.answer > 3) {
          errors.push(`Invalid answer for multiple choice question: ${question.questionText}`);
        }
        break;
      case 'one_word_answer':
        if (typeof response.answer !== 'string' || response.answer.trim().length === 0) {
          errors.push(`Invalid answer for text question: ${question.questionText}`);
        }
        break;
      case 'verbal_evaluation':
        // Verbal evaluation answers are handled manually by tutor
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to calculate assessment score
export const calculateAssessmentScore = (
  questions: AssessmentQuestion[],
  correctAnswers: number
): number => {
  const totalQuestions = questions.length;
  return totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
};
