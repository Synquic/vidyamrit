import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/test-reports`;

export interface TestReport {
  _id: string;
  student: string | { _id: string; name?: string; roll_no?: string; class?: string };
  school: string | { _id: string; name?: string };
  program: string | { _id: string; name?: string; subject?: string } | null;
  subject: string;
  testType: "baseline" | "level_test";
  level: number;
  score: number;
  passed: boolean | null;
  action: "jump" | "assigned" | null;
  totalQuestions: number;
  correctAnswers: number;
  mentor: string | { _id: string; name?: string };
  date: string;
}

export interface CreateTestReportDTO {
  student: string;
  school: string;
  program?: string;
  subject: string;
  testType: "baseline" | "level_test";
  level: number;
  score: number;
  passed: boolean | null;
  action: "jump" | "assigned" | null;
  totalQuestions: number;
  correctAnswers: number;
}

export const createTestReport = async (
  data: CreateTestReportDTO
): Promise<TestReport> => {
  const response = await authAxios.post(baseUrl, data);
  return response.data;
};

export const getStudentTestReports = async (
  studentId: string
): Promise<TestReport[]> => {
  const response = await authAxios.get(`${baseUrl}/student/${studentId}`);
  return response.data;
};

export const getSchoolTestReports = async (
  schoolId: string
): Promise<TestReport[]> => {
  const response = await authAxios.get(`${baseUrl}/school/${schoolId}`);
  return response.data;
};
