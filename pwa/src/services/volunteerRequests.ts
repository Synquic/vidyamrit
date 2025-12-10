import axios from "axios";
import { apiUrl, authAxios } from "@/services/index";

const baseUrl = `${apiUrl}/volunteer-requests`;

export interface VolunteerRequest {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  state: string;
  pincode: string;
  education: string;
  experience?: string;
  motivation?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitVolunteerRequestDTO {
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  state: string;
  pincode: string;
  education: string;
  experience?: string;
  motivation?: string;
}

// Public API - Submit volunteer request (no auth required)
export const submitVolunteerRequest = async (
  data: SubmitVolunteerRequestDTO
): Promise<{ success: boolean; message: string; requestId: string }> => {
  const response = await axios.post(`${baseUrl}/submit`, data);
  return response.data;
};

// Get all volunteer requests (Super Admin only)
export const getAllVolunteerRequests = async (
  status?: string
): Promise<{ success: boolean; requests: VolunteerRequest[] }> => {
  const params = status ? { status } : {};
  const response = await authAxios.get(baseUrl, { params });
  return response.data;
};

// Get pending volunteer requests (Super Admin only)
export const getPendingVolunteerRequests = async (): Promise<{
  success: boolean;
  requests: VolunteerRequest[];
}> => {
  const response = await authAxios.get(`${baseUrl}/pending`);
  return response.data;
};

// Approve volunteer request (Super Admin only)
export const approveVolunteerRequest = async (
  requestId: string
): Promise<{ success: boolean; message: string; request: VolunteerRequest }> => {
  const response = await authAxios.patch(`${baseUrl}/${requestId}/approve`);
  return response.data;
};

// Reject volunteer request (Super Admin only)
export const rejectVolunteerRequest = async (
  requestId: string,
  rejectionReason?: string
): Promise<{ success: boolean; message: string; request: VolunteerRequest }> => {
  const response = await authAxios.patch(`${baseUrl}/${requestId}/reject`, {
    rejectionReason,
  });
  return response.data;
};

