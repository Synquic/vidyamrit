import { api } from "@/lib/api";

// Enums matching backend
export enum EvaluationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  APPROVED = "approved",
  REJECTED = "rejected",
  REVISION_REQUIRED = "revision_required",
}

export enum EvaluationCategory {
  INFRASTRUCTURE = "infrastructure",
  ACADEMIC_STANDARDS = "academic_standards",
  FACULTY_QUALITY = "faculty_quality",
  STUDENT_FACILITIES = "student_facilities",
  TECHNOLOGY_READINESS = "technology_readiness",
  ADMINISTRATIVE_CAPACITY = "administrative_capacity",
  SAFETY_SECURITY = "safety_security",
  FINANCIAL_STABILITY = "financial_stability",
}

export enum EvaluationRating {
  EXCELLENT = 5,
  GOOD = 4,
  SATISFACTORY = 3,
  NEEDS_IMPROVEMENT = 2,
  POOR = 1,
}

// TypeScript interfaces
export interface EvaluationCriterion {
  name: string;
  description: string;
  rating: EvaluationRating;
  score: number;
  maxScore: number;
  comments: string;
  evidence: string[];
  evaluatedBy: string;
  evaluatedAt: Date;
}

export interface EvaluationCategoryData {
  category: EvaluationCategory;
  criteria: EvaluationCriterion[];
  overallRating: EvaluationRating;
  totalScore: number;
  maxScore: number;
  weightage: number;
  recommendations: string[];
}

export interface DocumentSubmission {
  _id?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedBy?: string;
  verificationComments?: string;
}

export interface VisitSchedule {
  _id?: string;
  visitType: "initial" | "follow_up" | "final";
  scheduledDate: Date;
  duration: number;
  evaluators: string[];
  agenda: string[];
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  completedAt?: Date;
  visitReport?: string;
}

export interface ActionItem {
  _id?: string;
  title: string;
  description: string;
  category: EvaluationCategory;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  completedAt?: Date;
  completionEvidence?: string[];
  comments: string[];
  createdBy: string;
  createdAt: Date;
}

export interface EvaluationTimeline {
  phase: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "completed" | "delayed";
  milestones: {
    name: string;
    dueDate: Date;
    completed: boolean;
    completedAt?: Date;
  }[];
}

