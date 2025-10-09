import { api } from "@/lib/api";

// Enums matching backend
export enum OnboardingStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ON_HOLD = "on_hold",
  CANCELLED = "cancelled",
}

export enum OnboardingStepStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SKIPPED = "skipped",
  BLOCKED = "blocked",
}

export enum OnboardingPhase {
  INITIAL_SETUP = "initial_setup",
  DOCUMENTATION = "documentation",
  INFRASTRUCTURE_SETUP = "infrastructure_setup",
  STAFF_TRAINING = "staff_training",
  SYSTEM_INTEGRATION = "system_integration",
  PILOT_TESTING = "pilot_testing",
  GO_LIVE = "go_live",
  POST_LAUNCH_SUPPORT = "post_launch_support",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// TypeScript interfaces
export interface OnboardingTask {
  _id?: string;
  title: string;
  description: string;
  instructions: string[];
  phase: OnboardingPhase;
  priority: TaskPriority;
  estimatedDuration: number;
  dependencies: string[];
  assignedTo: string[];
  status: OnboardingStepStatus;
  startDate?: Date;
  dueDate: Date;
  completedDate?: Date;
  completionPercentage: number;
  completionEvidence: string[];
  blockers: string[];
  comments: {
    userId: string;
    comment: string;
    timestamp: Date;
  }[];
  resources: {
    name: string;
    type: "document" | "video" | "link" | "software";
    url: string;
    description?: string;
  }[];
}

export interface OnboardingMilestone {
  _id?: string;
  name: string;
  description: string;
  phase: OnboardingPhase;
  targetDate: Date;
  completedDate?: Date;
  isCompleted: boolean;
  completionCriteria: string[];
  signOffRequired: boolean;
  signOffBy?: string[];
  signedOffBy?: {
    userId: string;
    signedAt: Date;
    comments?: string;
  }[];
}

export interface TrainingSession {
  _id?: string;
  title: string;
  description: string;
  type: "online" | "in_person" | "hybrid";
  scheduledDate: Date;
  duration: number;
  trainer: string;
  attendees: {
    userId: string;
    registrationStatus: "registered" | "attended" | "missed" | "excused";
    completionScore?: number;
    feedback?: string;
  }[];
  materials: {
    name: string;
    type: "presentation" | "manual" | "video" | "assessment";
    url: string;
  }[];
  prerequisites: string[];
  learningObjectives: string[];
  assessmentRequired: boolean;
  certificationAwarded: boolean;
}

export interface SystemSetup {
  component: string;
  description: string;
  configurationSteps: string[];
  status: OnboardingStepStatus;
  assignedTo: string;
  estimatedHours: number;
  actualHours?: number;
  testingRequired: boolean;
  testingCompleted: boolean;
  signOffRequired: boolean;
  signedOff: boolean;
  rollbackPlan: string;
}

export interface QualityGate {
  _id?: string;
  name: string;
  description: string;
  criteria: {
    criterion: string;
    requirement: string;
    status: "pending" | "met" | "not_met";
    evidence?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
  }[];
  overallStatus: "pending" | "passed" | "failed";
  approver: string;
  approvedDate?: Date;
  comments?: string;
}

export interface SupportTicket {
  _id?: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: "technical" | "training" | "process" | "other";
  priority: TaskPriority;
  status: "open" | "in_progress" | "resolved" | "closed";
  reportedBy: string;
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  satisfaction?: number;
}

export interface SchoolOnboarding {
  _id: string;
  schoolId: {
    _id: string;
    name: string;
    location?: string;
    contactEmail?: string;
  };
  onboardingCode: string;
  initiatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  projectManager: {
    _id: string;
    name: string;
    email: string;
  };
  onboardingTeam: {
    _id: string;
    name: string;
    email: string;
  }[];
  schoolContacts: {
    role: string;
    userId: string;
    primary: boolean;
  }[];
  status: OnboardingStatus;
  startDate: Date;
  plannedEndDate: Date;
  actualEndDate?: Date;
  currentPhase: OnboardingPhase;
  tasks: OnboardingTask[];
  milestones: OnboardingMilestone[];
  qualityGates: QualityGate[];
  trainingSessions: TrainingSession[];
  systemSetups: SystemSetup[];
  supportTickets: SupportTicket[];
  overallProgress: number;
  phaseProgress: {
    phase: OnboardingPhase;
    progress: number;
    status: OnboardingStepStatus;
  }[];
  onboardingDocuments: {
    name: string;
    type: string;
    url: string;
    version: string;
    uploadedAt: Date;
    uploadedBy: string;
  }[];
  communications: {
    type: "email" | "meeting" | "call" | "message";
    subject: string;
    content: string;
    participants: string[];
    timestamp: Date;
    followUpRequired: boolean;
    followUpDate?: Date;
  }[];
  risks: {
    description: string;
    impact: "low" | "medium" | "high";
    probability: "low" | "medium" | "high";
    mitigation: string;
    owner: string;
    status: "open" | "mitigated" | "closed";
  }[];
  successCriteria: string[];
  kpis: {
    name: string;
    target: number;
    actual?: number;
    unit: string;
    achieved: boolean;
  }[];
  goLiveDate?: Date;
  stabilizationPeriod: number;
  postLaunchSupport: {
    supportLevel: "basic" | "standard" | "premium";
    supportUntil: Date;
    contactPerson: string;
  };
  schoolFeedback: {
    category: string;
    rating: number;
    comments: string;
    submittedBy: string;
    submittedAt: Date;
  }[];
  overallSatisfaction?: number;
  lessonsLearned: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSchoolOnboardingRequest {
  schoolId: string;
  projectManager: string;
  onboardingTeam: string[];
  schoolContacts?: {
    role: string;
    userId: string;
    primary: boolean;
  }[];
  plannedEndDate: Date;
  tasks?: Omit<OnboardingTask, "_id">[];
  milestones?: Omit<OnboardingMilestone, "_id">[];
  successCriteria?: string[];
}

export interface AddOnboardingTaskRequest {
  title: string;
  description: string;
  instructions: string[];
  phase: OnboardingPhase;
  priority: TaskPriority;
  estimatedDuration: number;
  dependencies: string[];
  assignedTo: string[];
  dueDate: Date;
  resources?: {
    name: string;
    type: "document" | "video" | "link" | "software";
    url: string;
    description?: string;
  }[];
}

export interface UpdateTaskProgressRequest {
  status?: OnboardingStepStatus;
  completionPercentage?: number;
  comments?: string;
  blockers?: string[];
}

export interface AddMilestoneRequest {
  name: string;
  description: string;
  phase: OnboardingPhase;
  targetDate: Date;
  completionCriteria: string[];
  signOffRequired: boolean;
  signOffBy?: string[];
}

export interface ScheduleTrainingRequest {
  title: string;
  description: string;
  type: "online" | "in_person" | "hybrid";
  scheduledDate: Date;
  duration: number;
  trainer: string;
  attendees: string[];
  materials?: {
    name: string;
    type: "presentation" | "manual" | "video" | "assessment";
    url: string;
  }[];
  prerequisites?: string[];
  learningObjectives?: string[];
  assessmentRequired?: boolean;
  certificationAwarded?: boolean;
}

export interface UpdateTrainingAttendanceRequest {
  attendeeId: string;
  registrationStatus: "registered" | "attended" | "missed" | "excused";
  completionScore?: number;
  feedback?: string;
}

export interface CreateSupportTicketRequest {
  title: string;
  description: string;
  category: "technical" | "training" | "process" | "other";
  priority: TaskPriority;
}

export interface UpdateSupportTicketRequest {
  status?: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  resolution?: string;
  satisfaction?: number;
}

export interface AddSchoolFeedbackRequest {
  category: string;
  rating: number;
  comments: string;
}

export interface OnboardingStatistics {
  totalOnboardings: number;
  notStartedOnboardings: number;
  inProgressOnboardings: number;
  completedOnboardings: number;
  onHoldOnboardings: number;
  averageProgress: number;
  averageSatisfaction: number;
}

export interface GetSchoolOnboardingsParams {
  schoolId?: string;
  status?: OnboardingStatus;
  currentPhase?: OnboardingPhase;
  projectManager?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// API Functions
export const getSchoolOnboardings = async (
  params?: GetSchoolOnboardingsParams
) => {
  const response = await api.get("/school-onboardings", { params });
  return response.data;
};

export const getSchoolOnboardingById = async (
  id: string
): Promise<{ onboarding: SchoolOnboarding }> => {
  const response = await api.get(`/school-onboardings/${id}`);
  return response.data;
};

export const createSchoolOnboarding = async (
  data: CreateSchoolOnboardingRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.post("/school-onboardings", data);
  return response.data;
};

export const updateSchoolOnboarding = async (
  id: string,
  data: Partial<SchoolOnboarding>
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.put(`/school-onboardings/${id}`, data);
  return response.data;
};

export const addOnboardingTask = async (
  id: string,
  data: AddOnboardingTaskRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.post(`/school-onboardings/${id}/tasks`, data);
  return response.data;
};

export const updateTaskProgress = async (
  id: string,
  taskId: string,
  data: UpdateTaskProgressRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.put(
    `/school-onboardings/${id}/tasks/${taskId}/progress`,
    data
  );
  return response.data;
};

export const completeOnboardingTask = async (
  id: string,
  taskId: string,
  evidence?: string[]
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.put(
    `/school-onboardings/${id}/tasks/${taskId}/complete`,
    { evidence }
  );
  return response.data;
};

export const addOnboardingMilestone = async (
  id: string,
  data: AddMilestoneRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.post(`/school-onboardings/${id}/milestones`, data);
  return response.data;
};

export const completeMilestone = async (
  id: string,
  milestoneId: string,
  signOffComments?: string
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.put(
    `/school-onboardings/${id}/milestones/${milestoneId}/complete`,
    { signOffComments }
  );
  return response.data;
};

export const scheduleTrainingSession = async (
  id: string,
  data: ScheduleTrainingRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.post(
    `/school-onboardings/${id}/training-sessions`,
    data
  );
  return response.data;
};

export const updateTrainingAttendance = async (
  id: string,
  sessionId: string,
  data: UpdateTrainingAttendanceRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.put(
    `/school-onboardings/${id}/training-sessions/${sessionId}/attendance`,
    data
  );
  return response.data;
};

export const createSupportTicket = async (
  id: string,
  data: CreateSupportTicketRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.post(
    `/school-onboardings/${id}/support-tickets`,
    data
  );
  return response.data;
};

export const updateSupportTicket = async (
  id: string,
  ticketId: string,
  data: UpdateSupportTicketRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.put(
    `/school-onboardings/${id}/support-tickets/${ticketId}`,
    data
  );
  return response.data;
};

export const addSchoolFeedback = async (
  id: string,
  data: AddSchoolFeedbackRequest
): Promise<{ onboarding: SchoolOnboarding; message: string }> => {
  const response = await api.post(`/school-onboardings/${id}/feedback`, data);
  return response.data;
};

export const getOnboardingStatistics = async (params?: {
  schoolId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{
  statistics: OnboardingStatistics;
  phaseDistribution: { _id: string; count: number }[];
}> => {
  const response = await api.get("/school-onboardings/statistics", { params });
  return response.data;
};

export const generateOnboardingReport = async (
  id: string
): Promise<{ report: Record<string, unknown>; message: string }> => {
  const response = await api.get(`/school-onboardings/${id}/report`);
  return response.data;
};

export const getBlockedTasks = async (
  id: string
): Promise<{ blockedTasks: OnboardingTask[] }> => {
  const response = await api.get(`/school-onboardings/${id}/blocked-tasks`);
  return response.data;
};

export const getUpcomingDeadlines = async (
  id: string,
  days = 7
): Promise<{ upcomingTasks: OnboardingTask[] }> => {
  const response = await api.get(
    `/school-onboardings/${id}/upcoming-deadlines`,
    { params: { days } }
  );
  return response.data;
};

export const deleteSchoolOnboarding = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/school-onboardings/${id}`);
  return response.data;
};

// Helper functions
export const getOnboardingStatusLabel = (status: OnboardingStatus): string => {
  const labels: Record<OnboardingStatus, string> = {
    [OnboardingStatus.NOT_STARTED]: "Not Started",
    [OnboardingStatus.IN_PROGRESS]: "In Progress",
    [OnboardingStatus.COMPLETED]: "Completed",
    [OnboardingStatus.ON_HOLD]: "On Hold",
    [OnboardingStatus.CANCELLED]: "Cancelled",
  };
  return labels[status];
};

export const getOnboardingPhaseLabel = (phase: OnboardingPhase): string => {
  const labels: Record<OnboardingPhase, string> = {
    [OnboardingPhase.INITIAL_SETUP]: "Initial Setup",
    [OnboardingPhase.DOCUMENTATION]: "Documentation",
    [OnboardingPhase.INFRASTRUCTURE_SETUP]: "Infrastructure Setup",
    [OnboardingPhase.STAFF_TRAINING]: "Staff Training",
    [OnboardingPhase.SYSTEM_INTEGRATION]: "System Integration",
    [OnboardingPhase.PILOT_TESTING]: "Pilot Testing",
    [OnboardingPhase.GO_LIVE]: "Go Live",
    [OnboardingPhase.POST_LAUNCH_SUPPORT]: "Post-Launch Support",
  };
  return labels[phase];
};

export const getTaskStatusLabel = (status: OnboardingStepStatus): string => {
  const labels: Record<OnboardingStepStatus, string> = {
    [OnboardingStepStatus.PENDING]: "Pending",
    [OnboardingStepStatus.IN_PROGRESS]: "In Progress",
    [OnboardingStepStatus.COMPLETED]: "Completed",
    [OnboardingStepStatus.SKIPPED]: "Skipped",
    [OnboardingStepStatus.BLOCKED]: "Blocked",
  };
  return labels[status];
};

export const getTaskPriorityLabel = (priority: TaskPriority): string => {
  const labels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: "Low",
    [TaskPriority.MEDIUM]: "Medium",
    [TaskPriority.HIGH]: "High",
    [TaskPriority.CRITICAL]: "Critical",
  };
  return labels[priority];
};

export const getOnboardingStatusColor = (status: OnboardingStatus): string => {
  const colors: Record<OnboardingStatus, string> = {
    [OnboardingStatus.NOT_STARTED]: "text-gray-600 bg-gray-100",
    [OnboardingStatus.IN_PROGRESS]: "text-blue-600 bg-blue-100",
    [OnboardingStatus.COMPLETED]: "text-green-600 bg-green-100",
    [OnboardingStatus.ON_HOLD]: "text-yellow-600 bg-yellow-100",
    [OnboardingStatus.CANCELLED]: "text-red-600 bg-red-100",
  };
  return colors[status];
};

export const getTaskStatusColor = (status: OnboardingStepStatus): string => {
  const colors: Record<OnboardingStepStatus, string> = {
    [OnboardingStepStatus.PENDING]: "text-gray-600 bg-gray-100",
    [OnboardingStepStatus.IN_PROGRESS]: "text-blue-600 bg-blue-100",
    [OnboardingStepStatus.COMPLETED]: "text-green-600 bg-green-100",
    [OnboardingStepStatus.SKIPPED]: "text-purple-600 bg-purple-100",
    [OnboardingStepStatus.BLOCKED]: "text-red-600 bg-red-100",
  };
  return colors[status];
};

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: "text-gray-600 bg-gray-100",
    [TaskPriority.MEDIUM]: "text-blue-600 bg-blue-100",
    [TaskPriority.HIGH]: "text-orange-600 bg-orange-100",
    [TaskPriority.CRITICAL]: "text-red-600 bg-red-100",
  };
  return colors[priority];
};

export const getPhaseColor = (phase: OnboardingPhase): string => {
  const colors: Record<OnboardingPhase, string> = {
    [OnboardingPhase.INITIAL_SETUP]: "text-blue-600 bg-blue-100",
    [OnboardingPhase.DOCUMENTATION]: "text-indigo-600 bg-indigo-100",
    [OnboardingPhase.INFRASTRUCTURE_SETUP]: "text-purple-600 bg-purple-100",
    [OnboardingPhase.STAFF_TRAINING]: "text-pink-600 bg-pink-100",
    [OnboardingPhase.SYSTEM_INTEGRATION]: "text-orange-600 bg-orange-100",
    [OnboardingPhase.PILOT_TESTING]: "text-yellow-600 bg-yellow-100",
    [OnboardingPhase.GO_LIVE]: "text-green-600 bg-green-100",
    [OnboardingPhase.POST_LAUNCH_SUPPORT]: "text-emerald-600 bg-emerald-100",
  };
  return colors[phase];
};
