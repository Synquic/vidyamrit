// User/customer API service functions
import { auth } from "../../firebaseConfig";
import { apiUrl } from '@/services/index';

const baseUrl = apiUrl + '/customers';

export interface BaseCustomer {
    firstName: string
    lastName:  string
    companyName: string
    phone: string 
    email: string 
    gstNumber: string 
    address: string 
    enquiries: object
}

export interface CustomerView extends BaseCustomer {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

// 
const getToken = async () => {
  return await auth.currentUser?.getIdToken();
};

export const fetchCustomers = async (): Promise<CustomerView[]> => {
  const token = await getToken();
  const res = await fetch(`${baseUrl}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const createCustomer = async (data: BaseCustomer): Promise<CustomerView> => {
  const token = await getToken();
  const res = await fetch(`${baseUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
};

export const updateCustomer = async (
  _id: string,
  data: BaseCustomer
): Promise<CustomerView> => {
  const token = await getToken();
  const res = await fetch(`${baseUrl}/${_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
};

export const deleteCustomer = async (_id: string): Promise<void> => {
  const token = await getToken();
  const res = await fetch(`${baseUrl}/${_id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete user");
};
