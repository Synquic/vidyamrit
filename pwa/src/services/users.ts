import { auth } from "../../firebaseConfig";
import { apiUrl } from '@/services/index';

const baseUrl = apiUrl + '/users';

export interface User {
username: string;
firstName: string;
lastName: string;
dob: Date;
phone: string;
email: string;
aadharNo: string;
panNo: string;
}

export interface UserView extends User {
    _id: string;
    createdAt: string;
    updatedAt: string;
}
 
const getToken = async () => {
  return await auth.currentUser?.getIdToken();
};

export const fetchUsers = async (): Promise<UserView[]> => {
  const token = await getToken();
  const res = await fetch(`${baseUrl}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const createUser = async (data: User): Promise<UserView> => {
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

export const updateUser = async (
  _id: string,
  data: User
): Promise<UserView> => {
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

export const deleteUser = async (_id: string): Promise<void> => {
  const token = await getToken();
  const res = await fetch(`${baseUrl}/${_id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete user");
};
