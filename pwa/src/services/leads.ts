import { apiUrl, authAxios } from "@/services/index";

export interface Lead {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  status: "open" | "converted" | "closed";
  quote?: object;
  createdAt?: string;
  updatedAt?: string;
}

// Fetch all leads
export const fetchLeads = async (): Promise<Lead[]> => {
  const response = await authAxios.get(`${apiUrl}/enquiry`);
  return response.data;
};

// Get a single lead by ID
export const getLeadById = async (id: string): Promise<Lead> => {
  const response = await authAxios.get(`${apiUrl}/enquiry/${id}`);
  return response.data;
};

// Update a lead
export const updateLead = async (id: string, data: Partial<Lead>): Promise<Lead> => {
  const response = await authAxios.put(`${apiUrl}/enquiry/${id}`, data);
  return response.data;
};

// Delete a lead
export const deleteLead = async (id: string): Promise<void> => {
  await authAxios.delete(`${apiUrl}/enquiry/${id}`);
};
