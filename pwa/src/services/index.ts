import axios from "axios";
import { auth } from "../../firebaseConfig";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

if (!import.meta.env.VITE_BACKEND_URL) {
  console.warn(
    "Environment variable VITE_BACKEND_URL is not set. Using default value."
  );
}

export const apiUrl = `${backendUrl}/api`;

// Helper to get token
export const getToken = async () => {
  return await auth.currentUser?.getIdToken();
};

// Axios instance with interceptor for auth
export const authAxios = axios.create();

authAxios.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Utility to extract user-friendly error messages from API errors
// Replace backend terminology with user-friendly labels
function normalizeDisplayText(text: string): string {
  return text
    .replace(/\bCohort\b/g, "Group").replace(/\bcohort\b/g, "group").replace(/\bCohorts\b/g, "Groups").replace(/\bcohorts\b/g, "groups")
    .replace(/\bAssessment\b/g, "Test").replace(/\bassessment\b/g, "test").replace(/\bAssessments\b/g, "Tests").replace(/\bassessments\b/g, "tests")
    .replace(/\bAssessed\b/g, "Tested").replace(/\bassessed\b/g, "tested");
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    // Axios error with a response body from the server
    if ("response" in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string; errors?: string[] };
        };
      };
      const data = axiosError.response?.data;
      if (data?.message) return normalizeDisplayText(data.message);
      if (data?.error) return normalizeDisplayText(data.error);
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0)
        return normalizeDisplayText(data.errors[0]);
    }
    // Plain JS Error (e.g. network failure)
    if (error instanceof Error) return normalizeDisplayText(error.message);
  }
  return fallback;
}
