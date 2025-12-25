import { apiUrl, authAxios } from "./index";

const baseUrl = `${apiUrl}/volunteers`;

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  password?: string; // Only returned when creating
  schoolId: {
    _id: string;
    name: string;
  };
  expiresAt: string; // ISO date string
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVolunteerDTO {
  schoolId: string;
  durationHours?: number; // Default 24 hours
  volunteerName?: string; // Default "Volunteer"
}

export interface UpdateVolunteerStatusDTO {
  isActive: boolean;
}

export interface ExtendVolunteerAccessDTO {
  additionalHours: number;
}

export interface VolunteerAccess {
  isValid: boolean;
  isExpired: boolean;
  isInactive: boolean;
  expiresAt: string | null;
  timeRemaining: number | null; // milliseconds
}

// Create a new volunteer account
export const createVolunteer = async (data: CreateVolunteerDTO): Promise<Volunteer> => {
  const response = await authAxios.post(`${baseUrl}/create`, data);
  return response.data.volunteer;
};

// Get all volunteers (super admin)
export const getAllVolunteers = async (): Promise<Volunteer[]> => {
  const response = await authAxios.get(`${baseUrl}/all`);
  return response.data.volunteers;
};

// Get volunteers by school
export const getVolunteersBySchool = async (schoolId: string): Promise<Volunteer[]> => {
  const response = await authAxios.get(`${baseUrl}/school/${schoolId}`);
  return response.data.volunteers;
};

// Update volunteer status (activate/deactivate)
export const updateVolunteerStatus = async (
  volunteerId: string,
  data: UpdateVolunteerStatusDTO
): Promise<Volunteer> => {
  const response = await authAxios.patch(`${baseUrl}/${volunteerId}/status`, data);
  return response.data.volunteer;
};

// Extend volunteer access
export const extendVolunteerAccess = async (
  volunteerId: string,
  data: ExtendVolunteerAccessDTO
): Promise<Volunteer> => {
  const response = await authAxios.patch(`${baseUrl}/${volunteerId}/extend`, data);
  return response.data.volunteer;
};

// Delete volunteer account
export const deleteVolunteer = async (volunteerId: string): Promise<void> => {
  await authAxios.delete(`${baseUrl}/${volunteerId}`);
};

// Check volunteer access (for volunteers themselves)
export const checkVolunteerAccess = async (): Promise<VolunteerAccess> => {
  const response = await authAxios.get(`${baseUrl}/access/check`);
  return response.data.access;
};

// Send volunteer credentials via email
export interface SendCredentialsEmailDTO {
  emails: string | string[]; // Single email or comma-separated string or array
  subject?: string;
  body?: string;
  password: string; // Password is required to send credentials
}

export const sendVolunteerCredentialsEmail = async (
  volunteerId: string,
  data: SendCredentialsEmailDTO
): Promise<{ success: boolean; message: string; recipients: string[] }> => {
  const response = await authAxios.post(
    `${baseUrl}/${volunteerId}/send-credentials`,
    data
  );
  return response.data;
};