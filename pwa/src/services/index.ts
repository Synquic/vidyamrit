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
