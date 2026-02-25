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
      if (data?.message) return data.message;
      if (data?.error) return data.error;
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0)
        return data.errors[0];
    }
    // Plain JS Error (e.g. network failure)
    if (error instanceof Error) return error.message;
  }
  return fallback;
}
