import { useState, useCallback } from "react";
import {
  createProgramAssessment,
  getCurrentQuestion,
  submitAnswer,
  getProgramAssessment,
  getAssessmentStats,
  pauseAssessment,
  resumeAssessment,
  completeAssessment,
  type ProgramAssessment,
  type CreateProgramAssessmentDTO,
  type CurrentQuestion,
  type AssessmentStats,
} from "../services/programAssessments";

interface UseProgramAssessmentState {
  assessment: ProgramAssessment | null;
  currentQuestion: CurrentQuestion | null;
  stats: AssessmentStats | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
}

interface UseProgramAssessmentActions {
  startAssessment: (
    data: CreateProgramAssessmentDTO
  ) => Promise<ProgramAssessment | null>;
  loadAssessment: (assessmentId: string) => Promise<void>;
  loadCurrentQuestion: (assessmentId: string) => Promise<void>;
  submitQuestionAnswer: (
    assessmentId: string,
    answer: boolean
  ) => Promise<boolean>;
  loadStats: (assessmentId: string) => Promise<void>;
  pauseCurrentAssessment: (assessmentId: string) => Promise<void>;
  resumeCurrentAssessment: (assessmentId: string) => Promise<void>;
  completeCurrentAssessment: (assessmentId: string) => Promise<void>;
  resetState: () => void;
  clearError: () => void;
}

export type UseProgramAssessmentReturn = UseProgramAssessmentState &
  UseProgramAssessmentActions;

/**
 * Custom hook for managing program assessment state and operations
 */
export const useProgramAssessment = (): UseProgramAssessmentReturn => {
  const [state, setState] = useState<UseProgramAssessmentState>({
    assessment: null,
    currentQuestion: null,
    stats: null,
    loading: false,
    error: null,
    submitting: false,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setState((prev) => ({ ...prev, submitting }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const resetState = useCallback(() => {
    setState({
      assessment: null,
      currentQuestion: null,
      stats: null,
      loading: false,
      error: null,
      submitting: false,
    });
  }, []);

  /**
   * Start a new program assessment
   */
  const startAssessment = useCallback(
    async (
      data: CreateProgramAssessmentDTO
    ): Promise<ProgramAssessment | null> => {
      try {
        setLoading(true);
        setError(null);

        const assessment = await createProgramAssessment(data);

        setState((prev) => ({
          ...prev,
          assessment,
          loading: false,
        }));

        // Automatically load the first question
        await loadCurrentQuestion(assessment._id);

        return assessment;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to start assessment";
        setError(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  /**
   * Load an existing assessment
   */
  const loadAssessment = useCallback(
    async (assessmentId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const assessment = await getProgramAssessment(assessmentId);

        setState((prev) => ({
          ...prev,
          assessment,
          loading: false,
        }));
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load assessment";
        setError(errorMessage);
        setLoading(false);
      }
    },
    []
  );

  /**
   * Load the current question for an assessment
   */
  const loadCurrentQuestion = useCallback(
    async (assessmentId: string): Promise<void> => {
      try {
        setError(null);

        const currentQuestion = await getCurrentQuestion(assessmentId);

        setState((prev) => ({
          ...prev,
          currentQuestion,
        }));
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load current question";
        setError(errorMessage);
      }
    },
    []
  );

  /**
   * Submit an answer and get the next question
   */
  const submitQuestionAnswer = useCallback(
    async (assessmentId: string, answer: boolean): Promise<boolean> => {
      try {
        setSubmitting(true);
        setError(null);

        const response = await submitAnswer({
          assessmentId,
          questionId: "", // This might need to be provided or handled differently based on your backend
          userAnswer: answer,
          timeSpent: 0, // This might need to be tracked based on your requirements
        });

        setState((prev) => ({
          ...prev,
          currentQuestion: response,
          submitting: false,
        }));

        // If assessment is complete, load final stats
        if (response.isComplete) {
          await loadStats(assessmentId);
          await loadAssessment(assessmentId); // Refresh assessment data
        }

        return response.isComplete;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to submit answer";
        setError(errorMessage);
        setSubmitting(false);
        return false;
      }
    },
    []
  );

  /**
   * Load assessment statistics
   */
  const loadStats = useCallback(async (assessmentId: string): Promise<void> => {
    try {
      setError(null);

      const stats = await getAssessmentStats(assessmentId);

      setState((prev) => ({
        ...prev,
        stats,
      }));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load statistics";
      setError(errorMessage);
    }
  }, []);

  /**
   * Pause the current assessment
   */
  const pauseCurrentAssessment = useCallback(
    async (assessmentId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const assessment = await pauseAssessment(assessmentId);

        setState((prev) => ({
          ...prev,
          assessment,
          loading: false,
        }));
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to pause assessment";
        setError(errorMessage);
        setLoading(false);
      }
    },
    []
  );

  /**
   * Resume a paused assessment
   */
  const resumeCurrentAssessment = useCallback(
    async (assessmentId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const assessment = await resumeAssessment(assessmentId);

        setState((prev) => ({
          ...prev,
          assessment,
          loading: false,
        }));

        // Load current question for resumed assessment
        await loadCurrentQuestion(assessmentId);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to resume assessment";
        setError(errorMessage);
        setLoading(false);
      }
    },
    []
  );

  /**
   * Complete the current assessment
   */
  const completeCurrentAssessment = useCallback(
    async (assessmentId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const assessment = await completeAssessment(assessmentId);

        setState((prev) => ({
          ...prev,
          assessment,
          loading: false,
        }));

        // Load final stats
        await loadStats(assessmentId);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to complete assessment";
        setError(errorMessage);
        setLoading(false);
      }
    },
    []
  );

  return {
    ...state,
    startAssessment,
    loadAssessment,
    loadCurrentQuestion,
    submitQuestionAnswer,
    loadStats,
    pauseCurrentAssessment,
    resumeCurrentAssessment,
    completeCurrentAssessment,
    resetState,
    clearError,
  };
};
