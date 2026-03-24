import { authAxios, apiUrl } from "./index";

export interface ReportStudent {
  _id: string;
  name: string;
  class: string;
  roll_no: string;
  isArchived: boolean;
  isProficient: boolean;
  fln: Array<{ subject: string; source: "baseline" | "level_test" }>;
}

export interface ReportOverview {
  avgAttendance: number;
  proficientCount: number;
  activeCount: number;
  inactiveCount: number;
  totalStudents: number;
  availableClasses: string[];
  students: ReportStudent[];
}

export const getReportOverview = async (
  schoolId: string,
  classFilter?: string
): Promise<ReportOverview> => {
  const params: any = { schoolId };
  if (classFilter && classFilter !== "all") {
    params.classFilter = classFilter;
  }
  const response = await authAxios.get(`${apiUrl}/reports/overview`, { params });
  return response.data;
};
