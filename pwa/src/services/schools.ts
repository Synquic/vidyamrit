import { apiUrl, authAxios } from "@/services/index";

const baseUrl = apiUrl + "/schools";

export interface School {
  _id?: string;
  name: string;
  type: "government" | "private";
  udise_code: string;
  address: string;
  level: "primary" | "middle";
  city: string;
  state: string;
  establishedYear: number;
  pinCode: string;
  pointOfContact: string;
  phone: string;
  block?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getSchools = async (): Promise<School[]> => {
  const response = await authAxios.get(baseUrl);
  return response.data;
};

export const getSchool = async (id: string): Promise<School> => {
  const response = await authAxios.get(`${baseUrl}/${id}`);
  return response.data;
};

export const createSchool = async (
  data: Omit<School, "_id" | "createdAt" | "updatedAt">
): Promise<School> => {
  const response = await authAxios.post(baseUrl, data);
  return response.data;
};

export const updateSchool = async (
  id: string,
  data: Partial<School>
): Promise<School> => {
  const response = await authAxios.put(`${baseUrl}/${id}`, data);
  return response.data;
};

export const deleteSchool = async (id: string): Promise<void> => {
  const response = await authAxios.delete(`${baseUrl}/${id}`);
  return response.data;
};
