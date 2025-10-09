import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/attendance`;

export type AttendanceStatus = "present" | "absent" | "exam";
export type SessionType = "regular" | "assessment" | "review";

export interface Attendance {
  _id: string;
  student: {
    _id: string;
    name: string;
    roll_no: string;
    class: string;
  };
  school: {
    _id: string;
    name: string;
  };
  mentor: {
    _id: string;
    name: string;
  };
  date: string;
  status: AttendanceStatus;
  subject?: "hindi" | "math" | "english";
  sessionType: SessionType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceDTO {
  studentId: string;
  schoolId: string;
  date: string;
  status: AttendanceStatus;
  subject?: "hindi" | "math" | "english";
  sessionType?: SessionType;
  notes?: string;
}

export interface BulkAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  subject?: "hindi" | "math" | "english";
  sessionType?: SessionType;
  notes?: string;
}

export interface BulkAttendanceDTO {
  attendanceRecords: BulkAttendanceRecord[];
  schoolId: string;
  date: string;
}

export interface AttendanceFilters {
  schoolId?: string;
  studentId?: string;
  mentorId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  subject?: "hindi" | "math" | "english";
}

export interface AttendanceStats {
  overallStats: Array<{
    _id: AttendanceStatus;
    count: number;
  }>;
  studentStats: Array<{
    _id: string;
    studentInfo: {
      name: string;
      roll_no: string;
      class: string;
    };
    present: number;
    absent: number;
    exam: number;
    totalDays: number;
    attendancePercentage: number;
  }>;
}

export interface DailyAttendanceRecord {
  student: {
    _id: string;
    name: string;
    roll_no: string;
    class: string;
  };
  attendance: Attendance | null;
  status: AttendanceStatus | null;
}

// Get attendance records with filters
export const getAttendanceRecords = async (
  filters?: AttendanceFilters
): Promise<Attendance[]> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await authAxios.get(`${baseUrl}?${params.toString()}`);
  return response.data;
};

// Mark attendance for a single student
export const markAttendance = async (
  data: CreateAttendanceDTO
): Promise<Attendance> => {
  const response = await authAxios.post(baseUrl, data);
  return response.data;
};

// Bulk mark attendance for multiple students
export const bulkMarkAttendance = async (
  data: BulkAttendanceDTO
): Promise<{
  success: number;
  errorCount: number;
  results: Attendance[];
  errors: Array<{ studentId: string; error: string }>;
}> => {
  const response = await authAxios.post(`${baseUrl}/bulk`, data);
  return response.data;
};

// Get attendance statistics
export const getAttendanceStats = async (filters?: {
  schoolId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceStats> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await authAxios.get(`${baseUrl}/stats?${params.toString()}`);
  return response.data;
};

// Get daily attendance for a specific date and school
export const getDailyAttendance = async (
  schoolId: string,
  date: string,
  subject?: "hindi" | "math" | "english"
): Promise<DailyAttendanceRecord[]> => {
  const params = new URLSearchParams({
    schoolId,
    date,
  });

  if (subject) {
    params.append("subject", subject);
  }

  const response = await authAxios.get(`${baseUrl}/daily?${params.toString()}`);
  return response.data;
};
