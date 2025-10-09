import { authAxios } from "./index";

export type GroupLevel = "A" | "B" | "C" | "D" | "E";
export type Subject = "hindi" | "math" | "english";

export interface Group {
  _id: string;
  name: string;
  level: GroupLevel;
  subject: Subject;
  school: {
    _id: string;
    name: string;
  };
  mentor?: {
    _id: string;
    name: string;
    email: string;
  };
  students: Array<{
    _id: string;
    name: string;
    roll_no: string;
    class: string;
    hindi_level?: number;
    math_level?: number;
    english_level?: number;
  }>;
  description?: string;
  minLevel: number;
  maxLevel: number;
  capacity: number;
  autoAssignment: boolean;
  studentCount?: number;
  availableSpots?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  level: GroupLevel;
  subject: Subject;
  schoolId: string;
  mentorId?: string;
  description?: string;
  minLevel: number;
  maxLevel: number;
  capacity?: number;
  autoAssignment?: boolean;
}

export interface UpdateGroupRequest {
  name?: string;
  level?: GroupLevel;
  subject?: Subject;
  mentorId?: string;
  description?: string;
  minLevel?: number;
  maxLevel?: number;
  capacity?: number;
  autoAssignment?: boolean;
}

export interface AutoAssignRequest {
  schoolId: string;
  subject: Subject;
}

export interface AutoAssignResult {
  message: string;
  results: {
    assigned: number;
    alreadyAssigned: number;
    noSuitableGroup: number;
    errors: number;
  };
}

export interface GroupStatistics {
  _id: {
    level: GroupLevel;
    subject: Subject;
  };
  totalGroups: number;
  totalStudents: number;
  totalCapacity: number;
  avgStudentsPerGroup: number;
}

export interface GetGroupsParams {
  schoolId?: string;
  subject?: Subject;
  level?: GroupLevel;
  mentorId?: string;
}

// Get groups with optional filters
export const getGroups = async (params?: GetGroupsParams): Promise<Group[]> => {
  const searchParams = new URLSearchParams();

  if (params?.schoolId) searchParams.append("schoolId", params.schoolId);
  if (params?.subject) searchParams.append("subject", params.subject);
  if (params?.level) searchParams.append("level", params.level);
  if (params?.mentorId) searchParams.append("mentorId", params.mentorId);

  const queryString = searchParams.toString();
  const url = `/groups${queryString ? `?${queryString}` : ""}`;

  const response = await authAxios.get(url);
  return response.data;
};

// Get single group by ID
export const getGroupById = async (id: string): Promise<Group> => {
  const response = await authAxios.get(`/groups/${id}`);
  return response.data;
};

// Create new group
export const createGroup = async (
  groupData: CreateGroupRequest
): Promise<Group> => {
  const response = await authAxios.post("/groups", groupData);
  return response.data;
};

// Update existing group
export const updateGroup = async (
  id: string,
  groupData: UpdateGroupRequest
): Promise<Group> => {
  const response = await authAxios.put(`/groups/${id}`, groupData);
  return response.data;
};

// Delete group
export const deleteGroup = async (id: string): Promise<void> => {
  await authAxios.delete(`/groups/${id}`);
};

// Add student to group
export const addStudentToGroup = async (
  groupId: string,
  studentId: string
): Promise<Group> => {
  const response = await authAxios.post(`/groups/${groupId}/students`, {
    studentId,
  });
  return response.data;
};

// Remove student from group
export const removeStudentFromGroup = async (
  groupId: string,
  studentId: string
): Promise<Group> => {
  const response = await authAxios.delete(
    `/groups/${groupId}/students/${studentId}`
  );
  return response.data;
};

// Auto-assign students to groups
export const autoAssignStudentsToGroups = async (
  data: AutoAssignRequest
): Promise<AutoAssignResult> => {
  const response = await authAxios.post("/groups/auto-assign", data);
  return response.data;
};

// Get group statistics
export const getGroupStatistics = async (
  schoolId?: string,
  subject?: Subject
): Promise<GroupStatistics[]> => {
  try {
    const searchParams = new URLSearchParams();

    if (schoolId) searchParams.append("schoolId", schoolId);
    if (subject) searchParams.append("subject", subject);

    const queryString = searchParams.toString();
    const url = `/groups/statistics${queryString ? `?${queryString}` : ""}`;

    const response = await authAxios.get(url);

    // Ensure we return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn(
        "Group statistics API returned non-array data:",
        response.data
      );
      return [];
    }
  } catch (error) {
    console.error("Error fetching group statistics:", error);
    return [];
  }
};
