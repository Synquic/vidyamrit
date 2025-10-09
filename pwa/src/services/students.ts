import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/students`;

export interface Student {
  uid: string;
  _id: string;
  name: string;
  age: number;
  gender: string;
  class: string;
  caste: string;
  role: string;
  roll_no: string;
  schoolId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  contactInfo: Array<{
    name: string;
    relation: string;
    occupation?: string;
    phone_no?: string;
  }>;
  knowledgeLevel: Array<{
    level: number;
    date: string;
  }>;
  cohort: Array<{
    cohortId: string;
    dateJoined: string;
    dateLeaved?: string;
  }>;
}

export interface StudentLevel {
  studentId: string;
  studentName: string;
  currentLevel: number;
  lastAssessmentDate: string | null;
  totalAssessments: number;
  levelHistory: Array<{
    level: number;
    date: string;
  }>;
}

export interface CreateStudentDTO {
  roll_no: string;
  name: string;
  age: number;
  gender: string;
  class: string;
  caste: string;
  schoolId: string;
  contactInfo: Array<object>;
  knowledgeLevel: Array<object>;
  cohort: Array<object>;
}

export interface UpdateStudentDTO {
  roll_no: string;
  name: string;
  age: number;
  gender: string;
  class: string;
  caste: string;
  schoolId: string;
}

export const createStudent = async (
  data: CreateStudentDTO
): Promise<Student> => {
  const response = await authAxios.post(baseUrl, data);
  return response.data;
};

export const getStudents = async (schoolId?: string): Promise<Student[]> => {
  const response = await authAxios.get(baseUrl, {
    params: { schoolId },
  });
  return response.data;
};

export const getStudent = async (id: string): Promise<Student> => {
  const response = await authAxios.get(`${baseUrl}/${id}`);
  return response.data;
};

export const updateStudent = async (
  id: string,
  data: UpdateStudentDTO
): Promise<Student> => {
  const response = await authAxios.put(`${baseUrl}/${id}`, data);
  return response.data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await authAxios.delete(`${baseUrl}/${id}`);
};

export const getStudentLevel = async (id: string): Promise<StudentLevel> => {
  const response = await authAxios.get(`${baseUrl}/${id}/level`);
  return response.data;
};
