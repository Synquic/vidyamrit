import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/views`;

export type StakeholderType =
  | "principal"
  | "director"
  | "education_minister"
  | "block_coordinator"
  | "district_coordinator"
  | "state_coordinator"
  | "custom";

export interface ViewConfig {
  sections: {
    schools?: {
      enabled: boolean;
      showTotal?: boolean;
      showActive?: boolean;
      showWithAssessments?: boolean;
      filters?: {
        block?: string[];
        state?: string[];
        type?: ("government" | "private")[];
      };
    };
    tutors?: {
      enabled: boolean;
      showTotal?: boolean;
      filters?: {
        schoolId?: string[];
      };
    };
    students?: {
      enabled: boolean;
      showTotal?: boolean;
      showActive?: boolean;
      showDropped?: boolean;
      filters?: {
        schoolId?: string[];
        block?: string[];
        state?: string[];
      };
    };
    cohorts?: {
      enabled: boolean;
      showTotal?: boolean;
      filters?: {
        schoolId?: string[];
        programId?: string[];
      };
    };
    assessments?: {
      enabled: boolean;
      showTotal?: boolean;
      filters?: {
        schoolId?: string[];
        programId?: string[];
        dateRange?: { start: string; end: string };
      };
    };
    progress?: {
      enabled: boolean;
      views?: (
        | "group"
        | "student"
        | "school"
        | "block"
        | "district"
        | "state"
        | "cohort"
        | "program"
      )[];
      filters?: {
        schoolId?: string[];
        programId?: string[];
        block?: string[];
        state?: string[];
      };
    };
    attendance?: {
      enabled: boolean;
      views?: ("student" | "cohort" | "school" | "block" | "state")[];
      filters?: {
        schoolId?: string[];
        cohortId?: string[];
        dateRange?: { start: string; end: string };
      };
    };
  };
  access: {
    allowedSchools?: string[];
    allowedBlocks?: string[];
    allowedStates?: string[];
  };
}

export interface View {
  _id: string;
  name: string;
  description?: string;
  stakeholderType: StakeholderType;
  customStakeholderType?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  config: ViewConfig;
  viewUser: {
    email: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateViewDTO {
  name: string;
  description?: string;
  stakeholderType: StakeholderType;
  customStakeholderType?: string;
  config: ViewConfig;
  viewUser: {
    email: string;
    password: string;
  };
}

export interface UpdateViewDTO {
  name?: string;
  description?: string;
  stakeholderType?: StakeholderType;
  customStakeholderType?: string;
  config?: ViewConfig;
}

export interface ViewData {
  viewId: string;
  viewName: string;
  data: {
    schools?: {
      total?: number;
      active?: number;
      withAssessments?: number;
      details?: Array<{
        schoolId: string;
        name: string;
        udise_code: string;
        type: string;
        block: string;
        state: string;
        city: string;
        level: string;
        studentCount: number;
        cohortCount: number;
        activeCohortCount: number;
        tutorCount: number;
        assessmentCount: number;
        pointOfContact: string;
        phone: string;
      }>;
    };
    tutors?: {
      total?: number;
      engaged?: number;
      details?: Array<{
        tutorId: string;
        name: string;
        email: string;
        phoneNo: string;
        school: {
          schoolId: string;
          name: string;
          block: string;
          state: string;
        } | null;
        cohortCount: number;
        activeCohortCount: number;
        studentCount: number;
        isActive: boolean;
      }>;
    };
    students?: {
      total?: number;
      active?: number;
      dropped?: number;
      details?: Array<{
        studentId: string;
        roll_no?: string;
        name: string;
        age: number;
        gender: string;
        class: string;
        school: {
          schoolId: string;
          name: string;
          block: string;
        } | null;
        cohortCount: number;
        activeCohortCount: number;
        assessmentCount: number;
        latestAssessment: {
          type: string;
          level: number;
          date: string;
        } | null;
        isArchived: boolean;
      }>;
    };
    cohorts?: {
      total?: number;
      active?: number;
      details?: Array<{
        cohortId: string;
        name: string;
        school: {
          schoolId: string;
          name: string;
          block: string;
        } | null;
        tutor: {
          tutorId: string;
          name: string;
          email: string;
        } | null;
        program: {
          programId: string;
          name: string;
          subject: string;
        } | null;
        currentLevel: number;
        studentCount: number;
        attendanceRate: number;
        averageLevel: number;
        status: string;
        startDate: string;
      }>;
    };
    assessments?: {
      total?: number;
      programAssessments?: number;
      regularAssessments?: number;
      details?: Array<{
        assessmentId: string;
        type: string;
        level: number;
        score: number | null;
        student: {
          name: string;
          roll_no?: string;
          class: string;
        } | null;
        school: {
          name: string;
          block: string;
        } | null;
        program: {
          name: string;
          subject: string;
        } | null;
        date: string;
      }>;
    };
    progress?: {
      student?: Array<{
        studentId: string;
        name: string;
        latestLevel: number;
        progressFlags: any;
      }>;
      cohort?: Array<{
        cohortId: string;
        name: string;
        currentLevel: number;
        status: string;
        progressCount: number;
      }>;
      school?: Array<{
        schoolId: string;
        name: string;
        block?: string;
        state: string;
        studentCount: number;
        cohortCount: number;
      }>;
      block?: Array<{
        block: string;
        schoolCount: number;
        studentCount: number;
        cohortCount: number;
      }>;
      state?: Array<{
        state: string;
        schoolCount: number;
        studentCount: number;
        cohortCount: number;
      }>;
      program?: Array<{
        programId: string;
        name: string;
        subject: string;
        cohortCount: number;
        studentCount: number;
      }>;
    };
    attendance?: {
      student?: Array<{
        studentId: string;
        studentName: string;
        present: number;
        absent: number;
        total: number;
        attendanceRate: number;
      }>;
      cohort?: Array<{
        cohortId: string;
        name: string;
        studentCount: number;
        present: number;
        absent: number;
        total: number;
        attendanceRate: number;
      }>;
      school?: Array<{
        schoolId: string;
        schoolName: string;
        present: number;
        absent: number;
        total: number;
        attendanceRate: number;
      }>;
      block?: Array<{
        block: string;
        present: number;
        absent: number;
        total: number;
        attendanceRate: number;
      }>;
      state?: Array<{
        state: string;
        present: number;
        absent: number;
        total: number;
        attendanceRate: number;
      }>;
    };
  };
}

/**
 * Get all views
 */
export const getViews = async (): Promise<View[]> => {
  const response = await authAxios.get(baseUrl);
  return response.data;
};

/**
 * Get a single view by ID
 */
export const getView = async (id: string): Promise<View> => {
  const response = await authAxios.get(`${baseUrl}/${id}`);
  return response.data;
};

/**
 * Create a new view
 */
export const createView = async (data: CreateViewDTO): Promise<View> => {
  const response = await authAxios.post(baseUrl, data);
  return response.data;
};

/**
 * Update a view
 */
export const updateView = async (
  id: string,
  data: UpdateViewDTO
): Promise<View> => {
  const response = await authAxios.put(`${baseUrl}/${id}`, data);
  return response.data;
};

/**
 * Delete a view
 */
export const deleteView = async (id: string): Promise<void> => {
  await authAxios.delete(`${baseUrl}/${id}`);
};

/**
 * Get aggregated data for a view
 */
export const getViewData = async (id: string): Promise<ViewData> => {
  const response = await authAxios.get(`${baseUrl}/${id}/data`);
  return response.data;
};

/**
 * Activate/Deactivate a view
 */
export const activateView = async (
  id: string,
  isActive: boolean
): Promise<View> => {
  const response = await authAxios.put(`${baseUrl}/${id}/activate`, {
    isActive,
  });
  return response.data;
};

/**
 * Get current user's view (for view users)
 */
export const getMyView = async (): Promise<View> => {
  const response = await authAxios.get(`${baseUrl}/me/view`);
  return response.data;
};

/**
 * Get current user's view data (for view users)
 */
export const getMyViewData = async (): Promise<ViewData> => {
  const response = await authAxios.get(`${baseUrl}/me/data`);
  return response.data;
};

