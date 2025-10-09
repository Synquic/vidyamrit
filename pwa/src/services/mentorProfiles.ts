import { apiUrl } from "./index";

const API_BASE_URL = apiUrl;

export type Specialization =
  | "hindi"
  | "math"
  | "english"
  | "general"
  | "remedial"
  | "advanced";
export type PerformanceRating = 1 | 2 | 3 | 4 | 5;
export type AssignmentStatus = "active" | "completed" | "on_hold" | "cancelled";
export type WorkType = "full_time" | "part_time" | "contract" | "volunteer";
export type MentorStatus =
  | "active"
  | "inactive"
  | "on_leave"
  | "probation"
  | "terminated";

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
  grade?: string;
}

export interface Experience {
  role: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

export interface PerformanceMetric {
  period: string;
  studentsAssigned: number;
  averageStudentImprovement: number;
  attendanceRate: number;
  assessmentCompletionRate: number;
  parentSatisfactionScore?: number;
  adminRating?: PerformanceRating;
  notes?: string;
  createdAt: string;
}

export interface Assignment {
  _id: string;
  type: "student" | "group" | "cohort";
  targetId: string;
  targetName: string;
  subject?: Specialization;
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
  priority: "low" | "medium" | "high";
  notes?: string;
  goals?: string[];
  progress?: number;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verificationUrl?: string;
}

export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Feedback {
  rating: number;
  comment?: string;
  date: string;
  studentId?: {
    _id: string;
    name: string;
  };
  adminId?: {
    _id: string;
    name: string;
  };
}

export interface MentorProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phoneNo: string;
    schoolId?: {
      _id: string;
      name: string;
    };
  };
  personalInfo: {
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      relation: string;
      phone: string;
    };
    languages: string[];
    profilePicture?: string;
  };
  professionalInfo: {
    employeeId?: string;
    joinDate: string;
    department?: string;
    position: string;
    salary?: number;
    workType: WorkType;
    specializations: Specialization[];
    maxStudents: number;
    currentStudents: number;
  };
  qualifications: Qualification[];
  experience: Experience[];
  certifications: Certification[];
  performanceMetrics: PerformanceMetric[];
  assignments: Assignment[];
  availability: Availability[];
  preferences: {
    preferredSubjects: Specialization[];
    preferredStudentLevels: number[];
    maxClassSize?: number;
    teachingStyle?: string;
    communicationPreferences: string[];
  };
  skills: {
    technicalSkills: string[];
    softSkills: string[];
    languageProficiency: Array<{
      language: string;
      level: "basic" | "intermediate" | "advanced" | "native";
    }>;
  };
  feedback: {
    fromStudents: Feedback[];
    fromParents: Feedback[];
    fromAdmins: Feedback[];
  };
  status: MentorStatus;
  overallRating?: number;
  workloadPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorProfileRequest {
  userId: string;
  personalInfo?: Partial<MentorProfile["personalInfo"]>;
  professionalInfo?: Partial<MentorProfile["professionalInfo"]>;
  qualifications?: Qualification[];
  experience?: Experience[];
  certifications?: Certification[];
}

export interface UpdateMentorProfileRequest {
  personalInfo?: Partial<MentorProfile["personalInfo"]>;
  professionalInfo?: Partial<MentorProfile["professionalInfo"]>;
  qualifications?: Qualification[];
  experience?: Experience[];
  certifications?: Certification[];
  preferences?: Partial<MentorProfile["preferences"]>;
  skills?: Partial<MentorProfile["skills"]>;
  availability?: Availability[];
  status?: MentorStatus;
}

