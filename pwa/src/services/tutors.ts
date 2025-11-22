import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/users`;

export interface Tutor {
  id: string;
  name: string;
  email: string;
  phoneNo: string;
  role: "tutor";
  schoolId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTutorDTO {
  name: string;
  email: string;
  password: string;
  schoolId: string;
  phoneNo: string;
  role: "tutor";
}

export interface UpdateTutorDTO {
  name?: string;
  email?: string;
  schoolId?: string;
  phoneNo?: string;
}

export const createTutor = async (data: CreateTutorDTO): Promise<Tutor> => {
  const response = await authAxios.post(`${baseUrl}/register`, data);
  return response.data;
};

export const getTutors = async (schoolId?: string): Promise<Tutor[]> => {
  let url = baseUrl;
  if (schoolId) {
    url += `?schoolId=${schoolId}&role=tutor`;
  } else {
    url += `?role=tutor`;
  }
  const response = await authAxios.get(url);
  return response.data;
};

export const getTutor = async (id: string): Promise<Tutor> => {
  const response = await authAxios.get(`${baseUrl}/${id}`);
  return response.data;
};

export const updateTutor = async (
  id: string,
  data: UpdateTutorDTO
): Promise<Tutor> => {
  const response = await authAxios.put(`${baseUrl}/${id}`, data);
  return response.data;
};

export const deleteTutor = async (id: string): Promise<void> => {
  await authAxios.delete(`${baseUrl}/${id}`);
};
