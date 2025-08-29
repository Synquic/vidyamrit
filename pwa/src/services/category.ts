import { apiUrl, authAxios } from '@/services/index';

const baseUrl = apiUrl + '/categories';

export interface Category {
  _id?: string;
  name: string;
  description: string;
  createdAt?: string;
}

export const createCategory = async (categoryData: Category) => {
  const response = await authAxios.post(`${baseUrl}`, categoryData);
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await authAxios.get(`${baseUrl}`);
  return response.data;
};

export const updateCategory = async (id: string, categoryData: Category) => {
  const response = await authAxios.put(`${baseUrl}/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await authAxios.delete(`${baseUrl}/${id}`);
  return response.data;
};