export interface SchoolEvaluation {
  _id: string;
  schoolId: {
    _id: string;
    name: string;
    location?: string;
    contactEmail?: string;
  };
  evaluationCode: string;
  evaluationRound: number;
  initiatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedEvaluators: {
    _id: string;
    name: string;
    email: string;
  }[];
  leadEvaluator: {
    _id: string;
    name: string;
    email: string;
  };
  status: EvaluationStatus;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  timeline: EvaluationTimeline[];
  categories: EvaluationCategoryData[];
  overallScore: number;
  maxOverallScore: number;
  overallRating: EvaluationRating;
  requiredDocuments: string[];
  submittedDocuments: DocumentSubmission[];
  documentCompletionPercentage: number;
  visits: VisitSchedule[];
  actionItems: ActionItem[];
  recommendations: string[];
  evaluationSummary: string;
  decision: "approved" | "conditional_approval" | "rejected" | "pending";
  decisionDate?: Date;
  decisionBy?: string;
  decisionReason: string;
  conditions: string[];
  nextEvaluationDate?: Date;
  followUpRequired: boolean;
  followUpItems: string[];
  complianceScore: number;
  certificationLevel: "basic" | "standard" | "premium" | "none";
  certificationValidUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface CreateSchoolEvaluationRequest {
  schoolId: string;
  assignedEvaluators: string[];
  leadEvaluator: string;
  expectedEndDate: Date;
  requiredDocuments?: string[];
  timeline?: EvaluationTimeline[];
}

export interface AddEvaluationCategoryRequest {
  category: EvaluationCategory;
  criteria: Omit<EvaluationCriterion, "evaluatedBy" | "evaluatedAt">[];
  weightage: number;
}

export interface AddActionItemRequest {
  title: string;
  description: string;
  category: EvaluationCategory;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  dueDate: Date;
}

export interface ScheduleVisitRequest {
  visitType: "initial" | "follow_up" | "final";
  scheduledDate: Date;
  duration: number;
  evaluators: string[];
  agenda: string[];
}

export interface SubmitDocumentRequest {
  documentType: string;
  fileName: string;
  fileUrl: string;
}

export interface VerifyDocumentRequest {
  verificationStatus: "verified" | "rejected";
  comments?: string;
}

export interface FinalizeDecisionRequest {
  decision: "approved" | "conditional_approval" | "rejected";
  decisionReason: string;
  conditions?: string[];
}

export interface EvaluationStatistics {
  totalEvaluations: number;
  pendingEvaluations: number;
  inProgressEvaluations: number;
  completedEvaluations: number;
  approvedEvaluations: number;
  rejectedEvaluations: number;
  averageScore: number;
  averageComplianceScore: number;
}

export interface GetSchoolEvaluationsParams {
  schoolId?: string;
  status?: EvaluationStatus;
  leadEvaluator?: string;
  evaluationRound?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// API Functions
export const getSchoolEvaluations = async (
  params?: GetSchoolEvaluationsParams
) => {
  const response = await api.get("/school-evaluations", { params });
  return response.data;
};

export const getSchoolEvaluationById = async (
  id: string
): Promise<{ evaluation: SchoolEvaluation }> => {
  const response = await api.get(`/school-evaluations/${id}`);
  return response.data;
};

export const createSchoolEvaluation = async (
  data: CreateSchoolEvaluationRequest
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.post("/school-evaluations", data);
  return response.data;
};

export const updateSchoolEvaluation = async (
  id: string,
  data: Partial<SchoolEvaluation>
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.put(`/school-evaluations/${id}`, data);
  return response.data;
};

export const addEvaluationCategory = async (
  id: string,
  data: AddEvaluationCategoryRequest
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.post(`/school-evaluations/${id}/categories`, data);
  return response.data;
};

export const addActionItem = async (
  id: string,
  data: AddActionItemRequest
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.post(
    `/school-evaluations/${id}/action-items`,
    data
  );
  return response.data;
};

export const completeActionItem = async (
  id: string,
  actionItemId: string,
  evidence?: string[]
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.put(
    `/school-evaluations/${id}/action-items/${actionItemId}/complete`,
    { evidence }
  );
  return response.data;
};

export const scheduleEvaluationVisit = async (
  id: string,
  data: ScheduleVisitRequest
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.post(`/school-evaluations/${id}/visits`, data);
  return response.data;
};

export const submitEvaluationDocument = async (
  id: string,
  data: SubmitDocumentRequest
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.post(`/school-evaluations/${id}/documents`, data);
  return response.data;
};

export const verifyEvaluationDocument = async (
  id: string,
  documentId: string,
  data: VerifyDocumentRequest
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.put(
    `/school-evaluations/${id}/documents/${documentId}/verify`,
    data
  );
  return response.data;
};

export const finalizeEvaluationDecision = async (
  id: string,
  data: FinalizeDecisionRequest
): Promise<{ evaluation: SchoolEvaluation; message: string }> => {
  const response = await api.put(`/school-evaluations/${id}/finalize`, data);
  return response.data;
};

export const getEvaluationStatistics = async (params?: {
  schoolId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{
  statistics: EvaluationStatistics;
  certificationLevels: { _id: string; count: number }[];
}> => {
  const response = await api.get("/school-evaluations/statistics", { params });
  return response.data;
};

export const generateEvaluationReport = async (
  id: string
): Promise<{ report: Record<string, unknown>; message: string }> => {
  const response = await api.get(`/school-evaluations/${id}/report`);
  return response.data;
};

export const deleteSchoolEvaluation = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/school-evaluations/${id}`);
  return response.data;
};

// Helper functions
export const getEvaluationStatusLabel = (status: EvaluationStatus): string => {
  const labels: Record<EvaluationStatus, string> = {
    [EvaluationStatus.PENDING]: "Pending",
    [EvaluationStatus.IN_PROGRESS]: "In Progress",
    [EvaluationStatus.COMPLETED]: "Completed",
    [EvaluationStatus.APPROVED]: "Approved",
    [EvaluationStatus.REJECTED]: "Rejected",
    [EvaluationStatus.REVISION_REQUIRED]: "Revision Required",
  };
  return labels[status];
};

export const getEvaluationCategoryLabel = (
  category: EvaluationCategory
): string => {
  const labels: Record<EvaluationCategory, string> = {
    [EvaluationCategory.INFRASTRUCTURE]: "Infrastructure",
    [EvaluationCategory.ACADEMIC_STANDARDS]: "Academic Standards",
    [EvaluationCategory.FACULTY_QUALITY]: "Faculty Quality",
    [EvaluationCategory.STUDENT_FACILITIES]: "Student Facilities",
    [EvaluationCategory.TECHNOLOGY_READINESS]: "Technology Readiness",
    [EvaluationCategory.ADMINISTRATIVE_CAPACITY]: "Administrative Capacity",
    [EvaluationCategory.SAFETY_SECURITY]: "Safety & Security",
    [EvaluationCategory.FINANCIAL_STABILITY]: "Financial Stability",
  };
  return labels[category];
};

export const getEvaluationRatingLabel = (rating: EvaluationRating): string => {
  const labels: Record<EvaluationRating, string> = {
    [EvaluationRating.EXCELLENT]: "Excellent",
    [EvaluationRating.GOOD]: "Good",
    [EvaluationRating.SATISFACTORY]: "Satisfactory",
    [EvaluationRating.NEEDS_IMPROVEMENT]: "Needs Improvement",
    [EvaluationRating.POOR]: "Poor",
  };
  return labels[rating];
};

export const getStatusColor = (status: EvaluationStatus): string => {
  const colors: Record<EvaluationStatus, string> = {
    [EvaluationStatus.PENDING]: "text-gray-600 bg-gray-100",
    [EvaluationStatus.IN_PROGRESS]: "text-blue-600 bg-blue-100",
    [EvaluationStatus.COMPLETED]: "text-green-600 bg-green-100",
    [EvaluationStatus.APPROVED]: "text-emerald-600 bg-emerald-100",
    [EvaluationStatus.REJECTED]: "text-red-600 bg-red-100",
    [EvaluationStatus.REVISION_REQUIRED]: "text-yellow-600 bg-yellow-100",
  };
  return colors[status];
};

export const getRatingColor = (rating: EvaluationRating): string => {
  const colors: Record<EvaluationRating, string> = {
    [EvaluationRating.EXCELLENT]: "text-emerald-600 bg-emerald-100",
    [EvaluationRating.GOOD]: "text-green-600 bg-green-100",
    [EvaluationRating.SATISFACTORY]: "text-blue-600 bg-blue-100",
    [EvaluationRating.NEEDS_IMPROVEMENT]: "text-yellow-600 bg-yellow-100",
    [EvaluationRating.POOR]: "text-red-600 bg-red-100",
  };
  return colors[rating];
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: "text-gray-600 bg-gray-100",
    medium: "text-blue-600 bg-blue-100",
    high: "text-orange-600 bg-orange-100",
    critical: "text-red-600 bg-red-100",
  };
  return colors[priority] || "text-gray-600 bg-gray-100";
};
