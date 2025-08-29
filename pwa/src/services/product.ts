import { apiUrl, authAxios } from '@/services/index';

const baseUrl = apiUrl + '/products';

export interface Product {
    _id?: string;
    name: string;
    category: string;
    type: string;
    gsm: number;
    createdAt?: string;
}

export const createProduct = async (productData: Product) => {
    const response = await authAxios.post(`${baseUrl}`, productData);
    return response.data;
};

export const getProducts = async (): Promise<Product[]> => {
    const response = await authAxios.get(`${baseUrl}`);
    return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
    const response = await authAxios.get(`${baseUrl}/${id}`);
    return response.data;
};

export const updateProduct = async (_id: string, productData: Product) => {
    const response = await authAxios.put(`${baseUrl}/${_id}`, productData);
    return response.data;
};

export const deleteProduct = async (_id: string) => {
    const response = await authAxios.delete(`${baseUrl}/${_id}`);
    return response.data;
};