export interface GetMentorProfilesParams {
  schoolId?: string;
  specialization?: Specialization;
  status?: MentorStatus;
  workType?: WorkType;
  available?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MentorProfilesResponse {
  mentors: MentorProfile[];
  pagination: {
    current: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PerformanceMetricRequest {
  period: string;
  studentsAssigned: number;
  averageStudentImprovement: number;
  attendanceRate: number;
  assessmentCompletionRate: number;
  parentSatisfactionScore?: number;
  adminRating?: PerformanceRating;
  notes?: string;
}

export interface AssignmentRequest {
  type: "student" | "group" | "cohort";
  targetId: string;
  targetName: string;
  subject?: Specialization;
  priority?: "low" | "medium" | "high";
  notes?: string;
  goals?: string[];
}

export interface FeedbackRequest {
  type: "student" | "parent" | "admin";
  rating: PerformanceRating;
  comment?: string;
  studentId?: string;
  adminId?: string;
}

export interface MentorStatistics {
  totalMentors: number;
  activeMentors: number;
  totalStudentsAssigned: number;
  averageWorkload: number;
  averageRating: number;
  specializationDistribution: Record<string, number>;
  workTypeDistribution: Record<string, number>;
  capacityUtilization: number;
}

// Get mentor profiles with filters and pagination
export const getMentorProfiles = async (
  params?: GetMentorProfilesParams
): Promise<MentorProfilesResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.schoolId) searchParams.append("schoolId", params.schoolId);
  if (params?.specialization)
    searchParams.append("specialization", params.specialization);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.workType) searchParams.append("workType", params.workType);
  if (params?.available)
    searchParams.append("available", params.available.toString());
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/mentor-profiles${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch mentor profiles");
  }

  return response.json();
};

// Get single mentor profile by ID
export const getMentorProfileById = async (
  id: string
): Promise<MentorProfile> => {
  const response = await fetch(`${API_BASE_URL}/mentor-profiles/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch mentor profile");
  }

  return response.json();
};

// Create new mentor profile
export const createMentorProfile = async (
  data: CreateMentorProfileRequest
): Promise<MentorProfile> => {
  const response = await fetch(`${API_BASE_URL}/mentor-profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create mentor profile");
  }

  return response.json();
};

// Update mentor profile
export const updateMentorProfile = async (
  id: string,
  data: UpdateMentorProfileRequest
): Promise<MentorProfile> => {
  const response = await fetch(`${API_BASE_URL}/mentor-profiles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update mentor profile");
  }

  return response.json();
};

// Add performance metric
export const addPerformanceMetric = async (
  id: string,
  data: PerformanceMetricRequest
): Promise<{ message: string; metric: PerformanceMetric }> => {
  const response = await fetch(
    `${API_BASE_URL}/mentor-profiles/${id}/performance`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add performance metric");
  }

  return response.json();
};

// Assign to mentor
export const assignToMentor = async (
  id: string,
  data: AssignmentRequest
): Promise<{ message: string; assignment: Assignment }> => {
  const response = await fetch(
    `${API_BASE_URL}/mentor-profiles/${id}/assignments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to assign to mentor");
  }

  return response.json();
};

// Update assignment
export const updateAssignment = async (
  id: string,
  assignmentId: string,
  data: Partial<Assignment>
): Promise<{ message: string; assignment: Assignment }> => {
  const response = await fetch(
    `${API_BASE_URL}/mentor-profiles/${id}/assignments/${assignmentId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update assignment");
  }

  return response.json();
};

// Add feedback
export const addFeedback = async (
  id: string,
  data: FeedbackRequest
): Promise<{ message: string; feedback: Feedback }> => {
  const response = await fetch(
    `${API_BASE_URL}/mentor-profiles/${id}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add feedback");
  }

  return response.json();
};

// Get mentor statistics
export const getMentorStatistics = async (
  schoolId?: string,
  period?: string
): Promise<MentorStatistics> => {
  const searchParams = new URLSearchParams();

  if (schoolId) searchParams.append("schoolId", schoolId);
  if (period) searchParams.append("period", period);

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/mentor-profiles/statistics${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch mentor statistics");
  }

  return response.json();
};

// Helper functions
export const getWorkTypeLabel = (workType: WorkType): string => {
  const labels = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    volunteer: "Volunteer",
  };
  return labels[workType] || workType;
};

export const getSpecializationLabel = (
  specialization: Specialization
): string => {
  const labels = {
    hindi: "Hindi",
    math: "Mathematics",
    english: "English",
    general: "General Education",
    remedial: "Remedial Education",
    advanced: "Advanced Learning",
  };
  return labels[specialization] || specialization;
};

export const getStatusColor = (status: MentorStatus): string => {
  const colors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    on_leave: "bg-yellow-100 text-yellow-800",
    probation: "bg-orange-100 text-orange-800",
    terminated: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getWorkloadColor = (percentage: number): string => {
  if (percentage >= 90) return "text-red-600";
  if (percentage >= 70) return "text-yellow-600";
  if (percentage >= 50) return "text-blue-600";
  return "text-green-600";
};
